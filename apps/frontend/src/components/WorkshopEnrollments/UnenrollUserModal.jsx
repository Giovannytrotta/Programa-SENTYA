// apps/frontend/src/components/WorkshopEnrollments/UnenrollUserModal.jsx

import React, { useState } from 'react';
import { X, AlertTriangle, UserMinus } from 'lucide-react';
import { useWorkshopUsers } from '../../hooks/useWorkshopUsers';
import './UnenrollUserModal.css';

const UnenrollUserModal = ({ enrollment, onClose, onSuccess }) => {
  const { unenrollUser, loading } = useWorkshopUsers();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleUnenroll = async () => {
    if (!reason.trim()) {
      setError('Debes proporcionar una razón para la desinscripción');
      return;
    }

    try {
      await unenrollUser(enrollment.id, reason);
      onSuccess();
    } catch (error) {
      console.error('Error unenrolling user:', error);
    }
  };

  const isWaitlist = enrollment.waitlist_position !== null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="delete-modal-header">
          <div className="warning-icon">
            <AlertTriangle size={48} />
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="delete-modal-body">
          <h2>
            {isWaitlist ? '¿Eliminar de Lista de Espera?' : '¿Desinscribir Usuario?'}
          </h2>
          
          <div className="enrollment-info-box">
            <div className="user-info-display">
              <div className="user-avatar-large">
                {enrollment.user_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3>{enrollment.user_name}</h3>
                {isWaitlist ? (
                  <p className="waitlist-badge">
                    Posición en espera: #{enrollment.waitlist_position}
                  </p>
                ) : (
                  <p className="enrolled-badge">Usuario inscrito</p>
                )}
              </div>
            </div>
          </div>

          {!isWaitlist && (
            <div className="warning-message">
              <AlertTriangle size={20} />
              <div>
                <strong>⚠️ Al desinscribir a este usuario:</strong>
                <p>Se liberará un cupo y el primer usuario en lista de espera será promovido automáticamente.</p>
              </div>
            </div>
          )}

          <div className="reason-input">
            <label>Razón de la desinscripción *</label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              rows="4"
              placeholder="Ej: El usuario solicitó la baja por motivos personales"
              autoFocus
            />
            {error && <span className="error">{error}</span>}
            <small>Esta razón quedará registrada en el historial</small>
          </div>
        </div>

        {/* Actions */}
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
            onClick={handleUnenroll}
            disabled={loading || !reason.trim()}
          >
            {loading ? 'Procesando...' : (isWaitlist ? 'Eliminar' : 'Desinscribir')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnenrollUserModal;