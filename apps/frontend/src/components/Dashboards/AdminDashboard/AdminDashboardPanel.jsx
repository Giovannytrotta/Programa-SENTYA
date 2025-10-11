import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Calendar,
  Building2,
  TrendingUp,
  Activity,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import useGlobalReducer from '../../../store/useGlobalReducer';
import { ACTION_TYPES } from '../../../store';
import './AdminDashboardPanel.css';

const AdminDashboardPanel = () => {
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();
  const { role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeWorkshops: 0,
    totalSessions: 0,
    totalCenters: 0
  });
  const [recentWorkshops, setRecentWorkshops] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const usersResponse = await apiService.getAllUsers();
      const users = usersResponse.users || [];

      const workshopsResponse = await apiService.getAllWorkshops();
      const workshops = workshopsResponse.workshops || [];

      const centersResponse = await apiService.getActiveCSSCenters();
      const centers = centersResponse.css_centers || [];

      const activeWorkshops = workshops.filter(w => w.status === 'active').length;

      setStats({
        totalUsers: users.length,
        activeWorkshops: activeWorkshops,
        totalSessions: workshops.reduce((sum, w) => sum + (w.total_sessions || 0), 0),
        totalCenters: centers.length
      });

      setRecentWorkshops(workshops.slice(0, 6));

    } catch (error) {
      console.error('Error:', error);
      showNotification('Error al cargar el dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    dispatch({
      type: ACTION_TYPES.ADD_NOTIFICATION,
      payload: { id: Date.now(), message, type, timestamp: new Date() }
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
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
                    {workshop.status}
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
        <button 
          className="action-btn secondary"
          onClick={() => navigate('/reports')}
        >
          <TrendingUp size={20} />
          Ver Reportes
        </button>
      </div>
    </div>
  );
};

export default AdminDashboardPanel;