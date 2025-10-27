// apps/frontend/src/hooks/useProfile.js

import { useState, useCallback } from 'react';
import { apiService, ApiError } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

const MESSAGES = {
  SUCCESS: {
    PROFILE_UPDATED: '✅ Perfil actualizado correctamente',
    PASSWORD_UPDATED: '✅ Contraseña actualizada correctamente',
    AVATAR_UPDATED: '✅ Avatar actualizado correctamente'
  },
  ERROR: {
    FETCH_PROFILE: '❌ Error al cargar perfil',
    UPDATE_PROFILE: '❌ Error al actualizar perfil',
    UPDATE_PASSWORD: '❌ Error al actualizar contraseña',
    UPDATE_AVATAR: '❌ Error al actualizar avatar',
    WRONG_PASSWORD: '❌ Contraseña actual incorrecta',
    PASSWORDS_DONT_MATCH: '❌ Las contraseñas no coinciden'
  }
};

export const useProfile = () => {
  const { dispatch } = useGlobalReducer();
  const [profile, setProfile] = useState(null);
  const [avatars, setAvatars] = useState([]);
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

  // Obtener perfil
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserProfile();
      
      if (response && response.data) {
        setProfile(response.data);
        return response.data;
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? 
        err.message : MESSAGES.ERROR.FETCH_PROFILE;
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Actualizar perfil
  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    
    try {
      const response = await apiService.updateUserProfile(profileData);
      
      if (response && response.success) {
        showNotification(MESSAGES.SUCCESS.PROFILE_UPDATED, 'success');
        
        // Actualizar estado local
        setProfile(prev => ({ ...prev, ...profileData }));
        
        // Actualizar usuario en el store global si es necesario
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: { ...profile, ...profileData }
        });
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al actualizar perfil');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_PROFILE;
      
      if (err instanceof ApiError) {
        errorMessage = `❌ ${err.message}`;
      }
      
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [profile, showNotification, dispatch]);

  // Actualizar contraseña
  const updatePassword = useCallback(async (passwordData) => {
    setLoading(true);
    
    try {
      // Validación frontend
      if (passwordData.new_password !== passwordData.confirm_password) {
        throw new Error(MESSAGES.ERROR.PASSWORDS_DONT_MATCH);
      }
      
      const response = await apiService.updatePassword(passwordData);
      
      if (response && response.success) {
        showNotification(MESSAGES.SUCCESS.PASSWORD_UPDATED, 'success');
        return { success: true };
      }
      
      throw new Error('Error al actualizar contraseña');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_PASSWORD;
      
      if (err instanceof ApiError) {
        if (err.message.includes('incorrecta')) {
          errorMessage = MESSAGES.ERROR.WRONG_PASSWORD;
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      } else if (err.message === MESSAGES.ERROR.PASSWORDS_DONT_MATCH) {
        errorMessage = err.message;
      }
      
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Obtener avatares predefinidos
  const fetchAvatars = useCallback(async () => {
    try {
      const response = await apiService.getPredefinedAvatars();
      
      if (response && response.avatars) {
        setAvatars(response.avatars);
        return response.avatars;
      }
      
      return [];
    } catch (err) {
      console.error('Error fetching avatars:', err);
      return [];
    }
  }, []);

  // Actualizar avatar
  const updateAvatar = useCallback(async (avatarData) => {
    setLoading(true);
    
    try {
      const response = await apiService.updateAvatar(avatarData);
      
      if (response && response.success) {
        showNotification(MESSAGES.SUCCESS.AVATAR_UPDATED, 'success');
        
        // Actualizar perfil local
        setProfile(prev => ({
          ...prev,
          avatar: response.avatar,
          avatar_type: response.avatar_type
        }));
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al actualizar avatar');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_AVATAR;
      
      if (err instanceof ApiError) {
        errorMessage = `❌ ${err.message}`;
      }
      
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  return {
    // Estado
    profile,
    avatars,
    loading,
    error,
    
    // Funciones
    fetchProfile,
    updateProfile,
    updatePassword,
    fetchAvatars,
    updateAvatar,
    
    // Utilidades
    clearError: () => setError(null),
    MESSAGES
  };
};