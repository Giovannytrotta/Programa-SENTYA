import React from 'react';
import { X, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { useSessions } from '../../hooks/useSessions';
import './DeleteSessionModal.css';

const DeleteSessionModal = ({ session, onClose, onSuccess }) => {
  const { deleteSession, loading } = useSessions();

  const hasAttendance = session.status === 'completed';

  const handleDelete = async () => {
    try {
      await deleteSession(session.id);
      onSuccess();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header con ícono de advertencia */}
        <div className="delete-modal-header">
          <div className="warning-icon">
            <AlertTriangle size={48} />
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="delete-modal-body">
          <h2>¿Eliminar Sesión?</h2>
          
          <div className="session-info-box">
            <div className="session-date-info">
              <Calendar size={18} />
              <span>{session.date}</span>
            </div>
            <div className="session-time-info">
              <Clock size={18} />
              <span>{session.start_time} - {session.end_time}</span>
            </div>
            {session.topic && (
              <h3>{session.topic}</h3>
            )}
          </div>

          {hasAttendance ? (
            <div className="warning-message">
              <AlertTriangle size={20} />
              <div>
                <strong>⚠️ Esta sesión ya fue completada</strong>
                <p>No puedes eliminar sesiones que ya fueron realizadas y tienen asistencia registrada.</p>
              </div>
            </div>
          ) : (
            <p className="info-message">
              Esta acción no se puede deshacer. La sesión será eliminada permanentemente.
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="delete-modal-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-delete"
            onClick={handleDelete}
            disabled={loading || hasAttendance}
          >
            {loading ? 'Eliminando...' : 'Eliminar Sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSessionModal;