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
import * as XLSX from 'xlsx';

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

  const handleExportExcel = () => {
    if (!reportData) {
      showNotification('No hay datos para exportar', 'warning');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // HOJA 1: RESUMEN
      const summaryData = [
        ['REPORTE DE ASISTENCIA - ' + reportData.workshop.name],
        [],
        ['📍 Centro:', reportData.workshop.css_name],
        ['👨‍🏫 Profesional:', reportData.workshop.professional_name],
        ['📅 Fecha de Inicio:', reportData.workshop.start_date],
        ['👥 Capacidad:', `${reportData.workshop.current_capacity}/${reportData.workshop.max_capacity}`],
        [],
        ['ESTADÍSTICAS GENERALES'],
        ['Total Sesiones:', reportData.stats.total_sessions],
        ['Promedio Asistencia:', reportData.stats.average_attendance_rate + '%'],
        ['Usuarios Activos:', reportData.stats.active_users],
        ['Total Inscritos:', reportData.stats.total_users],
        ['Usuarios Inactivos:', reportData.stats.inactive_users]
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

      // HOJA 2: TOP ASISTENCIA
      const topData = [
        ['RANKING - TOP ASISTENCIA'],
        [],
        ['Posición', 'Nombre', 'Email', 'Presentes', 'Ausentes', '% Asistencia']
      ];

      reportData.top_attendance.forEach((user, index) => {
        topData.push([
          `#${index + 1}`,
          user.user_name,
          user.email,
          user.present,
          user.absent,
          user.attendance_rate + '%'
        ]);
      });

      const ws2 = XLSX.utils.aoa_to_sheet(topData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Top Asistencia');

      // HOJA 3: BAJA ASISTENCIA
      const lowData = [
        ['ALERTA - BAJA ASISTENCIA (< 60%)'],
        [],
        ['Usuario', 'Email', 'Presentes', 'Ausentes', '% Asistencia']
      ];

      if (reportData.low_attendance.length === 0) {
        lowData.push(['✅ No hay usuarios con baja asistencia']);
      } else {
        reportData.low_attendance.forEach((user) => {
          lowData.push([
            user.user_name,
            user.email,
            user.present,
            user.absent,
            user.attendance_rate + '%'
          ]);
        });
      }

      const ws3 = XLSX.utils.aoa_to_sheet(lowData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Baja Asistencia');

      // HOJA 4: DETALLE COMPLETO
      const detailData = [
        ['DETALLE COMPLETO DE USUARIOS'],
        [],
        ['Usuario', 'Email', 'Sesiones', 'Presentes', 'Ausentes', '% Asistencia', 'Estado']
      ];

      reportData.users.forEach((user) => {
        detailData.push([
          user.user_name,
          user.email,
          user.sessions_attended,
          user.present,
          user.absent,
          user.attendance_rate + '%',
          user.status === 'active' ? 'Activo' : 'Inactivo'
        ]);
      });

      const ws4 = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Detalle Usuarios');

      const fileName = `Reporte_${reportData.workshop.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      showNotification('✅ Reporte exportado exitosamente', 'success');
    } catch (error) {
      console.error('Error exporting:', error);
      showNotification('❌ Error al exportar reporte', 'error');
    }
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

          {/* 🔥 TABLA ARREGLADA CON CLASES ESPECÍFICAS */}
          <div className="users-table-container">
            <div className="table-header">
              <h3>Detalle por Usuario</h3>
              <button className="btn-export" onClick={handleExportExcel}>
                <Download size={16} />
                Exportar a Excel
              </button>
            </div>

            <div className="table-wrapper">
              <table className="users-table reports-table">
                <thead className="reports-table-head">
                  <tr className="reports-table-header-row">
                    <th className="reports-table-th">Usuario</th>
                    <th className="reports-table-th">Email</th>
                    <th className="reports-table-th center">Sesiones</th>
                    <th className="reports-table-th center">Presentes</th>
                    <th className="reports-table-th center">Ausentes</th>
                    <th className="reports-table-th center">% Asistencia</th>
                    <th className="reports-table-th center">Estado</th>
                  </tr>
                </thead>
                <tbody className="reports-table-body">
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="reports-table-row">
                      <td className="reports-table-td user-name-cell">
                        {user.user_name}
                      </td>
                      <td className="reports-table-td user-email-cell">
                        {user.email}
                      </td>
                      <td className="reports-table-td center sessions-cell">
                        {user.sessions_attended}
                      </td>
                      <td className="reports-table-td center badge-cell">
                        <span className="badge present">{user.present}</span>
                      </td>
                      <td className="reports-table-td center badge-cell">
                        <span className="badge absent">{user.absent}</span>
                      </td>
                      <td className="reports-table-td center rate-cell">
                        <span
                          className={`rate-badge ${
                            user.attendance_rate >= 80 ? 'high' :
                            user.attendance_rate >= 60 ? 'medium' : 'low'
                          }`}
                        >
                          {user.attendance_rate}%
                        </span>
                      </td>
                      <td className="reports-table-td center status-cell">
                        <span className={`status-badge ${user.status}`}>
                          {user.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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