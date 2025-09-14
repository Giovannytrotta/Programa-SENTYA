from flask import Blueprint, jsonify,request
from app.extensions import db, jwt, bcrypt
from app.models.user import SystemUser,UserRole
from flask_jwt_extended import create_access_token,jwt_required,get_jwt_identity,JWTManager,unset_jwt_cookies,set_access_cookies
from app.exceptions import ValidationError,UnauthorizedError,ForbiddenError,AppError,BadRequestError
from app.utils.helper import build_qr_data_uri,issue_tokens_for_user
from datetime import datetime,timezone
from datetime import datetime as dt
import re
from functools import wraps

auth_bp = Blueprint("auth", __name__,url_prefix= '/auth')

#Por mejorar o refactorizar para una segunda version posible crear un modulo solo de admin.
def requires_admin(f):
    """Decorador para endpoints que solo puede usar el admin""" #NOTA POR MEJORAR...
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = SystemUser.query.get(user_id)
        if not user or not user.is_active:
            raise UnauthorizedError("User not found")
        if user.rol != UserRole.ADMINISTRATOR:
            raise ForbiddenError("admin access required")
        return f(*args,**kwargs)
    return decorated_function

# =========================
# lISTA DE ROLES
# =========================

@auth_bp.route("/roles",methods=["GET"])
def list_roles():
    roles = [r.value for r in UserRole if r != UserRole.PENDING]
    return jsonify({"roles": roles})

# =========================================================================================================
#                                           REGISTRO
# =========================================================================================================

@auth_bp.route("/register",methods=["POST"])
@requires_admin
def register():
    data = request.get_json(silent=True) or {}
    if data is None:
        raise BadRequestError("Invalid JSON data")
    password = data.get("password") or ""
    
    required_fields = ['email', 'password', 'name', 'last_name', 'dni', 'rol','birth_date','age',"phone"]
    for field in required_fields:
        if not data.get(field):
            raise ValidationError("f'Field {field} rol is required'}")
    # Validar email
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    email = data.get('email').strip().lower()
    if re.match(pattern,email) is None:
        raise BadRequestError("Invalid credentials")
    # Verificar duplicados
    if SystemUser.query.filter_by(email=email).first():
        raise ValidationError("Email already registered")
    
    if SystemUser.query.filter_by(dni=data.get('dni')).first():
        raise ValidationError('DNI already registered')
    
        # rol (enum)
    try:
        role = UserRole(data["rol"].strip())
    except ValueError:
        raise ValidationError("Invalid role")
    
    try:
        birth_date = dt.strptime(data["birth_date"].strip(), "%Y-%m-%d").date()
    except Exception:
        raise ValidationError("birth_date must be YYYY-MM-DD")
    
        # age
    try:
        age = int(data["age"])
    except Exception:
        raise ValidationError("age must be integer")
    
    phone = data.get('phone', '').strip()
    if not phone:
        raise ValidationError("Phone number is required")
    
   
    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")


    user = SystemUser(
        email=email,
        password=password_hash,
        name=data["name"].strip(),
        last_name=data["last_name"].strip(),
        dni=data["dni"].strip(),
        rol=role,
        phone=phone,  
        birth_date=birth_date,
        age=age,
        is_active=False,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"ok": True, "msg":"User created successfully","user_id": user.id}), 201

# =========================================================================================================
#                                          Login con 2fa
# =========================================================================================================

@auth_bp.route("/login",methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    token_2fa = (data.get('token_2fa') or '').strip()
    
    #campos requeridos
    if not email or not password:
        raise UnauthorizedError("Email and password are required.")
    
#Verificamos si el usuario existe 
    user = SystemUser.query.filter_by(email=email).first()
    if not user:
        raise UnauthorizedError("Invalid credentials")
    
    if not bcrypt.check_password_hash(user.password, password):
        raise UnauthorizedError("Invalid credentials")
    
    if user.two_factor_enabled:
        if not token_2fa or not user.verify_2fa_token(token_2fa):
            raise UnauthorizedError("Se requiere 2FA válido")
    
    #lógica de activación y last_login
    if not user.is_active:
        if user.last_login is None:
     # Si es el primer login, activar automáticamente
            user.is_active = True 
        else:
            raise UnauthorizedError("Inactive user")
    
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()
    
    access_token= issue_tokens_for_user(user)
    
    response = jsonify({"msg": 'Login successful'})
    
    # return jsonify({"access_token":access_token,"role":user.rol.value}),200
    set_access_cookies(response, access_token)
    
    return response

# =========================================================================================================
#                               2FA setup / verify-2fa-enable and setup 
# =========================================================================================================

@auth_bp.route('/2fa/setup',methods=["GET"])
@jwt_required()
def twofa_setup():
    user = SystemUser.query.get(int(get_jwt_identity()))
    user.generate_2fa_secret()
    uri = user.get_2fa_uri()
    if not uri:
        raise AppError("No se pudo generar el URI de 2FA")
    qr = build_qr_data_uri(uri)
    return jsonify({"otpauth_uri": uri, "qr_data_uri": qr})


@auth_bp.route('/verify-2fa-setup', methods=['POST'])
@jwt_required()
def verify_2fa_setup():
    """Verificar y habilitar 2FA"""
    user = SystemUser.query.get(int(get_jwt_identity()))
    if not user:
        raise UnauthorizedError("User not found")
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    if not token:
        raise ValidationError("Token required")
    # Verificamos el TOTP. OJO: verify_2fa_token NO depende de two_factor_enabled,
    # así permite la verificación durante el setup.
    if user.verify_2fa_token(token):
        user.two_factor_enabled = True
        db.session.commit()
        return jsonify({"msg": "2FA successfully enabled"}), 200

    # TOTP inválido => 401 (no 400), es credencial de segunda fase incorrecta
    raise UnauthorizedError("Invalid 2FA Token")



# @auth_bp.route('/2fa/disable', methods=['POST'])
# @jwt_required()
# def twofa_disable():
#     user = SystemUser.query.get(get_jwt_identity())
#     if not user:
#         raise UnauthorizedError("User Not Found")
#     # En producción: pide password reciente y/o un TOTP válido
#     user.two_factor_enabled = False
#     # opcional: borra secret para forzar nuevo setup
#     # user.two_factor_secret = None
#     db.session.commit()
#     return jsonify({"enabled": False}), 200


# ===============================================================================================
#                               Rutas para admin (Solo Admin)
# ===============================================================================================

@auth_bp.route('/admin/users', methods=['GET'])
@requires_admin
def get_all_users():
    """Obtener lista de todos los usuarios con sus roles Solo accesible para administradores"""
    try:
        # Parámetros opcionales para filtrado
        role_filter = request.args.get('role')
        active_filter = request.args.get('active')
        search = request.args.get('search', '').strip()
        
        # Query base
        query = SystemUser.query
        
        # Aplicar filtros
        if role_filter and role_filter != 'all':
            try:
                role_enum = UserRole(role_filter)
                query = query.filter(SystemUser.rol == role_enum)
            except ValueError:
                raise ValidationError(f"Invalid role filter: {role_filter}")
        
        if active_filter is not None:
            is_active = active_filter.lower() == 'true'
            query = query.filter(SystemUser.is_active == is_active)
        
        #BUSQUEDA DETALLADA DEL USUARIO POR NOMBRE EMAIL LASTNAME O DNI
        
        if search:
            like = f"%{search}%"
            query = query.filter(
                (SystemUser.email.ilike(like)) |
                (SystemUser.name.ilike(like)) |
                (SystemUser.last_name.ilike(like)) |
                (SystemUser.dni.ilike(like))
            )
        
        # Ordenar por fecha de creación (más recientes primero)
        users = query.order_by(SystemUser.created_at.desc()).all()
        
        # Estadísticas rápidas
        total_count = SystemUser.query.count()
        active_count = SystemUser.query.filter_by(is_active=True).count()
        
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
                    "birth_date": user.birth_date.isoformat() if user.birth_date else None
                }
                for user in users],
            
            "total": len(users),
            "stats": {
                "total_users": total_count,
                "active_users": active_count,
                "inactive_users": total_count - active_count
            },
            "filters_applied": {
                "role": role_filter,
                "active": active_filter,
                "search": search
            }
        }), 200
        
    except Exception as e:
        raise AppError(f"Error fetching users: {str(e)}")
    
    
# @auth_bp.route("/admin/users/<int:user_id>", methods=['GET'])
# @requires_admin
# def admin_get_user(user_id: int):
#     user = SystemUser.query.get(user_id)
#     if not user:
#         raise ValidationError("User not found")
#     return jsonify({
#         "id": user.id,
#         "email": user.email,
#         "name": getattr(user, "name", None),
#         "last_name": getattr(user, "last_name", None),
#         "dni": getattr(user, "dni", None),
#         "role": user.rol.value,
#         "is_active": user.is_active,
#         "two_factor_enabled": user.two_factor_enabled,
#         "created_at": user.created_at.isoformat() if user.created_at else None,
#         "last_login": user.last_login.isoformat() if user.last_login else None,
#         "birth_date": user.birth_date.isoformat() if getattr(user, "birth_date", None) else None,
#     }), 200

@auth_bp.route("/admin/users/<int:user_id>/role", methods=['PUT'])
@requires_admin
def admin_change_role(user_id: int):
    admin_id = get_jwt_identity()
    if user_id == admin_id:
        raise ValidationError("Cannot change your own role")#POR HABLAR CON SERGIO PARA MOSTRARLO MENSAJES PARA MOSTRAR AL USUARIO EN ESPAÑOL

    u = SystemUser.query.get(user_id)
    if not u:
        raise ValidationError("User not found")

    data = request.get_json(silent=True) or {}
    new_role_val = (data.get("role") or "").strip()
    if not new_role_val:
        raise ValidationError("Field 'role' is required")

    try:
        new_role = UserRole(new_role_val)
    except ValueError:
        raise ValidationError(f"Invalid role: {new_role_val}")

    old_role = u.rol.value
    u.rol = new_role
    u.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "message": "Role updated successfully",
        "user_id": u.id,
        "old_role": old_role,
        "new_role": new_role.value,
        "changed_by": admin_id
    }), 200
    

@auth_bp.route("/admin/users/<int:user_id>/status", methods=['PUT'])
@requires_admin
def admin_change_status(user_id: int):
    admin_id = get_jwt_identity()
    if user_id == admin_id:
        raise ValidationError("Cannot change your own status")

    u = SystemUser.query.get(user_id)
    if not u:
        raise ValidationError("User not found")

    body = request.get_json(silent=True) or {}
    if "is_active" not in body:
        raise ValidationError("Field 'is_active' is required")

    new_status = bool(body["is_active"])
    old_status = u.is_active
    u.is_active = new_status
    u.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "message": ("User activated" if new_status else "User deactivated"),
        "user_id": u.id,
        "old_status": old_status,
        "new_status": new_status,
        "changed_by": admin_id
    }), 200


@auth_bp.route("/admin/users/<int:user_id>", methods=['DELETE'])
@requires_admin
def admin_delete_user(user_id: int):
    """Borrar usuario.- Soft delete (default): /auth/admin/users/<id>- MOSTRAR INFORMACION QUE SE DESACTIVO
    Hard delete (peligroso): /auth/admin/users/<id>?force=true"""
    admin_id = get_jwt_identity()
    # 1) NO SE PUEDE BORRAR A SI MISMO
    if user_id == admin_id:
        raise ValidationError("Cannot delete your own account")
#MOSTRAR A SERGIO PARA ESTA IMPLEMENTACION DE DELETE 
    # 2) Buscar usuario
    user = SystemUser.query.get(user_id)
    if not user:
        raise ValidationError("User not found")

    # 3) No borres al último admin activo
    if user.rol == UserRole.ADMINISTRATOR:
        remaining_admins = SystemUser.query.filter(
            SystemUser.rol == UserRole.ADMINISTRATOR,
            SystemUser.id != user_id,
            SystemUser.is_active == True
        ).count()
        if remaining_admins == 0:
            raise ValidationError("Cannot delete the last administrator")

    # 4) Soft vs Hard
    force = (request.args.get("force") or "").lower() == "true"

    if not force:
        # --- Soft delete ---
        user.is_active = False
        user.updated_at = datetime.now(timezone.utc)
        # Opcional: limpiar 2FA si quieres evitar confusiones
        user.two_factor_enabled = False
        user.two_factor_secret = None
        db.session.commit()
        return jsonify({
            "message": "User deactivated (soft delete)",
            "user_id": user_id,
            "is_active": user.is_active
        }), 200

    # --- Hard delete ---
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({
            "message": "User deleted",
            "user_id": user_id
        }), 200
    except Exception as e:
        db.session.rollback()
        # Muy probable: error de integridad por FKs si no hay cascadas por verificar
        raise AppError(f"Delete failed: {str(e)}")



# =======================================================================================================
#                                        LOGOUT
# =======================================================================================================


@auth_bp.route("/logout", methods = ["POST"])
def logout():
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get(user_id)
    if user:
        user.last_login_at = datetime.now(timezone.utc)
        db.session.commit()
    response = jsonify({'msg': 'Logout OK'})
    unset_jwt_cookies(response)
    return response 