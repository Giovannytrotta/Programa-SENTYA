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
        const response = await apiService.getMyEnrolledSessions();
        const sessions = response.sessions || [];
        
        const uniqueWorkshops = {};
        sessions.forEach(session => {
          if (!uniqueWorkshops[session.workshop_id]) {
            uniqueWorkshops[session.workshop_id] = {
              id: session.workshop_id,
              name: session.workshop_name,
              description: '',
              status: 'active',
              css_name: '',
              location: session.location || '',
              current_capacity: 0,
              max_capacity: 0,
              start_date: session.date,
              start_time: session.start_time,
              end_time: session.end_time,
              thematic_area_name: ''
            };
          }
        });
        
        const myWorkshops = Object.values(uniqueWorkshops);
        setWorkshops(myWorkshops);
        return myWorkshops;
      }
      
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