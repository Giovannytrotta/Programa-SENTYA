from flask import Blueprint, jsonify
from app.models.thematic_areas import ThematicArea
from app.utils.decotators import requires_staff_access
from app.exceptions import NotFoundError

thematic_areas_bp = Blueprint("thematic_areas", __name__, url_prefix='/thematic-areas')


@thematic_areas_bp.route("/", methods=["GET"])
@requires_staff_access
def get_all_thematic_areas():
    """Obtener todas las áreas temáticas"""
    areas = ThematicArea.query.all()
    
    return jsonify({
        "thematic_areas": [{"id": area.id, "name": area.name} for area in areas]
    }), 200


@thematic_areas_bp.route("/<int:area_id>", methods=["GET"])
@requires_staff_access
def get_thematic_area(area_id):
    """Obtener detalle de un área temática"""
    area = ThematicArea.query.get(area_id)
    
    if not area:
        raise NotFoundError(f"Área temática con ID {area_id} no encontrada")
    
    return jsonify({
        "thematic_area": area.serialize()
    }), 200