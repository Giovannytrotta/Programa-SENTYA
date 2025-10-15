import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { useAttendance } from '../../hooks/useAttendance';
import './AttendanceView.css';

const AttendanceView = () => {
  const navigate = useNavigate();
  const { fetchMyWorkshopsAttendance, loading } = useAttendance();
  
  const [attendanceData, setAttendanceData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [workshopFilter, setWorkshopFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const response = await fetchMyWorkshopsAttendance();
      setAttendanceData(response);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const filteredSessions = useMemo(() => {
    if (!attendanceData?.sessions_with_attendance) return [];
    
    let filtered = attendanceData.sessions_with_attendance;
    
    if (workshopFilter !== 'all') {
      filtered = filtered.filter(s => s.workshop_id === parseInt(workshopFilter));
    }
    
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.workshop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(s => {
        const sessionDate = new Date(s.date);
        
        if (dateFilter === 'today') {
          return sessionDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return sessionDate >= monthAgo;
        }
        return true;
      });
    }
    
    return filtered;
  }, [attendanceData, workshopFilter, searchQuery, dateFilter]);

  if (loading && !attendanceData) {
    return (
      <div className="attendance-loading">
        <div className="loading-spinner"></div>
        <p>Cargando historial de asistencias...</p>
      </div>
    );
  }

  const stats = attendanceData?.stats || {
    total_sessions: 0,
    total_workshops: 0,
    total_attendances: 0,
    average_attendance_rate: 0
  };

  // 🆕 FUNCIÓN PARA RENDERIZAR CARDS (MÓVIL)
  const renderMobileCards = () => {
    if (filteredSessions.length === 0) {
      return (
        <div className="no-attendance">
          <ClipboardCheck size={48} />
          <p>No se encontraron registros de asistencia</p>
        </div>
      );
    }

    return (
      <div className="attendance-cards">
        {filteredSessions.map((session) => (
          <div key={session.session_id} className="attendance-card">
            <div className="attendance-card-header">
              <div className="attendance-card-date">
                <Calendar size={16} />
                {new Date(session.date).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
              <span 
                className={`rate-badge ${
                  session.attendance_rate >= 80 ? 'high' :
                  session.attendance_rate >= 60 ? 'medium' : 'low'
                }`}
              >
                {session.attendance_rate}%
              </span>
            </div>

            <div className="attendance-card-workshop">
              {session.workshop_name}
            </div>

            {session.topic && (
              <div className="attendance-card-topic">
                {session.topic}
              </div>
            )}

            <div className="attendance-card-time">
              {session.start_time} - {session.end_time}
            </div>

            <div className="attendance-card-stats">
              <div className="attendance-card-stat">
                <span className="attendance-card-stat-label">Total</span>
                <span className="badge total">{session.total_students}</span>
              </div>

              <div className="attendance-card-stat">
                <span className="attendance-card-stat-label">Presentes</span>
                <span className="badge present">
                  <CheckCircle size={14} />
                  {session.present}
                </span>
              </div>

              <div className="attendance-card-stat">
                <span className="attendance-card-stat-label">Ausentes</span>
                <span className="badge absent">
                  <XCircle size={14} />
                  {session.absent}
                </span>
              </div>
            </div>

            <div className="attendance-card-footer">
              <button
                className="btn-view"
                onClick={() => navigate(`/workshops/${session.workshop_id}/sessions`)}
                title="Ver sesiones del taller"
              >
                <Eye size={16} />
                Ver Taller
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 🆕 FUNCIÓN PARA RENDERIZAR TABLA (DESKTOP/TABLET)
  const renderDesktopTable = () => {
    if (filteredSessions.length === 0) {
      return (
        <div className="no-attendance">
          <ClipboardCheck size={48} />
          <p>No se encontraron registros de asistencia</p>
        </div>
      );
    }

    return (
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Taller</th>
            <th>Tema</th>
            <th>Horario</th>
            <th className="center">Total</th>
            <th className="center">Presentes</th>
            <th className="center">Ausentes</th>
            <th className="center">% Asist.</th>
            <th className="center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredSessions.map((session) => (
            <tr key={session.session_id}>
              <td>
                <div className="date-cell">
                  <Calendar size={16} />
                  {new Date(session.date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </td>
              <td className="workshop-name">{session.workshop_name}</td>
              <td className="topic">{session.topic || '-'}</td>
              <td className="time">
                {session.start_time} - {session.end_time}
              </td>
              <td className="center">
                <span className="badge total">{session.total_students}</span>
              </td>
              <td className="center">
                <span className="badge present">
                  <CheckCircle size={14} />
                  {session.present}
                </span>
              </td>
              <td className="center">
                <span className="badge absent">
                  <XCircle size={14} />
                  {session.absent}
                </span>
              </td>
              <td className="center">
                <span 
                  className={`rate-badge ${
                    session.attendance_rate >= 80 ? 'high' :
                    session.attendance_rate >= 60 ? 'medium' : 'low'
                  }`}
                >
                  {session.attendance_rate}%
                </span>
              </td>
              <td className="center">
                <button
                  className="btn-view"
                  onClick={() => navigate(`/workshops/${session.workshop_id}/sessions`)}
                  title="Ver sesiones del taller"
                >
                  <Eye size={16} />
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="attendance-view">
      {/* Header */}
      <div className="attendance-header">
        <div className="header-title">
          <h1>Historial de Asistencias</h1>
          <p className="subtitle">
            Consulta el registro completo de asistencias de tus talleres
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="attendance-stats">
        <div className="stat-card">
          <div className="stat-icon sessions">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total_sessions}</span>
            <span className="stat-label">Sesiones Completadas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon workshops">
            <ClipboardCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total_workshops}</span>
            <span className="stat-label">Talleres Activos</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon records">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total_attendances}</span>
            <span className="stat-label">Total Registros</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rate">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.average_attendance_rate}%</span>
            <span className="stat-label">Asistencia Promedio</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="attendance-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por taller o tema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select
            value={workshopFilter}
            onChange={(e) => setWorkshopFilter(e.target.value)}
          >
            <option value="all">Todos los talleres</option>
            {attendanceData?.workshops?.map(workshop => (
              <option key={workshop.id} value={workshop.id}>
                {workshop.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <Calendar size={18} />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
          </select>
        </div>
      </div>

      {/* 🆕 CARDS PARA MÓVIL (se muestran en <768px) */}
      {renderMobileCards()}

      {/* 🆕 TABLA PARA DESKTOP (se oculta en <768px) */}
      <div className="attendance-table-container">
        {renderDesktopTable()}
      </div>
    </div>
  );
};

export default AttendanceView;