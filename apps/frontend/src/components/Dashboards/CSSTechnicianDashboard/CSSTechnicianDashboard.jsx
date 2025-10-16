import React, { useState, useEffect } from 'react';
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
import { apiService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import useGlobalReducer from '../../../store/useGlobalReducer';
import { ACTION_TYPES } from '../../../store';
import './CSSTechnicianDashboard.css';

const CSSTechnicianDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dispatch } = useGlobalReducer();

  const [loading, setLoading] = useState(true);
  const [centerInfo, setCenterInfo] = useState(null);
  const [stats, setStats] = useState({
    totalWorkshops: 0,
    activeWorkshops: 0,
    totalUsers: 0,
    upcomingSessions: 0
  });
  const [workshops, setWorkshops] = useState([]);
  const [usersByRole, setUsersByRole] = useState({
    administrator: 0,
    coordinator: 0,
    professional: 0,
    client: 0,
    css_technician: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.css_id) {
      setLoading(false);
      showNotification('⚠️ No tienes un centro asignado', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Cargar info del centro
      const centersResponse = await apiService.getActiveCSSCenters();
      const myCenter = centersResponse.css_centers?.find(c => c.id === user.css_id);
      setCenterInfo(myCenter);

      // Cargar talleres del centro
      const workshopsResponse = await apiService.getAllWorkshops();
      const centerWorkshops = workshopsResponse.workshops?.filter(w => w.css_id === user.css_id) || [];
      setWorkshops(centerWorkshops.slice(0, 6)); // Solo primeros 6

      // Cargar usuarios del centro
      const usersResponse = await apiService.getAllUsers();
      const centerUsers = usersResponse.users?.filter(u => u.css_id === user.css_id) || [];

      // Calcular stats
      const activeWorkshops = centerWorkshops.filter(w => w.status === 'active').length;
      
      // Contar usuarios por rol
      const roleCount = {
        administrator: 0,
        coordinator: 0,
        professional: 0,
        client: 0,
        css_technician: 0
      };

      centerUsers.forEach(u => {
        if (roleCount.hasOwnProperty(u.rol)) {
          roleCount[u.rol]++;
        }
      });

      setUsersByRole(roleCount);

      setStats({
        totalWorkshops: centerWorkshops.length,
        activeWorkshops: activeWorkshops,
        totalUsers: centerUsers.length,
        upcomingSessions: centerWorkshops.reduce((sum, w) => sum + (w.total_sessions || 0), 0)
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
      showNotification('❌ Error al cargar el dashboard', 'error');
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando información del centro...</p>
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

        {workshops.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>No hay talleres disponibles en este centro</p>
          </div>
        ) : (
          <div className="workshops-grid">
            {workshops.map(workshop => (
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