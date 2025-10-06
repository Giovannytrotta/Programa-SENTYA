import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Users,
  Clock,
  MapPin,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkshops } from '../../hooks/useWorkshops';
import './MyWorkshopsView.css';

const MyWorkshopsView = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { workshops, loading, fetchWorkshops } = useWorkshops();
  
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown) setOpenDropdown(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  // Filtrar solo talleres asignados al profesional actual
  const myWorkshops = workshops.filter(workshop => {
    if (role === 'professional') {
      return workshop.professional_id === user.id;
    }
    // TODO: Para clientes, filtrar por inscripciones (PASO 2)
    return false;
  });

  // Aplicar filtros de búsqueda y status
  const filteredWorkshops = myWorkshops.filter(workshop => {
    const matchesSearch = workshop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || workshop.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'status-pending',
      'active': 'status-active',
      'paused': 'status-paused',
      'finished': 'status-finished'
    };
    return colors[status] || 'status-pending';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pendiente',
      'active': 'Activo',
      'paused': 'Pausado',
      'finished': 'Finalizado'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="workshops-loading">
        <div className="loading-spinner"></div>
        <p>Cargando mis talleres...</p>
      </div>
    );
  }

  return (
    <div className="workshops-view">
      {/* Header */}
      <div className="workshops-header">
        <div className="header-title">
          <h1>Mis Talleres</h1>
          <p className="subtitle">
            {role === 'professional' 
              ? 'Talleres asignados a ti como profesional'
              : 'Talleres en los que estás inscrito'}
          </p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="workshops-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar talleres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="pending">Pendientes</option>
            <option value="paused">Pausados</option>
            <option value="finished">Finalizados</option>
          </select>
        </div>
      </div>

      {/* Stats cards */}
      <div className="workshops-stats">
        <div className="stat-card">
          <div className="stat-icon active">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {filteredWorkshops.filter(w => w.status === 'active').length}
            </span>
            <span className="stat-label">Talleres Activos</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon total">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{filteredWorkshops.length}</span>
            <span className="stat-label">Total de Talleres</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon capacity">
            <MapPin size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {filteredWorkshops.reduce((sum, w) => sum + (w.current_capacity || 0), 0)}
            </span>
            <span className="stat-label">Usuarios Inscritos</span>
          </div>
        </div>
      </div>

      {/* Lista de talleres */}
      <div className="workshops-grid">
        {filteredWorkshops.length === 0 ? (
          <div className="no-workshops">
            <BookOpen size={48} />
            <p>
              {role === 'professional' 
                ? 'No tienes talleres asignados'
                : 'No estás inscrito en ningún taller'}
            </p>
          </div>
        ) : (
          filteredWorkshops.map(workshop => (
            <div key={workshop.id} className="workshop-card">
              {/* Status badge */}
              <div className={`workshop-status ${getStatusColor(workshop.status)}`}>
                {getStatusLabel(workshop.status)}
              </div>

              {/* Contenido */}
              <div className="workshop-content">
                <h3 className="workshop-name">{workshop.name}</h3>
                <p className="workshop-description">{workshop.description}</p>

                {/* Información */}
                <div className="workshop-info">
                  <div className="info-item">
                    <Calendar size={16} />
                    <span>{workshop.start_date}</span>
                  </div>

                  <div className="info-item">
                    <Clock size={16} />
                    <span>{workshop.start_time} - {workshop.end_time}</span>
                  </div>

                  <div className="info-item">
                    <MapPin size={16} />
                    <span>{workshop.css_name || 'Sin asignar'}</span>
                  </div>

                  <div className="info-item">
                    <Users size={16} />
                    <span>
                      {workshop.current_capacity}/{workshop.max_capacity} inscritos
                    </span>
                  </div>
                </div>

                {/* Área temática */}
                {workshop.thematic_area_name && (
                  <div className="workshop-tag">
                    {workshop.thematic_area_name}
                  </div>
                )}
              </div>

              {/* Acciones - Profesionales tienen acceso de solo lectura/gestión */}
              <div className="workshop-actions">
                {/* Dropdown para opciones */}
                <div className="dropdown-wrapper">
                  <button
                    className="btn-action view"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === workshop.id ? null : workshop.id);
                    }}
                  >
                    Ver Detalles ⋯
                  </button>

                  {openDropdown === workshop.id && (
                    <div
                      className="dropdown-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button onClick={() => {
                        navigate(`/workshops/${workshop.id}/sessions`);
                        setOpenDropdown(null);
                      }}>
                        📅 Ver Sesiones
                      </button>
                      <button onClick={() => {
                        navigate(`/workshops/${workshop.id}/enrollments`);
                        setOpenDropdown(null);
                      }}>
                        👥 Ver Inscritos
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyWorkshopsView;