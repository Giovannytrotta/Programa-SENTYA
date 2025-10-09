import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Award,
  AlertTriangle,
  Search,
  Download
} from 'lucide-react';
import { apiService } from '../../services/api';
import useGlobalReducer from '../../store/useGlobalReducer';
import { ACTION_TYPES } from '../../store';
import './ReportsView.css';

const ReportsView = () => {
  const { dispatch } = useGlobalReducer();
  
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadWorkshops();
  }, []);

  const loadWorkshops = async () => {
    try {
      const response = await apiService.getWorkshopsForReports();
      setWorkshops(response.workshops || []);
    } catch (error) {
      console.error('Error loading workshops:', error);
      showNotification('Error al cargar talleres', 'error');
    }
  };

  const loadReport = async (workshopId) => {
    setLoading(true);
    try {
      const response = await apiService.getWorkshopDetailedReport(workshopId);
      setReportData(response);
      setSelectedWorkshop(workshopId);
    } catch (error) {
      console.error('Error loading report:', error);
      showNotification('Error al cargar reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    dispatch({
      type: ACTION_TYPES.ADD_NOTIFICATION,
      payload: {
        id: Date.now(),
        message,
        type,
        timestamp: new Date()
      }
    });
  };

  const filteredUsers = reportData?.users?.filter(user =>
    user.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="reports-view">
      {/* Header */}
      <div className="reports-header">
        <div className="header-title">
          <h1>Reportes y Estadísticas</h1>
          <p className="subtitle">
            Analiza el rendimiento y asistencia de los talleres
          </p>
        </div>
      </div>

      {/* Selector de Taller */}
      <div className="workshop-selector">
        <div className="selector-label">
          <BarChart3 size={20} />
          <span>Selecciona un taller para ver su reporte:</span>
        </div>
        <select
          value={selectedWorkshop || ''}
          onChange={(e) => loadReport(parseInt(e.target.value))}
          className="workshop-select"
        >
          <option value="">Seleccionar taller...</option>
          {workshops.map(workshop => (
            <option key={workshop.id} value={workshop.id}>
              {workshop.name} ({workshop.completed_sessions} sesiones)
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="reports-loading">
          <div className="loading-spinner"></div>
          <p>Generando reporte...</p>
        </div>
      )}

      {/* Contenido del Reporte */}
      {reportData && !loading && (
        <>
          {/* Info del Taller */}
          <div className="workshop-info-card">
            <h2>{reportData.workshop.name}</h2>
            <div className="workshop-meta">
              <span>📍 {reportData.workshop.css_name}</span>
              <span>👨‍🏫 {reportData.workshop.professional_name}</span>
              <span>👥 {reportData.workshop.current_capacity}/{reportData.workshop.max_capacity}</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="reports-stats">
            <div className="stat-card">
              <div className="stat-icon sessions">
                <Calendar size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{reportData.stats.total_sessions}</span>
                <span className="stat-label">Sesiones Impartidas</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon rate">
                <TrendingUp size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{reportData.stats.average_attendance_rate}%</span>
                <span className="stat-label">Promedio Asistencia</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon users">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{reportData.stats.active_users}</span>
                <span className="stat-label">Usuarios Activos</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon total">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{reportData.stats.total_users}</span>
                <span className="stat-label">Total Inscritos</span>
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="rankings-container">
            {/* Top Asistencia */}
            <div className="ranking-card top-ranking">
              <div className="ranking-header">
                <Award size={20} />
                <h3>Top Asistencia</h3>
              </div>
              {reportData.top_attendance.length === 0 ? (
                <p className="no-data">No hay datos suficientes</p>
              ) : (
                <div className="ranking-list">
                  {reportData.top_attendance.map((user, index) => (
                    <div key={user.user_id} className="ranking-item">
                      <span className="rank-badge top">#{index + 1}</span>
                      <div className="rank-info">
                        <span className="rank-name">{user.user_name}</span>
                        <span className="rank-sessions">
                          {user.present}/{user.sessions_attended} sesiones
                        </span>
                      </div>
                      <span className="rank-rate high">{user.attendance_rate}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Baja Asistencia */}
            <div className="ranking-card low-ranking">
              <div className="ranking-header">
                <AlertTriangle size={20} />
                <h3>Baja Asistencia</h3>
              </div>
              {reportData.low_attendance.length === 0 ? (
                <p className="no-data">✅ Todos los usuarios tienen buena asistencia</p>
              ) : (
                <div className="ranking-list">
                  {reportData.low_attendance.map((user) => (
                    <div key={user.user_id} className="ranking-item">
                      <AlertTriangle size={16} className="alert-icon" />
                      <div className="rank-info">
                        <span className="rank-name">{user.user_name}</span>
                        <span className="rank-sessions">
                          {user.present}/{user.sessions_attended} sesiones
                        </span>
                      </div>
                      <span className="rank-rate low">{user.attendance_rate}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Búsqueda */}
          <div className="search-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="users-table-container">
            <div className="table-header">
              <h3>Detalle por Usuario</h3>
              <button className="btn-export" disabled>
                <Download size={16} />
                Exportar (Próximamente)
              </button>
            </div>

            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th className="center">Sesiones</th>
                  <th className="center">Presentes</th>
                  <th className="center">Ausentes</th>
                  <th className="center">% Asistencia</th>
                  <th className="center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id}>
                    <td className="user-name">{user.user_name}</td>
                    <td className="user-email">{user.email}</td>
                    <td className="center">{user.sessions_attended}</td>
                    <td className="center">
                      <span className="badge present">{user.present}</span>
                    </td>
                    <td className="center">
                      <span className="badge absent">{user.absent}</span>
                    </td>
                    <td className="center">
                      <span 
                        className={`rate-badge ${
                          user.attendance_rate >= 80 ? 'high' :
                          user.attendance_rate >= 60 ? 'medium' : 'low'
                        }`}
                      >
                        {user.attendance_rate}%
                      </span>
                    </td>
                    <td className="center">
                      <span className={`status-badge ${user.status}`}>
                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Estado inicial */}
      {!reportData && !loading && (
        <div className="no-report">
          <BarChart3 size={64} />
          <p>Selecciona un taller para ver su reporte detallado</p>
        </div>
      )}
    </div>
  );
};

export default ReportsView;