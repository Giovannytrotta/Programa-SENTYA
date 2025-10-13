import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, Users, Search, X, Eye } from 'lucide-react';
import { useCSSCenters } from '../../hooks/useCSSCenters';
import { useUsers } from '../../hooks/useUsers';
import './CSSView.css';

const CSSView = () => {
  const { centers, loading, fetchCenters } = useCSSCenters();
  const { users, fetchUsersByCSS } = useUsers();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const filteredCenters = centers.filter(center =>
    center.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewUsers = async (center) => {
    setSelectedCenter(center);
    setShowUsersModal(true);
    setLoadingUsers(true);
    
    try {
      await fetchUsersByCSS(center.id);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      'administrator': 'Administrador',
      'coordinator': 'Coordinador',
      'professional': 'Profesional',
      'client': 'Cliente',
      'css_technician': 'Técnico CSS'
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'administrator': 'role-admin',
      'coordinator': 'role-coordinator',
      'professional': 'role-professional',
      'client': 'role-client',
      'css_technician': 'role-technician'
    };
    return colors[role] || 'role-client';
  };

  if (loading) {
    return (
      <div className="css-loading">
        <div className="loading-spinner"></div>
        <p>Cargando centros...</p>
      </div>
    );
  }

  return (
    <div className="css-view">
      {/* Header */}
      <div className="css-header">
        <div className="header-title">
          <h1>Centros Sociales</h1>
          <p className="subtitle">Centros de servicios sociales activos</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="css-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, código o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="css-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{centers.length}</span>
            <span className="stat-label">Total Centros</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {centers.reduce((sum, c) => sum + (c.total_users || 0), 0)}
            </span>
            <span className="stat-label">Total Usuarios</span>
          </div>
        </div>
      </div>

      {/* Grid de Centros */}
      <div className="css-grid">
        {filteredCenters.length === 0 ? (
          <div className="no-centers">
            <Building2 size={48} />
            <p>No se encontraron centros</p>
          </div>
        ) : (
          filteredCenters.map(center => (
            <div key={center.id} className="center-card">
              <div className="center-header">
                <div className="center-icon">
                  <Building2 size={24} />
                </div>
                <div className="center-code">
                  {center.code}
                </div>
              </div>

              <div className="center-content">
                <h3 className="center-name">{center.name}</h3>

                <div className="center-info">
                  {center.address && (
                    <div className="info-item">
                      <MapPin size={16} />
                      <span>{center.address}</span>
                    </div>
                  )}

                  {center.phone && (
                    <div className="info-item">
                      <Phone size={16} />
                      <span>{center.phone}</span>
                    </div>
                  )}

                  {center.email && (
                    <div className="info-item">
                      <Mail size={16} />
                      <span>{center.email}</span>
                    </div>
                  )}

                  <div className="info-item">
                    <Users size={16} />
                    <span>{center.total_users || 0} usuarios</span>
                  </div>
                </div>
              </div>

              <div className="center-footer">
                <span className="status-badge active">
                  Activo
                </span>
                
                {/* 🆕 Botón Ver Usuarios */}
                <button 
                  className="btn-view-users"
                  onClick={() => handleViewUsers(center)}
                >
                  <Eye size={16} />
                  Ver Usuarios
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🆕 MODAL DE USUARIOS */}
      {showUsersModal && selectedCenter && (
        <div className="modal-overlay" onClick={() => setShowUsersModal(false)}>
          <div className="modal-content users-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Usuarios de {selectedCenter.name}</h2>
                <p className="modal-subtitle">
                  {users.length} usuario{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button 
                className="btn-close-modal"
                onClick={() => setShowUsersModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {loadingUsers ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                  <p>Cargando usuarios...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="modal-empty">
                  <Users size={48} />
                  <p>No hay usuarios en este centro</p>
                </div>
              ) : (
                <div className="users-list">
                  {users.map(user => (
                    <div key={user.id} className="user-item">
                      <div className="user-avatar">
                        {user.name?.charAt(0)}{user.last_name?.charAt(0)}
                      </div>
                      <div className="user-details">
                        <div className="user-name">
                          {user.name} {user.last_name}
                        </div>
                        <div className="user-email">
                          <Mail size={12} />
                          {user.email}
                        </div>
                      </div>
                      <div className="user-badges">
                        <span className={`role-badge ${getRoleBadgeColor(user.rol)}`}>
                          {getRoleLabel(user.rol)}
                        </span>
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSSView;