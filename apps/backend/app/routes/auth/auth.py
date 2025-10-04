from flask import Blueprint, jsonify, request, session,current_app
from app.extensions import db, jwt, bcrypt
from app.models.user import SystemUser, UserRole
from app.models.css import Css
from app.utils.decorators import requires_coordinator_or_admin
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies, set_access_cookies,decode_token
from app.exceptions import ValidationError, UnauthorizedError, ForbiddenError, AppError, BadRequestError,NotFoundError,ConflictError
from app.utils.helper import build_qr_data_uri, issue_tokens_for_user,validate_international_phone
from datetime import datetime, timezone, timedelta,date
import re
from functools import wraps
from app.services.mail_service import send_reset_password_email
from app.services.reset_2fa_service import send_reset_2fa_email

auth_bp = Blueprint("auth", __name__, url_prefix='/auth')

# Decorador para admin
def requires_admin(f):
    """Decorador para endpoints que solo puede usar el admin"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = SystemUser.query.get(user_id)
        if not user or not user.is_active:
            raise UnauthorizedError("Usuario no encontrado o inactivo")
        if user.rol != UserRole.ADMINISTRATOR:
            raise ForbiddenError("Se requiere acceso de administrador")
        return f(*args, **kwargs)
    return decorated_function

# =========================
# LISTA DE ROLES
# =========================
@auth_bp.route("/roles", methods=["GET"])
def list_roles():
    roles = [r.value for r in UserRole if r != UserRole.PENDING]
    return jsonify({"roles": roles})

# =========================================================================================================
#                                          Login con 2FA MEJORADO
# =========================================================================================================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    token_2fa = (data.get('token_2fa') or '').strip()
    
    # Validación de campos requeridos
    if not email or not password:
        raise UnauthorizedError("Email y contraseña son requeridos")
    
    # Verificar si el usuario existe
    user = SystemUser.query.filter_by(email=email).first()
    if not user:
        raise UnauthorizedError("Credenciales inválidas")
    
    # Verificar contraseña
    if not bcrypt.check_password_hash(user.password, password):
        raise UnauthorizedError("Credenciales inválidas")
    
    # Verificar si el usuario está activo o es su primer login
    if not user.is_active:
        if user.last_login is None:
            # Primer login - activar automáticamente
            user.is_active = True
        else:
            raise UnauthorizedError("Usuario inactivo. Contacte al administrador.")
    
    # IMPORTANTE: Si es la primera vez (no tiene 2FA configurado), forzar configuración
    if not user.two_factor_enabled or not user.two_factor_secret:
        # Guardar credenciales temporalmente en sesión para después del setup 2FA
        session['temp_email'] = email
        session['temp_user_id'] = user.id
        
        # NO DAR ACCESO - Devolver 401 con flag especial
        return jsonify({
            "requires_2fa_setup": True,
            "message": "Primera vez: Debe configurar autenticación de dos factores",
            "user_id": user.id
        }), 401  # 401 
    
    # Si tiene 2FA habilitado, SIEMPRE verificar el token
    if user.two_factor_enabled:
        if not token_2fa:
            # No se proporcionó token 2FA - NO DAR ACCESO
            return jsonify({
                "requires_2fa": True,
                "message": "Se requiere código de autenticación de dos factores"
            }), 401  # CAMBIO CLAVE: 401 en lugar de 200
        
        # Verificar el token 2FA
        if not user.verify_2fa_token(token_2fa):
            raise UnauthorizedError("Código de autenticación inválido")
    
    # SOLO si pasó todas las verificaciones: Login exitoso
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()
    
    # Generar token JWT
    access_token = issue_tokens_for_user(user)
    
    response = jsonify({
        "msg": "Login successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "last_name": user.last_name,
            "rol": user.rol.value
        },
        "role": user.rol.value
    })
    
    set_access_cookies(response, access_token)
    return response

# =========================================================================================================
#                               2FA setup 
# =========================================================================================================
@auth_bp.route('/2fa/setup', methods=["GET"])
def twofa_setup():
    """Setup inicial de 2FA o regeneración del QR"""
    # Puede ser llamado sin JWT si es el setup inicial
    user_id = None
    
    # Intentar obtener user desde JWT
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = int(get_jwt_identity())
    except:
        # Si no hay JWT, buscar en sesión (setup inicial)
        user_id = session.get('temp_user_id')
    
    if not user_id:
        raise UnauthorizedError("No se pudo identificar al usuario")
    
    user = SystemUser.query.get(user_id)
    if not user:
        raise UnauthorizedError("Usuario no encontrado")
    
    # Generar secret si no existe
    user.generate_2fa_secret()
    uri = user.get_2fa_uri()
    
    if not uri:
        raise AppError("No se pudo generar el código QR para 2FA")
    
    qr = build_qr_data_uri(uri)
    
    return jsonify({
        "otpauth_uri": uri,
        "qr_data_uri": qr,
        "message": "Escanea el código QR con tu aplicación de autenticación"
    })

@auth_bp.route('/2fa/verify-setup', methods=['POST'])
def verify_2fa_setup():
    """Verificar y habilitar 2FA durante el setup inicial"""
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    
    if not token:
        raise ValidationError("El código es requerido")
    
    # Obtener usuario desde sesión o JWT
    user_id = session.get('temp_user_id')
    
    if not user_id:
        try:
            from flask_jwt_extended import get_jwt_identity
            user_id = int(get_jwt_identity())
        except:
            raise UnauthorizedError("Sesión expirada. Por favor, inicie sesión nuevamente.")
    
    user = SystemUser.query.get(user_id)
    if not user:
        raise UnauthorizedError("Usuario no encontrado")
    
    # Verificar el token
    if not user.verify_2fa_token(token):
        raise UnauthorizedError("Código de verificación inválido")
    
    
    
    # Habilitar 2FA
    user.two_factor_enabled = True
    user.two_factor_enabled_at = datetime.now(timezone.utc)
    
    # Si es el setup inicial, completar el login
    if session.get('temp_email'):
        user.last_login = datetime.now(timezone.utc)
        user.is_active = True
        db.session.commit()
        
        # Limpiar sesión temporal
        session.pop('temp_email', None)
        session.pop('temp_user_id', None)
        
        # Generar token JWT
        access_token = issue_tokens_for_user(user)
        
        response = jsonify({
            "msg": "2FA configurado exitosamente. Inicio de sesión completo.",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "last_name": user.last_name,
                "rol": user.rol.value
            },
            "role": user.rol.value,
            "setup_complete": True
        })
        
        set_access_cookies(response, access_token)
        return response
    
    # Si es una reconfiguración normal
    db.session.commit()
    return jsonify({"msg": "2FA actualizado exitosamente"}), 200
    
    
#POR VERIFICAR LO DEJARE COMENTADO Y VERIFICAR EL FLUJO PARA LLEVARLO A CABO 
    
# @auth_bp.route('/2fa/disable', methods=['POST'])
# def twofa_disable():
#     # Intentar obtener user desde JWT
#     try:
#         user_id = get_jwt_identity()
#     except:
#         user_id = None

#     # Si no hay JWT, buscar en sesión temporal (login pendiente 2FA)
#     if not user_id:
#         user_id = session.get('temp_user_id')

#     if not user_id:
#         raise UnauthorizedError("Usuario no autenticado")

#     user = SystemUser.query.get(user_id)
#     if not user:
#         raise UnauthorizedError("Usuario no encontrado")

#     # Opcional: pedir password reciente desde request.json
#     data = request.get_json() or {}
#     password = data.get("password")
#     if not bcrypt.check_password_hash(user.password, password):
#         raise UnauthorizedError("Contraseña incorrecta")

#     user.two_factor_enabled = False
#     user.two_factor_secret = None
#     db.session.commit()

#     return jsonify({"enabled": False}), 200
    
    
@auth_bp.route('/2fa/request-reset', methods=['POST'])
def request_2fa_reset():
    """Solicitar reseteo de 2FA por email"""
    email = (request.get_json() or {}).get("email", "").strip().lower()
    
    if not email:
        raise ValidationError("El email es requerido")
    
    if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
        raise ValidationError("Formato de email inválido")
    
    user = SystemUser.query.filter_by(email=email).first()
    
    # Solo enviar si usuario existe y tiene 2FA activado
    if user and user.two_factor_enabled:
        try:
            from app.services.reset_2fa_service import send_reset_2fa_email
            send_reset_2fa_email(user.email, user.name)
        except Exception as e:
            current_app.logger.error(f"Error sending 2FA reset email: {e}")
            # No revelar el error específico
    
    # Siempre devolver éxito por seguridad (no revelar si email existe)
    return jsonify({
        "message": "Si el email está registrado y tiene 2FA activado, recibirás un correo para restablecerlo"
    }), 200


@auth_bp.route('/2fa/confirm-reset', methods=['POST'])
def confirm_2fa_reset():
    """Confirmar reseteo de 2FA usando token del email"""
    data = request.get_json() or {}
    token = data.get('token')
    
    if not token:
        raise ValidationError("Token de reseteo requerido")
    
    try:
        from flask_jwt_extended import decode_token
        payload = decode_token(token)
    except Exception:
        raise ValidationError("Token inválido o expirado")
    
    # Verificar propósito del token
    if payload.get("purpose") != "reset_2fa":
        raise ValidationError("Token inválido para reseteo 2FA")
    
    email = payload.get("sub")
    if not email:
        raise ValidationError("Token inválido")
    
    user = SystemUser.query.filter_by(email=email).first()
    if not user:
        raise NotFoundError("Usuario no encontrado")
    
    # Si ya está deshabilitado, informar pero no fallar
    if not user.two_factor_enabled:
        return jsonify({
            "message": "El 2FA ya está deshabilitado para este usuario"
        }), 200
    
    # Deshabilitar 2FA
    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.updated_at = datetime.now(timezone.utc)
    
    db.session.commit()
    
    current_app.logger.info(f"2FA disabled via email reset for user {user.id} ({user.email})")
    
    return jsonify({
        "message": "Autenticación 2FA deshabilitada exitosamente. Ya puedes iniciar sesión normalmente."
    }), 200


# =========================================================================================================
#                                           REGISTRO MEJORADO
# =========================================================================================================
@auth_bp.route("/register", methods=["POST"])
@requires_admin
def register():
    data = request.get_json(silent=True) or {}
    if data is None:
        raise BadRequestError("Datos JSON inválidos")
    
    # Validaciones mejoradas
    required_fields = ['email', 'password', 'name', 'last_name', 'dni', 'rol', 'birth_date', 'age', 'phone','css_id']
    missing_fields = [field for field in required_fields if not data.get(field)]
    
    if missing_fields:
        raise ValidationError(f"Campos requeridos faltantes: {', '.join(missing_fields)}")
    
    # Validar email
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    email = data.get('email').strip().lower()
    if not re.match(email_pattern, email):
        raise ValidationError("Formato de email inválido")
    
    #Validacion: añadimos al pattern dos variables para validar tanto nie como dni para evitar limitaciones
    dni = data.get('dni').strip().upper()
    dni_pattern = r"^[0-9]{8}[A-Z]$"
    nie_pattern = r"^[XYZ][0-9]{7}[A-Z]$"
    if not (re.match(dni_pattern, dni) or re.match(nie_pattern, dni)):
        raise ValidationError("Formato inválido: se esperaba DNI o NIE")
    
    # Verificar duplicados
    if SystemUser.query.filter_by(email=email).first():
        raise ValidationError("El email ya está registrado")
    
    if SystemUser.query.filter_by(dni=dni).first():
        raise ValidationError("El DNI ya está registrado")
    
    # Validar rol
    try:
        role = UserRole(data["rol"].strip())
    except ValueError:
        valid_roles = [r.value for r in UserRole]
        raise ValidationError(f"Rol inválido. Roles válidos: {', '.join(valid_roles)}")
    
    # Validar fecha de nacimiento
    try:
        birth_date = datetime.strptime(data["birth_date"].strip(), "%Y-%m-%d").date()
    except Exception:
        raise ValidationError("Formato de fecha inválido (debe ser YYYY-MM-DD)")
    
    # Validar edad
    try:
        age = int(data["age"])
        if age < 18 or age > 120:
            raise ValidationError("La edad debe estar entre 18 y 120 años")
    except ValueError:
        raise ValidationError("La edad debe ser un número entero")
    
    # Validar teléfono viene con formato internacional y por default +34 que es local para españa
    phone = data.get('phone', '').strip()
    if not phone:
        raise ValidationError("el telefono es obligatorio")
    phone = validate_international_phone(phone)
    
    # Validar contraseña
    password = data.get("password") or ""
    if len(password) < 8:
        raise ValidationError("La contraseña debe tener al menos 8 caracteres")
    # if not re.search(r"[A-Z]", password):
    #     raise ValidationError("La contraseña debe contener al menos una mayúscula")
    # if not re.search(r"[a-z]", password):
    #     raise ValidationError("La contraseña debe contener al menos una minúscula")
    # if not re.search(r"[0-9]", password):
    #     raise ValidationError("La contraseña debe contener al menos un número")
    
    # Crear hash de contraseña
    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    # ✅ VALIDAR que el CSS existe
    
    css_id = data.get('css_id')
    css_center = Css.query.get(css_id)
    if not css_center:
        raise ValidationError("El centro CSS seleccionado no existe")
    if not css_center.is_active:
        raise ValidationError("El centro CSS seleccionado no esta disponible")
    
    # Crear usuario
    user = SystemUser(
        email=email,
        password=password_hash,
        name=data["name"].strip(),
        last_name=data["last_name"].strip(),
        dni=dni,
        rol=role,
        phone=phone,
        birth_date=birth_date,
        age=age,
        css_id=css_id,
        is_active=False,  # Se activará en el primer login
        address=data.get("address", "").strip(),
        observations=data.get("observations", "").strip()
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        "ok": True,
        "msg": "Usuario creado exitosamente",
        "user_id": user.id,
        "message": "El usuario deberá configurar autenticación de dos factores en su primer inicio de sesión"
    }), 201

# ===============================================================================================
#                               Rutas para admin
# ===============================================================================================
@auth_bp.route('/admin/users', methods=['GET'])
@requires_admin
def get_all_users():
    """Obtener lista de todos los usuarios con filtros mejorados"""
    try:
        role_filter = request.args.get('role')
        active_filter = request.args.get('active')
        css_filter = request.args.get('css')  # ✅ NUEVO FILTRO agregado 
        search = request.args.get('search', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Query base
        query = SystemUser.query
        
        # Aplicar filtros
        if role_filter and role_filter != 'all':
            try:
                role_enum = UserRole(role_filter)
                query = query.filter(SystemUser.rol == role_enum)
            except ValueError:
                raise ValidationError(f"Rol inválido: {role_filter}")
        
        if active_filter is not None:
            is_active = active_filter.lower() == 'true'
            query = query.filter(SystemUser.is_active == is_active)
            
        if css_filter and css_filter != 'all':
            try:
                css_id = int(css_filter)
                query = query.filter(SystemUser.css_id == css_id)
            except ValueError:
                raise ValidationError(f"CSS ID inválido: {css_filter}")
        
        if search:
            like = f"%{search}%"
            query = query.filter(
                (SystemUser.email.ilike(like)) |
                (SystemUser.name.ilike(like)) |
                (SystemUser.last_name.ilike(like)) |
                (SystemUser.dni.ilike(like))
                (SystemUser.css.has(Css.name.ilike(like)))
            )
        
        # Paginación
        pagination = query.order_by(SystemUser.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        users = pagination.items
        
        # Estadísticas
        total_count = SystemUser.query.count()
        active_count = SystemUser.query.filter_by(is_active=True).count()
        with_2fa_count = SystemUser.query.filter_by(two_factor_enabled=True).count()
        
        css_stats = {}
        if css_filter and css_filter != 'all':
            css_id = int(css_filter)
            css_stats = {
                'css_total': SystemUser.query.filter_by(css_id=css_id).count(),
                'css_active': SystemUser.query.filter_by(css_id=css_id, is_active=True).count()
            }
        
        return jsonify({
            "users": [
                {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "last_name": user.last_name,
                    "dni": user.dni,
                    "phone": user.phone,
                    "rol": user.rol.value,
                    "is_active": user.is_active,
                    "two_factor_enabled": user.two_factor_enabled,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "last_login": user.last_login.isoformat() if user.last_login else None,
                    "birth_date": user.birth_date.isoformat() if user.birth_date else None,
                    "age": user.age,
                    "css_id": user.css_id,
                    # ✅ INCLUIR INFORMACIÓN DEL CSS para el filtro 
                    "css_info": {
                        "id": user.css.id,
                        "name": user.css.name,
                        "code": user.css.code,
                        "address": user.css.address
                    } if user.css else None
                }
                for user in users
            ],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": pagination.total,
                "pages": pagination.pages
            },
            "stats": {
                "total_users": total_count,
                "active_users": active_count,
                "inactive_users": total_count - active_count,
                "with_2fa": with_2fa_count,
                **css_stats
            },
            "filters_applied": {
                "role": role_filter,
                "active": active_filter,
                "css": css_filter,
                "search": search
            }
        }), 200
        
    except Exception as e:
        raise AppError(f"Error obteniendo usuarios: {str(e)}")
    
    
# En Nuevo endpoint para filtrar css

@auth_bp.route("/admin/css", methods=["GET"])
@requires_coordinator_or_admin
def get_active_css():
    css_centers = Css.query.filter_by(is_active=True).all()
    return jsonify({
        "css_centers": [
            {
                "id": css.id,
                "name": css.name,
                "code": css.code,
                "address": css.address,
                "manager": css.manager
            } for css in css_centers
        ]
    }), 200
    
#OBTENER DETALLES DE UN CSS    
  
@auth_bp.route("/admin/<int:css_id>", methods=["GET"])
@requires_coordinator_or_admin
def get_css_details(css_id):
    """Obtener detalle de un centro social"""
    css = Css.query.get(css_id)
    
    if not css:
        raise NotFoundError(f"Centro social con ID {css_id} no encontrado")
    
    return jsonify({
        "css": css.serialize()
    }), 200
    
# actualizacion de centro de servicio social 

@auth_bp.route("/admin/user/<int:user_id>/css", methods=["PUT"])
@requires_coordinator_or_admin
def update_user_css(user_id):
    data = request.get_json()
    css_id = data.get('css_id')
    
    user = SystemUser.query.get_or_404(user_id)
    user.css_id = css_id
    
    db.session.commit()
    
    return jsonify({
        "message": "Centro social actualizado correctamente",
        "user_id": user_id,
        "css_id": css_id
    }), 200

# PARA GESTIÓN ( de campos incluyendo rol)



@auth_bp.route("/admin/users/<int:user_id>/role", methods=['PUT'])
@requires_admin
def admin_change_role(user_id: int):
    admin_id = get_jwt_identity()
    if int(user_id) == int(admin_id):
        raise ValidationError("No puedes cambiar tu propio rol")

    user = SystemUser.query.get(user_id)
    if not user:
        raise NotFoundError("Usuario no encontrado")

    data = request.get_json(silent=True) or {}
    new_role_val = (data.get("role") or "").strip()
    if not new_role_val:
        raise ValidationError("El campo 'role' es requerido")

    try:
        new_role = UserRole(new_role_val)
    except ValueError:
        valid_roles = [r.value for r in UserRole]
        raise ValidationError(f"Rol inválido. Roles válidos: {', '.join(valid_roles)}")

    old_role = user.rol.value
    user.rol = new_role
    user.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "message": "Rol actualizado exitosamente",
        "user_id": user.id,
        "old_role": old_role,
        "new_role": new_role.value,
        "changed_by": admin_id
    }), 200

# 1️ ENDPOINT PARA CAMBIO DE ESTADO ÚNICAMENTE (activar/desactivar)

@auth_bp.route("/admin/users/<int:user_id>/status", methods=['PUT'])
@requires_admin
def admin_change_status(user_id: int):
    admin_id = get_jwt_identity()
    if int(user_id) == int(admin_id):
        raise ValidationError("No puedes cambiar tu propio estado")

    user = SystemUser.query.get(user_id)
    if not user:
        raise NotFoundError("Usuario no encontrado")

    body = request.get_json(silent=True) or {}
    if "is_active" not in body:
        raise ValidationError("El campo 'is_active' es requerido")

    new_status = bool(body["is_active"])
    old_status = user.is_active
    user.is_active = new_status
    user.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "message": "Estado de usuario actualizado" if new_status else "Usuario desactivado",
        "user_id": user.id,
        "old_status": old_status,
        "new_status": new_status,
        "changed_by": admin_id
    }), 200

# =============================================================
#       Gestion completa de Todos los campos de usuarios
# ==============================================================

@auth_bp.route("/admin/users/<int:user_id>", methods=['PUT'])
@requires_admin
def admin_update_user_complete(user_id: int):
    """Gestión completa de usuario - TODOS los campos son opcionales
    Campos disponibles:
    - name, last_name, email, dni, phone, birth_date, address, observations
    - rol (administrator, coordinator, professional, css_technician, client)
    - is_active (también se puede cambiar aquí, pero recomendamos usar /status)
    Solo actualiza los campos que se envían en la request """

    # Validar que no se esté editando a sí mismo (opcional según reglas de negocio)
    admin_id = get_jwt_identity()
    if int(user_id) == int(admin_id):
        raise ValidationError("No puedes cambiar tu propio rol")
    
    user = SystemUser.query.get(user_id)
    if not user:
        raise NotFoundError("Usuario no encontrado")
    
 # Obtener datos del request
 
    data = request.get_json(silent=True) or {}
    if not data:
        raise ValidationError("No se proporcionaron datos para actualizar")

# ARRAY PARA TRACKEAR CAMBIOS

    changes_made = []
    
    # ========== CAMPOS PERSONALES (todos opcionales) ==========
    if 'name' in data:
        new_name = data['name'].strip() if data['name'] else ''
        if not new_name:
            raise ValidationError("El nombre no puede estar vacío")
        if user.name != new_name:
            user.name = new_name
            changes_made.append("nombre")
    
    if 'last_name' in data:
        new_last_name = data['last_name'].strip() if data['last_name'] else ''
        if not new_last_name:
            raise ValidationError("Los apellidos no pueden estar vacíos")
        if user.last_name != new_last_name:
            user.last_name = new_last_name
            changes_made.append("apellidos")
    
#  ACTUALIZAR EMAIL (opcional)
    if 'email' in data:
        new_email = data['email'].strip().lower() if data['email'] else ''
        if not new_email:
            raise ValidationError("El email no puede estar vacío")
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", new_email):
            raise ValidationError("Formato de email inválido")
        
        # Verificar que el email no esté en uso
        existing_user = SystemUser.query.filter(
            SystemUser.email == new_email,
            SystemUser.id != user_id
        ).first()
        if existing_user:
            raise ConflictError("Este email ya está en uso por otro usuario")
        
        if user.email != new_email:
            user.email = new_email
            changes_made.append("email")
    
#CAMPOS OBLIGATORIOS
    if 'dni' in data:
        new_dni = data['dni'].strip().upper() if data['dni'] else '' 
        if not new_dni:
            raise ValidationError("El DNI no puede estar vacío")
        
        # Validar formato DNI/NIE
        dni_pattern = r"^[0-9]{8}[A-Z]$"
        nie_pattern = r"^[XYZ][0-9]{7}[A-Z]$"
        if not (re.match(dni_pattern, new_dni) or re.match(nie_pattern, new_dni)):
            raise ValidationError("Formato de DNI/NIE inválido")
        
        # Verificar que el DNI no esté en uso
        existing_user = SystemUser.query.filter(
            SystemUser.dni == new_dni,
            SystemUser.id != user_id
        ).first()
        if existing_user:
            raise ConflictError("Este DNI ya está en uso por otro usuario")
        
        if user.dni != new_dni:
            user.dni = new_dni
            changes_made.append("DNI")
    
    if 'phone' in data:
        new_phone = data['phone'].strip() if data['phone'] else None
        
        if not new_phone:
            raise ValidationError("El teléfono no puede estar vacío")
        
        new_phone = validate_international_phone(new_phone)
        
        if user.phone != new_phone:
            user.phone = new_phone
            changes_made.append("teléfono")
    
    if 'birth_date' in data:
        if data['birth_date']:
            try:
                new_birth_date = datetime.strptime(data['birth_date'], "%Y-%m-%d").date()
                
                # Validar edad razonable
                today = date.today()
                age = today.year - new_birth_date.year - ((today.month, today.day) < (new_birth_date.month, new_birth_date.day))
                if age < 18 or age > 120:
                    raise ValidationError("La edad debe estar entre 18 y 120 años")
                
                if user.birth_date != new_birth_date:
                    user.birth_date = new_birth_date
                    user.age = str(age)
                    changes_made.append("fecha de nacimiento y edad")
                    
            except ValueError:
                raise ValidationError("Formato de fecha inválido (debe ser YYYY-MM-DD)")
        else:
            # Permitir limpiar la fecha de nacimiento
            if user.birth_date is not None:
                user.birth_date = None
                user.age = None
                changes_made.append("fecha de nacimiento eliminada")
    
    if 'address' in data:
        new_address = data['address'].strip() if data['address'] else None
        if user.address != new_address:
            user.address = new_address
            changes_made.append("dirección")
    
    if 'observations' in data:
        new_observations = data['observations'].strip() if data['observations'] else None
        if user.observations != new_observations:
            user.observations = new_observations
            changes_made.append("observaciones")
    
    # ========== CAMPOS ADMINISTRATIVOS (opcionales pero con validaciones especiales) ========== POR VERIFICAR CON SERGUIHO
    #SI NO DEJAR QUE UN ADMIN NO PUEDA CAMBIAR A OTRO O SIMPLEMENTE DEJARLO DE ESTA FORMA PARA QUE  
    #Admin A puede cambiar el rol de Admin B (siempre que quede al menos 1 admin) Protege que no se quede el sistema sin administradores
    #ALGO ASI COMO QUE UN Un super admin puede degradar a otros admins
    if 'rol' in data:
        # No permitir que un admin cambie su propio rol
        if int(user_id) == int(admin_id):
            raise ValidationError("No puedes cambiar tu propio rol")
        
        try:
            new_role = UserRole(data['rol'])
        except ValueError:
            valid_roles = [r.value for r in UserRole]
            raise ValidationError(f"Rol inválido. Roles válidos: {', '.join(valid_roles)}")
        
        # Verificar que no se elimine el último admin
        if user.rol == UserRole.ADMINISTRATOR and new_role != UserRole.ADMINISTRATOR:
            remaining_admins = SystemUser.query.filter(
                SystemUser.rol == UserRole.ADMINISTRATOR,
                SystemUser.id != user_id,
                SystemUser.is_active == True
            ).count()
            if remaining_admins == 0:
                raise ValidationError("No se puede cambiar el rol del último administrador")
        
        if user.rol != new_role:
            old_role = user.rol.value
            user.rol = new_role
            changes_made.append(f"rol de '{old_role}' a '{new_role.value}'")
    
    # is_active también se puede cambiar aquí (aunque recomendamos usar /status para ello)
    if 'is_active' in data:
        # No permitir que un admin cambie su propio estado
        if int(user_id) == int(admin_id):
            raise ValidationError("No puedes cambiar tu propio estado")
        
        new_status = bool(data['is_active'])
        
        # Verificar que no se desactive el último admin
        if (user.rol == UserRole.ADMINISTRATOR and 
            user.is_active == True and 
            new_status == False):
            remaining_active_admins = SystemUser.query.filter(
                SystemUser.rol == UserRole.ADMINISTRATOR,
                SystemUser.id != user_id,
                SystemUser.is_active == True
            ).count()
            if remaining_active_admins == 0:
                raise ValidationError("No se puede desactivar el último administrador")
        
        if user.is_active != new_status:
            user.is_active = new_status
            status_text = "activado" if new_status else "desactivado"
            changes_made.append(f"estado a '{status_text}'")
    
    # ========== FINALIZACIÓN ==========
    
    # Si no hubo cambios, informarlo
    if not changes_made:
        return jsonify({
            "message": "No se realizaron cambios",
            "user_id": user_id,
            "changes": [],
            "type": "no_changes"
        }), 200
    
    # Actualizar timestamp y guardar
    user.updated_at = datetime.now(timezone.utc)
    
    try:
        db.session.commit()
        
        return jsonify({
            "message": f"Usuario actualizado exitosamente. Cambios realizados: {', '.join(changes_made)}",
            "user_id": user_id,
            "changes": changes_made,
            "updated_by": admin_id,
            "updated_at": user.updated_at.isoformat(),
            "type": "complete_update"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        raise AppError(f"Error al guardar cambios: {str(e)}")

@auth_bp.route("/admin/users/<int:user_id>", methods=['DELETE'])
@requires_admin
def admin_delete_user(user_id: int):
    """Eliminar usuario - soft delete por defecto, hard delete con ?force=true"""
    admin_id = get_jwt_identity()
    
    if int(user_id) == int(admin_id):
        raise ValidationError("No puedes eliminar tu propia cuenta")

    user = SystemUser.query.get(user_id)
    if not user:
        raise NotFoundError("Usuario no encontrado")

    # No eliminar el último admin
    if user.rol == UserRole.ADMINISTRATOR:
        remaining_admins = SystemUser.query.filter(
            SystemUser.rol == UserRole.ADMINISTRATOR,
            SystemUser.id != user_id,
            SystemUser.is_active == True
        ).count()
        if remaining_admins == 0:
            raise ValidationError("No se puede eliminar el último administrador")

    force = (request.args.get("force") or "").lower() == "true"

    if not force:
        # Soft delete
        user.is_active = False
        user.updated_at = datetime.now(timezone.utc)
        user.two_factor_enabled = False
        user.two_factor_secret = None
        db.session.commit()
        return jsonify({
            "message": "Usuario desactivado correctamente",
            "user_id": user_id,
            "is_active": user.is_active
        }), 200

    # Hard delete
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({
            "message": "Usuario eliminado permanentemente",
            "user_id": user_id
        }), 200
    except Exception as e:
        db.session.rollback()
        raise AppError(f"Error al eliminar: {str(e)}")

# =======================================================================================================
#                                        LOGOUT
# =======================================================================================================
@auth_bp.route("/logout", methods=["POST"])
def logout():
    try:
        # Intentar obtener el user_id si hay JWT válido
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        if user_id:
            user = SystemUser.query.get(int(user_id))
            if user:
                user.last_login = datetime.now(timezone.utc)
                db.session.commit()
    except:
        pass  # Si no hay JWT válido, simplemente continuar con el logout
    
    response = jsonify({'msg': 'Sesión cerrada correctamente'})
    unset_jwt_cookies(response)
    
    # Limpiar cualquier sesión temporal
    session.clear()
    
    return response

# =======================================================================================================
#                                        Olvide Contraseña
# =======================================================================================================

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    email = (request.get_json() or {}).get("email", "").strip()
    if not email:
        raise BadRequestError("Email is required")

    user = SystemUser.query.filter_by(email=email).first()
    if not user:
        raise NotFoundError("User not found")

#Si hay un fallo, mail_service hará raise AppError(...) o ValidationError(...).
#El @app.errorhandler(AppError) global lo capturará y devolverá,
    
    send_reset_password_email(user.email)
    
    return jsonify({"msg":"Reset email sent"}), 200


# =======================================================================================================
#                                        Restablecimiento de Contraseña 
# =======================================================================================================

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        raise BadRequestError('Token and new password are required.')
    try:
        payload = decode_token(token)
    except Exception:
        raise BadRequestError("Invalid or expired token")
    if payload.get("purpose")!= "reset_password":
        raise BadRequestError('Invalid or expired token.')
    email = payload["sub"]
    user = SystemUser.query.filter_by(email=email).first_or_404()
    
    # Hasheamos y guardamos la nueva contraseña
    hashed = bcrypt.generate_password_hash(new_password).decode("utf-8")
    user.password = hashed
    db.session.commit()
    
    return jsonify(msg="Password updated successfully"), 200

