import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

export const useMyWorkshops = () => {
  const { dispatch } = useGlobalReducer();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const showNotification = useCallback((message, type) => {
    dispatch({
      type: ACTION_TYPES.ADD_NOTIFICATION,
      payload: { id: Date.now(), message, type, timestamp: new Date() }
    });
  }, [dispatch]);

  const fetchMyWorkshops = useCallback(async (role, userId) => {
    setLoading(true);
    setError(null);

    try {
      if (role === 'professional') {
        const response = await apiService.getAllWorkshops();
        const myWorkshops = response.workshops.filter(w => w.professional_id === userId);
        setWorkshops(myWorkshops);
        return myWorkshops;
      }


      if (role === 'client') {
        // ✅ USAR EL NUEVO ENDPOINT
        const response = await apiService.getMyEnrolledWorkshops();
        const myWorkshops = response.workshops || [];

        setWorkshops(myWorkshops);
        return myWorkshops;
      }

      // Default: Sin talleres
      setWorkshops([]);
      return [];

    } catch (err) {
      const errorMessage = '❌ Error al cargar talleres';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  return {
    workshops,
    loading,
    error,
    fetchMyWorkshops,
    clearError: () => setError(null)
  };
};