import React, { useState, useEffect } from 'react';
import { X, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAttendance } from '../../hooks/useAttendance';
import { useWorkshopUsers } from '../../hooks/useWorkshopUsers';
import './AttendanceModal.css';

const AttendanceModal = ({ session, onClose, onSuccess }) => {
  const { takeAttendance, loading } = useAttendance();
  const { enrolledStudents, fetchWorkshopStudents } = useWorkshopUsers();
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Cargar estudiantes inscritos
  useEffect(() => {
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        await fetchWorkshopStudents(session.workshop_id);
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [session.workshop_id, fetchWorkshopStudents]);

  // Inicializar data de asistencia
  useEffect(() => {
    if (enrolledStudents.length > 0) {
      const initialData = enrolledStudents.map(enrollment => ({
        user_id: enrollment.user_id,
        user_name: enrollment.user_name,
        present: true, // Por defecto marcar como presente
        observations: ''
      }));
      setAttendanceData(initialData);
    }
  }, [enrolledStudents]);

  const handleTogglePresent = (userId) => {
    setAttendanceData(prev =>
      prev.map(att =>
        att.user_id === userId
          ? { ...att, present: !att.present }
          : att
      )
    );
  };

  const handleObservationChange = (userId, value) => {
    setAttendanceData(prev =>
      prev.map(att =>
        att.user_id === userId
          ? { ...att, observations: value }
          : att
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await takeAttendance(session.id, attendanceData);
      onSuccess();
    } catch (error) {
      console.error('Error taking attendance:', error);
    }
  };

  const presentCount = attendanceData.filter(a => a.present).length;
  const absentCount = attendanceData.length - presentCount;

  if (loadingStudents) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content attendance-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando estudiantes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content attendance-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Tomar Asistencia</h2>
            <p className="session-info-subtitle">
              {session.topic || 'Sesión'} - {session.date}
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Stats */}
        <div className="attendance-stats">
          <div className="stat-item present">
            <CheckCircle size={20} />
            <span className="stat-number">{presentCount}</span>
            <span className="stat-label">Presentes</span>
          </div>
          <div className="stat-item absent">
            <XCircle size={20} />
            <span className="stat-number">{absentCount}</span>
            <span className="stat-label">Ausentes</span>
          </div>
          <div className="stat-item total">
            <Users size={20} />
            <span className="stat-number">{attendanceData.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="attendance-form">
          {attendanceData.length === 0 ? (
            <div className="no-students">
              <AlertCircle size={48} />
              <p>No hay estudiantes inscritos en este taller</p>
            </div>
          ) : (
            <div className="students-attendance-list">
              {attendanceData.map((student) => (
                <div
                  key={student.user_id}
                  className={`student-attendance-card ${student.present ? 'present' : 'absent'}`}
                >
                  <div className="student-attendance-info">
                    <div className="student-avatar">
                      {student.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="student-name">
                      <h4>{student.user_name}</h4>
                    </div>
                  </div>

                  <div className="attendance-controls">
                    <button
                      type="button"
                      className={`btn-toggle ${student.present ? 'active' : ''}`}
                      onClick={() => handleTogglePresent(student.user_id)}
                    >
                      {student.present ? (
                        <>
                          <CheckCircle size={18} />
                          Presente
                        </>
                      ) : (
                        <>
                          <XCircle size={18} />
                          Ausente
                        </>
                      )}
                    </button>

                    <input
                      type="text"
                      placeholder="Observaciones (opcional)"
                      value={student.observations}
                      onChange={(e) => handleObservationChange(student.user_id, e.target.value)}
                      className="observations-input"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || attendanceData.length === 0}
            >
              {loading ? 'Guardando...' : 'Guardar Asistencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceModal;