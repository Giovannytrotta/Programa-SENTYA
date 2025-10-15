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
  const [daySessionsModal, setDaySessionsModal] = useState(null);

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

      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const dayNum = String(day.getDate()).padStart(2, '0');
      const dayStr = `${year}-${month}-${dayNum}`;

      const daySessions = filteredSessions.filter(s => s.date === dayStr);

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

    // Calcular cuántos días vacíos al inicio (offset)
    const dayOfWeek = firstDay.getDay();
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lunes = 0

    const days = [];
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < offset; i++) {
      days.push({ isEmpty: true });
    }

    // Agregar solo los días del mes actual
    const daysInMonth = lastDay.getDate();
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dayDate = new Date(year, month, dayNum);
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      
      const daySessions = filteredSessions.filter(s => s.date === dayStr);

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      days.push({
        date: dayDate,
        dateStr: dayStr,
        dayNum: dayNum,
        isCurrentMonth: true, // Todos son del mes actual ahora
        isToday: dayStr === todayStr,
        sessions: daySessions,
        isEmpty: false
      });
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

  const handleDayClick = (day) => {
    if (day.sessions.length === 0) return;

    if (day.sessions.length === 1) {
      setSelectedSession(day.sessions[0]);
    } else {
      setDaySessionsModal(day);
    }
  };

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
      <div className="schedule-container">
        <div className="schedule-loading">
          <div className="schedule-spinner"></div>
          <p>Cargando calendario...</p>
        </div>
      </div>
    );
  }

  const weekDays = view === 'week' ? getWeekSessions() : [];
  const monthDays = view === 'month' ? getMonthSessions() : [];
  const stats = scheduleData?.stats || {};

  return (
    <div className="schedule-container">
      {/* Header */}
      <header className="schedule-header">
        <div className="schedule-header-content">
          <h1>Mi Calendario</h1>
          <p>Gestiona tus horarios y sesiones programadas</p>
        </div>
      </header>

      {/* Stats */}
      <div className="schedule-stats-grid">
        <div className="schedule-stat-card">
          <div className="schedule-stat-icon schedule-stat-icon-today">
            <Calendar size={24} />
          </div>
          <div className="schedule-stat-content">
            <div className="schedule-stat-value">{stats.today || 0}</div>
            <div className="schedule-stat-label">Hoy</div>
          </div>
        </div>

        <div className="schedule-stat-card">
          <div className="schedule-stat-icon schedule-stat-icon-upcoming">
            <Clock size={24} />
          </div>
          <div className="schedule-stat-content">
            <div className="schedule-stat-value">{stats.upcoming || 0}</div>
            <div className="schedule-stat-label">Próximas</div>
          </div>
        </div>

        <div className="schedule-stat-card">
          <div className="schedule-stat-icon schedule-stat-icon-completed">
            <CheckCircle size={24} />
          </div>
          <div className="schedule-stat-content">
            <div className="schedule-stat-value">{stats.completed || 0}</div>
            <div className="schedule-stat-label">Completadas</div>
          </div>
        </div>

        <div className="schedule-stat-card">
          <div className="schedule-stat-icon schedule-stat-icon-total">
            <Users size={24} />
          </div>
          <div className="schedule-stat-content">
            <div className="schedule-stat-value">{stats.total_sessions || 0}</div>
            <div className="schedule-stat-label">Total</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="schedule-controls">
        <div className="schedule-view-toggles">
          <button
            className={`schedule-view-btn ${view === 'week' ? 'schedule-view-btn-active' : ''}`}
            onClick={() => setView('week')}
          >
            <Grid size={18} />
            <span>Semana</span>
          </button>
          <button
            className={`schedule-view-btn ${view === 'month' ? 'schedule-view-btn-active' : ''}`}
            onClick={() => setView('month')}
          >
            <Calendar size={18} />
            <span>Mes</span>
          </button>
          <button
            className={`schedule-view-btn ${view === 'list' ? 'schedule-view-btn-active' : ''}`}
            onClick={() => setView('list')}
          >
            <List size={18} />
            <span>Lista</span>
          </button>
        </div>

        <div className="schedule-filter">
          <Filter size={18} />
          <select
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

        <button className="schedule-btn-today" onClick={goToToday}>
          Hoy
        </button>
      </div>

      {/* Navigation */}
      <div className="schedule-navigation">
        <button
          className="schedule-nav-btn"
          onClick={() => view === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
        >
          <ChevronLeft size={20} />
        </button>

        <h2 className="schedule-period">
          {view === 'week'
            ? `Semana del ${weekDays[0]?.dayNum} de ${weekDays[0]?.monthName}`
            : currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h2>

        <button
          className="schedule-nav-btn"
          onClick={() => view === 'week' ? navigateWeek(1) : navigateMonth(1)}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div className="schedule-week-container">
          <div className="schedule-week-grid">
            {weekDays.map((day) => (
              <div
                key={day.dateStr}
                className={`schedule-day-col ${day.isToday ? 'schedule-day-col-today' : ''}`}
              >
                <div className="schedule-day-header">
                  <span className="schedule-day-name">{day.dayName}</span>
                  <span className="schedule-day-num">{day.dayNum}</span>
                </div>

                <div className="schedule-day-content">
                  {day.sessions.length === 0 ? (
                    <div className="schedule-no-sessions">Sin sesiones</div>
                  ) : (
                    day.sessions.map((session) => {
                      const statusInfo = getStatusInfo(session.status);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={session.id}
                          className={`schedule-session-card schedule-session-${statusInfo.color}`}
                          onClick={() => setSelectedSession(session)}
                          style={{
                            borderLeftColor: session.workshop_color || '#E9531A'
                          }}
                        >
                          <div className="schedule-session-top">
                            <div className="schedule-session-time">
                              <Clock size={14} />
                              <span>{session.start_time}</span>
                            </div>
                            <div className={`schedule-session-status schedule-status-${statusInfo.color}`}>
                              <StatusIcon size={14} />
                            </div>
                          </div>

                          <h4 className="schedule-session-title">{session.workshop_name}</h4>

                          {session.topic && (
                            <p className="schedule-session-topic">{session.topic}</p>
                          )}

                          {session.location && (
                            <div className="schedule-session-location">
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

      {/* Month View - MEJORADO */}
      {view === 'month' && (
        <div className="schedule-month-container">
          <div className="schedule-month-weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="schedule-weekday-label">{day}</div>
            ))}
          </div>

          <div className="schedule-month-grid">
            {monthDays.map((day, index) => {
              // Si es un día vacío, renderizar celda vacía
              if (day.isEmpty) {
                return <div key={`empty-${index}`} className="schedule-month-day-empty"></div>;
              }

              // Renderizar día normal
              return (
                <div
                  key={day.dateStr}
                  className={`schedule-month-day 
                    ${day.isToday ? 'schedule-month-day-today' : ''} 
                    ${day.sessions.length > 0 ? 'schedule-month-day-has-sessions' : ''}
                  `}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="schedule-month-day-number">{day.dayNum}</div>

                  {day.sessions.length > 0 && (
                    <div className="schedule-month-sessions">
                      {day.sessions.slice(0, 2).map((session) => (
                        <div
                          key={session.id}
                          className={`schedule-month-session-badge schedule-badge-${getStatusInfo(session.status).color}`}
                          style={{
                            backgroundColor: session.workshop_color || '#E9531A'
                          }}
                          title={`${session.start_time} - ${session.workshop_name}`}
                        >
                          <Clock size={10} />
                          <span>{session.start_time}</span>
                        </div>
                      ))}
                      {day.sessions.length > 2 && (
                        <div className="schedule-month-more">
                          +{day.sessions.length - 2} más
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="schedule-list-container">
          {upcomingSessions.length === 0 ? (
            <div className="schedule-empty-state">
              <AlertCircle size={48} />
              <p>No hay sesiones programadas</p>
            </div>
          ) : (
            <div className="schedule-list">
              {upcomingSessions.map((session) => {
                const statusInfo = getStatusInfo(session.status);
                const StatusIcon = statusInfo.icon;
                const sessionDate = parseDate(session.date);

                return (
                  <div
                    key={session.id}
                    className="schedule-list-item"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="schedule-list-date">
                      <div className="schedule-list-day">{sessionDate.getDate()}</div>
                      <div className="schedule-list-month">
                        {sessionDate.toLocaleDateString('es-ES', { month: 'short' })}
                      </div>
                    </div>

                    <div className="schedule-list-content">
                      <h3>{session.workshop_name}</h3>
                      {session.topic && <p>{session.topic}</p>}
                      <div className="schedule-list-meta">
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
                    </div>

                    <div className={`schedule-list-status schedule-status-${statusInfo.color}`}>
                      <StatusIcon size={20} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal días múltiples sesiones */}
      {daySessionsModal && (
        <div className="schedule-modal-overlay" onClick={() => setDaySessionsModal(null)}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <h2>
                Sesiones del {daySessionsModal.date.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </h2>
              <button onClick={() => setDaySessionsModal(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="schedule-modal-content">
              {daySessionsModal.sessions.map((session) => {
                const statusInfo = getStatusInfo(session.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={session.id}
                    className="schedule-modal-session"
                    onClick={() => {
                      setSelectedSession(session);
                      setDaySessionsModal(null);
                    }}
                  >
                    <div className="schedule-modal-session-time">
                      <Clock size={16} />
                      <span>{session.start_time}</span>
                    </div>

                    <div className="schedule-modal-session-info">
                      <h4>{session.workshop_name}</h4>
                      {session.topic && <p>{session.topic}</p>}
                    </div>

                    <div className={`schedule-modal-session-status schedule-status-${statusInfo.color}`}>
                      <StatusIcon size={18} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal sesión individual */}
      {selectedSession && (
        <div className="schedule-modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <h2>{selectedSession.workshop_name}</h2>
              <button onClick={() => setSelectedSession(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="schedule-modal-content">
              <div className="schedule-modal-item">
                <Calendar size={20} />
                <span>
                  {parseDate(selectedSession.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className="schedule-modal-item">
                <Clock size={20} />
                <span>{selectedSession.start_time} - {selectedSession.end_time}</span>
              </div>

              {selectedSession.location && (
                <div className="schedule-modal-item">
                  <MapPin size={20} />
                  <span>{selectedSession.location}</span>
                </div>
              )}

              {selectedSession.topic && (
                <div className="schedule-modal-section">
                  <h3>Tema</h3>
                  <p>{selectedSession.topic}</p>
                </div>
              )}

              <div className="schedule-modal-section">
                <h3>Estado</h3>
                <div className={`schedule-modal-status schedule-status-${getStatusInfo(selectedSession.status).color}`}>
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

