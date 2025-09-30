from flask import Blueprint, jsonify, request, session,current_app
from app.extensions import db, jwt, bcrypt
from app.models.user import SystemUser
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies, set_access_cookies,decode_token
from app.exceptions import ValidationError, UnauthorizedError, ForbiddenError, AppError, BadRequestError,NotFoundError,ConflictError
from app.utils.helper import issue_tokens_for_user
from datetime import datetime, timezone, timedelta,date
import re
from functools import wraps

user_bp = Blueprint("user", __name__, url_prefix='/user')

# @api_bp.route("/login",methods=["POST"])
# def login():
#     data = request.get_json(silent=True) or {}
#     email = data.get("email", "").strip()
#     password = data.get("password", "")
#     #campos requeridos
#     if not email or not password:
#         raise UnauthorizedError("Email and password are required.")
    
# #Verificamos si el usuario existe 
#     user = SystemUser.query.filter_by(email=email).first()
#     if not user:
#         raise UnauthorizedError("Invalid credentials")
    
#     if not bcrypt.check_password_hash(user.password, password):
#         raise UnauthorizedError("Invalid credentials")
#     # if not user.confirmed:
#     #     raise ForbiddenError("unconfirmed account")
    
#     access_token = create_access_token(identity=str(user.id))
    
#     response = jsonify({"msg": 'Login successful',"user":user.serialize()})
    
#     set_access_cookies(response, access_token)
    
#     return response

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