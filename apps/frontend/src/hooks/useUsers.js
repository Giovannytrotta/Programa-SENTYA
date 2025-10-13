import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

export const useUsers = () => {
  const { dispatch } = useGlobalReducer();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    with_2fa: 0
  });

  const showNotification = useCallback((message, type) => {
    dispatch({
      type: ACTION_TYPES.ADD_NOTIFICATION,
      payload: { id: Date.now(), message, type, timestamp: new Date() }
    });
  }, [dispatch]);

  const fetchUsers = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllUsers(filters);
      
      if (response && response.users) {
        setUsers(response.users);
        setStats(response.stats || {});
        return response;
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = '❌ Error al cargar usuarios';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const fetchUsersByCSS = useCallback(async (cssId) => {
    return fetchUsers({ css: cssId });
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    stats,
    fetchUsers,
    fetchUsersByCSS,
    clearError: () => setError(null)
  };
};