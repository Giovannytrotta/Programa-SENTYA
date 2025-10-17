import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  Shield,
  UserCog,
  Award,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useDashboard } from '../../../hooks/useDashboard'; // 🆕 HOOK NUEVO
import './CSSTechnicianDashboard.css';

const CSSTechnicianDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log("🧩 CSSTechnicianDashboard render:", {
    id: user?.id,
    role: user?.rol,
    css_id: user?.css_id,
    user
  });

  if (!user?.css_id) {
  return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Verificando centro asignado...</p>
    </div>
  );
}

  // ============================================
  // 🔥 UNA SOLA LÍNEA - TODA LA LÓGICA DELEGADA AL HOOK
  // ============================================
  const {
    stats,
    recentWorkshops,
    centerInfo,
    usersByRole,
    loading,
    error
  } = useDashboard('css_technician', user?.id, user?.css_id);

  // ============================================
  // 🎨 FUNCIONES HELPER DE UI (solo formateo visual)
  // ============================================
  const getRoleLabel = (role) => {
    const labels = {
      administrator: 'Administradores',
      coordinator: 'Coordinadores',
      professional: 'Profesionales',
      client: 'Clientes',
      css_technician: 'Técnicos CSS'
    };
    return labels[role] || role;
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Activo',
      pending: 'Pendiente',
      paused: 'Pausado',
      finished: 'Finalizado'
    };
    return labels[status] || status;
  };

  // ============================================
  // 🎭 ESTADOS DE CARGA Y ERROR
  // ============================================
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando información del centro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <Building2 size={64} />
        <p>{error}</p>
      </div>
    );
  }

  if (!centerInfo) {
    return (
      <div className="empty-state">
        <Building2 size={64} />
        <p>No se encontró información del centro</p>
      </div>
    );
  }

  // ============================================
  // 🎨 RENDERIZADO PRINCIPAL - SOLO JSX LIMPIO
  // ============================================
  return (
    <div className="css-technician-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Panel de Técnico CSS</h1>
        <p>Vista general de tu centro de servicios sociales</p>
      </div>

      {/* Center Info Card */}
      <div className="center-info-card">
        <div className="center-icon-large">
          <Building2 size={32} />
        </div>
        <div className="center-details">
          <h2>{centerInfo.name}</h2>
          <div className="center-meta">
            {centerInfo.address && (
              <span>
                <MapPin size={14} />
                {centerInfo.address}
              </span>
            )}
            {centerInfo.phone && (
              <span>
                <Phone size={14} />
                {centerInfo.phone}
              </span>
            )}
            {centerInfo.email && (
              <span>
                <Mail size={14} />
                {centerInfo.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/workshops')}>
          <div className="stat-icon workshops">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Talleres</h3>
            <p className="stat-number">{stats.totalWorkshops}</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/workshops')}>
          <div className="stat-icon active">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>Talleres Activos</h3>
            <p className="stat-number">{stats.activeWorkshops}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Usuarios</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sessions">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Sesiones Totales</h3>
            <p className="stat-number">{stats.upcomingSessions}</p>
          </div>
        </div>
      </div>

      {/* Talleres del Centro */}
      <div className="content-section">
        <div className="section-header">
          <h2>Talleres del Centro</h2>
          <button 
            className="btn-view-all"
            onClick={() => navigate('/workshops')}
          >
            Ver todos
            <ArrowRight size={16} />
          </button>
        </div>

        {recentWorkshops.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>No hay talleres disponibles en este centro</p>
          </div>
        ) : (
          <div className="workshops-grid">
            {recentWorkshops.map(workshop => (
              <div 
                key={workshop.id} 
                className="workshop-card"
                onClick={() => navigate('/workshops')}
              >
                <div className="workshop-color-bar"></div>
                <div className="workshop-content">
                  <h3>{workshop.name}</h3>
                  <div className="workshop-meta">
                    <span>
                      <Calendar size={14} />
                      {workshop.start_date}
                    </span>
                    <span>
                      <Users size={14} />
                      {workshop.current_capacity}/{workshop.max_capacity} inscritos
                    </span>
                    {workshop.professional_name && (
                      <span>
                        <Award size={14} />
                        {workshop.professional_name}
                      </span>
                    )}
                  </div>
                  <span className={`workshop-status ${workshop.status}`}>
                    {getStatusLabel(workshop.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usuarios por Rol */}
      <div className="content-section">
        <div className="section-header">
          <h2>Usuarios del Centro</h2>
        </div>

        <div className="users-summary">
          <div className="user-role-card">
            <div className="user-role-header">
              <div className="role-icon admin">
                <Shield size={20} />
              </div>
              <div className="role-info">
                <h4>Administradores</h4>
                <span className="role-count">
                  {usersByRole.administrator} {usersByRole.administrator === 1 ? 'usuario' : 'usuarios'}
                </span>
              </div>
            </div>
            <p className="user-count">{usersByRole.administrator}</p>
          </div>

          <div className="user-role-card">
            <div className="user-role-header">
              <div className="role-icon coordinator">
                <UserCog size={20} />
              </div>
              <div className="role-info">
                <h4>Coordinadores</h4>
                <span className="role-count">
                  {usersByRole.coordinator} {usersByRole.coordinator === 1 ? 'usuario' : 'usuarios'}
                </span>
              </div>
            </div>
            <p className="user-count">{usersByRole.coordinator}</p>
          </div>

          <div className="user-role-card">
            <div className="user-role-header">
              <div className="role-icon professional">
                <Award size={20} />
              </div>
              <div className="role-info">
                <h4>Profesionales</h4>
                <span className="role-count">
                  {usersByRole.professional} {usersByRole.professional === 1 ? 'usuario' : 'usuarios'}
                </span>
              </div>
            </div>
            <p className="user-count">{usersByRole.professional}</p>
          </div>

          <div className="user-role-card">
            <div className="user-role-header">
              <div className="role-icon client">
                <Users size={20} />
              </div>
              <div className="role-info">
                <h4>Clientes</h4>
                <span className="role-count">
                  {usersByRole.client} {usersByRole.client === 1 ? 'usuario' : 'usuarios'}
                </span>
              </div>
            </div>
            <p className="user-count">{usersByRole.client}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="action-btn primary"
          onClick={() => navigate('/workshops')}
        >
          <BookOpen size={20} />
          Ver Talleres
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => navigate('/css')}
        >
          <Building2 size={20} />
          Ver Centros
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => navigate('/reports')}
        >
          <BarChart3 size={20} />
          Ver Reportes
        </button>
      </div>
    </div>
  );
};

export default CSSTechnicianDashboard;