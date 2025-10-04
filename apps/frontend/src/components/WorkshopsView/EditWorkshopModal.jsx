import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, MapPin, Clock } from 'lucide-react';
import { useWorkshops } from '../../hooks/useWorkshops';
import { apiService } from '../../services/api';
import './CreateWorkshopModal.css'; // Reutilizamos los estilos

const EditWorkshopModal = ({ workshop, onClose, onSuccess }) => {
  const { updateWorkshop, loading } = useWorkshops();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thematic_area_id: '',
    css_id: '',
    professional_id: '',
    max_capacity: 30,
    start_time: '',
    end_time: '',
    week_days: '',
    start_date: '',
    end_date: '',
    location: '',
    session_duration: 60,
    status: 'pending',
    observations: ''
  });

  const [thematicAreas, setThematicAreas] = useState([]);
  const [cssCenters, setCssCenters] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [errors, setErrors] = useState({});

  // Cargar datos del taller existente
  useEffect(() => {
    if (workshop) {
      setFormData({
        name: workshop.name || '',
        description: workshop.description || '',
        thematic_area_id: workshop.thematic_area_id || '',
        css_id: workshop.css_id || '',
        professional_id: workshop.professional_id || '',
        max_capacity: workshop.max_capacity || 30,
        start_time: workshop.start_time || '',
        end_time: workshop.end_time || '',
        week_days: workshop.week_days || '',
        start_date: workshop.start_date || '',
        end_date: workshop.end_date || '',
        location: workshop.location || '',
        session_duration: workshop.session_duration || 60,
        status: workshop.status || 'pending',
        observations: workshop.observations || ''
      });
    }
  }, [workshop]);

  // Cargar datos auxiliares
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cssResponse, areasResponse, profResponse] = await Promise.all([
          apiService.getActiveCSSCenters(),
          apiService.getThematicAreas(),
          apiService.getProfessionals()
        ]);

        if (cssResponse?.css_centers) setCssCenters(cssResponse.css_centers);
        if (areasResponse?.thematic_areas) setThematicAreas(areasResponse.thematic_areas);
        if (profResponse?.professionals) setProfessionals(profResponse.professionals);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
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

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.thematic_area_id) newErrors.thematic_area_id = 'Debe seleccionar un área temática';
    if (!formData.css_id) newErrors.css_id = 'Debe seleccionar un centro';
    if (!formData.professional_id) newErrors.professional_id = 'Debe asignar un profesional';
    if (!formData.start_time) newErrors.start_time = 'La hora de inicio es requerida';
    if (!formData.end_time) newErrors.end_time = 'La hora de fin es requerida';
    if (!formData.week_days) newErrors.week_days = 'Debe seleccionar al menos un día';
    if (!formData.start_date) newErrors.start_date = 'La fecha de inicio es requerida';
    
    // Validar capacidad vs inscritos actuales
    if (formData.max_capacity < workshop.current_capacity) {
      newErrors.max_capacity = `No puedes reducir la capacidad por debajo de ${workshop.current_capacity} inscritos`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const workshopData = {
        ...formData,
        thematic_area_id: parseInt(formData.thematic_area_id),
        css_id: parseInt(formData.css_id),
        professional_id: parseInt(formData.professional_id),
        max_capacity: parseInt(formData.max_capacity),
        session_duration: parseInt(formData.session_duration)
      };

      await updateWorkshop(workshop.id, workshopData);
      onSuccess();
    } catch (error) {
      console.error('Error updating workshop:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'active': '#10b981',
      'paused': '#ef4444',
      'finished': '#6b7280'
    };
    return colors[status] || '#f59e0b';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Editar Taller</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="workshop-form">
          {/* Información básica */}
          <div className="form-section">
            <h3>Información Básica</h3>

            <div className="form-group">
              <label>Nombre del Taller *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Taller de Risoterapia"
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Área Temática *</label>
              <select
                name="thematic_area_id"
                value={formData.thematic_area_id}
                onChange={handleChange}
              >
                <option value="">Seleccionar área temática</option>
                {thematicAreas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              {errors.thematic_area_id && <span className="error">{errors.thematic_area_id}</span>}
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Describe el taller..."
              />
            </div>

            {/* STATUS DROPDOWN */}
            <div className="form-group">
              <label>Estado del Taller *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ 
                  borderLeft: `4px solid ${getStatusColor(formData.status)}`,
                  fontWeight: '600'
                }}
              >
                <option value="pending">⏳ Pendiente</option>
                <option value="active">✅ Activo</option>
                <option value="paused">⏸️ Pausado</option>
                <option value="finished">🏁 Finalizado</option>
              </select>
              <small>
                {formData.status === 'active' && '✅ Los usuarios pueden inscribirse'}
                {formData.status === 'pending' && '⏳ En espera de activación'}
                {formData.status === 'paused' && '⏸️ Temporalmente pausado'}
                {formData.status === 'finished' && '🏁 Taller completado'}
              </small>
            </div>
          </div>

          {/* Asignaciones */}
          <div className="form-section">
            <h3>Asignaciones</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Centro Social *</label>
                <select
                  name="css_id"
                  value={formData.css_id}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar centro</option>
                  {cssCenters.map(css => (
                    <option key={css.id} value={css.id}>
                      {css.name}
                    </option>
                  ))}
                </select>
                {errors.css_id && <span className="error">{errors.css_id}</span>}
              </div>

              <div className="form-group">
                <label>Profesional Asignado *</label>
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

            <div className="form-group">
              <label>Ubicación</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ej: Sala 2 - Planta Baja"
              />
            </div>
          </div>

          {/* Horario */}
          <div className="form-section">
            <h3>Horario</h3>

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

            <div className="form-group">
              <label>Días de la Semana *</label>
              <input
                type="text"
                name="week_days"
                value={formData.week_days}
                onChange={handleChange}
                placeholder="Ej: L,M,V"
              />
              <small>Formato: L,M,X,J,V,S,D</small>
              {errors.week_days && <span className="error">{errors.week_days}</span>}
            </div>
          </div>

          {/* Fechas */}
          <div className="form-section">
            <h3>Período</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Inicio *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                />
                {errors.start_date && <span className="error">{errors.start_date}</span>}
              </div>

              <div className="form-group">
                <label>Fecha de Fin</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Capacidad */}
          <div className="form-section">
            <h3>Capacidad</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Capacidad Máxima *</label>
                <input
                  type="number"
                  name="max_capacity"
                  value={formData.max_capacity}
                  onChange={handleChange}
                  min={workshop.current_capacity}
                />
                <small>
                  📊 Inscritos actuales: {workshop.current_capacity}
                </small>
                {errors.max_capacity && <span className="error">{errors.max_capacity}</span>}
              </div>

              <div className="form-group">
                <label>Duración por Sesión (minutos)</label>
                <input
                  type="number"
                  name="session_duration"
                  value={formData.session_duration}
                  onChange={handleChange}
                  min="30"
                  step="15"
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="form-section">
            <h3>Información Adicional</h3>

            <div className="form-group">
              <label>Observaciones</label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows="3"
                placeholder="Notas adicionales..."
              />
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

export default EditWorkshopModal;