import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    User,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Filter
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSessions } from '../../hooks/useSessions';
import { useWorkshops } from '../../hooks/useWorkshops';
import { useAttendance } from '../../hooks/useAttendance';
import './SessionsView.css';
import CreateSessionModal from './CreateSessionModal';
import EditSessionModal from './EditSessionModal';
import DeleteSessionModal from './DeleteSessionModal';
import AttendanceModal from './AttendanceModal';

const SessionsView = () => {
    const { workshopId } = useParams(); // Para cuando viene desde un taller específico
    const navigate = useNavigate();
    const { role } = useAuth();
    const { sessions, loading, fetchWorkshopSessions, completeSession } = useSessions();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const { workshops, fetchWorkshops } = useWorkshops();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [selectedWorkshop, setSelectedWorkshop] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    // Permisos
    const canManageSessions = ['administrator', 'coordinator'].includes(role);
    const isProfessional = role === 'professional';
    const canCreateSessions = canManageSessions || isProfessional; //NUEVO PERMISO PARA CREAR SESSIONES PARA PROFESIONAL

    //FUNCIÓN PARA DETERMINAR RUTA DE VUELTA SEGÚN ROL ES IMPORTANTE PORQUE DEPENDE DE TU ROL HARAS LA NAVEGACION

    const getBackRoute = () => {
        // Admin y coordinadores gestionan → /workshops
        if (role === 'administrator' || role === 'coordinator') {
            return '/workshops';
        }

        // Profesionales y clientes usan → /my-workshops
        if (role === 'professional' || role === 'client') {
            return '/my-workshops';
        }

        // CSS Technician (por defecto) → /workshops SOLO VISTA DE INVITADO
        return '/workshops';
    };

    useEffect(() => {
        if (workshopId) {
            // Cargar sesiones del taller específico
            fetchWorkshopSessions(parseInt(workshopId));

            // Obtener info del taller
            fetchWorkshops().then(response => {
                if (response?.workshops) {
                    const workshop = response.workshops.find(w => w.id === parseInt(workshopId));
                    setSelectedWorkshop(workshop);
                }
            });
        }
    }, [workshopId, fetchWorkshopSessions, fetchWorkshops]);

    // Filtrar sesiones por status
    const filteredSessions = sessions.filter(session => {
        if (statusFilter === 'all') return true;
        return session.status === statusFilter;
    });

    const getStatusColor = (status) => {
        const colors = {
            'scheduled': 'status-scheduled',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled',
            'rescheduled': 'status-rescheduled'
        };
        return colors[status] || 'status-scheduled';
    };

    const getStatusLabel = (status) => {
        const labels = {
            'scheduled': 'Programada',
            'completed': 'Completada',
            'cancelled': 'Cancelada',
            'rescheduled': 'Reprogramada'
        };
        return labels[status] || status;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle size={16} />;
            case 'cancelled':
                return <XCircle size={16} />;
            default:
                return <Clock size={16} />;
        }
    };

    const handleComplete = async (sessionId) => {
        if (!window.confirm('¿Marcar esta sesión como completada?')) return;

        try {
            await completeSession(sessionId);
        } catch (error) {
            console.error('Error completing session:', error);
        }
    };

    if (loading && sessions.length === 0) {
        return (
            <div className="sessions-loading">
                <div className="loading-spinner"></div>
                <p>Cargando sesiones...</p>
            </div>
        );
    }

    //funciones handle para editar eliminar y marcar

    const handleEdit = (session) => {
        setSelectedSession(session);
        setShowEditModal(true);
    };

    const handleDelete = (session) => {
        setSelectedSession(session);
        setShowDeleteModal(true);
    };

    const handleEditSuccess = () => {
        setShowEditModal(false);
        setSelectedSession(null);
        fetchWorkshopSessions(parseInt(workshopId));
    };

    const handleDeleteSuccess = () => {
        setShowDeleteModal(false);
        setSelectedSession(null);
        fetchWorkshopSessions(parseInt(workshopId));
    };

    const handleTakeAttendance = (session) => {
        setSelectedSession(session);
        setShowAttendanceModal(true);
    };

    return (
        <div className="sessions-view">
            {/* Header */}
            <div className="sessions-header">
                {workshopId && (
                    <button
                        className="btn-back"
                        onClick={() => navigate(getBackRoute())}
                    >
                        <ArrowLeft size={20} />
                        Volver a Talleres
                    </button>
                )}

                <div className="sessions-header-content">
                    <div className="header-title">
                        <h1>
                            {selectedWorkshop
                                ? `Sesiones: ${selectedWorkshop.name}`
                                : 'Sesiones'}
                        </h1>
                        <p className="subtitle">
                            {canManageSessions
                                ? 'Gestiona las clases programadas'
                                : 'Visualiza las clases programadas'}
                        </p>
                    </div>

                    {canCreateSessions && (
                        <button
                            className="btn-create-session"
                            onClick={() => setShowCreateModal(true)}  // ← Cambiar esto
                        >
                            <Plus size={20} />
                            Nueva Sesión
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <div className="sessions-filters">
                <div className="filter-group">
                    <Filter size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="scheduled">Programadas</option>
                        <option value="completed">Completadas</option>
                        <option value="cancelled">Canceladas</option>
                        <option value="rescheduled">Reprogramadas</option>
                    </select>
                </div>
            </div>

            {/* Stats cards */}
            {selectedWorkshop && (
                <div className="sessions-stats">
                    <div className="stat-card">
                        <div className="stat-icon scheduled">
                            <Clock size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">
                                {sessions.filter(s => s.status === 'scheduled').length}
                            </span>
                            <span className="stat-label">Programadas</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon completed">
                            <CheckCircle size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">
                                {sessions.filter(s => s.status === 'completed').length}
                            </span>
                            <span className="stat-label">Completadas</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon total">
                            <Calendar size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{sessions.length}</span>
                            <span className="stat-label">Total</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de sesiones */}
            <div className="sessions-list">
                {filteredSessions.length === 0 ? (
                    <div className="no-sessions">
                        <Calendar size={48} />
                        <p>No hay sesiones programadas</p>
                        {canManageSessions && (
                            <button
                                className="btn-create-first"
                                onClick={() => console.log('Crear primera sesión')}
                            >
                                <Plus size={20} />
                                Crear Primera Sesión
                            </button>
                        )}
                    </div>
                ) : (
                    filteredSessions.map(session => (
                        <div key={session.id} className="session-card">
                            {/* Status badge */}
                            <div className={`session-status ${getStatusColor(session.status)}`}>
                                {getStatusIcon(session.status)}
                                {getStatusLabel(session.status)}
                            </div>

                            {/* Contenido principal */}
                            <div className="session-content">
                                <div className="session-date-time">
                                    <div className="date-block">
                                        <Calendar size={20} />
                                        <span className="date">{session.date}</span>
                                    </div>
                                    <div className="time-block">
                                        <Clock size={16} />
                                        <span className="time">
                                            {session.start_time} - {session.end_time}
                                        </span>
                                    </div>
                                </div>

                                {session.topic && (
                                    <h3 className="session-topic">{session.topic}</h3>
                                )}

                                <div className="session-info">
                                    {session.professional_name && (
                                        <div className="info-item">
                                            <User size={16} />
                                            <span>{session.professional_name}</span>
                                        </div>
                                    )}

                                    {session.observations && (
                                        <p className="session-observations">
                                            📝 {session.observations}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Acciones */}
                            {(canManageSessions || isProfessional) && (
                                <div className="session-actions">
                                    {/* Tomar Asistencia - NUEVO */}
                                    {session.status === 'scheduled' && (
                                        <button
                                            className="btn-action attendance"
                                            onClick={() => handleTakeAttendance(session)}
                                            title="Tomar asistencia"
                                        >
                                            <CheckCircle size={16} />
                                            Asistencia
                                        </button>
                                    )}

                                    {/* Completar (solo si está scheduled) */}
                                    {session.status === 'scheduled' && (
                                        <button
                                            className="btn-action complete"
                                            onClick={() => handleComplete(session.id)}
                                            title="Marcar como completada"
                                        >
                                            <CheckCircle size={16} />
                                            Completar
                                        </button>
                                    )}

                                    {/* Editar */}
                                    <button
                                        className="btn-action edit"
                                        onClick={() => handleEdit(session)}
                                    >
                                        <Edit size={16} />
                                        Editar
                                    </button>

                                    {/* Eliminar (solo admin/coordinator y si no está completed) */}
                                    {canManageSessions && session.status !== 'completed' && (
                                        <button className="btn-action delete" onClick={() => handleDelete(session)}>
                                            <Trash2 size={16} />
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            {/* MODALES  */}

            {/* Modal de creación */}
            {canCreateSessions && showCreateModal && (
                <CreateSessionModal
                    workshopId={parseInt(workshopId)}
                    workshopName={selectedWorkshop?.name}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchWorkshopSessions(parseInt(workshopId));
                    }}
                />
            )}

            {/* Modal editar */}

            {(canManageSessions || isProfessional) && showEditModal && selectedSession && (
                <EditSessionModal
                    session={selectedSession}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedSession(null);
                    }}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* Modal eliminar */}

            {canManageSessions && showDeleteModal && selectedSession && (
                <DeleteSessionModal
                    session={selectedSession}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedSession(null);
                    }}
                    onSuccess={handleDeleteSuccess}
                />
            )}
            
            {/* Modal Asistencia */}
            {(canManageSessions || isProfessional) && showAttendanceModal && selectedSession && (
                <AttendanceModal
                    session={selectedSession}
                    onClose={() => {
                        setShowAttendanceModal(false);
                        setSelectedSession(null);
                    }}
                    onSuccess={() => {
                        setShowAttendanceModal(false);
                        setSelectedSession(null);
                        fetchWorkshopSessions(parseInt(workshopId));
                    }}
                />
            )}

        </div>
    );
};

export default SessionsView;