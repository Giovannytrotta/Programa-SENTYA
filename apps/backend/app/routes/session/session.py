from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity,jwt_required
from app.utils.decorators import (
    requires_coordinator_or_admin,
    requires_professional_access,
    requires_staff_access)
from app.models.sessions import Session
from app.models.workshops import Workshop
from app.models.user import SystemUser, UserRole
from app.models.workshop_users import WorkshopUser
from app.extensions import db
from datetime import datetime, timezone
from app.exceptions import ValidationError, NotFoundError, BadRequestError

session_bp = Blueprint("sessions", __name__, url_prefix='/sessions')


# ============================================
# CREAR SESIÓN 
# que hace? Una Session es cada clase individual de un taller. 
# El coordinador programa una clase específica del taller verificamos que :
# 1) El taller exista, 2) que el profesional o monitor es quien dara la clase, 3) fechas, 4) horarios, 5) evitar conflictos
#  campos Campos importantes:
# workshop_id: A qué taller pertenece
# date: Qué día es la clase
# start_time/end_time: Horario de la clase
# professional_id: Quién la imparte
# topic: Tema de esa clase específica (ej: "Ejercicios de respiración")
# Su importancia: Control de Calendario, Gestión Operativa (coordinador puede crear/modificar/cancelar) clases
# Base para asistencias: aca tendremos las asistencias de cada taller, seguimiento de actividad
# Informe y estadisticas
#   Ejemplo:

# creas un Workshop (Taller):

# Nombre: "Taller de Fisioterapia"
# Días: Lunes y Miércoles
# Horario: 09:00 - 11:00
# Duración: 3 meses (Octubre - Diciembre)

# Ese taller tendrá múltiples sesiones:

# Sesión 1: Lunes 7 Oct, 09:00-11:00
# Sesión 2: Miércoles 9 Oct, 09:00-11:00
# Sesión 3: Lunes 14 Oct, 09:00-11:00 y así sucesivamente
# ============================================

# LA RELACIÓN ENTRE WORKSHOP Y SESSION FUNCIONA ASI:
# Workshop (Taller)
# └── Session 1 (Clase del 7 Oct)
#     └── Attendance (Asistencias de usuarios)
# └── Session 2 (Clase del 9 Oct)
#     └── Attendance (Asistencias de usuarios)
# └── Session 3 (Clase del 14 Oct)
#     └── Attendance (Asistencias de usuarios)


@session_bp.route("", methods=["POST"])                                                          
@requires_professional_access                                          
def create_session():                                         
    """Crear una nueva sesión                                         
    Body JSON:                                         
    {   "workshop_id": 1,                                         
        "date": "2025-10-15",                                         
        "start_time": "09:00",                                         
        "end_time": "11:00",                                         
        "topic": "Ejercicios de movilidad",                                         
        "observations": "Traer ropa cómoda",                                         
        "professional_id": 5,                                         
        "status": "scheduled" }"""
    data = request.get_json()
    
    # 1. Campos obligatorios
    required_fields = ['workshop_id', 'date', 'start_time', 'end_time', 'professional_id']
    
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"El campo '{field}' es obligatorio")
    
    # 2. Verificar que el taller existe
    workshop = Workshop.query.get(data['workshop_id'])
    if not workshop:
        raise NotFoundError("El taller no existe")
    
    # 3. Verificar que el profesional existe y es PROFESSIONAL
    professional = SystemUser.query.get(data['professional_id'])
    if not professional:
        raise NotFoundError("El profesional no existe")
    
    if professional.rol != UserRole.PROFESSIONAL:
        raise BadRequestError("El usuario seleccionado no es un profesional")
    
    # 4. Convertir fecha
    try:
        session_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except ValueError:
        raise ValidationError("Formato de fecha inválido. Usa YYYY-MM-DD")
    
    # 5. Validar que la fecha esté dentro del rango del taller
    if session_date < workshop.start_date:
        raise ValidationError(
            f"La sesión no puede ser antes del inicio del taller ({workshop.start_date})"
        )
    
    if workshop.end_date and session_date > workshop.end_date:
        raise ValidationError(
            f"La sesión no puede ser después del fin del taller ({workshop.end_date})"
        )
    
    # 6. Convertir horas
    try:
        start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        end_time = datetime.strptime(data['end_time'], '%H:%M').time()
    except ValueError:
        raise ValidationError("Formato de hora inválido. Usa HH:MM")
    
    if start_time >= end_time:
        raise ValidationError("La hora de inicio debe ser antes que la hora de fin")
    
    # 7. Validar status
    valid_statuses = ['scheduled', 'completed', 'cancelled', 'rescheduled']
    status = data.get('status', 'scheduled').lower()
    if status not in valid_statuses:
        raise ValidationError(f"Status inválido. Usa: {', '.join(valid_statuses)}")
    
    # 8. Verificar que no exista otra sesión a la misma hora
    conflicting_session = Session.query.filter(
        Session.workshop_id == data['workshop_id'],
        Session.date == session_date,
        Session.start_time < end_time,
        Session.end_time > start_time
    ).first()
    
    if conflicting_session:
        raise BadRequestError("Ya existe una sesión programada para este taller en ese horario")
    
    # Crear sesión
    new_session = Session(
        workshop_id=data['workshop_id'],
        date=session_date,
        start_time=start_time,
        end_time=end_time,
        topic=data.get('topic'),
        observations=data.get('observations'),
        professional_id=data['professional_id'],
        status=status
    )
    
    db.session.add(new_session)
    db.session.commit()
    
    return jsonify({
        "message": "Sesión creada exitosamente",
        "session": new_session.serialize()
    }), 201


# ============================================
# LISTAR SESIONES DE UN TALLER
# ============================================

@session_bp.route("/workshop/<int:workshop_id>", methods=["GET"])
@jwt_required()
def get_workshop_sessions(workshop_id):
    """Listar todas las sesiones de un taller 
    Ver todas las clases programadas de un taller"""
    workshop = Workshop.query.get(workshop_id)
    
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
    sessions = Session.query.filter_by(workshop_id=workshop_id).order_by(
        Session.date.asc(),
        Session.start_time.asc()
    ).all()
    
    return jsonify({
        "workshop": {
            "id": workshop.id,
            "name": workshop.name
        },
        "sessions": [s.serialize() for s in sessions]
    }), 200


# ============================================
# VER DETALLE DE SESIÓN
# ============================================

@session_bp.route("/<int:session_id>", methods=["GET"])
@requires_staff_access
def get_session_details(session_id):
    """Ver detalles de una sesión 
    Ver la información completa de una clase específica"""
    session = Session.query.get(session_id)
    
    if not session:
        raise NotFoundError(f"Sesión con ID {session_id} no encontrada")
    
    return jsonify({
        "session": session.serialize()
    }), 200


# ============================================
# ACTUALIZAR SESIÓN
# ============================================

@session_bp.route("/<int:session_id>", methods=["PUT"])
@requires_professional_access
def update_session(session_id):
    """Actualizar una sesión para que? 
    Modificar una clase ya programada
    Ejemplo: "La clase del martes la cambio para el jueves" o "Cambio de profesional"""
    session = Session.query.get(session_id)
    
    if not session:
        raise NotFoundError(f"Sesión con ID {session_id} no encontrada")
    
    data = request.get_json()
    
    # Actualizar fecha
    if 'date' in data:
        try:
            new_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            
            # Validar rango del taller
            workshop = session.workshop
            if new_date < workshop.start_date:
                raise ValidationError("La sesión no puede ser antes del inicio del taller")
            if workshop.end_date and new_date > workshop.end_date:
                raise ValidationError("La sesión no puede ser después del fin del taller")
            
            session.date = new_date
        except ValueError:
            raise ValidationError("Formato de fecha inválido")
    
    # Actualizar horarios
    if 'start_time' in data:
        try:
            session.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        except ValueError:
            raise ValidationError("Formato de hora inválido")
    
    if 'end_time' in data:
        try:
            session.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        except ValueError:
            raise ValidationError("Formato de hora inválido")
    
    if session.start_time >= session.end_time:
        raise ValidationError("Hora de inicio debe ser antes que hora de fin")
    
    # Actualizar profesional
    if 'professional_id' in data:
        professional = SystemUser.query.get(data['professional_id'])
        if not professional:
            raise NotFoundError("Profesional no existe")
        if professional.rol != UserRole.PROFESSIONAL:
            raise BadRequestError("Usuario no es profesional")
        session.professional_id = data['professional_id']
    
    # Actualizar topic
    if 'topic' in data:
        session.topic = data['topic']
    
    # Actualizar observations
    if 'observations' in data:
        session.observations = data['observations']
    
    # Actualizar status
    if 'status' in data:
        valid_statuses = ['scheduled', 'completed', 'cancelled', 'rescheduled']
        status = data['status'].lower()
        if status not in valid_statuses:
            raise ValidationError("Status inválido")
        session.status = status
    
    session.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    
    return jsonify({
        "message": "Sesión actualizada exitosamente",
        "session": session.serialize()
    }), 200


# ============================================
# ELIMINAR SESIÓN
# ============================================

@session_bp.route("/<int:session_id>", methods=["DELETE"])
@requires_coordinator_or_admin
def delete_session(session_id):
    """Eliminar una sesión Borramos una clase que ya no se va a dar por x motivo"""
    session = Session.query.get(session_id)
    
    if not session:
        raise NotFoundError(f"Sesión con ID {session_id} no encontrada")
    
    # Verificar si ya tiene asistencias registradas
    if session.attendances and len(session.attendances) > 0:
        raise BadRequestError(
            "No se puede eliminar una sesión que ya tiene asistencias registradas"
        )
    
    db.session.delete(session)
    db.session.commit()
    
    return jsonify({
        "message": "Sesión eliminada exitosamente"
    }), 200


# ============================================
# MARCAR SESIÓN COMO COMPLETADA
# ============================================

@session_bp.route("/<int:session_id>/complete", methods=["POST"])
@requires_professional_access
def complete_session(session_id):
    """Marcar una sesión como completada 
    El profesional marca que la clase ya se dio """
    session = Session.query.get(session_id)
    
    if not session:
        raise NotFoundError(f"Sesión con ID {session_id} no encontrada")
    
    if session.status == 'completed':
        raise BadRequestError("La sesión ya está marcada como completada")
    
    session.status = 'completed'
    session.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    
    return jsonify({
        "message": "Sesión marcada como completada",
        "session": session.serialize()
    }), 200


# ============================================
# CANCELAR SESIÓN
# ============================================

@session_bp.route("/<int:session_id>/cancel", methods=["POST"])
@requires_professional_access
def cancel_session(session_id):
    """Cancelar una sesión a diferencia de delete con esta ruta podemos cancelar la
    session por x motivo (lluvia, emergencia, etc.) nota OBLIGATORIO PEDIR LA RAZON"""
    session = Session.query.get(session_id)
    
    if not session:
        raise NotFoundError(f"Sesión con ID {session_id} no encontrada")
    
    data = request.get_json()
    cancellation_reason = data.get('reason')
    
    if not cancellation_reason:
        raise ValidationError("Debes proporcionar una razón para la cancelación")
    
    session.status = 'cancelled'
    session.observations = f"Cancelada: {cancellation_reason}" + (f"\n{session.observations}" if session.observations else "")
    session.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    
    return jsonify({
        "message": "Sesión cancelada exitosamente",
        "session": session.serialize()
    }), 200


# ============================================
# MIS SESIONES (PROFESIONALES)
# ============================================

@session_bp.route("/my-sessions", methods=["GET"])
@requires_professional_access
def get_my_sessions():
    """Obtener sesiones del profesional 
    Profesionales ven solo SUS clases asignadas"""
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get(user_id)
    
    if not user:
        raise NotFoundError("Usuario no encontrado")
    
    if user.rol == UserRole.PROFESSIONAL:
        sessions = Session.query.filter_by(professional_id=user_id).order_by(
            Session.date.desc(),
            Session.start_time.desc()
        ).all()
    else:
        # Admin y coordinadores ven todas
        sessions = Session.query.order_by(
            Session.date.desc(),
            Session.start_time.desc()
        ).all()
    
    return jsonify({
        "sessions": [s.serialize() for s in sessions]
    }), 200

# ============================================
# MIS SESIONES INSCRITAS para (CLIENTES)
# ============================================

@session_bp.route("/my-enrolled-sessions", methods=["GET"])
@jwt_required()
def get_my_enrolled_sessions():
    """Obtener sesiones de talleres donde estoy inscrito (PARA CLIENTES)
    Los clientes ven todas las sesiones (pasadas y futuras) de sus talleres"""
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get(user_id)
    
    if not user:
        raise NotFoundError("Usuario no encontrado")
    
    # Solo clientes usan esta ruta
    if user.rol != UserRole.CLIENT:
        raise BadRequestError("Esta ruta es solo para clientes")
    
    # Obtener talleres donde está inscrito (sin lista de espera)
    enrollments = WorkshopUser.query.filter_by(
        user_id=user_id
    ).filter(
        WorkshopUser.waitlist_position.is_(None)  # Solo inscritos activos
    ).all()
    
    workshop_ids = [e.workshop_id for e in enrollments]
    
    if not workshop_ids:
        return jsonify({
            "sessions": [],
            "message": "No estás inscrito en ningún taller"
        }), 200
    
    # Obtener todas las sesiones de esos talleres (pasadas y futuras)
    sessions = Session.query.filter(
        Session.workshop_id.in_(workshop_ids)
    ).order_by(
        Session.date.desc(),
        Session.start_time.desc()
    ).all()
    
    return jsonify({
        "sessions": [s.serialize() for s in sessions]
    }), 200
