// hooks/useDashboard.js
import { useState, useCallback, useEffect } from 'react';
import { apiService, ApiError } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

const MESSAGES = {
    SUCCESS: {
        DATA_LOADED: '✅ Dashboard cargado correctamente'
    },
    ERROR: {
        LOAD_DASHBOARD: '❌ Error al cargar dashboard',
        NO_CSS_ASSIGNED: '⚠️ No tienes un centro asignado',
        NO_DATA: '❌ No se pudieron cargar los datos',
        INVALID_ROLE: '❌ Rol no reconocido'
    }
};

/**
 * Hook personalizado para cargar datos de dashboards según rol
 * @param {string} role - Rol del usuario (administrator, coordinator, professional, client, css_technician)
 * @param {number} userId - ID del usuario actual
 * @param {number|null} cssId - ID del centro social (solo para css_technician)
 * @returns {Object} - Estados y funciones para el dashboard
 */
export const useDashboard = (role, userId, cssId = null) => {
    const { dispatch } = useGlobalReducer();

    // ============================================
    // 📊 ESTADOS
    // ============================================
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeWorkshops: 0,
        totalSessions: 0,
        totalCenters: 0,
        totalWorkshops: 0,
        todaySessions: 0,
        upcomingSessions: 0,
        completedSessions: 0,
        averageAttendance: 0,
        enrolledWorkshops: 0,
        attendanceRate: 0
    });

    const [recentWorkshops, setRecentWorkshops] = useState([]);
    const [centerInfo, setCenterInfo] = useState(null);
    const [usersByRole, setUsersByRole] = useState({
        administrator: 0,
        coordinator: 0,
        professional: 0,
        client: 0,
        css_technician: 0
    });

    // 🆕 ESTADOS PARA SESIONES DE PROFESIONALES

    const [todaySessions, setTodaySessions] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ============================================
    // 🔔 NOTIFICACIONES
    // ============================================
    const showNotification = useCallback((message, type = 'info') => {
        dispatch({
            type: ACTION_TYPES.ADD_NOTIFICATION,
            payload: {
                id: Date.now(),
                message,
                type,
                timestamp: new Date()
            }
        });
    }, [dispatch]);

    // ============================================
    // 🔵 ADMINISTRATOR / COORDINATOR DASHBOARD
    // ============================================

    const loadAdminDashboard = useCallback(async () => {
        try {
            const [usersResponse, workshopsResponse, centersResponse] = await Promise.all([
                apiService.getAllUsers(),
                apiService.getAllWorkshops(),
                apiService.getActiveCSSCenters()
            ]);

            const users = usersResponse.users || [];
            const workshops = workshopsResponse.workshops || [];
            const centers = centersResponse.css_centers || [];

            const activeWorkshops = workshops.filter(w => w.status === 'active').length;

            setStats({
                totalUsers: users.length,
                activeWorkshops: activeWorkshops,
                totalSessions: workshops.reduce((sum, w) => sum + (w.total_sessions || 0), 0),
                totalCenters: centers.length
            });

            setRecentWorkshops(workshops.slice(0, 6));

            return { success: true };
        } catch (err) {
            throw err;
        }
    }, []);

    // ============================================
    // 🟢 PROFESSIONAL DASHBOARD
    // ============================================

    const loadProfessionalDashboard = useCallback(async () => {
        try {
            const [scheduleResponse, attendanceResponse] = await Promise.all([
                apiService.getMySchedule(),
                apiService.getMyWorkshopsAttendance()
            ]);

            const scheduleStats = scheduleResponse.stats || {};
            const attendanceStats = attendanceResponse.stats || {};


            setStats({
                totalWorkshops: (scheduleResponse.workshops?.length || 0),
                todaySessions: scheduleStats.today || 0,
                upcomingSessions: scheduleStats.upcoming || 0,
                completedSessions: scheduleStats.completed || 0,
                averageAttendance: attendanceStats.average_attendance_rate || 0
            });

            setRecentWorkshops(scheduleResponse.workshops || []);


            // 🆕 SETEAR SESIONES DE HOY Y PRÓXIMAS
            const today = scheduleResponse.sessions?.today || [];
            const upcoming = scheduleResponse.sessions?.upcoming || [];

            setTodaySessions(today);
            setUpcomingSessions(upcoming.slice(0, 5));

            return { success: true };
        } catch (err) {
            throw err;
        }
    }, []);

    // ============================================
    // 🟡 CLIENT DASHBOARD
    // ============================================

//   const loadClientDashboard = useCallback(async () => {
//   try {
//     const [sessionsResponse, workshopsResponse] = await Promise.all([
//       apiService.getMyEnrolledSessions(),
//       apiService.getAllWorkshops()
//     ]);

//     const sessions = sessionsResponse.sessions || [];
//     const workshops = workshopsResponse.workshops || [];

//     const now = new Date();
//     const todayStr = now.toISOString().split('T')[0];

//     const upcoming = sessions.filter(s => s.date >= todayStr);
//     const completed = sessions.filter(s => s.status === 'completed');

//     const uniqueWorkshops = [...new Set(sessions.map(s => s.workshop_id))];

//     setStats({
//       enrolledWorkshops: uniqueWorkshops.length,
//       upcomingSessions: upcoming.length,
//       completedSessions: completed.length,
//       attendanceRate: sessions.length > 0 ? Math.round((completed.length / sessions.length) * 100) : 0
//     });

//     // 🆕 FILTRAR SOLO LOS TALLERES DONDE ESTÁ INSCRITO
//     const myWorkshops = workshops.filter(w => uniqueWorkshops.includes(w.id));
//     setRecentWorkshops(myWorkshops.slice(0, 6));
    
//     const sortedUpcoming = upcoming
//       .sort((a, b) => new Date(a.date) - new Date(b.date))
//       .slice(0, 5);
//     setUpcomingSessions(sortedUpcoming);

//     return { success: true };
//   } catch (err) {
//     throw err;
//   }
// }, []);

    // ============================================
    // 🟠 CSS TECHNICIAN DASHBOARD
    // ============================================

    const loadCSSTechnicianDashboard = useCallback(async (cssId) => {
        if (!cssId) {
            throw new Error(MESSAGES.ERROR.NO_CSS_ASSIGNED);
        }

        try {
            const [centersResponse, workshopsResponse, usersResponse] = await Promise.all([
                apiService.getActiveCSSCenters(),
                apiService.getAllWorkshops(),
                apiService.getAllUsers()
            ]);

            const myCenter = centersResponse.css_centers?.find(c => c.id === cssId);
            setCenterInfo(myCenter);

            const centerWorkshops = workshopsResponse.workshops?.filter(w => w.css_id === cssId) || [];
            setRecentWorkshops(centerWorkshops.slice(0, 6));

            const centerUsers = usersResponse.users?.filter(u => u.css_id === cssId) || [];

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

            const activeWorkshops = centerWorkshops.filter(w => w.status === 'active').length;

            setStats({
                totalWorkshops: centerWorkshops.length,
                activeWorkshops: activeWorkshops,
                totalUsers: centerUsers.length,
                upcomingSessions: centerWorkshops.reduce((sum, w) => sum + (w.total_sessions || 0), 0)
            });

            return { success: true };
        } catch (err) {
            throw err;
        }
    }, []);

    // ============================================
    // 🎯 CARGA PRINCIPAL - SWITCH POR ROL
    // ============================================

    const loadDashboard = useCallback(async () => {
        // ✅ FIX: No cargar si userId no está listo
        if (!userId) {
            setLoading(true);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            switch (role) {
                case 'administrator':
                case 'coordinator':
                    await loadAdminDashboard();
                    break;

                case 'professional':
                    await loadProfessionalDashboard();
                    break;

                case 'client':
                    await loadClientDashboard();
                    break;

                case 'css_technician':
                    await loadCSSTechnicianDashboard(cssId);
                    break;

                default:
                    throw new Error(MESSAGES.ERROR.INVALID_ROLE);
            }

        } catch (err) {
            let errorMessage = MESSAGES.ERROR.LOAD_DASHBOARD;

            if (err instanceof ApiError) {
                errorMessage = `❌ ${err.message}`;
            } else if (err.message === MESSAGES.ERROR.NO_CSS_ASSIGNED) {
                errorMessage = err.message;
            } else if (err.message === MESSAGES.ERROR.INVALID_ROLE) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            showNotification(errorMessage, 'error');

            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, [

        role,
        userId,
        cssId,
        loadAdminDashboard,
        loadProfessionalDashboard,
        // loadClientDashboard,
        loadCSSTechnicianDashboard,
        showNotification
    ]);

    // ============================================
    // 🔄 EFECTO PRINCIPAL
    // ============================================

    useEffect(() => {
        // ✅ Solo cargar si userId existe (evita race condition)
        if (userId) {
            loadDashboard();
        }
    }, [userId, cssId, loadDashboard]);

    // ============================================
    // 📤 RETORNO
    // ============================================

    return {
        // Estados
        stats,
        recentWorkshops,
        centerInfo,
        usersByRole,

        //sessiones (solo para profesionales)

        todaySessions,
        upcomingSessions,

        //carga

        loading,
        error,

        // Funciones
        reloadDashboard: loadDashboard,
        clearError: () => setError(null),

        // Mensajes
        MESSAGES
    };
};