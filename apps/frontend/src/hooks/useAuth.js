// hooks/useAuth.js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../store/useGlobalReducer';
import { apiService, ApiError } from '../services/api';
import { ACTION_TYPES } from '../store';

// Mensajes en español
const MESSAGES = {
  LOGIN: {
    SUCCESS: '✅ Inicio de sesión exitoso',
    ERROR: '❌ Error al iniciar sesión',
    INVALID_CREDENTIALS: '⚠️ Credenciales inválidas',
    INACTIVE_USER: '🚫 Usuario inactivo. Contacte al administrador',
    CONNECTION_ERROR: '🌐 Error de conexión. Verifica que el servidor esté activo',
    REQUIRES_2FA: '🔐 Ingresa tu código de autenticación',
    REQUIRES_2FA_SETUP: '📱 Debes configurar la autenticación de dos factores',
    TOO_MANY_ATTEMPTS: '⏱️ Demasiados intentos. Intenta de nuevo en unos minutos'
  },
  TWO_FA: {
    SETUP_SUCCESS: '✅ Autenticación de dos factores configurada correctamente',
    VERIFY_SUCCESS: '✅ Código verificado correctamente',
    INVALID_CODE: '❌ Código incorrecto. Verifica e intenta nuevamente',
    EXPIRED_SESSION: '⏱️ Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
    SETUP_ERROR: '❌ Error al configurar 2FA. Intenta nuevamente'
  },
  LOGOUT: {
    SUCCESS: '👋 Sesión cerrada correctamente',
    ERROR: '⚠️ Error al cerrar sesión'
  },
  VALIDATION: {
    EMAIL_REQUIRED: 'El correo electrónico es requerido',
    EMAIL_INVALID: 'Ingresa un correo electrónico válido',
    PASSWORD_REQUIRED: 'La contraseña es requerida',
    PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 8 caracteres',
    TOKEN_REQUIRED: 'El código de verificación es requerido',
    TOKEN_INVALID: 'El código debe tener 6 dígitos'
  }
};

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
      
      // Caso 1: Requiere configurar 2FA por primera vez
      if (response && response.requires_2fa_setup) {
        dispatch({ type: ACTION_TYPES.LOGIN_REQUIRES_2FA_SETUP });
        showNotification(MESSAGES.LOGIN.REQUIRES_2FA_SETUP, 'warning');
        
        // Navegar a la página de 2FA con flag de setup inicial
        navigate('/aossadmin/2fa', {
          state: { 
            email: credentials.email,
            password: credentials.password,
            isFirstTimeSetup: true,
            userId: response.user_id
          }
        });
        
        return { 
          success: false, 
          requires2FASetup: true 
        };
      }
      
      // Caso 2: Requiere código 2FA (ya configurado)
      if (response && response.requires_2fa) {
        dispatch({ type: ACTION_TYPES.LOGIN_REQUIRES_2FA });
        showNotification(MESSAGES.LOGIN.REQUIRES_2FA, 'info');
        
        // Navegar a la página de 2FA
        navigate('/aossadmin/2fa', {
          state: { 
            email: credentials.email,
            password: credentials.password,
            isFirstTimeSetup: false
          }
        });
        
        return { 
          success: false, 
          requires2FA: true 
        };
      }
      
      // Caso 3: Login exitoso (sin 2FA o con 2FA incluido)
      if (response && response.msg === 'Login successful') {
        dispatch({
          type: ACTION_TYPES.LOGIN_SUCCESS,
          payload: {
            user: response.user || { email: credentials.email },
            role: response.role
          }
        });
        
        showNotification(MESSAGES.LOGIN.SUCCESS, 'success');
        navigate('/aossadmin/dashboard');
        return { success: true };
      }
      
      // Caso 4: Respuesta inesperada
      throw new Error('Respuesta inesperada del servidor');
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = MESSAGES.LOGIN.ERROR;
      
      if (error instanceof ApiError) {
        // Mapear errores específicos a mensajes en español
        if (error.status === 401) {
          if (error.message.includes('Credenciales')) {
            errorMessage = MESSAGES.LOGIN.INVALID_CREDENTIALS;
          } else if (error.message.includes('inactivo')) {
            errorMessage = MESSAGES.LOGIN.INACTIVE_USER;
          } else if (error.message.includes('2FA')) {
            errorMessage = MESSAGES.TWO_FA.INVALID_CODE;
          } else {
            errorMessage = error.message || MESSAGES.LOGIN.INVALID_CREDENTIALS;
          }
        } else if (error.status === 429) {
          errorMessage = MESSAGES.LOGIN.TOO_MANY_ATTEMPTS;
        } else if (error.status === 0) {
          errorMessage = MESSAGES.LOGIN.CONNECTION_ERROR;
        } else {
          errorMessage = error.message || MESSAGES.LOGIN.ERROR;
        }
      }
      
      dispatch({
        type: ACTION_TYPES.LOGIN_ERROR,
        payload: errorMessage
      });
      
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
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
        
        showNotification(MESSAGES.TWO_FA.VERIFY_SUCCESS, 'success');
        navigate('/aossadmin/dashboard');
        return { success: true };
      }
      
      throw new Error('Respuesta inesperada del servidor');
      
    } catch (error) {
      console.error('Login with 2FA error:', error);
      
      let errorMessage = MESSAGES.TWO_FA.INVALID_CODE;
      
      if (error instanceof ApiError) {
        if (error.message.includes('expirad')) {
          errorMessage = MESSAGES.TWO_FA.EXPIRED_SESSION;
        } else if (error.message.includes('inválid')) {
          errorMessage = MESSAGES.TWO_FA.INVALID_CODE;
        } else {
          errorMessage = error.message;
        }
      }
      
      dispatch({
        type: ACTION_TYPES.LOGIN_ERROR,
        payload: errorMessage
      });
      
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [dispatch, navigate, showNotification]);

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
      dispatch({ type: ACTION_TYPES.LOGOUT });
      showNotification(MESSAGES.LOGOUT.SUCCESS, 'info');
      navigate('/aossadmin');
    } catch (error) {
      // Aunque falle el servidor, limpiamos el estado local
      dispatch({ type: ACTION_TYPES.LOGOUT });
      showNotification(MESSAGES.LOGOUT.ERROR, 'warning');
      navigate('/aossadmin');
    }
  }, [dispatch, navigate, showNotification]);

  const clearErrors = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERRORS });
  }, [dispatch]);

  const setup2FA = useCallback(async () => {
    try {
      const response = await apiService.setup2FA();
      return response;
    } catch (error) {
      const message = error instanceof ApiError ? 
        error.message : MESSAGES.TWO_FA.SETUP_ERROR;
      showNotification(message, 'error');
      throw new Error(message);
    }
  }, [showNotification]);

  const verify2FASetup = useCallback(async (token, isInitialSetup = false) => {
    try {
      const response = await apiService.verify2FASetup(token);
      
      // Si es el setup inicial y la respuesta incluye datos de login
      if (isInitialSetup && response.setup_complete) {
        dispatch({
          type: ACTION_TYPES.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            role: response.role
          }
        });
        
        showNotification(MESSAGES.TWO_FA.SETUP_SUCCESS, 'success');
        navigate('/aossadmin/dashboard');
        return { success: true };
      }
      
      showNotification(MESSAGES.TWO_FA.SETUP_SUCCESS, 'success');
      return response;
      
    } catch (error) {
      const message = error instanceof ApiError ? 
        error.message : MESSAGES.TWO_FA.INVALID_CODE;
      showNotification(message, 'error');
      throw new Error(message);
    }
  }, [dispatch, navigate, showNotification]);

  // Función para validar formularios
  const validateLoginForm = useCallback((formData) => {
    const errors = {};

    // Validar email
    if (!formData.email) {
      errors.email = MESSAGES.VALIDATION.EMAIL_REQUIRED;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = MESSAGES.VALIDATION.EMAIL_INVALID;
    }

    // Validar contraseña
    if (!formData.password) {
      errors.password = MESSAGES.VALIDATION.PASSWORD_REQUIRED;
    } else if (formData.password.length < 8) {
      errors.password = MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH;
    }

    return errors;
  }, []);

  const validate2FAToken = useCallback((token) => {
    if (!token) {
      return MESSAGES.VALIDATION.TOKEN_REQUIRED;
    }
    if (!/^\d{6}$/.test(token)) {
      return MESSAGES.VALIDATION.TOKEN_INVALID;
    }
    return null;
  }, []);

  return {
    // Estado
    isAuthenticated: store.auth.isAuthenticated,
    user: store.auth.user,
    role: store.auth.role,
    isLoading: store.auth.isLoading,
    error: store.auth.error,
    requires2FA: store.auth.requires2FA,
    requires2FASetup: store.auth.requires2FASetup,
    
    // Funciones
    login,
    loginWith2FA,
    logout,
    clearErrors,
    setup2FA,
    verify2FASetup,
    
    // Validaciones
    validateLoginForm,
    validate2FAToken,
    
    // Mensajes
    MESSAGES
  };
};