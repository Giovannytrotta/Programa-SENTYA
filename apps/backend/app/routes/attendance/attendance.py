from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.utils.decotators import (
    requires_coordinator_or_admin,
    requires_professional_access,
    requires_staff_access
)
from app.models.attendance import Attendance
from app.models.sessions import Session
from app.models.workshops import Workshop
from app.models.user import SystemUser, UserRole
from app.extensions import db
from datetime import datetime, timezone
from app.exceptions import ValidationError, NotFoundError, BadRequestError


attendance_bp = Blueprint("attendance", __name__, url_prefix='/attendance')


# ============================================
# TOMAR ASISTENCIA DE UNA SESIÓN
# ============================================

@attendance_bp.route("/session/<int:session_id>", methods=["POST"])
@requires_professional_access
def take_attendance(session_id):
    """
    Tomar asistencia de una sesión
    Body JSON:
    {
        "attendances": [
            {"user_id": 1, "present": true, "observations": "Llegó a tiempo"},
            {"user_id": 2, "present": false, "observations": "Ausencia justificada"},
            {"user_id": 3, "present": true, "observations": null}
        ]
    }
    """
    data = request.get_json()
    recorder_id = int(get_jwt_identity())
    
    # Verificar que la sesión existe
    session = Session.query.get(session_id)
    if not session:
        raise NotFoundError(f"Sesión con ID {session_id} no encontrada")
    
    # Verificar que la sesión no esté cancelada
    if session.status == 'cancelled':
        raise BadRequestError("No se puede tomar asistencia de una sesión cancelada")
    
    # Validar que se envió el array de asistencias
    if 'attendances' not in data or not isinstance(data['attendances'], list):
        raise ValidationError("Debes enviar un array de 'attendances'")
    
    if len(data['attendances']) == 0:
        raise ValidationError("El array de asistencias no puede estar vacío")
    
    # Validar que no se haya tomado asistencia antes
    existing_attendance = Attendance.query.filter_by(session_id=session_id).first()
    if existing_attendance:
        raise BadRequestError(
            "Ya se ha registrado asistencia para esta sesión. "
            "Usa PUT /attendance/session/<id> para actualizar."
        )
    
    # Obtener usuarios inscritos en el taller
    workshop = session.workshop
    enrolled_users = [assignment.user_id for assignment in workshop.user_assignments]
    
    # Procesar cada asistencia
    created_attendances = []
    
    for att_data in data['attendances']:
        # Validar campos obligatorios
        if 'user_id' not in att_data:
            raise ValidationError("Cada asistencia debe tener 'user_id'")
        
        if 'present' not in att_data:
            raise ValidationError("Cada asistencia debe tener 'present' (true/false)")
        
        user_id = att_data['user_id']
        
        # Verificar que el usuario existe
        user = SystemUser.query.get(user_id)
        if not user:
            raise NotFoundError(f"Usuario con ID {user_id} no existe")
        
        # Verificar que el usuario está inscrito en el taller
        if user_id not in enrolled_users:
            raise BadRequestError(
                f"El usuario {user.name} {user.last_name} no está inscrito en este taller"
            )
        
        # Crear registro de asistencia
        attendance = Attendance(
            session_id=session_id,
            user_id=user_id,
            present=bool(att_data['present']),
            observations=att_data.get('observations'),
            recorded_by=recorder_id
        )
        
        db.session.add(attendance)
        created_attendances.append(attendance)
    
    # Marcar sesión como completada si no lo está
    if session.status != 'completed':
        session.status = 'completed'
        session.updated_at = datetime.now(timezone.utc)
    
    db.session.commit()
    
    # Calcular estadísticas
    total = len(created_attendances)
    present = sum(1 for att in created_attendances if att.present)
    absent = total - present
    
    return jsonify({
        "message": "Asistencia registrada exitosamente",
        "session_id": session_id,
        "stats": {
            "total": total,
            "present": present,
            "absent": absent,
            "attendance_rate": round((present / total * 100), 2) if total > 0 else 0
        },
        "attendances": [att.serialize() for att in created_attendances]
    }), 201


# ============================================
# VER ASISTENCIA DE UNA SESIÓN
# ============================================

@attendance_bp.route("/session/<int:session_id>", methods=["GET"])
@requires_staff_access
def get_session_attendance(session_id):
    """Ver la asistencia registrada de una sesión"""
    session = Session.query.get(session_id)
    
    if not session:
        raise NotFoundError(f"Sesión con ID {session_id} no encontrada")
    
    attendances = Attendance.query.filter_by(session_id=session_id).all()
    
    if not attendances:
        return jsonify({
            "message": "No se ha registrado asistencia para esta sesión",
            "session_id": session_id,
            "attendances": []
        }), 200
    
    # Calcular estadísticas
    total = len(attendances)
    present = sum(1 for att in attendances if att.present)
    absent = total - present
    
    return jsonify({
        "session": {
            "id": session.id,
            "date": session.date.strftime('%Y-%m-%d'),
            "workshop_name": session.workshop.name
        },
        "stats": {
            "total": total,
            "present": present,
            "absent": absent,
            "attendance_rate": round((present / total * 100), 2) if total > 0 else 0
        },
        "attendances": [att.serialize() for att in attendances]
    }), 200


# ============================================
# ACTUALIZAR ASISTENCIA DE UNA SESIÓN
# ============================================

@attendance_bp.route("/session/<int:session_id>", methods=["PUT"])
@requires_professional_access
def update_attendance(session_id):
    """
    Actualizar asistencia de una sesión
    (Para corregir errores en el registro)
    Body JSON:
    {
        "attendances": [
            {"user_id": 1, "present": false, "observations": "Cambio: llegó tarde y se fue"},
            {"user_id": 2, "present": true, "observations": "Corrección: sí asistió"}
        ]}
    """
    data = request.get_json()
    recorder_id = int(get_jwt_identity())
    
    session = Session.query.get(session_id)
    if not session:
        raise NotFoundError(f"Sesión con ID {session_id} no encontrada")
    
    if 'attendances' not in data or not isinstance(data['attendances'], list):
        raise ValidationError("Debes enviar un array de 'attendances'")
    
    updated_attendances = []
    
    for att_data in data['attendances']:
        if 'user_id' not in att_data:
            raise ValidationError("Cada asistencia debe tener 'user_id'")
        
        user_id = att_data['user_id']
        
        # Buscar asistencia existente
        attendance = Attendance.query.filter_by(
            session_id=session_id,
            user_id=user_id
        ).first()
        
        if not attendance:
            raise NotFoundError(
                f"No existe registro de asistencia para el usuario {user_id} en esta sesión"
            )
        
        # Actualizar campos
        if 'present' in att_data:
            attendance.present = bool(att_data['present'])
        
        if 'observations' in att_data:
            attendance.observations = att_data['observations']
        
        attendance.recorded_by = recorder_id
        attendance.recorded_at = datetime.now(timezone.utc)
        
        updated_attendances.append(attendance)
    
    db.session.commit()
    
    return jsonify({
        "message": "Asistencia actualizada exitosamente",
        "attendances": [att.serialize() for att in updated_attendances]
    }), 200


# ============================================
# HISTORIAL DE ASISTENCIA DE UN USUARIO
# ============================================

@attendance_bp.route("/user/<int:user_id>/workshop/<int:workshop_id>", methods=["GET"])
@requires_staff_access
def get_user_attendance_history(user_id, workshop_id):
    """Ver historial de asistencia de un usuario en un taller específico"""
    user = SystemUser.query.get(user_id)
    if not user:
        raise NotFoundError(f"Usuario con ID {user_id} no encontrado")
    
    workshop = Workshop.query.get(workshop_id)
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
    # Obtener todas las sesiones del taller
    sessions = Session.query.filter_by(workshop_id=workshop_id).all()
    session_ids = [s.id for s in sessions]
    
    # Obtener asistencias del usuario
    attendances = Attendance.query.filter(
        Attendance.user_id == user_id,
        Attendance.session_id.in_(session_ids)
    ).all()
    
    # Calcular estadísticas
    total_sessions = len(sessions)
    sessions_with_attendance = len(attendances)
    present_count = sum(1 for att in attendances if att.present)
    absent_count = sessions_with_attendance - present_count
    
    return jsonify({
        "user": {
            "id": user.id,
            "name": f"{user.name} {user.last_name}"
        },
        "workshop": {
            "id": workshop.id,
            "name": workshop.name
        },
        "stats": {
            "total_sessions": total_sessions,
            "sessions_recorded": sessions_with_attendance,
            "present": present_count,
            "absent": absent_count,
            "attendance_rate": round((present_count / sessions_with_attendance * 100), 2) if sessions_with_attendance > 0 else 0
        },
        "attendances": [att.serialize() for att in attendances]
    }), 200


# ============================================
# REPORTE DE ASISTENCIA DE UN TALLER
# ============================================

@attendance_bp.route("/workshop/<int:workshop_id>/report", methods=["GET"])
@requires_staff_access
def get_workshop_attendance_report(workshop_id):
    """Reporte completo de asistencia de un taller"""
    workshop = Workshop.query.get(workshop_id)
    
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
    # Obtener todas las sesiones del taller
    sessions = Session.query.filter_by(workshop_id=workshop_id).all()
    
    # Obtener todos los usuarios inscritos
    enrolled_users = [assignment.user for assignment in workshop.user_assignments]
    
    # Construir reporte por usuario
    user_reports = []
    
    for user in enrolled_users:
        # Obtener asistencias del usuario en este taller
        attendances = Attendance.query.join(Session).filter(
            Session.workshop_id == workshop_id,
            Attendance.user_id == user.id
        ).all()
        
        present = sum(1 for att in attendances if att.present)
        absent = len(attendances) - present
        
        user_reports.append({
            "user_id": user.id,
            "user_name": f"{user.name} {user.last_name}",
            "total_sessions": len(attendances),
            "present": present,
            "absent": absent,
            "attendance_rate": round((present / len(attendances) * 100), 2) if attendances else 0
        })
    
    return jsonify({
        "workshop": {
            "id": workshop.id,
            "name": workshop.name
        },
        "total_sessions": len(sessions),
        "total_students": len(enrolled_users),
        "students": user_reports
    }), 200