from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.utils.decorators import (
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

# ============================================
# MIS ASISTENCIAS (PROFESIONALES)
# ============================================

@attendance_bp.route("/my-workshops", methods=["GET"])
@requires_professional_access
def get_my_workshops_attendance():
    """
    Ver TODAS las asistencias de los talleres del profesional
    Stats + Historial de todas las sesiones con asistencia registrada
    """
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get(user_id)
    
    if not user:
        raise NotFoundError("Usuario no encontrado")
    
    # Obtener talleres del profesional
    if user.rol == UserRole.PROFESSIONAL:
        workshops = Workshop.query.filter_by(professional_id=user_id).all()
    else:
        # Admin/Coordinator ven todos
        workshops = Workshop.query.all()
    
    workshop_ids = [w.id for w in workshops]
    
    if not workshop_ids:
        return jsonify({
            "message": "No tienes talleres asignados",
            "workshops": [],
            "sessions_with_attendance": [],
            "stats": {
                "total_sessions": 0,
                "total_workshops": 0,
                "total_attendances": 0,
                "average_attendance_rate": 0
            }
        }), 200
    
    # Obtener todas las sesiones con asistencia registrada
    sessions_with_attendance = Session.query.filter(
        Session.workshop_id.in_(workshop_ids),
        Session.status == 'completed'
    ).all()
    
    # Construir respuesta con detalles
    sessions_data = []
    total_present = 0
    total_records = 0
    
    for session in sessions_with_attendance:
        # Obtener asistencias de esta sesión
        attendances = Attendance.query.filter_by(session_id=session.id).all()
        
        if attendances:
            present_count = sum(1 for att in attendances if att.present)
            absent_count = len(attendances) - present_count
            attendance_rate = round((present_count / len(attendances) * 100), 2) if attendances else 0
            
            total_present += present_count
            total_records += len(attendances)
            
            sessions_data.append({
                "session_id": session.id,
                "workshop_id": session.workshop_id,
                "workshop_name": session.workshop.name,
                "date": session.date.strftime('%Y-%m-%d'),
                "start_time": session.start_time.strftime('%H:%M'),
                "end_time": session.end_time.strftime('%H:%M'),
                "topic": session.topic,
                "total_students": len(attendances),
                "present": present_count,
                "absent": absent_count,
                "attendance_rate": attendance_rate,
                "recorded_at": attendances[0].recorded_at.isoformat() if attendances else None
            })
    
    # Calcular estadísticas globales
    average_rate = round((total_present / total_records * 100), 2) if total_records > 0 else 0
    
    stats = {
        "total_sessions": len(sessions_data),
        "total_workshops": len(workshops),
        "total_attendances": total_records,
        "total_present": total_present,
        "total_absent": total_records - total_present,
        "average_attendance_rate": average_rate
    }
    
    return jsonify({
        "workshops": [{"id": w.id, "name": w.name} for w in workshops],
        "sessions_with_attendance": sessions_data,
        "stats": stats
    }), 200


# ============================================
# REPORTES ADMIN/COORDINATOR
# ============================================

@attendance_bp.route("/reports/workshop/<int:workshop_id>", methods=["GET"])
@requires_staff_access
def get_workshop_detailed_report(workshop_id):
    """
    Reporte detallado de un taller con:
    - Stats generales del taller
    - Ranking de asistencia (top y baja)
    - Lista completa de usuarios con sus stats individuales
    """
    workshop = Workshop.query.get(workshop_id)
    
    if not workshop:
        raise NotFoundError(f"Taller con ID {workshop_id} no encontrado")
    
    # Obtener todas las sesiones completadas del taller
    sessions = Session.query.filter_by(
        workshop_id=workshop_id,
        status='completed'
    ).all()
    
    total_sessions = len(sessions)
    
    if total_sessions == 0:
        return jsonify({
            "workshop": {
                "id": workshop.id,
                "name": workshop.name,
                "css_name": workshop.css.name if workshop.css else None,
                "professional_name": f"{workshop.professional.name} {workshop.professional.last_name}" if workshop.professional else None,
                "max_capacity": workshop.max_capacity,
                "current_capacity": workshop.current_capacity
            },
            "stats": {
                "total_sessions": 0,
                "average_attendance_rate": 0,
                "total_users": workshop.current_capacity,
                "active_users": 0
            },
            "users": [],
            "top_attendance": [],
            "low_attendance": []
        }), 200
    
    # Obtener todos los usuarios inscritos en el taller
    enrolled_users = [assignment.user for assignment in workshop.user_assignments 
                     if assignment.waitlist_position is None]
    
    # Calcular stats por usuario
    users_stats = []
    total_attendance_sum = 0
    
    for user in enrolled_users:
        # Obtener asistencias del usuario en este taller
        attendances = Attendance.query.join(Session).filter(
            Session.workshop_id == workshop_id,
            Session.status == 'completed',
            Attendance.user_id == user.id
        ).all()
        
        sessions_attended = len(attendances)
        present_count = sum(1 for att in attendances if att.present)
        absent_count = sessions_attended - present_count
        
        # Calcular porcentaje (sobre las sesiones a las que debió asistir)
        attendance_rate = round((present_count / sessions_attended * 100), 2) if sessions_attended > 0 else 0
        
        total_attendance_sum += attendance_rate
        
        users_stats.append({
            "user_id": user.id,
            "user_name": f"{user.name} {user.last_name}",
            "email": user.email,
            "sessions_attended": sessions_attended,
            "present": present_count,
            "absent": absent_count,
            "attendance_rate": attendance_rate,
            "status": "active" if sessions_attended > 0 else "inactive"
        })
    
    # Ordenar por attendance_rate
    users_stats_sorted = sorted(users_stats, key=lambda x: x['attendance_rate'], reverse=True)
    
    # Top 5 asistencia
    top_attendance = users_stats_sorted[:5]
    
    # Baja asistencia (menos de 60%)
    low_attendance = [u for u in users_stats_sorted if u['attendance_rate'] < 60 and u['sessions_attended'] > 0]
    
    # Calcular promedio general
    active_users = len([u for u in users_stats if u['sessions_attended'] > 0])
    average_rate = round(total_attendance_sum / len(users_stats), 2) if users_stats else 0
    
    # Stats generales
    stats = {
        "total_sessions": total_sessions,
        "average_attendance_rate": average_rate,
        "total_users": len(enrolled_users),
        "active_users": active_users,
        "inactive_users": len(enrolled_users) - active_users
    }
    
    return jsonify({
        "workshop": {
            "id": workshop.id,
            "name": workshop.name,
            "css_name": workshop.css.name if workshop.css else None,
            "professional_name": f"{workshop.professional.name} {workshop.professional.last_name}" if workshop.professional else None,
            "max_capacity": workshop.max_capacity,
            "current_capacity": workshop.current_capacity,
            "start_date": workshop.start_date.strftime('%Y-%m-%d') if workshop.start_date else None,
            "status": workshop.status.value if workshop.status else None
        },
        "stats": stats,
        "users": users_stats_sorted,
        "top_attendance": top_attendance,
        "low_attendance": low_attendance
    }), 200


# ============================================
# LISTAR TALLERES PARA REPORTES
# ============================================

@attendance_bp.route("/reports/workshops", methods=["GET"])
@requires_staff_access
def get_workshops_for_reports():
    """
    Obtener lista de talleres disponibles para generar reportes
    (Solo talleres con al menos una sesión completada)
    """
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get(user_id)
    
    # Admin ve todos, Coordinator solo los de su CSS
    if user.rol == UserRole.ADMINISTRATOR:
        workshops = Workshop.query.all()
    elif user.rol == UserRole.COORDINATOR:
        workshops = Workshop.query.filter_by(css_id=user.css_id).all()
    else:
        workshops = []
    
    # Filtrar solo talleres con sesiones completadas
    workshops_with_sessions = []
    for workshop in workshops:
        completed_sessions = Session.query.filter_by(
            workshop_id=workshop.id,
            status='completed'
        ).count()
        
        if completed_sessions > 0:
            workshops_with_sessions.append({
                "id": workshop.id,
                "name": workshop.name,
                "css_name": workshop.css.name if workshop.css else None,
                "completed_sessions": completed_sessions,
                "status": workshop.status.value if workshop.status else None
            })
    
    return jsonify({
        "workshops": workshops_with_sessions,
        "total": len(workshops_with_sessions)
    }), 200