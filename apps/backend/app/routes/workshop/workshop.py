from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity,jwt_required
from app.utils.decorators import (
    requires_coordinator_or_admin,
    requires_professional_access,
    requires_staff_access
)
from app.models.user import SystemUser, UserRole
from app.models.workshops import Workshop,WorkshopStatus
from app.models.workshop_users import WorkshopUser
from app.models.thematic_areas import ThematicArea
from app.models.css import Css
from app.extensions import db
from datetime import datetime, timezone
from app.exceptions import ValidationError,NotFoundError,BadRequestError,ForbiddenError
from app.models.sessions import Session
from app.models.attendance import Attendance


workshop_bp = Blueprint("workshops", __name__, url_prefix='/workshops')

# ============================================
# RUTAS PARA ADMIN Y COORDINADOR CREAR TALLERES 
# ============================================


@workshop_bp.route("/", methods=["POST"])
@requires_coordinator_or_admin
def create_workshop():
    """Crear un nuevo taller
        Body JSON:{
        "name": "Taller de Fisioterapia",
        "description": "Ejercicios para mejorar movilidad",
        "thematic_area_id": 1,
        "css_id": 3,
        "professional_id": 5,
        "max_capacity": 25,
        "start_time": "09:00",
        "end_time": "11:00",
        "week_days": "L,M,V",
        "start_date": "2025-10-01",
        "end_date": "2025-12-20",
        "location": "Sala 2 - Planta Baja",
        "session_duration": 120,
        "status": "active",
        "observations": "Traer ropa cómoda"}"""
    data = request.get_json()
    user_id = int(get_jwt_identity())
        

#    VALIDACIONES

        # 1. Campos obligatorios
    required_fields = [
        'name', 'thematic_area_id', 'css_id', 
        'professional_id', 'max_capacity', 
        'start_time', 'end_time', 'week_days', 'start_date'
    ]
        
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"El campo '{field}' es obligatorio")
        
        # 2. Verificar que el área temática existe
    thematic_area = ThematicArea.query.get(data['thematic_area_id'])
    if not thematic_area:
        raise NotFoundError("El área temática no existe")
        
        # 3. Verificar que el CSS existe
    css = Css.query.get(data['css_id'])
    if not css:
        raise NotFoundError("El centro social no existe")
        
        # 4. Verificar que el profesional existe y es PROFESSIONAL
    professional = SystemUser.query.get(data['professional_id'])
    if not professional:
        raise NotFoundError("El profesional no existe")
        
    if professional.rol != UserRole.PROFESSIONAL:
        raise BadRequestError("El usuario seleccionado no es un profesional")
        
        # 5. Validar capacidad máxima
    if data['max_capacity'] < 1:
        raise ValidationError("La capacidad máxima debe ser mayor a 0")
        
        # 6. Validar días de la semana
    valid_days = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    week_days = data['week_days'].split(',')
        
    for day in week_days:
        if day.strip() not in valid_days:
                raise ValidationError(f"Día inválido: {day}. Usa: L,M,X,J,V,S,D")
        # 7. Convertir horas de string a time
    try:
        start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        
    except ValueError:
        raise ValidationError("Formato de hora inválido. Usa HH:MM (ej: 09:00)")
        
    if start_time >= end_time:
        raise ValidationError("La hora de inicio debe ser antes que la hora de fin")

        # 8. Convertir fechas
    try:
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = None
        if data.get('end_date'):
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            if end_date < start_date:
                raise ValidationError("La fecha de fin debe ser posterior a la fecha de inicio")
    except ValueError:
        raise ValidationError("Formato de fecha inválido. Usa YYYY-MM-DD")
        
        # 9. Validar status
    status = data.get('status', 'pending').lower()
    if status not in ['pending', 'active', 'paused', 'finished']:
        raise ValidationError("Status inválido. Usa: pending, active, paused, finished")

        
       
    # CREAR TALLER
        
    new_workshop = Workshop(
        # Obligatorios
        name=data['name'],
        thematic_area_id=data['thematic_area_id'],
        css_id=data['css_id'],
        professional_id=data['professional_id'],
        max_capacity=data['max_capacity'],
        start_time=start_time,
        end_time=end_time,
        week_days=data['week_days'],
        start_date=start_date,
        
        # Opcionales
        description=data.get('description'),
        end_date=end_date,
        location=data.get('location'),
        session_duration=data.get('session_duration'),
        status=WorkshopStatus[status.upper()],
        observations=data.get('observations'),
        
        # Automáticos
        current_capacity=0,
        created_by=user_id
    )
        
    db.session.add(new_workshop)
    db.session.commit()
        
    return jsonify({
    "message": "Taller creado exitosamente",
    "workshop": new_workshop.serialize()
    }), 201

# ========================================================================
#                RUTAS PARA TODO EL STAFF 
# ========================================================================

# Listamos todos los talleres

@workshop_bp.route("/", methods=["GET"])
@jwt_required()  # Cambiar de @requires_staff_access
def get_all_workshops():
    """Listar talleres según permisos del usuario"""
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get(user_id)
    
    if not user:
        raise NotFoundError("Usuario no encontrado")
    
    # Clientes solo ven talleres de su CSS
    if user.rol == UserRole.CLIENT:
        # Solo talleres de su CSS (activos con cupo)
        workshops = Workshop.query.filter(
            Workshop.css_id == user.css_id,
            Workshop.status == WorkshopStatus.ACTIVE,
            # Workshop.current_capacity < Workshop.max_capacity comentada por verificar 
        ).all()
    else:
        # Staff ve todos
        workshops = Workshop.query.all()
    
    return jsonify({
        "workshops": [w.serialize() for w in workshops]
    }), 200

# ===========================================================================
#       Detalles de un taller 
# ===========================================================================

@workshop_bp.route("/<int:workshop_id>", methods=["GET"])
@requires_staff_access
def get_workshop_details(workshop_id):
    """Ver detalles de un taller"""
    workshop = Workshop.query.get(workshop_id)
    
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
    return jsonify({
        "workshop": workshop.serialize()
    }), 200
    

# ============================================
# TALLERES DISPONIBLES DE MI CSS (CLIENTES)
# ============================================

@workshop_bp.route("/available", methods=["GET"])
@jwt_required()
def get_available_workshops():
    """
    Obtener TODOS los talleres activos del CSS del cliente
    (Incluye talleres con y sin cupo disponible)
    
    Para: Vista "Talleres Disponibles" en el dashboard del cliente
    Permissions: Solo CLIENT
    """
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get(user_id)
    
    if not user:
        raise NotFoundError("Usuario no encontrado")
    
    # Solo para clientes
    if user.rol != UserRole.CLIENT:
        raise BadRequestError("Esta ruta es solo para clientes")
    
    if not user.css_id:
        return jsonify({
            "workshops": [],
            "message": "No tienes un centro social asignado"
        }), 200
    
    # Obtener TODOS los talleres activos del CSS
    # (No filtrar por cupo - mostrar todos aunque estén llenos)
    workshops = Workshop.query.filter(
        Workshop.css_id == user.css_id,
        Workshop.status == WorkshopStatus.ACTIVE
    ).all()
    
    return jsonify({
        "workshops": [w.serialize() for w in workshops],
        "total": len(workshops),
        "css_name": user.css.name if user.css else None
    }), 200


# # ============================================================
# #               LISTAR TALLERES DE UN CSS activo por confirmar
# # ============================================================

# @workshop_bp.route("/css/<int:css_id>/active", methods=["GET"])
# @requires_staff_access #POR CONFIRMAR 
# def get_active_workshops_by_css(css_id):
#     """
#     Listar solo talleres ACTIVOS de un CSS
#     (Para mostrar en panel de inscripciones)
#     """
#     css = Css.query.get(css_id)
    
#     if not css:
#         raise NotFoundError(f"Centro social con ID {css_id} no encontrado")
    
#     # Solo talleres activos con cupos disponibles
#     workshops = Workshop.query.filter(
#         Workshop.css_id == css_id,
#         Workshop.status == WorkshopStatus.ACTIVE,
#         Workshop.current_capacity < Workshop.max_capacity  # Tienen cupo
#     ).all()
    
#     return jsonify({
#         "css": {
#             "id": css.id,
#             "name": css.name
#         },
#         "available_workshops": len(workshops),
#         "workshops": [w.serialize() for w in workshops]
#     }), 200

    
# ==================================================================
#               LISTAR TALLERES DE UN CSS ESPECÍFICO
# ==================================================================

@workshop_bp.route("/css/<int:css_id>", methods=["GET"])
@jwt_required()
def get_workshops_by_css(css_id):
    """
    Listar todos los talleres de un centro social específico
    Permisos:
    - CLIENTES: Solo pueden ver talleres de su propio CSS
    - STAFF: Pueden ver talleres de cualquier CSS
    para:
    - Panel de usuario: ver talleres de su CSS
    - Filtrar talleres por centro
    - Inscripciones: mostrar talleres disponibles
    """
    
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get(user_id)
    
    if not user:
        raise NotFoundError("Usuario no encontrado")
    
    # Verificar que el CSS existe
    css = Css.query.get(css_id)
    if not css:
        raise NotFoundError(f"Centro social con ID {css_id} no encontrado")
    
    # VALIDACIÓN DE PERMISOS
    
    # Si es cliente, solo puede ver talleres de su CSS
    if user.rol == UserRole.CLIENT:
        if user.css_id != css_id:
            raise ForbiddenError(
                "No tienes permiso para ver talleres de otros centros sociales"
            )
        
        # Clientes solo ven talleres ACTIVOS con cupo disponible
        workshops = Workshop.query.filter(
            Workshop.css_id == css_id,
            Workshop.status == WorkshopStatus.ACTIVE,
            Workshop.current_capacity < Workshop.max_capacity
        ).all()
    else:
        # Staff ve TODOS los talleres (sin filtros)
        workshops = Workshop.query.filter_by(css_id=css_id).all()
    
    return jsonify({
        "css": {
            "id": css.id,
            "name": css.name
        },
        "total_workshops": len(workshops),
        "workshops": [w.serialize() for w in workshops]
    }), 200
    
    
# =============================================================
# ACTUALIZAR TALLER
# ==============================================================

@workshop_bp.route("/<int:workshop_id>", methods=["PUT"])
@requires_coordinator_or_admin  # ← Solo admin y coordinador
def update_workshop(workshop_id):
    """Editar un taller existente"""
    workshop = Workshop.query.get(workshop_id)
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    data = request.get_json()
    
    # Actualizar nombre
    
    if 'name' in data:
        workshop.name = data['name']
    # Actualizar description
    
    if 'description' in data:
        workshop.description = data['description']
        
    # Actualizar área temática
    
    if 'thematic_area_id' in data:
        thematic_area = ThematicArea.query.get(data['thematic_area_id'])
        if not thematic_area:
            raise NotFoundError("Área temática no existe")
        workshop.thematic_area_id = data['thematic_area_id']
        
        # Actualizar CSS
        
    if 'css_id' in data:
        css = Css.query.get(data['css_id'])
        if not css:
            raise NotFoundError("Centro social no existe")
        workshop.css_id = data['css_id']
    
    if 'professional_id' in data:
        professional_id = data['professional_id']
        professional = SystemUser.query.get(professional_id)
        
        if not professional:
            raise NotFoundError("Profesional no encontrado")
        
        if professional.rol != UserRole.PROFESSIONAL:
            raise BadRequestError("El usuario debe ser un profesional")
        
        workshop.professional_id = professional_id
    
        # Actualizar capacidad
    if 'max_capacity' in data:
        if data['max_capacity'] < workshop.current_capacity:
            raise BadRequestError(
                f"No puedes reducir la capacidad por debajo de {workshop.current_capacity} inscritos")
        workshop.max_capacity = data['max_capacity']
    
        # Actualizar horarios
    if 'start_time' in data:
        try:
            workshop.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        except ValueError:
            raise ValidationError("Formato de hora inválido")
    
    if 'end_time' in data:
        try:
            workshop.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        except ValueError:
            raise ValidationError("Formato de hora inválido")
    
    if workshop.start_time >= workshop.end_time:
        raise ValidationError("Hora de inicio debe ser antes que hora de fin")
    
    # Actualizar días
    if 'week_days' in data:
        valid_days = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
        week_days = data['week_days'].split(',')
        for day in week_days:
            if day.strip() not in valid_days:
                raise ValidationError(f"Día inválido: {day}")
        workshop.week_days = data['week_days']
    
    # Actualizar fechas
    
    if 'start_date' in data:
        try:
            workshop.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        except ValueError:
            raise ValidationError("Formato de fecha inválido")
    
    if 'end_date' in data:
        if data['end_date']:
            try:
                end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
                if end_date < workshop.start_date:
                    raise ValidationError("Fecha fin debe ser posterior a fecha inicio")
                workshop.end_date = end_date
            except ValueError:
                raise ValidationError("Formato de fecha inválido")
        else:
            workshop.end_date = None
    
    # Actualizar otros
    
    if 'location' in data:
        workshop.location = data['location']
    
    if 'session_duration' in data:
        workshop.session_duration = data['session_duration']
    
    if 'status' in data:
        status = data['status'].lower()
        if status not in ['pending', 'active', 'paused', 'finished']:
            raise ValidationError("Status inválido")
        workshop.status = WorkshopStatus[status.upper()]
    
    if 'observations' in data:
        workshop.observations = data['observations']
    
    workshop.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    
    return jsonify({
        "message": "Taller actualizado exitosamente",
        "workshop": workshop.serialize()
    }), 200





# ===========================================================
#                       ELIMINAR TALLER
# ============================================================

@workshop_bp.route("/<int:workshop_id>", methods=["DELETE"])
@requires_coordinator_or_admin
def delete_workshop(workshop_id):
    """Eliminar un taller"""
    workshop = Workshop.query.get(workshop_id)
    
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
    # Validar que no tenga inscritos
    if workshop.current_capacity > 0:
        raise BadRequestError(
            f"No se puede eliminar el taller porque tiene {workshop.current_capacity} usuarios inscritos"
        )
    
    db.session.delete(workshop)
    db.session.commit()
    
    return jsonify({
        "message": "Taller eliminado exitosamente"}), 200
    

# ===============================================================================
#                              ASIGNAR PROFESIONAL
# ===============================================================================

@workshop_bp.route("/<int:workshop_id>/assign-professional", methods=["POST"])
@requires_coordinator_or_admin
def assign_professional(workshop_id):
    """Asignar profesional a un taller"""
    workshop = Workshop.query.get(workshop_id)
    
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
    data = request.get_json()
    professional_id = data.get('professional_id')
    
    if not professional_id:
        raise ValidationError("El campo 'professional' es obligatorio")
    
    professional = SystemUser.query.get(professional_id)
    
    if not professional:
        raise NotFoundError("Profesional no encontrado")
    
    if professional.rol != UserRole.PROFESSIONAL:
        raise BadRequestError("El usuario debe ser un profesional")
    
    workshop.professional_id = professional_id
    db.session.commit()
    
    return jsonify({
        "message": "Profesional asignado exitosamente",
        "workshop": workshop.serialize()
    }), 200


# =====================================================================================
#                           RUTAS PARA PROFESIONALES
# =====================================================================================

@workshop_bp.route("/my-workshops", methods=["GET"])
@requires_professional_access  # ← Admin, coordinador y profesional
def get_my_workshops():
    """Obtener talleres del usuario (profesionales ven solo los suyos)"""
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get(user_id)
    
    if user.rol == UserRole.PROFESSIONAL:
        # Profesionales solo ven sus talleres asignados
        workshops = Workshop.query.filter_by(professional_id=user_id).all()
    else:
        # Admin y coordinadores ven todos
        workshops = Workshop.query.all()
    
    return jsonify({
        "workshops": [w.serialize() for w in workshops]
    }), 200



# # ============================================
# # ESTADÍSTICAS DE TALLER dejamos comentado por el momento lo agregamos cuando tengamos asistencias y sessiones
# # ============================================

# @workshop_bp.route("/<int:workshop_id>/stats", methods=["GET"])
# @requires_staff_access
# def get_workshop_stats(workshop_id):
#     """Ver estadísticas de un taller"""
#     workshop = Workshop.query.get(workshop_id)
    
#     if not workshop:
#         raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
#     # CALCULAR ESTADÍSTICAS REALES

    
#     # Total de sesiones del taller
#     total_sessions = Session.query.filter_by(workshop_id=workshop_id).count()
    
#     # Sesiones completadas
#     completed_sessions = Session.query.filter_by(
#         workshop_id=workshop_id,
#         status='completed'
#     ).count()
    
#     # Calcular tasa de asistencia
#     if completed_sessions > 0:
#         # Total de asistencias posibles (sesiones completadas * capacidad actual)
#         total_possible = completed_sessions * workshop.current_capacity
        
#         # Asistencias registradas como "present"
#         total_present = db.session.query(Attendance).join(Session).filter(
#             Session.workshop_id == workshop_id,
#             Attendance.status == 'present'
#         ).count()
        
#         attendance_rate = (total_present / total_possible * 100) if total_possible > 0 else 0
#     else:
#         attendance_rate = 0
    
#     # Calcular satisfacción (si tienes un campo de satisfacción en Attendance)
#     # satisfaction_rate = ... (lo implementas después si lo necesitas)
    
#     stats = {
#         "total_sessions": total_sessions,
#         "completed_sessions": completed_sessions,
#         "pending_sessions": total_sessions - completed_sessions,
#         "attendance_rate": round(attendance_rate, 2),
#         "current_capacity": workshop.current_capacity,
#         "max_capacity": workshop.max_capacity,
#         "occupancy_rate": round((workshop.current_capacity / workshop.max_capacity * 100), 2)
#     }
    
#     return jsonify({
#         "workshop": workshop.serialize(),
#         "stats": stats
#     }), 200

