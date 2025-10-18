import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Calendar,
  Building2,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useDashboard } from '../../../hooks/useDashboard'; // 🆕 HOOK NUEVO
import './AdminDashboardPanel.css';

const AdminDashboardPanel = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  // ============================================
  // 🔥 UNA SOLA LÍNEA - TODA LA LÓGICA DELEGADA AL HOOK
  // ============================================
  const {
    stats,
    recentWorkshops,
    loading,
    error
  } = useDashboard(role, user?.id);

  // ============================================
  // 🎨 FUNCIONES HELPER DE UI (solo formateo visual)
  // ============================================
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
      <div className="admin-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <Activity size={64} />
        <p>{error}</p>
      </div>
    );
  }

  // ============================================
  // 🎨 RENDERIZADO PRINCIPAL - SOLO JSX LIMPIO
  // ============================================
  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Panel de {role === 'administrator' ? 'Administración' : 'Coordinación'}</h1>
        <p>Vista general del sistema</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/users')}>
          <div className="stat-icon users">
            <Users size={28} />
          </div>
          <div className="stat-content">
            <h3>Total Usuarios</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/workshops')}>
          <div className="stat-icon workshops">
            <BookOpen size={28} />
          </div>
          <div className="stat-content">
            <h3>Talleres Activos</h3>
            <p className="stat-number">{stats.activeWorkshops}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sessions">
            <Calendar size={28} />
          </div>
          <div className="stat-content">
            <h3>Sesiones Totales</h3>
            <p className="stat-number">{stats.totalSessions}</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/css')}>
          <div className="stat-icon centers">
            <Building2 size={28} />
          </div>
          <div className="stat-content">
            <h3>Centros Sociales</h3>
            <p className="stat-number">{stats.totalCenters}</p>
          </div>
        </div>
      </div>

      {/* Talleres Recientes */}
      <div className="content-section">
        <div className="section-header">
          <h2>Talleres Recientes</h2>
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
            <p>No hay talleres disponibles</p>
          </div>
        ) : (
          <div className="workshops-grid">
            {recentWorkshops.map(workshop => (
              <div 
                key={workshop.id} 
                className="workshop-card"
                onClick={() => navigate('/workshops')}
              >
                <div className="workshop-header">
                  <h3>{workshop.name}</h3>
                  <span className={`status-badge ${workshop.status}`}>
                    {getStatusLabel(workshop.status)}
                  </span>
                </div>
                <div className="workshop-meta">
                  <span>
                    <Users size={14} />
                    {workshop.current_capacity}/{workshop.max_capacity}
                  </span>
                  <span>{workshop.css_name || 'Sin centro'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {role === 'administrator' && (
          <button 
            className="action-btn admin-panel"
            onClick={() => navigate('/aossadmin')}
          >
            <Activity size={20} />
            Panel Avanzado (Solo Admin)
          </button>
        )}
        <button 
          className="action-btn primary"
          onClick={() => navigate('/workshops')}
        >
          <BookOpen size={20} />
          Gestionar Talleres
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => navigate('/users')}
        >
          <Users size={20} />
          Gestionar Usuarios
        </button>
      </div>
    </div>
  );
};

export default AdminDashboardPanel;