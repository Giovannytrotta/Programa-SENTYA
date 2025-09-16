from flask import Blueprint, jsonify, request, session
from app.extensions import db, jwt, bcrypt
from app.models.user import SystemUser, UserRole
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies, set_access_cookies,decode_token
from app.exceptions import ValidationError, UnauthorizedError, ForbiddenError, AppError, BadRequestError,NotFoundError
from app.utils.helper import build_qr_data_uri, issue_tokens_for_user
from datetime import datetime, timezone, timedelta
import re
from functools import wraps
from app.services.mail_service import send_reset_password_email

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
    required_fields = ['email', 'password', 'name', 'last_name', 'dni', 'rol', 'birth_date', 'age', 'phone']
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
    
    # Validar teléfono (formato español)
    phone = data.get('phone', '').strip()
    phone_pattern = r"^[6-9][0-9]{8}$"
    if not re.match(phone_pattern, phone):
        raise ValidationError("Formato de teléfono inválido (9 dígitos, comenzando con 6-9)")
    
    # Validar contraseña
    password = data.get("password") or ""
    if len(password) < 8:
        raise ValidationError("La contraseña debe tener al menos 8 caracteres")
    if not re.search(r"[A-Z]", password):
        raise ValidationError("La contraseña debe contener al menos una mayúscula")
    if not re.search(r"[a-z]", password):
        raise ValidationError("La contraseña debe contener al menos una minúscula")
    if not re.search(r"[0-9]", password):
        raise ValidationError("La contraseña debe contener al menos un número")
    
    # Crear hash de contraseña
    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    
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
        
        if search:
            like = f"%{search}%"
            query = query.filter(
                (SystemUser.email.ilike(like)) |
                (SystemUser.name.ilike(like)) |
                (SystemUser.last_name.ilike(like)) |
                (SystemUser.dni.ilike(like))
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
                    "age": user.age
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
                "with_2fa": with_2fa_count
            },
            "filters_applied": {
                "role": role_filter,
                "active": active_filter,
                "search": search
            }
        }), 200
        
    except Exception as e:
        raise AppError(f"Error obteniendo usuarios: {str(e)}")

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

