from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify
from app.models.user import SystemUser, UserRole
from app.exceptions import NotFoundError, ForbiddenError, UnauthorizedError


def requires_role(*allowed_roles):
    """ Decorador para verificar roles de usuario.
    Uso:
        @requires_role(UserRole.ADMINISTRATOR, UserRole.COORDINATOR)
    Args:
        *allowed_roles: Roles permitidos (uno o más UserRole)Returns:
        Decorator function
        Raises:
        UnauthorizedError: Token inválido
        NotFoundError: Usuario no existe
        ForbiddenError: Usuario sin permisos o inactivo"""
#Usamos el requires role como ultima defensa para evitar que alguien cambie el rol y haga en resumidas cuentas
#desastre en la aplicacion con rol de coordinador o administrador 
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            try:
                # Obtener ID del usuario desde el JWT
                user_id = int(get_jwt_identity())
                
            except (ValueError, TypeError):
                raise UnauthorizedError("Token de autenticación inválido") 
                # Buscar usuario en la base de datos
            user = SystemUser.query.get(user_id)
                
                # Verificar que el usuario existe y está activo
            if not user:
                raise NotFoundError("Usuario no encontrado en el sistema")
            if not user.is_active:
                raise ForbiddenError("Tu cuenta ha sido desactivada. Contacta al administrador")
                  
                # Verificar que el usuario tiene uno de los roles permitidos
            if user.rol not in allowed_roles:
                raise ForbiddenError("No tienes permisos para realizar esta acción")
                
                # Usuario válido con permisos correctos
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


# ============================================
# DECORADORES ESPECÍFICOS (ATAJOS)
# ============================================

def requires_coordinator_or_admin(f):
    """Solo coordinadores y administradores pueden acceder"""
    return requires_role(UserRole.ADMINISTRATOR, UserRole.COORDINATOR)(f)


def requires_professional_access(f):
    """Profesionales, coordinadores y administradores pueden acceder"""
    return requires_role(
        UserRole.ADMINISTRATOR,
        UserRole.COORDINATOR,
        UserRole.PROFESSIONAL
    )(f)


def requires_staff_access(f):
    """Cualquier personal (no clientes) puede acceder"""
    return requires_role(
        UserRole.ADMINISTRATOR,
        UserRole.COORDINATOR,
        UserRole.PROFESSIONAL,
        UserRole.CSS_TECHNICIAN
    )(f)


def requires_authenticated(f):
    """Cualquier usuario autenticado puede acceder"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function