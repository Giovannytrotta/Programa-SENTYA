// apps/frontend/src/components/Workshops/WorkshopsView.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Users, MapPin, Clock, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkshops } from '../../hooks/useWorkshops';
import CreateWorkshopModal from './CreateWorkshopModal';
import EditWorkshopModal from './EditWorkshopModal'; //editar taller
import DeleteWorkshopModal from './DeleteWorkshopModal'; // elimitar taller
import { useNavigate } from 'react-router-dom';
import './WorkshopsView.css';

const WorkshopsView = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { workshops, loading, fetchWorkshops } = useWorkshops();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);      // NUEVO  editar
  const [showDeleteModal, setShowDeleteModal] = useState(false);  // NUEVO eliminar
  const [selectedWorkshop, setSelectedWorkshop] = useState(null); // NUEVO seleccionar
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verificar si puede crear talleres
  const canCreateWorkshop = role === 'administrator' || role === 'coordinator';

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

  const filteredWorkshops = workshops.filter(workshop => {
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

  const handleEdit = (workshop) => {
    setSelectedWorkshop(workshop);
    setShowEditModal(true);
  };

  const handleDelete = (workshop) => {
    setSelectedWorkshop(workshop);
    setShowDeleteModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedWorkshop(null);
    fetchWorkshops();
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setSelectedWorkshop(null);
    fetchWorkshops();
  };

  if (loading) {
    return (
      <div className="workshops-loading">
        <div className="loading-spinner"></div>
        <p>Cargando talleres...</p>
      </div>
    );
  }

  return (
    <div className="workshops-view">
      {/* Header */}
      <div className="workshops-header">
        <div className="header-title">
          <h1>Talleres</h1>
          <p className="subtitle">
            {canCreateWorkshop
              ? 'Gestiona los talleres disponibles'
              : 'Explora los talleres disponibles'}
          </p>
        </div>

        {/* Botón crear - solo para admin/coordinator */}
        {canCreateWorkshop && (
          <button
            className="btn-create-workshop"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
            Crear Taller
          </button>
        )}
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
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {workshops.filter(w => w.status === 'active').length}
            </span>
            <span className="stat-label">Talleres Activos</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon total">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{workshops.length}</span>
            <span className="stat-label">Total de Talleres</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon capacity">
            <MapPin size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {workshops.reduce((sum, w) => sum + (w.current_capacity || 0), 0)}
            </span>
            <span className="stat-label">Usuarios Inscritos</span>
          </div>
        </div>
      </div>

      {/* Lista de talleres */}
      <div className="workshops-grid">
        {filteredWorkshops.length === 0 ? (
          <div className="no-workshops">
            <Calendar size={48} />
            <p>No se encontraron talleres</p>
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

                {/* Profesional asignado */}
                {workshop.professional_name && (
                  <div className="workshop-professional">
                    <span className="label">Profesional:</span>
                    <span className="value">{workshop.professional_name}</span>
                  </div>
                )}

                {/* Área temática */}
                {workshop.thematic_area_name && (
                  <div className="workshop-tag">
                    {workshop.thematic_area_name}
                  </div>
                )}
              </div>

              {/* Acciones - solo para admin/coordinator */}
              {canCreateWorkshop && (
                <div className="workshop-actions">
                  <button
                    className="btn-action edit"
                    onClick={() => handleEdit(workshop)}
                  >
                    <Edit size={16} />
                    Editar
                  </button>

                  <button
                    className="btn-action delete"
                    onClick={() => handleDelete(workshop)}
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>

                  {/* Dropdown para más opciones */}
                  <div className="dropdown-wrapper">
                    <button
                      className="btn-action dropdown"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === workshop.id ? null : workshop.id);
                      }}
                    >
                      Más ⋯
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
              )}
            </div>
          ))
        )}
      </div>

      {/* MODALES */}

      {/* Modal de creación - solo para admin/coordinator */}
      
      {canCreateWorkshop && showCreateModal && (
        <CreateWorkshopModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchWorkshops();
          }}
        />
      )}
      {/*  Modal de edición - NUEVO */}
      {canCreateWorkshop && showEditModal && selectedWorkshop && (
        <EditWorkshopModal
          workshop={selectedWorkshop}
          onClose={() => {
            setShowEditModal(false);
            setSelectedWorkshop(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/*  Modal de eliminación - NUEVO */}
      {canCreateWorkshop && showDeleteModal && selectedWorkshop && (
        <DeleteWorkshopModal
          workshop={selectedWorkshop}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedWorkshop(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default WorkshopsView;