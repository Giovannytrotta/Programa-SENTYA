import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../../../services/api';
import useGlobalReducer from '../../../store/useGlobalReducer';
import { ACTION_TYPES } from '../../../store';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolledWorkshops: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    attendanceRate: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [availableWorkshops, setAvailableWorkshops] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar sesiones inscritas
      const sessionsResponse = await apiService.getMyEnrolledSessions();
      const sessions = sessionsResponse.sessions || [];

      // Cargar talleres disponibles
      const workshopsResponse = await apiService.getAllWorkshops();
      const workshops = workshopsResponse.workshops || [];

      // Calcular stats
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const upcoming = sessions.filter(s => s.date >= todayStr);
      const completed = sessions.filter(s => s.status === 'completed');

      // Contar talleres únicos inscritos
      const uniqueWorkshops = [...new Set(sessions.map(s => s.workshop_id))];

      setStats({
        enrolledWorkshops: uniqueWorkshops.length,
        upcomingSessions: upcoming.length,
        completedSessions: completed.length,
        attendanceRate: sessions.length > 0 ? Math.round((completed.length / sessions.length) * 100) : 0
      });

      // Ordenar próximas sesiones
      setUpcomingSessions(
        upcoming
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5)
      );

      // Talleres disponibles (máximo 6)
      setAvailableWorkshops(workshops.slice(0, 6));

    } catch (error) {
      console.error('Error loading dashboard:', error);
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

  const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="client-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Mi Dashboard</h1>
        <p>Bienvenido a tu espacio personal</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon workshops">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>Talleres Inscritos</h3>
            <p className="stat-number">{stats.enrolledWorkshops}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sessions">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>Próximas Sesiones</h3>
            <p className="stat-number">{stats.upcomingSessions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <h3>Sesiones Completadas</h3>
            <p className="stat-number">{stats.completedSessions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon attendance">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Tasa de Asistencia</h3>
            <p className="stat-number">{stats.attendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Próximas Sesiones */}
      <div className="content-section">
        <div className="section-header">
          <h2>Próximas Sesiones</h2>
          <button
            className="btn-view-all"
            onClick={() => navigate('/my-workshops')}
          >
            Ver todas
            <ArrowRight size={16} />
          </button>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <p>No tienes sesiones programadas próximamente</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/workshops')}
            >
              Explorar Talleres
            </button>
          </div>
        ) : (
          <div className="sessions-list">
            {upcomingSessions.map(session => (
              <div key={session.id} className="session-item">
                <div className="session-date">
                  <span className="date-day">
                    {parseDate(session.date).getDate()}
                  </span>
                  <span className="date-month">
                    {parseDate(session.date).toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                </div>
                <div className="session-info">
                  <h3>{session.workshop_name}</h3>
                  <div className="session-meta">
                    <span>
                      <Clock size={14} />
                      {session.start_time} - {session.end_time}
                    </span>
                    {session.location && (
                      <span>
                        <MapPin size={14} />
                        {session.location}
                      </span>
                    )}
                  </div>
                  {session.topic && (
                    <p className="session-topic">{session.topic}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Talleres Disponibles */}
      <div className="content-section">
        <div className="section-header">
          <h2>Talleres Disponibles</h2>
          <button
            className="btn-view-all"
            onClick={() => navigate('/workshops')}
          >
            Ver todos
            <ArrowRight size={16} />
          </button>
        </div>

        {availableWorkshops.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>No hay talleres disponibles en este momento</p>
          </div>
        ) : (
          <div className="workshops-grid">
            {availableWorkshops.map(workshop => (
              <div
                key={workshop.id}
                className="workshop-card"
                onClick={() => navigate(`/workshops/${workshop.id}/sessions`)}
              >
                <div className="workshop-header">
                  <h3>{workshop.name}</h3>
                  <span className={`status-badge ${workshop.status}`}>
                    {workshop.status === 'active' ? 'Activo' : workshop.status}
                  </span>
                </div>

                {workshop.description && (
                  <p className="workshop-description">
                    {workshop.description.length > 100
                      ? `${workshop.description.substring(0, 100)}...`
                      : workshop.description}
                  </p>
                )}

                <div className="workshop-footer">
                  <span className="capacity">
                    <Award size={14} />
                    {workshop.current_capacity}/{workshop.max_capacity} plazas
                  </span>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;