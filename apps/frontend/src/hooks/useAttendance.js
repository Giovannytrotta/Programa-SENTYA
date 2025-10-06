import { useState, useCallback } from 'react';
import { apiService, ApiError } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

const MESSAGES = {
  SUCCESS: {
    ATTENDANCE_TAKEN: '✅ Asistencia registrada exitosamente',
    ATTENDANCE_UPDATED: '✅ Asistencia actualizada correctamente'
  },
  ERROR: {
    TAKE_ATTENDANCE: '❌ Error al registrar asistencia',
    FETCH_ATTENDANCE: '❌ Error al cargar asistencia',
    UPDATE_ATTENDANCE: '❌ Error al actualizar asistencia',
    NO_PERMISSION: '🚫 No tienes permisos para realizar esta acción'
  }
};

export const useAttendance = () => {
  const { dispatch } = useGlobalReducer();
  const [attendance, setAttendance] = useState([]);
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

  // TOMAR ASISTENCIA
  const takeAttendance = useCallback(async (sessionId, attendances) => {
    setLoading(true);
    try {
      const response = await apiService.takeAttendance(sessionId, attendances);
      
      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.ATTENDANCE_TAKEN, 'success');
        return { success: true, data: response };
      }
      
      throw new Error('Error al registrar asistencia');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.TAKE_ATTENDANCE;
      
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

  // OBTENER ASISTENCIA DE SESIÓN
  const fetchSessionAttendance = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getSessionAttendance(sessionId);
      
      if (response) {
        setAttendance(response.attendances || []);
        return response;
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? 
        err.message : MESSAGES.ERROR.FETCH_ATTENDANCE;
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // ACTUALIZAR ASISTENCIA
  const updateAttendance = useCallback(async (sessionId, attendances) => {
    setLoading(true);
    try {
      const response = await apiService.updateAttendance(sessionId, attendances);
      
      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.ATTENDANCE_UPDATED, 'success');
        return { success: true, data: response };
      }
      
      throw new Error('Error al actualizar asistencia');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_ATTENDANCE;
      
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

  return {
    // Estado
    attendance,
    loading,
    error,
    
    // Funciones
    takeAttendance,
    fetchSessionAttendance,
    updateAttendance,
    
    // Utilidades
    clearError: () => setError(null),
    clearAttendance: () => setAttendance([]),
    MESSAGES
  };
};