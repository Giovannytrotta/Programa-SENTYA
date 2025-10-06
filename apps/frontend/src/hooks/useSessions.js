import { useState, useCallback } from 'react';
import { apiService, ApiError } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

const MESSAGES = {
  SUCCESS: {
    SESSION_CREATED: '✅ Sesión creada exitosamente',
    SESSION_UPDATED: '✅ Sesión actualizada correctamente',
    SESSION_DELETED: '✅ Sesión eliminada correctamente',
    SESSION_COMPLETED: '✅ Sesión marcada como completada',
    SESSION_CANCELLED: '✅ Sesión cancelada correctamente'
  },
  ERROR: {
    FETCH_SESSIONS: '❌ Error al cargar sesiones',
    CREATE_SESSION: '❌ Error al crear sesión',
    UPDATE_SESSION: '❌ Error al actualizar sesión',
    DELETE_SESSION: '❌ Error al eliminar sesión',
    COMPLETE_SESSION: '❌ Error al completar sesión',
    CANCEL_SESSION: '❌ Error al cancelar sesión',
    NO_PERMISSION: '🚫 No tienes permisos para realizar esta acción',
    INVALID_DATA: '⚠️ Datos inválidos. Verifica los campos'
  }
};

export const useSessions = () => {
  const { dispatch } = useGlobalReducer();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // OBTENER SESIONES DE UN TALLER

  const fetchWorkshopSessions = useCallback(async (workshopId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getWorkshopSessions(workshopId);

      if (response && response.sessions) {
        setSessions(response.sessions);
        return response;
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = err instanceof ApiError ?
        err.message : MESSAGES.ERROR.FETCH_SESSIONS;

      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);


  // OBTENER MIS SESIONES (PROFESIONALES)

  const fetchMySessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getMySessions();

      if (response && response.sessions) {
        setSessions(response.sessions);
        return response;
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = err instanceof ApiError ?
        err.message : MESSAGES.ERROR.FETCH_SESSIONS;

      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // OBTENER MIS SESIONES INSCRITAS (CLIENTES)

  const fetchMyEnrolledSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getMyEnrolledSessions();

      if (response && response.sessions) {
        setSessions(response.sessions);
        return response;
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = err instanceof ApiError ?
        err.message : MESSAGES.ERROR.FETCH_SESSIONS;

      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);


  // CREAR SESIÓN

  const createSession = useCallback(async (sessionData) => {
    setLoading(true);
    try {
      const response = await apiService.createSession(sessionData);

      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.SESSION_CREATED, 'success');

        // Agregar al estado local
        if (response.session) {
          setSessions(prevSessions => [...prevSessions, response.session]);
        }

        return { success: true, data: response };
      }

      throw new Error('Error al crear sesión');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.CREATE_SESSION;

      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = MESSAGES.ERROR.NO_PERMISSION;
        } else if (err.status === 422 || err.status === 400) {
          errorMessage = `❌ ${err.message}`;
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }

      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);


  // ACTUALIZAR SESIÓN

  const updateSession = useCallback(async (sessionId, sessionData) => {
    setLoading(true);
    try {
      const response = await apiService.updateSession(sessionId, sessionData);

      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.SESSION_UPDATED, 'success');

        // Actualizar en el estado local
        setSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === sessionId ? { ...session, ...response.session } : session
          )
        );

        return { success: true, data: response };
      }

      throw new Error('Error al actualizar sesión');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_SESSION;

      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = MESSAGES.ERROR.NO_PERMISSION;
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }

      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);


  // ELIMINAR SESIÓN

  const deleteSession = useCallback(async (sessionId) => {
    setLoading(true);
    try {
      const response = await apiService.deleteSession(sessionId);

      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.SESSION_DELETED, 'success');

        // Eliminar del estado local
        setSessions(prevSessions =>
          prevSessions.filter(session => session.id !== sessionId)
        );

        return { success: true, data: response };
      }

      throw new Error('Error al eliminar sesión');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.DELETE_SESSION;

      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = MESSAGES.ERROR.NO_PERMISSION;
        } else if (err.status === 400) {
          errorMessage = `❌ ${err.message}`;
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }

      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);


  // MARCAR SESIÓN COMO COMPLETADA

  const completeSession = useCallback(async (sessionId) => {
    setLoading(true);
    try {
      const response = await apiService.completeSession(sessionId);

      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.SESSION_COMPLETED, 'success');

        // Actualizar status en el estado local
        setSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === sessionId ? { ...session, status: 'completed' } : session
          )
        );

        return { success: true, data: response };
      }

      throw new Error('Error al completar sesión');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.COMPLETE_SESSION;

      if (err instanceof ApiError) {
        errorMessage = `❌ ${err.message}`;
      }

      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);


  // CANCELAR SESIÓN

  const cancelSession = useCallback(async (sessionId, reason) => {
    if (!reason || reason.trim() === '') {
      const errorMsg = '⚠️ Debes proporcionar una razón para cancelar';
      showNotification(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    setLoading(true);
    try {
      const response = await apiService.cancelSession(sessionId, reason);

      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.SESSION_CANCELLED, 'success');

        // Actualizar status en el estado local
        setSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === sessionId ? { ...session, status: 'cancelled' } : session
          )
        );

        return { success: true, data: response };
      }

      throw new Error('Error al cancelar sesión');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.CANCEL_SESSION;

      if (err instanceof ApiError) {
        errorMessage = `❌ ${err.message}`;
      }

      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);


  // OBTENER DETALLE DE SESIÓN

  const getSessionDetails = useCallback(async (sessionId) => {
    setLoading(true);
    try {
      const response = await apiService.getSessionDetails(sessionId);
      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ?
        err.message : 'Error al obtener detalle de sesión';
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  return {
    // Estado
    sessions,
    loading,
    error,

    // Funciones principales
    fetchWorkshopSessions,
    fetchMySessions,
    fetchMyEnrolledSessions,
    createSession,
    updateSession,
    deleteSession,
    completeSession,
    cancelSession,
    getSessionDetails,

    // Utilidades
    clearError: () => setError(null),
    clearSessions: () => setSessions([]),
    MESSAGES
  };
};