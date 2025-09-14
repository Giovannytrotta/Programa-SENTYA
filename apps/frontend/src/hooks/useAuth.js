// hooks/useAuth.js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../store/useGlobalReducer';
import { apiService, ApiError } from '../services/api';
import { ACTION_TYPES } from '../store';

export const useAuth = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();

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

  const login = useCallback(async (credentials) => {
    dispatch({ type: ACTION_TYPES.LOGIN_START });

    try {
      const response = await apiService.login(credentials);
      
      if (response && response.msg === 'Login successful') {
        dispatch({
          type: ACTION_TYPES.LOGIN_SUCCESS,
          payload: {
            user: response.user || { email: credentials.email },
            role: response.role
          }
        });
        
        showNotification('Inicio de sesión exitoso', 'success');
        navigate('/aossadmin/dashboard');
        return { success: true };
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof ApiError) {
        if (error.status === 401 && error.data?.requires_2fa) {
          dispatch({ type: ACTION_TYPES.LOGIN_REQUIRES_2FA });
          showNotification('Se requiere código 2FA', 'info');
          return { success: false, requires2FA: true };
        }
        
        const errorMessage = error.message || 'Error de autenticación';
        dispatch({
          type: ACTION_TYPES.LOGIN_ERROR,
          payload: errorMessage
        });
        
        return { success: false, error: errorMessage };
      }
      
      const connectionError = 'Error de conexión. Verifica que el servidor esté ejecutándose.';
      dispatch({
        type: ACTION_TYPES.LOGIN_ERROR,
        payload: connectionError
      });
      
      return { success: false, error: connectionError };
    }
  }, [dispatch, navigate, showNotification]);

  const loginWith2FA = useCallback(async (credentials) => {
    dispatch({ type: ACTION_TYPES.LOGIN_START });

    try {
      const response = await apiService.loginWith2FA(credentials);
      
      if (response && response.msg === 'Login successful') {
        dispatch({
          type: ACTION_TYPES.LOGIN_SUCCESS,
          payload: {
            user: response.user || { email: credentials.email },
            role: response.role
          }
        });
        
        showNotification('Verificación 2FA exitosa', 'success');
        navigate('/aossadmin/dashboard');
        return { success: true };
      }
    } catch (error) {
      console.error('Login with 2FA error:', error);
      
      if (error instanceof ApiError) {
        dispatch({
          type: ACTION_TYPES.LOGIN_ERROR,
          payload: error.message
        });
        return { success: false, error: error.message };
      }
      
      dispatch({
        type: ACTION_TYPES.LOGIN_ERROR,
        payload: 'Error de conexión'
      });
      
      return { success: false, error: 'Error de conexión' };
    }
  }, [dispatch, navigate, showNotification]);

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
      dispatch({ type: ACTION_TYPES.LOGOUT });
      showNotification('Sesión cerrada correctamente', 'info');
      navigate('/aossadmin');
    } catch (error) {
      // Aunque falle el servidor, limpiamos el estado local
      dispatch({ type: ACTION_TYPES.LOGOUT });
      navigate('/aossadmin');
    }
  }, [dispatch, navigate, showNotification]);

  const clearErrors = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERRORS });
  }, [dispatch]);

  const setup2FA = useCallback(async () => {
    try {
      return await apiService.setup2FA();
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Error al configurar 2FA');
    }
  }, []);

  const verify2FASetup = useCallback(async (token) => {
    try {
      const response = await apiService.verify2FASetup(token);
      showNotification('2FA configurado correctamente', 'success');
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Error al verificar 2FA');
    }
  }, [showNotification]);

  return {
    // Estado
    isAuthenticated: store.auth.isAuthenticated,
    user: store.auth.user,
    role: store.auth.role,
    isLoading: store.auth.isLoading,
    error: store.auth.error,
    requires2FA: store.auth.requires2FA,
    
    // Funciones
    login,
    loginWith2FA,
    logout,
    clearErrors,
    setup2FA,
    verify2FASetup
  };
};