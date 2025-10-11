import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Filter,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Users
} from 'lucide-react';
import { apiService } from '../../services/api';
import useGlobalReducer from '../../store/useGlobalReducer';
import { ACTION_TYPES } from '../../store';
import './ScheduleView.css';

const ScheduleView = () => {
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();

  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workshopFilter, setWorkshopFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [daySessionsModal, setDaySessionsModal] = useState(null); // 🆕 Para múltiples sesiones

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const response = await apiService.getMySchedule();
      setScheduleData(response);
    } catch (error) {
      console.error('Error loading schedule:', error);
      showNotification('Error al cargar calendario', 'error');
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

  const filteredSessions = useMemo(() => {
    if (!scheduleData?.sessions?.all) return [];
    let sessions = scheduleData.sessions.all;
    if (workshopFilter !== 'all') {
      sessions = sessions.filter(s => s.workshop_id === parseInt(workshopFilter));
    }
    return sessions;
  }, [scheduleData, workshopFilter]);

  // 🔧 FIX: Función para parsear fecha sin timezone
  const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getWeekSessions = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);

      // 🔥 FIX: Crear string de fecha SIN timezone
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const dayNum = String(day.getDate()).padStart(2, '0');
      const dayStr = `${year}-${month}-${dayNum}`;

      const daySessions = filteredSessions.filter(s => s.date === dayStr);

      // Hoy sin UTC
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      weekDays.push({
        date: day,
        dateStr: dayStr,
        dayName: day.toLocaleDateString('es-ES', { weekday: 'long' }),
        dayNum: day.getDate(),
        monthName: day.toLocaleDateString('es-ES', { month: 'short' }),
        isToday: dayStr === todayStr,
        sessions: daySessions
      });
    }
    return weekDays;
  };

  const getMonthSessions = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(firstDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const endDate = new Date(lastDay);
    const lastDayOfWeek = lastDay.getDay();
    if (lastDayOfWeek !== 0) {
      endDate.setDate(lastDay.getDate() + (7 - lastDayOfWeek));
    }

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // 🔥 FIX: Crear string de fecha SIN timezone
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dayStr = `${year}-${month}-${day}`; // ← Esto es YYYY-MM-DD sin UTC

      const daySessions = filteredSessions.filter(s => s.date === dayStr);

      // Para verificar si es hoy, también sin UTC
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      days.push({
        date: new Date(current), // Guardamos el objeto Date original
        dateStr: dayStr,
        dayNum: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: dayStr === todayStr, // ← Comparación sin UTC
        sessions: daySessions
      });

      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getStatusInfo = (status) => {
    const statusMap = {
      completed: { icon: CheckCircle, color: 'completed', label: 'Completada' },
      cancelled: { icon: XCircle, color: 'cancelled', label: 'Cancelada' },
      scheduled: { icon: Clock, color: 'scheduled', label: 'Programada' }
    };
    return statusMap[status] || statusMap.scheduled;
  };

  // 🆕 Función para manejar click en día con múltiples sesiones
  const handleDayClick = (day) => {
    if (day.sessions.length === 0) return;

    if (day.sessions.length === 1) {
      setSelectedSession(day.sessions[0]);
    } else {
      // Múltiples sesiones - abrir modal especial
      setDaySessionsModal(day);
    }
  };

  // 🔥 useMemo ANTES del if (loading)
  const upcomingSessions = useMemo(() => {
    if (!scheduleData?.sessions?.all) return [];

    let sessions = filteredSessions.filter(s =>
      new Date(s.date) >= new Date(new Date().setHours(0, 0, 0, 0))
    );

    if (view === 'list') {
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      sessions = sessions.filter(s => {
        const sessionDate = parseDate(s.date);
        return sessionDate.getFullYear() === currentYear &&
          sessionDate.getMonth() === currentMonth;
      });
    }

    return sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredSessions, view, currentDate, scheduleData]);


  if (loading) {
    return (
      <div className="schedule-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Cargando calendario...</p>
      </div>
    );
  }

  const weekDays = view === 'week' ? getWeekSessions() : [];
  const monthDays = view === 'month' ? getMonthSessions() : [];
  const stats = scheduleData?.stats || {};

  return (
    <div className="schedule-view">
      {/* Header */}
      <div className="schedule-header">
        <div className="header-content">
          <h1 className="schedule-title">Mi Calendario</h1>
          <p className="schedule-subtitle">Gestiona tus horarios y sesiones programadas</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="schedule-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-today">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.today || 0}</div>
            <div className="stat-label">Hoy</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-upcoming">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.upcoming || 0}</div>
            <div className="stat-label">Próximas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-completed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.completed || 0}</div>
            <div className="stat-label">Completadas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total_sessions || 0}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="schedule-controls">
        <div className="view-toggles">
          <button
            className={`view-btn ${view === 'week' ? 'view-btn-active' : ''}`}
            onClick={() => setView('week')}
          >
            <Grid size={18} />
            <span>Semana</span>
          </button>
          <button
            className={`view-btn ${view === 'month' ? 'view-btn-active' : ''}`}
            onClick={() => setView('month')}
          >
            <Calendar size={18} />
            <span>Mes</span>
          </button>
          <button
            className={`view-btn ${view === 'list' ? 'view-btn-active' : ''}`}
            onClick={() => setView('list')}
          >
            <List size={18} />
            <span>Lista</span>
          </button>
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select
            className="filter-select"
            value={workshopFilter}
            onChange={(e) => setWorkshopFilter(e.target.value)}
          >
            <option value="all">Todos los talleres</option>
            {scheduleData?.workshops?.map(workshop => (
              <option key={workshop.id} value={workshop.id}>
                {workshop.name}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-today" onClick={goToToday}>
          Hoy
        </button>
      </div>

      {/* Navigation */}
      <div className="calendar-navigation">
        <button
          className="nav-btn"
          onClick={() => view === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
        >
          <ChevronLeft size={20} />
        </button>

        <h2 className="current-period">
          {view === 'week'
            ? `Semana del ${weekDays[0]?.dayNum} de ${weekDays[0]?.monthName}`
            : currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h2>

        <button
          className="nav-btn"
          onClick={() => view === 'week' ? navigateWeek(1) : navigateMonth(1)}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div className="week-view">
          <div className="week-grid">
            {weekDays.map((day) => (
              <div
                key={day.dateStr}
                className={`day-column ${day.isToday ? 'day-column-today' : ''}`}
              >
                <div className="day-header">
                  <span className="day-name">{day.dayName}</span>
                  <span className="day-number">{day.dayNum}</span>
                </div>

                <div className="day-sessions">
                  {day.sessions.length === 0 ? (
                    <div className="no-sessions">Sin sesiones</div>
                  ) : (
                    day.sessions.map((session) => {
                      const statusInfo = getStatusInfo(session.status);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={session.id}
                          className={`session-card session-card-${statusInfo.color}`}
                          onClick={() => setSelectedSession(session)}
                          style={{
                            borderLeftColor: session.workshop_color || '#E9531A'
                          }}
                        >
                          <div className="session-card-top">
                            <div className="session-time-badge">
                              <Clock size={14} />
                              <span>{session.start_time}</span>
                            </div>
                            <div className={`session-status-badge status-${statusInfo.color}`}>
                              <StatusIcon size={14} />
                            </div>
                          </div>

                          <h4 className="session-name">{session.workshop_name}</h4>

                          {session.topic && (
                            <p className="session-topic">{session.topic}</p>
                          )}

                          {session.location && (
                            <div className="session-location">
                              <MapPin size={12} />
                              <span>{session.location}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="month-view">
          <div className="month-weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="weekday-label">{day}</div>
            ))}
          </div>

          <div className="month-grid">
            {monthDays.map((day) => (
              <div
                key={day.dateStr}
                className={`month-day 
    ${day.isToday ? 'month-day-today' : ''} 
    ${!day.isCurrentMonth ? 'month-day-other' : ''}
    ${day.sessions.length > 0 ? 'month-day-has-sessions' : ''}
  `}
                onClick={() => handleDayClick(day)}
                style={{ cursor: day.sessions.length > 0 ? 'pointer' : 'default' }}
              >
                <div className="month-day-number">{day.dayNum}</div>

                {day.sessions.length > 0 && (
                  <div
                    className="month-day-indicators"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayClick(day);
                    }}
                  >
                    {day.sessions.slice(0, 3).map((session) => (
                      <div
                        key={session.id}
                        className={`session-indicator session-indicator-${getStatusInfo(session.status).color}`}
                        style={{
                          backgroundColor: session.workshop_color || '#E9531A'
                        }}
                        title={`${session.start_time} - ${session.workshop_name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (day.sessions.length === 1) {
                            setSelectedSession(session);
                          } else {
                            setDaySessionsModal(day);
                          }
                        }}
                      />
                    ))}
                    {day.sessions.length > 3 && (
                      <span className="more-indicator">+{day.sessions.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="list-view">
          {upcomingSessions.length === 0 ? (
            <div className="no-sessions-list">
              <AlertCircle size={48} />
              <p>No hay sesiones programadas</p>
            </div>
          ) : (
            <div className="sessions-list">
              {upcomingSessions.map((session) => {
                const statusInfo = getStatusInfo(session.status);
                const StatusIcon = statusInfo.icon;
                const sessionDate = parseDate(session.date);

                return (
                  <div
                    key={session.id}
                    className="session-list-item"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="list-date-badge">
                      <div className="list-date-day">{sessionDate.getDate()}</div>
                      <div className="list-date-month">
                        {sessionDate.toLocaleDateString('es-ES', { month: 'short' })}
                      </div>
                    </div>

                    <div className="list-info">
                      <h3 className="list-title">{session.workshop_name}</h3>
                      {session.topic && <p className="list-topic">{session.topic}</p>}
                      <div className="list-meta">
                        <span className="list-meta-item">
                          <Clock size={14} />
                          <span>{session.start_time} - {session.end_time}</span>
                        </span>
                        {session.location && (
                          <span className="list-meta-item">
                            <MapPin size={14} />
                            <span>{session.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`list-status-icon status-${statusInfo.color}`}>
                      <StatusIcon size={20} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🆕 Modal para múltiples sesiones del mismo día */}
      {daySessionsModal && (
        <div className="modal-overlay" onClick={() => setDaySessionsModal(null)}>
          <div className="modal day-sessions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Sesiones del {daySessionsModal.date.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </h2>
              <button className="modal-close" onClick={() => setDaySessionsModal(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-content day-sessions-list">
              {daySessionsModal.sessions.map((session) => {
                const statusInfo = getStatusInfo(session.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={session.id}
                    className="day-session-item"
                    onClick={() => {
                      setSelectedSession(session);
                      setDaySessionsModal(null);
                    }}
                  >
                    <div className="session-time-col">
                      <Clock size={16} />
                      <span>{session.start_time}</span>
                    </div>

                    <div className="session-info-col">
                      <h4>{session.workshop_name}</h4>
                      {session.topic && <p>{session.topic}</p>}
                    </div>

                    <div className={`session-status-col status-${statusInfo.color}`}>
                      <StatusIcon size={18} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de sesión individual */}
      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedSession.workshop_name}</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedSession(null)}
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-content">
              <div className="modal-info-item">
                <Calendar size={20} className="modal-icon" />
                <span>
                  {parseDate(selectedSession.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className="modal-info-item">
                <Clock size={20} className="modal-icon" />
                <span>{selectedSession.start_time} - {selectedSession.end_time}</span>
              </div>

              {selectedSession.location && (
                <div className="modal-info-item">
                  <MapPin size={20} className="modal-icon" />
                  <span>{selectedSession.location}</span>
                </div>
              )}

              {selectedSession.topic && (
                <div className="modal-section">
                  <h3 className="modal-section-title">Tema</h3>
                  <p className="modal-text">{selectedSession.topic}</p>
                </div>
              )}

              <div className="modal-section">
                <h3 className="modal-section-title">Estado</h3>
                <div className={`modal-status status-${getStatusInfo(selectedSession.status).color}`}>
                  {(() => {
                    const statusInfo = getStatusInfo(selectedSession.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <>
                        <StatusIcon size={20} />
                        <span>{statusInfo.label}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;