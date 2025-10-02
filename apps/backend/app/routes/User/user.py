from flask import Blueprint, jsonify, request, session,current_app
from app.extensions import db, jwt, bcrypt
from app.models.user import SystemUser,UserRole
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies, set_access_cookies,decode_token
from app.exceptions import ValidationError, UnauthorizedError, ForbiddenError, AppError, BadRequestError,NotFoundError,ConflictError
from app.utils.helper import issue_tokens_for_user
from datetime import datetime, timezone, timedelta,date
import re
from functools import wraps
from app.utils.decotators import requires_coordinator_or_admin

user_bp = Blueprint("user", __name__, url_prefix='/user')


@user_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    
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

@user_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = SystemUser.query.get(current_user_id)
    
    if not user or not user.is_active:
        raise UnauthorizedError("Usuario no válido")
    
    return jsonify({
        "user": {
            "id": user.id,
            "name": user.name,
            "last_name": user.last_name,
            "email": user.email,
            "rol": user.rol.value,
            "css_id" : user.css_id
        },
        "role": user.rol.value 
    })
    
# =================================================================
#   RUTAS PARA OBTENER PERFIL DEL USUARIO O INFORMACION DEL USUARIO
# ==================================================================

@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_current_user_profile():
    """Obtener perfil completo del usuario actual.
    Returns: 
        200: Perfil completo del usuario
        404: Usuario no encontrado
    No requiere confirmación - solo lectura"""
    
    current_user_id = get_jwt_identity()
    user = SystemUser.query.get(current_user_id)
    
    if not user or not user.is_active:
        raise UnauthorizedError("Usuario no válido")
    
    return jsonify({
        "success": True,
        "data": {
            "id": user.id,
            "name": user.name,
            "last_name": user.last_name,
            "email": user.email,
            "dni": user.dni,
            "phone": user.phone,
            "birth_date": user.birth_date.isoformat() if user.birth_date else None,
            "age": user.age,
            "address": user.address,
            "observations": user.observations,
            "css_id": user.css_id,
            "rol": user.rol.value,
            "is_active": user.is_active,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }
    }), 200
    
# =================================================================
#           RUTA PARA ACTUALIZAR EL PERFIL DEL USUARIO
# ==================================================================

@user_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_current_user_profile():
    """Actualizar perfil del usuario actual. Body:
        - name: string (opcional)
        - last_name: string (opcional)
        - email: string (opcional)
        - phone: string (opcional)
        - bio: string (opcional)
        - location: string (opcional)
        - website: string (opcional)
        - address: string (opcional)
        - birth_date: string (opcional) - formato YYYY-MM-DD
    Returns:
        200: Perfil actualizado exitosamente
        400: Datos inválidos
        404: Usuario no encontrado
    """
    try:
        current_user_id = get_jwt_identity()
        user = SystemUser.query.get(current_user_id)
        
        if not user or not user.is_active:
            raise UnauthorizedError("Usuario no válido")
        
        # Obtener datos del request
        data = request.get_json(silent=True) or {}
        if not data:
            raise BadRequestError("No se proporcionaron datos para actualizar")

        # Array para trackear cambios
        changes_made = []
        
        # ========== CAMPOS PERSONALES (todos opcionales) ==========
        
        # Actualizar nombre
        if 'name' in data:
            new_name = data['name'].strip() if data['name'] else ''
            if new_name and user.name != new_name:
                user.name = new_name
                changes_made.append("nombre")
        
        # Actualizar apellidos
        if 'last_name' in data:
            new_last_name = data['last_name'].strip() if data['last_name'] else ''
            if new_last_name and user.last_name != new_last_name:
                user.last_name = new_last_name
                changes_made.append("apellidos")
        
        # Actualizar teléfono
        if 'phone' in data:
            new_phone = data['phone'].strip() if data['phone'] else None
            if new_phone:
                # Validar formato básico de teléfono
                if len(new_phone) < 8:
                    raise BadRequestError("El número de teléfono es demasiado corto")
                
                if user.phone != new_phone:
                    user.phone = new_phone
                    changes_made.append("teléfono")
        
        
        # Actualizar dirección
        if 'address' in data:
            new_address = data['address'].strip() if data['address'] else None
            if user.address != new_address:
                user.address = new_address
                changes_made.append("dirección")
        
        
        # ========== FINALIZACIÓN ==========
        
        # Si no hubo cambios, informarlo
        if not changes_made:
            return jsonify({
                "success": True,
                "message": "No se realizaron cambios",
                "changes": []
            }), 200
        
        # Actualizar timestamp y guardar
        user.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Perfil actualizado exitosamente. Cambios realizados: {', '.join(changes_made)}",
            "changes": changes_made,
            "updated_at": user.updated_at.isoformat()
        }), 200
        
    except (BadRequestError, ConflictError, UnauthorizedError) as e:
        db.session.rollback()
        raise e
    except Exception as e:
        db.session.rollback()
        raise BadRequestError(f"Error al actualizar el perfil: {str(e)}")

# =================================================================
#       RUTA PARA OBTENER LISTA DE PROFESIONALES 
# ==================================================================
 
    
@user_bp.route("/professionals", methods=["GET"])
@requires_coordinator_or_admin
def get_professionals():
    """
    Obtener lista de profesionales activos
    (Para select al crear/editar taller)
    """
    professionals = SystemUser.query.filter_by(
        rol=UserRole.PROFESSIONAL,
        is_active=True
    ).all()
    
    return jsonify({
        "professionals": [
            {
                "id": prof.id,
                "name": f"{prof.name} {prof.last_name}",
                "email": prof.email
            } 
            for prof in professionals
        ]
    }), 200
