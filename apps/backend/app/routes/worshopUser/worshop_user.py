from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity,jwt_required
from app.utils.decorators import (
    requires_coordinator_or_admin,
    requires_staff_access,
    requires_professional_access
)
from app.models.workshop_users import WorkshopUser
from app.models.workshops import Workshop, WorkshopStatus
from app.models.user import SystemUser, UserRole
from app.extensions import db
from datetime import datetime, timezone
from app.exceptions import ValidationError, NotFoundError, BadRequestError, ConflictError


workshop_users_bp = Blueprint("workshop_users", __name__, url_prefix='/workshop-users')

#ACA REGISTRAMOS O INSCRIBIMOS A LOS USUARIOS EN LOS TALLERES PARA COMPLETAR EL FLUJO DONDE
#WORKSHOP CREAMOS TALLER, SE CREA UNA SESSION EN LA QUE INSCRIBIMOS USUARIOS Y EN LA SESSION SE TOMA LAS
#ASISTENCIAS 


# ============================================
# INSCRIBIR USUARIO A TALLER
# ============================================

@workshop_users_bp.route("/enroll", methods=["POST"])
@requires_professional_access
def enroll_user():
    """Inscribir un usuario a un taller
    Body JSON:
    {"user_id": 5,
        "workshop_id": 3}"""
        
    data = request.get_json()
    assigner_id = int(get_jwt_identity())
    
    # Validar campos obligatorios
    if 'user_id' not in data:
        raise ValidationError("El campo 'user_id' es obligatorio")
    
    if 'workshop_id' not in data:
        raise ValidationError("El campo 'workshop_id' es obligatorio")
    
    user_id = data['user_id']
    workshop_id = data['workshop_id']
    
    # Verificar que el usuario existe
    user = SystemUser.query.get(user_id)
    if not user:
        raise NotFoundError(f"Usuario con ID {user_id} no encontrado")
    
    # Verificar que el taller existe
    workshop = Workshop.query.get(workshop_id)
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
    # Validar que el taller esté activo
    if workshop.status != WorkshopStatus.ACTIVE:
        raise BadRequestError(
            f"No se puede inscribir a un taller con estado '{workshop.status.value}'. "
            "Solo talleres activos permiten inscripciones."
        )
    
    # Verificar que el usuario no esté ya inscrito
    existing = WorkshopUser.query.filter_by(
        user_id=user_id,
        workshop_id=workshop_id
    ).first()
    
    if existing:
        raise ConflictError(
            f"El usuario {user.name} {user.last_name} ya está inscrito en este taller"
        )
    
    # Verificar capacidad del taller
    if workshop.current_capacity >= workshop.max_capacity:
        # Agregar a lista de espera
        # Obtener última posición en lista de espera
        last_waitlist = WorkshopUser.query.filter_by(
            workshop_id=workshop_id
        ).filter(
            WorkshopUser.waitlist_position.isnot(None)
        ).order_by(
            WorkshopUser.waitlist_position.desc()
        ).first()
        
        next_position = (last_waitlist.waitlist_position + 1) if last_waitlist else 1
        
        enrollment = WorkshopUser(
            user_id=user_id,
            workshop_id=workshop_id,
            assigned_by=assigner_id,
            waitlist_position=next_position,
            created_by=assigner_id
        )
        
        db.session.add(enrollment)
        db.session.commit()
        
        return jsonify({
            "message": f"Taller lleno. Usuario agregado a lista de espera en posición {next_position}",
            "enrollment": enrollment.serialize(),
            "in_waitlist": True,
            "waitlist_position": next_position
        }), 201
    
    # Inscribir usuario (hay cupo disponible)
    enrollment = WorkshopUser(
        user_id=user_id,
        workshop_id=workshop_id,
        assigned_by=assigner_id,
        created_by=assigner_id
    )
    
    # Actualizar capacidad del taller
    workshop.current_capacity += 1
    workshop.updated_at = datetime.now(timezone.utc)
    
    db.session.add(enrollment)
    db.session.commit()
    
    return jsonify({
        "message": f"Usuario {user.name} {user.last_name} inscrito exitosamente",
        "enrollment": enrollment.serialize(),
        "workshop": {
            "id": workshop.id,
            "name": workshop.name,
            "current_capacity": workshop.current_capacity,
            "max_capacity": workshop.max_capacity,
            "available_spots": workshop.max_capacity - workshop.current_capacity
        }
    }), 201


# ============================================
# DESINSCRIBIR USUARIO DE TALLER
# ============================================

@workshop_users_bp.route("/<int:enrollment_id>", methods=["DELETE"])
@requires_coordinator_or_admin
def unenroll_user(enrollment_id):
    """
    Desinscribir un usuario de un taller
    
    Body JSON:
    {"reason": "Usuario solicitó baja por motivos personales"}"""
    data = request.get_json()
    
    # Buscar inscripción
    enrollment = WorkshopUser.query.get(enrollment_id)
    
    if not enrollment:
        raise NotFoundError(f"Inscripción con ID {enrollment_id} no encontrada")
    
    # Validar razón
    reason = data.get('reason')
    if not reason:
        raise ValidationError("Debes proporcionar una razón para la desinscripción")
    
    workshop = enrollment.workshop
    user = enrollment.user
    
    # Si estaba en lista de espera, solo eliminarlo
    if enrollment.waitlist_position is not None:
        # Reordenar lista de espera
        waitlist_users = WorkshopUser.query.filter(
            WorkshopUser.workshop_id == workshop.id,
            WorkshopUser.waitlist_position > enrollment.waitlist_position
        ).all()
        
        for wu in waitlist_users:
            wu.waitlist_position -= 1
        
        db.session.delete(enrollment)
        db.session.commit()
        
        return jsonify({
            "message": f"Usuario {user.name} {user.last_name} eliminado de lista de espera"
        }), 200
    
    # Guardar razón de desinscripción
    enrollment.unassignment_reason = reason
    enrollment.unassignment_date = datetime.now(timezone.utc)
    
    # Reducir capacidad del taller
    workshop.current_capacity -= 1
    workshop.updated_at = datetime.now(timezone.utc)
    
    # Eliminar inscripción
    db.session.delete(enrollment)
    
    # Mover primer usuario de lista de espera si existe
    first_waitlist = WorkshopUser.query.filter_by(
        workshop_id=workshop.id
    ).filter(
        WorkshopUser.waitlist_position.isnot(None)
    ).order_by(
        WorkshopUser.waitlist_position.asc()
    ).first()
    
    promoted_user = None
    if first_waitlist:
        # Promover de lista de espera
        first_waitlist.waitlist_position = None
        first_waitlist.assignment_date = datetime.now(timezone.utc)
        workshop.current_capacity += 1
        promoted_user = first_waitlist.user
        
        # Reordenar resto de lista de espera
        remaining_waitlist = WorkshopUser.query.filter(
            WorkshopUser.workshop_id == workshop.id,
            WorkshopUser.waitlist_position.isnot(None)
        ).order_by(
            WorkshopUser.waitlist_position.asc()
        ).all()
        
        for i, wu in enumerate(remaining_waitlist, start=1):
            wu.waitlist_position = i
    
    db.session.commit()
    
    response_data = {
        "message": f"Usuario {user.name} {user.last_name} desinscrito exitosamente",
        "reason": reason,
        "workshop": {
            "id": workshop.id,
            "current_capacity": workshop.current_capacity,
            "available_spots": workshop.max_capacity - workshop.current_capacity
        }
    }
    
    if promoted_user:
        response_data["promoted_from_waitlist"] = {
            "user_id": promoted_user.id,
            "user_name": f"{promoted_user.name} {promoted_user.last_name}",
            "message": "Usuario promovido de lista de espera"
        }
    
    return jsonify(response_data), 200


# ============================================
# VER USUARIOS INSCRITOS EN UN TALLER
# ============================================

@workshop_users_bp.route("/workshop/<int:workshop_id>/students", methods=["GET"])
@jwt_required()#Cambiado el decorador a JWT para que los clientes vean los inscritos del taller
def get_workshop_students(workshop_id):
    """Ver todos los usuarios inscritos en un taller (activos y en espera)"""
    workshop = Workshop.query.get(workshop_id)
    
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
    # Usuarios inscritos (sin waitlist_position)
    enrolled = WorkshopUser.query.filter_by(
        workshop_id=workshop_id
    ).filter(
        WorkshopUser.waitlist_position.is_(None)
    ).all()
    
    # Usuarios en lista de espera
    waitlist = WorkshopUser.query.filter_by(
        workshop_id=workshop_id
    ).filter(
        WorkshopUser.waitlist_position.isnot(None)
    ).order_by(
        WorkshopUser.waitlist_position.asc()
    ).all()
    
    return jsonify({
        "workshop": {
            "id": workshop.id,
            "name": workshop.name,
            "current_capacity": workshop.current_capacity,
            "max_capacity": workshop.max_capacity,
            "available_spots": workshop.max_capacity - workshop.current_capacity
        },
        "enrolled_students": {
            "count": len(enrolled),
            "students": [e.serialize() for e in enrolled]
        },
        "waitlist": {
            "count": len(waitlist),
            "students": [w.serialize() for w in waitlist]
        }
    }), 200


# ============================================
# VER TALLERES DE UN USUARIO
# ============================================

@workshop_users_bp.route("/user/<int:user_id>/workshops", methods=["GET"])
@requires_staff_access
def get_user_workshops(user_id):
    """Ver todos los talleres en los que está inscrito un usuario"""
    user = SystemUser.query.get(user_id)
    
    if not user:
        raise NotFoundError(f"Usuario con ID {user_id} no encontrado")
    
    # Inscripciones activas
    enrollments = WorkshopUser.query.filter_by(user_id=user_id).all()
    
    active = [e for e in enrollments if e.waitlist_position is None]
    waitlist = [e for e in enrollments if e.waitlist_position is not None]
    
    return jsonify({
        "user": {
            "id": user.id,
            "name": f"{user.name} {user.last_name}"
        },
        "active_workshops": {
            "count": len(active),
            "workshops": [e.serialize() for e in active]
        },
        "waitlist_workshops": {
            "count": len(waitlist),
            "workshops": [e.serialize() for e in waitlist]
        }
    }), 200


# ============================================
# VER LISTA DE ESPERA DE UN TALLER
# ============================================

@workshop_users_bp.route("/workshop/<int:workshop_id>/waitlist", methods=["GET"])
@requires_staff_access
def get_workshop_waitlist(workshop_id):
    """Ver lista de espera de un taller específico"""
    workshop = Workshop.query.get(workshop_id)
    
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
    waitlist = WorkshopUser.query.filter_by(
        workshop_id=workshop_id
    ).filter(
        WorkshopUser.waitlist_position.isnot(None)
    ).order_by(
        WorkshopUser.waitlist_position.asc()
    ).all()
    
    return jsonify({
        "workshop": {
            "id": workshop.id,
            "name": workshop.name
        },
        "waitlist": {
            "count": len(waitlist),
            "students": [w.serialize() for w in waitlist]
        }
    }), 200