import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User } from 'lucide-react';
import { useSessions } from '../../hooks/useSessions';
import { apiService } from '../../services/api';
import './CreateSessionModal.css'; // Reutilizamos los estilos

const EditSessionModal = ({ session, onClose, onSuccess }) => {
  const { updateSession, loading } = useSessions();

  const [formData, setFormData] = useState({
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

  // Cargar datos de la sesión existente
  useEffect(() => {
    if (session) {
      setFormData({
        date: session.date || '',
        start_time: session.start_time || '',
        end_time: session.end_time || '',
        topic: session.topic || '',
        observations: session.observations || '',
        professional_id: session.professional_id || '',
        status: session.status || 'scheduled'
      });
    }
  }, [session]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const sessionData = {
        ...formData,
        professional_id: parseInt(formData.professional_id)
      };

      await updateSession(session.id, sessionData);
      onSuccess();
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': '#f59e0b',
      'completed': '#10b981',
      'cancelled': '#ef4444',
      'rescheduled': '#3b82f6'
    };
    return colors[status] || '#f59e0b';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content session-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Editar Sesión</h2>
            {session.topic && (
              <p className="workshop-subtitle">{session.topic}</p>
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
            <h3>Detalles</h3>

            <div className="form-group">
              <label>Tema de la Sesión</label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="Ej: Ejercicios de respiración"
              />
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
              <label>Estado de la Sesión</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ 
                  borderLeft: `4px solid ${getStatusColor(formData.status)}`,
                  fontWeight: '600'
                }}
              >
                <option value="scheduled">⏱️ Programada</option>
                <option value="completed">✅ Completada</option>
                <option value="cancelled">❌ Cancelada</option>
                <option value="rescheduled">🔄 Reprogramada</option>
              </select>
              <small>
                {formData.status === 'scheduled' && '⏱️ Sesión pendiente de realizarse'}
                {formData.status === 'completed' && '✅ Sesión ya realizada'}
                {formData.status === 'cancelled' && '❌ Sesión cancelada'}
                {formData.status === 'rescheduled' && '🔄 Sesión reprogramada para otra fecha'}
              </small>
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSessionModal;