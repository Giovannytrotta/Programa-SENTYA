// apps/frontend/src/hooks/useProfile.js
// HOOK MEJORADO CON SISTEMA DE NOTIFICACIONES CORRECTO

import { useState, useCallback } from 'react';
import { apiService, ApiError } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

const MESSAGES = {
  SUCCESS: {
    UPDATE_PROFILE: '✅ Perfil actualizado exitosamente',
    UPDATE_PASSWORD: '✅ Contraseña actualizada exitosamente',
    UPDATE_AVATAR: '✅ Avatar actualizado exitosamente',
    DELETE_AVATAR: '✅ Avatar eliminado exitosamente'
  },
  ERROR: {
    UPDATE_PROFILE: '❌ Error al actualizar el perfil',
    UPDATE_PASSWORD: '❌ Error al actualizar la contraseña',
    UPDATE_AVATAR: '❌ Error al actualizar el avatar',
    DELETE_AVATAR: '❌ Error al eliminar el avatar',
    FETCH_PROFILE: '❌ Error al cargar el perfil',
    INVALID_PASSWORD: '❌ Contraseña actual incorrecta',
    PASSWORD_MISMATCH: '❌ Las contraseñas no coinciden',
    PASSWORD_LENGTH: '❌ La contraseña debe tener al menos 8 caracteres'
  }
};

export const useProfile = () => {
  const { dispatch, store } = useGlobalReducer();

  // ============================================
  // 📊 ESTADOS
  // ============================================
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // 🔔 NOTIFICACIONES (USANDO TU SISTEMA)
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
  // 📥 OBTENER PERFIL DEL USUARIO
  // ============================================
  
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserProfile();
      
      if (response.success && response.user) {
        setProfile(response.user);
        
        // Actualizar el contexto de auth
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: {
            ...store.auth.user,  // store accesible por closure
            ...response.user
          }
        });
        
        return { success: true, data: response.user };
      }
      
      throw new Error('Error al obtener perfil');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.FETCH_PROFILE;
      
      if (err instanceof ApiError) {
        errorMessage = `❌ ${err.message}`;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showNotification, dispatch]); // ✅ SIN store en dependencias

  // ============================================
  // 📝 ACTUALIZAR INFORMACIÓN DEL PERFIL
  // ============================================
  
  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.updateUserProfile(profileData);
      
      if (response.success) {
        // Actualizar estado local
        setProfile(prev => ({
          ...prev,
          ...response.user
        }));
        
        // Actualizar contexto de auth
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: {
            ...store.auth.user,  // store accesible por closure
            ...response.user
          }
        });
        
        showNotification(MESSAGES.SUCCESS.UPDATE_PROFILE, 'success');
        return { success: true, data: response.user };
      }
      
      throw new Error('Error al actualizar perfil');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_PROFILE;
      
      if (err instanceof ApiError) {
        errorMessage = `❌ ${err.message}`;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showNotification, dispatch]); // ✅ SIN store en dependencias

  // ============================================
  // 🔒 ACTUALIZAR CONTRASEÑA
  // ============================================
  
  const updatePassword = useCallback(async (passwordData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validaciones frontend
      if (passwordData.new_password !== passwordData.confirm_password) {
        throw new Error(MESSAGES.ERROR.PASSWORD_MISMATCH);
      }
      
      if (passwordData.new_password.length < 8) {
        throw new Error(MESSAGES.ERROR.PASSWORD_LENGTH);
      }
      
      const response = await apiService.updatePassword(passwordData);
      
      if (response.success) {
        showNotification(MESSAGES.SUCCESS.UPDATE_PASSWORD, 'success');
        return { success: true };
      }
      
      throw new Error(response.error || 'Error al actualizar contraseña');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_PASSWORD;
      
      // Errores específicos del backend
      if (err.message?.includes('incorrecta')) {
        errorMessage = MESSAGES.ERROR.INVALID_PASSWORD;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (err instanceof ApiError) {
        errorMessage = `❌ ${err.message}`;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // ============================================
  // 🎨 ACTUALIZAR AVATAR (MEJORADO)
  // ============================================
  
  const updateAvatar = useCallback(async (avatarData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.updateAvatar(avatarData);
      
      if (response.success && response.avatar) {
        // Actualizar perfil local
        setProfile(prev => ({
          ...prev,
          ...response.avatar
        }));
        
        // Actualizar contexto de auth para que el Navbar lo vea
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: {
            ...store.auth.user,  // store accesible por closure
            ...response.avatar
          }
        });
        
        showNotification(MESSAGES.SUCCESS.UPDATE_AVATAR, 'success');
        return { success: true, data: response.avatar };
      }
      
      throw new Error('Error al actualizar avatar');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_AVATAR;
      
      if (err instanceof ApiError) {
        errorMessage = `❌ ${err.message}`;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showNotification, dispatch]); // ✅ SIN store en dependencias

  // ============================================
  // 🗑️ ELIMINAR AVATAR (volver al default)
  // ============================================
  
  const deleteAvatar = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.deleteAvatar();
      
      if (response.success) {
        // Limpiar datos de avatar
        const clearedAvatar = {
          avatar_url: null,
          avatar_type: null,
          avatar_style: null,
          avatar_color: null,
          avatar_seed: null
        };
        
        setProfile(prev => ({
          ...prev,
          ...clearedAvatar
        }));
        
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: {
            ...store.auth.user,  // store accesible por closure
            ...clearedAvatar
          }
        });
        
        showNotification(MESSAGES.SUCCESS.DELETE_AVATAR, 'success');
        return { success: true };
      }
      
      throw new Error('Error al eliminar avatar');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.DELETE_AVATAR;
      
      if (err instanceof ApiError) {
        errorMessage = `❌ ${err.message}`;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showNotification, dispatch]); // ✅ SIN store en dependencias

  // ============================================
  // 📤 RETORNO
  // ============================================

  return {
    // Estado
    profile,
    loading,
    error,
    
    // Funciones
    fetchProfile,
    updateProfile,
    updatePassword,
    updateAvatar,
    deleteAvatar,
    
    // Utilidades
    clearError: () => setError(null),
    MESSAGES
  };
};