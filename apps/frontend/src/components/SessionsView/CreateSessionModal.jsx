// apps/frontend/src/components/SessionsView/CreateSessionModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User } from 'lucide-react';
import { useSessions } from '../../hooks/useSessions';
import { apiService } from '../../services/api';
import './CreateSessionModal.css';

const CreateSessionModal = ({ workshopId, workshopName, onClose, onSuccess }) => {
  const { createSession, loading } = useSessions();

  const [formData, setFormData] = useState({
    workshop_id: workshopId,
    date: '',
    start_time: '',
    end_time: '',
    topic: '',
    observations: '',
    professional_id: '',
    status: 'scheduled'
  });

  const [professionals, setProfessionals] = useState([]);
  const [errors, setErrors] = useState({});

  // Cargar profesionales
  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        const response = await apiService.getProfessionals();
        if (response?.professionals) {
          setProfessionals(response.professionals);
        }
      } catch (error) {
        console.error('Error loading professionals:', error);
      }
    };

    loadProfessionals();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) newErrors.date = 'La fecha es requerida';
    if (!formData.start_time) newErrors.start_time = 'La hora de inicio es requerida';
    if (!formData.end_time) newErrors.end_time = 'La hora de fin es requerida';
    if (!formData.professional_id) newErrors.professional_id = 'Debe asignar un profesional';

    // Validar que end_time sea después de start_time
    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        newErrors.end_time = 'La hora de fin debe ser después de la hora de inicio';
      }
    }

    // Validar que la fecha no sea en el pasado
    const today = new Date().toISOString().split('T')[0];
    if (formData.date && formData.date < today) {
      newErrors.date = 'No puedes crear sesiones en fechas pasadas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const sessionData = {
        ...formData,
        workshop_id: parseInt(formData.workshop_id),
        professional_id: parseInt(formData.professional_id)
      };

      await createSession(sessionData);
      onSuccess();
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content session-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Nueva Sesión</h2>
            {workshopName && (
              <p className="workshop-subtitle">Para: {workshopName}</p>
            )}
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="session-form">
          {/* Fecha y horario */}
          <div className="form-section">
            <h3>
              <Calendar size={18} />
              Fecha y Horario
            </h3>

            <div className="form-group">
              <label>Fecha de la Sesión *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
              {errors.date && <span className="error">{errors.date}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hora de Inicio *</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                />
                {errors.start_time && <span className="error">{errors.start_time}</span>}
              </div>

              <div className="form-group">
                <label>Hora de Fin *</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                />
                {errors.end_time && <span className="error">{errors.end_time}</span>}
              </div>
            </div>
          </div>

          {/* Profesional */}
          <div className="form-section">
            <h3>
              <User size={18} />
              Profesional
            </h3>

            <div className="form-group">
              <label>Profesional a cargo *</label>
              <select
                name="professional_id"
                value={formData.professional_id}
                onChange={handleChange}
              >
                <option value="">Seleccionar profesional</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
              {errors.professional_id && <span className="error">{errors.professional_id}</span>}
            </div>
          </div>

          {/* Detalles */}
          <div className="form-section">
            <h3>Detalles Adicionales</h3>

            <div className="form-group">
              <label>Tema de la Sesión</label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="Ej: Ejercicios de respiración"
              />
              <small>Opcional - Describe el contenido de esta clase</small>
            </div>

            <div className="form-group">
              <label>Observaciones</label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows="3"
                placeholder="Notas adicionales sobre la sesión..."
              />
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="scheduled">Programada</option>
                <option value="rescheduled">Reprogramada</option>
              </select>
            </div>
          </div>

          {/* Botones */}
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
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;