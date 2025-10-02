// apps/frontend/src/hooks/useWorkshops.js

import { useState, useCallback, useEffect } from 'react';
import { apiService, ApiError } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

const MESSAGES = {
  SUCCESS: {
    WORKSHOP_CREATED: '✅ Taller creado exitosamente',
    WORKSHOP_UPDATED: '✅ Taller actualizado correctamente',
    WORKSHOP_DELETED: '✅ Taller eliminado correctamente'
  },
  ERROR: {
    FETCH_WORKSHOPS: '❌ Error al cargar talleres',
    CREATE_WORKSHOP: '❌ Error al crear taller',
    UPDATE_WORKSHOP: '❌ Error al actualizar taller',
    DELETE_WORKSHOP: '❌ Error al eliminar taller',
    NO_PERMISSION: '🚫 No tienes permisos para realizar esta acción'
  }
};

export const useWorkshops = () => {
  const { dispatch } = useGlobalReducer();
  const [workshops, setWorkshops] = useState([]);
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

  // Obtener todos los talleres
  const fetchWorkshops = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllWorkshops(filters);
      
      if (response && response.workshops) {
        setWorkshops(response.workshops);
        return response;
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? 
        err.message : MESSAGES.ERROR.FETCH_WORKSHOPS;
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Crear taller (solo admin/coordinator)
  const createWorkshop = useCallback(async (workshopData) => {
    setLoading(true);
    try {
      const response = await apiService.createWorkshop(workshopData);
      
      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.WORKSHOP_CREATED, 'success');
        
        // Recargar talleres
        await fetchWorkshops();
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al crear taller');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.CREATE_WORKSHOP;
      
      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = MESSAGES.ERROR.NO_PERMISSION;
        } else if (err.status === 422) {
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
  }, [showNotification, fetchWorkshops]);

  // Actualizar taller
  const updateWorkshop = useCallback(async (workshopId, workshopData) => {
    try {
      const response = await apiService.updateWorkshop(workshopId, workshopData);
      
      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.WORKSHOP_UPDATED, 'success');
        
        // Actualizar en el estado local
        setWorkshops(prevWorkshops => 
          prevWorkshops.map(workshop => 
            workshop.id === workshopId ? { ...workshop, ...response.workshop } : workshop
          )
        );
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al actualizar taller');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_WORKSHOP;
      
      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = MESSAGES.ERROR.NO_PERMISSION;
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }
      
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }, [showNotification]);

  // Eliminar taller
  const deleteWorkshop = useCallback(async (workshopId) => {
    try {
      const response = await apiService.deleteWorkshop(workshopId);
      
      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.WORKSHOP_DELETED, 'success');
        
        // Eliminar del estado local
        setWorkshops(prevWorkshops => 
          prevWorkshops.filter(workshop => workshop.id !== workshopId)
        );
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al eliminar taller');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.DELETE_WORKSHOP;
      
      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = MESSAGES.ERROR.NO_PERMISSION;
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }
      
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }, [showNotification]);

  return {
    // Estado
    workshops,
    loading,
    error,
    
    // Funciones
    fetchWorkshops,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    
    // Utilidades
    clearError: () => setError(null),
    MESSAGES
  };
};