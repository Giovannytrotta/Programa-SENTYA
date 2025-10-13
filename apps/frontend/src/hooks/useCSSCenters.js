import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

export const useCSSCenters = () => {
  const { dispatch } = useGlobalReducer();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const showNotification = useCallback((message, type) => {
    dispatch({
      type: ACTION_TYPES.ADD_NOTIFICATION,
      payload: { id: Date.now(), message, type, timestamp: new Date() }
    });
  }, [dispatch]);

  const fetchCenters = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getActiveCSSCenters();
      
      if (response && response.css_centers) {
        setCenters(response.css_centers);
        return response.css_centers;
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = '❌ Error al cargar centros';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  return {
    centers,
    loading,
    error,
    fetchCenters,
    clearError: () => setError(null)
  };
};