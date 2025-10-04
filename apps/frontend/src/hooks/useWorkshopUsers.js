import { useState, useCallback } from 'react';
import { apiService, ApiError } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

const MESSAGES = {
  SUCCESS: {
    USER_ENROLLED: '✅ Usuario inscrito exitosamente',
    USER_UNENROLLED: '✅ Usuario desinscrito correctamente',
    PROMOTED_FROM_WAITLIST: '🎉 Usuario promovido desde lista de espera'
  },
  ERROR: {
    FETCH_STUDENTS: '❌ Error al cargar estudiantes',
    ENROLL_USER: '❌ Error al inscribir usuario',
    UNENROLL_USER: '❌ Error al desinscribir usuario',
    NO_PERMISSION: '🚫 No tienes permisos para realizar esta acción',
    ALREADY_ENROLLED: '⚠️ El usuario ya está inscrito en este taller',
    WORKSHOP_FULL: '⚠️ Taller lleno - usuario agregado a lista de espera'
  }
};

export const useWorkshopUsers = () => {
  const { dispatch } = useGlobalReducer();
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [waitlistStudents, setWaitlistStudents] = useState([]);
  const [userWorkshops, setUserWorkshops] = useState([]);
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


  // OBTENER ESTUDIANTES INSCRITOS EN UN TALLER

  const fetchWorkshopStudents = useCallback(async (workshopId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getWorkshopStudents(workshopId);
      
      if (response) {
        setEnrolledStudents(response.enrolled_students?.students || []);
        setWaitlistStudents(response.waitlist?.students || []);
        return response;
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? 
        err.message : MESSAGES.ERROR.FETCH_STUDENTS;
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);


  // OBTENER TALLERES DE UN USUARIO

  const fetchUserWorkshops = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserWorkshops(userId);
      
      if (response) {
        setUserWorkshops({
          active: response.active_workshops?.workshops || [],
          waitlist: response.waitlist_workshops?.workshops || []
        });
        return response;
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? 
        err.message : 'Error al cargar talleres del usuario';
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // INSCRIBIR USUARIO A TALLER
 
  const enrollUser = useCallback(async (userId, workshopId) => {
    setLoading(true);
    try {
      const response = await apiService.enrollUserToWorkshop({
        user_id: userId,
        workshop_id: workshopId
      });
      
      if (response && response.message) {
        // Verificar si fue a lista de espera
        if (response.in_waitlist) {
          showNotification(
            `${MESSAGES.ERROR.WORKSHOP_FULL} (Posición ${response.waitlist_position})`,
            'warning'
          );
        } else {
          showNotification(MESSAGES.SUCCESS.USER_ENROLLED, 'success');
        }
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al inscribir usuario');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.ENROLL_USER;
      
      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = MESSAGES.ERROR.NO_PERMISSION;
        } else if (err.status === 409) {
          errorMessage = MESSAGES.ERROR.ALREADY_ENROLLED;
        } else if (err.status === 400 || err.status === 422) {
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

  // DESINSCRIBIR USUARIO DE TALLER

  const unenrollUser = useCallback(async (enrollmentId, reason) => {
    if (!reason || reason.trim() === '') {
      const errorMsg = '⚠️ Debes proporcionar una razón para la desinscripción';
      showNotification(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    setLoading(true);
    try {
      const response = await apiService.unenrollUserFromWorkshop(enrollmentId, reason);
      
      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.USER_UNENROLLED, 'success');
        
        // Si se promovió alguien de lista de espera
        if (response.promoted_from_waitlist) {
          const promotedUser = response.promoted_from_waitlist;
          showNotification(
            `🎉 ${promotedUser.user_name} promovido desde lista de espera`,
            'info'
          );
        }
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al desinscribir usuario');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UNENROLL_USER;
      
      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = MESSAGES.ERROR.NO_PERMISSION;
        } else if (err.status === 400 || err.status === 422) {
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


  // OBTENER LISTA DE ESPERA

  const fetchWaitlist = useCallback(async (workshopId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getWorkshopWaitlist(workshopId);
      
      if (response && response.waitlist) {
        setWaitlistStudents(response.waitlist.students || []);
        return response;
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? 
        err.message : 'Error al cargar lista de espera';
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  return {

    // Estado

    enrolledStudents,
    waitlistStudents,
    userWorkshops,
    loading,
    error,
    
    // Funciones principales

    fetchWorkshopStudents,
    fetchUserWorkshops,
    enrollUser,
    unenrollUser,
    fetchWaitlist,
    
    // Utilidades
    
    clearError: () => setError(null),
    clearStudents: () => {
      setEnrolledStudents([]);
      setWaitlistStudents([]);
    },
    MESSAGES
  };
};