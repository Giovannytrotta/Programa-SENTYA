// apps/frontend/src/components/WorkshopsView/DeleteWorkshopModal.jsx

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useWorkshops } from '../../hooks/useWorkshops';
import './DeleteWorkshopModal.css';

const DeleteWorkshopModal = ({ workshop, onClose, onSuccess }) => {
  const { deleteWorkshop, loading } = useWorkshops();
  const [confirmText, setConfirmText] = useState('');

  const hasEnrolledStudents = workshop.current_capacity > 0;

  const handleDelete = async () => {
    if (hasEnrolledStudents && confirmText !== 'ELIMINAR') {
      return;
    }

    try {
      await deleteWorkshop(workshop.id);
      onSuccess();
    } catch (error) {
      console.error('Error deleting workshop:', error);
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
          <h2>¿Eliminar Taller?</h2>
          
          <div className="workshop-info-box">
            <h3>{workshop.name}</h3>
            <p className="workshop-meta">
              📍 {workshop.css_name} • 👥 {workshop.current_capacity}/{workshop.max_capacity} inscritos
            </p>
          </div>

          {hasEnrolledStudents ? (
            <>
              <div className="warning-message">
                <AlertTriangle size={20} />
                <div>
                  <strong>⚠️ Este taller tiene {workshop.current_capacity} usuario(s) inscrito(s)</strong>
                  <p>Eliminar el taller desaparecerá permanentemente y afectará a los usuarios inscritos.</p>
                </div>
              </div>

              <div className="confirmation-input">
                <label>Para confirmar, escribe <strong>ELIMINAR</strong> en el campo:</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Escribe ELIMINAR"
                  autoFocus
                />
              </div>
            </>
          ) : (
            <p className="info-message">
              Este taller no tiene usuarios inscritos. ¿Estás seguro de eliminarlo?
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
            disabled={loading || (hasEnrolledStudents && confirmText !== 'ELIMINAR')}
          >
            {loading ? 'Eliminando...' : 'Eliminar Taller'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteWorkshopModal;