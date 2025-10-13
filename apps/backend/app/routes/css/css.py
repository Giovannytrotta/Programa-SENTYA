from flask import Blueprint, jsonify
from app.models.css import Css
from app.utils.decorators import requires_staff_access,requires_professional_access
from app.exceptions import NotFoundError,AppError
from app.models.user import SystemUser


css_bp = Blueprint("css", __name__, url_prefix='/css')

@css_bp.route('/active', methods=['GET'])
@requires_professional_access
def get_active_css_centers():
    """Obtener todos los centros CSS activos con conteo de usuarios"""
    try:
        # Query con conteo de usuarios
        css_centers = Css.query.filter_by(is_active=True).order_by(Css.name).all()
        
        result = []
        for css in css_centers:
            # Contar usuarios de este CSS
            user_count = SystemUser.query.filter_by(css_id=css.id).count()
            
            result.append({
                "id": css.id,
                "name": css.name,
                "code": css.code,
                "address": css.address,
                "phone": css.phone,
                "email": css.email,
                "is_active": css.is_active,
                "total_users": user_count
            })
        
        return jsonify({"css_centers": result}), 200
        
    except Exception as e:
        raise AppError(f"Error obteniendo centros CSS: {str(e)}")
