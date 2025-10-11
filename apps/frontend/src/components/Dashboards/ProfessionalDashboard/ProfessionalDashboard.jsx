import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  MapPin,
  Users,
  TrendingUp,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../../../services/api';
import useGlobalReducer from '../../../store/useGlobalReducer';
import { ACTION_TYPES } from '../../../store';
import './ProfessionalDashboard.css';

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkshops: 0,
    todaySessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    averageAttendance: 0
  });
  const [todaySessions, setTodaySessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [myWorkshops, setMyWorkshops] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar calendario/horarios
      const scheduleResponse = await apiService.getMySchedule();
      
      // Cargar asistencias
      const attendanceResponse = await apiService.getMyWorkshopsAttendance();

      // Procesar stats
      const scheduleStats = scheduleResponse.stats || {};
      const attendanceStats = attendanceResponse.stats || {};

      setStats({
        totalWorkshops: scheduleStats.total_workshops || 0,
        todaySessions: scheduleStats.today || 0,
        upcomingSessions: scheduleStats.upcoming || 0,
        completedSessions: scheduleStats.completed || 0,
        averageAttendance: attendanceStats.average_attendance_rate || 0
      });

      // Sesiones de hoy
      const today = scheduleResponse.sessions?.today || [];
      setTodaySessions(today);

      // Próximas sesiones (máximo 5)
      const upcoming = scheduleResponse.sessions?.upcoming || [];
      setUpcomingSessions(upcoming.slice(0, 5));

      // Mis talleres
      const workshops = scheduleResponse.workshops || [];
      setMyWorkshops(workshops);

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
      <div className="professional-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="professional-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Dashboard Profesional</h1>
        <p>Gestiona tus talleres y sesiones</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon workshops">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>Mis Talleres</h3>
            <p className="stat-number">{stats.totalWorkshops}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon today">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>Sesiones Hoy</h3>
            <p className="stat-number">{stats.todaySessions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon upcoming">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Próximas Sesiones</h3>
            <p className="stat-number">{stats.upcomingSessions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Completadas</h3>
            <p className="stat-number">{stats.completedSessions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon attendance">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Asistencia Promedio</h3>
            <p className="stat-number">{stats.averageAttendance}%</p>
          </div>
        </div>
      </div>

      {/* Sesiones de Hoy */}
      {todaySessions.length > 0 && (
        <div className="content-section highlight">
          <div className="section-header">
            <h2>🔥 Sesiones de Hoy</h2>
          </div>

          <div className="today-sessions-list">
            {todaySessions.map(session => (
              <div key={session.id} className="today-session-item">
                <div className="session-time-col">
                  <Clock size={20} />
                  <div>
                    <span className="time-start">{session.start_time}</span>
                    <span className="time-separator">-</span>
                    <span className="time-end">{session.end_time}</span>
                  </div>
                </div>

                <div className="session-info-col">
                  <h3>{session.workshop_name}</h3>
                  {session.topic && <p className="session-topic">{session.topic}</p>}
                  {session.location && (
                    <div className="session-location">
                      <MapPin size={14} />
                      {session.location}
                    </div>
                  )}
                </div>

                <button 
                  className="btn-session-action"
                  onClick={() => navigate('/attendance')}
                >
                  Tomar Asistencia
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximas Sesiones */}
      <div className="content-section">
        <div className="section-header">
          <h2>Próximas Sesiones</h2>
          <button 
            className="btn-view-all"
            onClick={() => navigate('/schedule')}
          >
            Ver calendario
            <ArrowRight size={16} />
          </button>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <p>No tienes sesiones programadas próximamente</p>
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

      {/* Mis Talleres */}
      <div className="content-section">
        <div className="section-header">
          <h2>Mis Talleres Activos</h2>
          <button 
            className="btn-view-all"
            onClick={() => navigate('/my-workshops')}
          >
            Ver todos
            <ArrowRight size={16} />
          </button>
        </div>

        {myWorkshops.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>No tienes talleres asignados</p>
          </div>
        ) : (
          <div className="workshops-grid">
            {myWorkshops.slice(0, 6).map(workshop => (
              <div 
                key={workshop.id} 
                className="workshop-card"
                onClick={() => navigate(`/my-workshops`)}
              >
                <div 
                  className="workshop-color-bar"
                  style={{ backgroundColor: workshop.color || '#E9531A' }}
                ></div>
                
                <div className="workshop-content">
                  <h3>{workshop.name}</h3>
                  
                  <div className="workshop-meta">
                    <span>
                      <Users size={14} />
                      {workshop.week_days}
                    </span>
                    <span>
                      <Clock size={14} />
                      {workshop.start_time} - {workshop.end_time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="action-btn primary"
          onClick={() => navigate('/schedule')}
        >
          <Calendar size={20} />
          Ver Calendario Completo
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => navigate('/attendance')}
        >
          <CheckCircle size={20} />
          Historial de Asistencias
        </button>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;