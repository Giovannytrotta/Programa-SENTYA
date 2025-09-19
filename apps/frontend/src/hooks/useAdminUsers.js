// hooks/useAdminUsers.js
import { useState, useCallback, useEffect } from 'react';
import { apiService, ApiError } from '../services/api';
import useGlobalReducer from '../store/useGlobalReducer';
import { ACTION_TYPES } from '../store';

const MESSAGES = {
  SUCCESS: {
    USER_CREATED: '✅ Usuario creado exitosamente',
    USER_UPDATED: '✅ Usuario actualizado correctamente',
    USER_DELETED: '✅ Usuario eliminado correctamente',
    ROLE_UPDATED: '✅ Rol actualizado correctamente',
    STATUS_UPDATED: '✅ Estado del usuario actualizado'
  },
  ERROR: {
    FETCH_USERS: '❌ Error al cargar usuarios',
    CREATE_USER: '❌ Error al crear usuario',
    UPDATE_USER: '❌ Error al actualizar usuario',
    DELETE_USER: '❌ Error al eliminar usuario',
    CONNECTION: '🌐 Error de conexión con el servidor'
  }
};

export const useAdminUsers = () => {
  const { dispatch } = useGlobalReducer();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    coordinadores: 0,
    profesores: 0,
    trabajadoresCSS: 0,
    usuarios: 0
  });

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

  // Calcular estadísticas
  const calculateStats = useCallback((usersList) => {
    const newStats = {
      totalUsers: usersList.length,
      activeUsers: usersList.filter(u => u.is_active).length,
      admins: usersList.filter(u => u.rol === 'administrator').length,
      coordinadores: usersList.filter(u => u.rol === 'coordinator').length,
      profesores: usersList.filter(u => u.rol === 'professional').length,
      trabajadoresCSS: usersList.filter(u => u.rol === 'css_technician').length,
      usuarios: usersList.filter(u => u.rol === 'client').length
    };
    setStats(newStats);
  }, []);

  // Obtener todos los usuarios
  const fetchUsers = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllUsers(filters);
      
      if (response && response.users) {
        setUsers(response.users);
        setFilteredUsers(response.users);
        calculateStats(response.users);
        return response;
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? 
        err.message : MESSAGES.ERROR.FETCH_USERS;
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification, calculateStats]);

  // Obtener roles disponibles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiService.getRoles();
      if (response && response.roles) {
        setRoles(response.roles);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  }, []);

  // Crear usuario
  const createUser = useCallback(async (userData) => {
    setLoading(true);
    try {
      const response = await apiService.createUser(userData);
      
      if (response && response.ok) {
        showNotification(MESSAGES.SUCCESS.USER_CREATED, 'success');
        
        // Recargar usuarios
        await fetchUsers();
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al crear usuario');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.CREATE_USER;
      
      if (err instanceof ApiError) {
        // Manejar errores específicos del backend
        if (err.status === 422) {
          // Errores de validación
          if (err.data && err.data.error) {
            errorMessage = `❌ ${err.data.error}`;
          } else if (err.message.includes('email')) {
            errorMessage = '❌ El email ya está registrado';
          } else if (err.message.includes('dni')) {
            errorMessage = '❌ El DNI ya está registrado';
          } else {
            errorMessage = `❌ ${err.message}`;
          }
        } else if (err.status === 409) {
          errorMessage = '❌ Ya existe un usuario con esos datos';
        } else if (err.status === 403) {
          errorMessage = '🚫 No tienes permisos para crear usuarios';
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }
      
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showNotification, fetchUsers]);

  // Actualizar usuario
  const updateUser = useCallback(async (userId, userData) => {
    try {
      const response = await apiService.updateUser(userId, userData);
      
      if (response && response.message) {
        showNotification(MESSAGES.SUCCESS.USER_UPDATED, 'success');
        
    // Actualizar usuario en el estado local con TODOS los campos
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, ...userData } : user
          )
        );
        
        setFilteredUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, ...userData } : user
          )
        );
        
        // Recalcular stats 
        const updatedUsers = users.map(user => 
          user.id === userId ? { ...user, ...userData } : user
        );
        calculateStats(updatedUsers);
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al actualizar usuario');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_USER;
      
      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = '🚫 No tienes permisos para realizar esta acción';
        } else if (err.status === 404) {
          errorMessage = '❌ Usuario no encontrado';
        } else if (err.status === 422) {
          errorMessage = '❌ Datos inválidos';
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }
      
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }, [users, showNotification, calculateStats]);

  const updateUserRole = useCallback(async (userId, newRole) => {
  try {
    const response = await apiService.updateUserRole(userId, newRole);
    if (response && response.message) {
      showNotification('✅ Rol actualizado exitosamente', 'success');
      
      // Actualizar estado local solo el rol
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, rol: newRole } : user
        )
      );
      setFilteredUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, rol: newRole } : user
        )
      );
      
      // Recalcular stats
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, rol: newRole } : user
      );
      calculateStats(updatedUsers);
      return { success: true };
    }
  } catch (err) {
    showNotification('❌ Error al cambiar rol', 'error');
    return { success: false };
  }
}, [showNotification, users, calculateStats]);

  // Actualizar estado de usuario
  const updateUserStatus = useCallback(async (userId, isActive) => {
    try {
      const response = await apiService.updateUserStatus(userId, isActive);
      
      if (response && response.message) {
        const message = isActive ? 
          '✅ Usuario activado correctamente' : 
          '✅ Usuario desactivado correctamente';
        
        showNotification(message, 'success');
        
        // Actualizar usuario en el estado local
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, is_active: isActive } : user
          )
        );
        
        setFilteredUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, is_active: isActive } : user
          )
        );
        
        // Recalcular stats
        const updatedUsers = users.map(user => 
          user.id === userId ? { ...user, is_active: isActive } : user
        );
        calculateStats(updatedUsers);
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al actualizar estado');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.UPDATE_USER;
      
      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = '🚫 No tienes permisos para cambiar el estado de usuarios';
        } else if (err.status === 404) {
          errorMessage = '❌ Usuario no encontrado';
        } else if (err.message.includes('propio')) {
          errorMessage = '⚠️ No puedes cambiar tu propio estado';
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }
      
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }, [users, showNotification, calculateStats]);

  // Eliminar usuario
  const deleteUser = useCallback(async (userId, force = false) => {
    try {
      const response = await apiService.deleteUser(userId, force);
      
      if (response && (response.message || response.user_id)) {
        const message = force ? 
          MESSAGES.SUCCESS.USER_DELETED : 
          '✅ Usuario desactivado correctamente';
        
        showNotification(message, 'success');
        
        if (force) {
          // Eliminar completamente del estado
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
          setFilteredUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        } else {
          // Solo desactivar
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === userId ? { ...user, is_active: false } : user
            )
          );
          setFilteredUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === userId ? { ...user, is_active: false } : user
            )
          );
        }
        
        // Recalcular stats
        const updatedUsers = force ? 
          users.filter(user => user.id !== userId) :
          users.map(user => 
            user.id === userId ? { ...user, is_active: false } : user
          );
        calculateStats(updatedUsers);
        
        return { success: true, data: response };
      }
      
      throw new Error('Error al eliminar usuario');
    } catch (err) {
      let errorMessage = MESSAGES.ERROR.DELETE_USER;
      
      if (err instanceof ApiError) {
        if (err.status === 403) {
          errorMessage = '🚫 No tienes permisos para eliminar usuarios';
        } else if (err.status === 404) {
          errorMessage = '❌ Usuario no encontrado';
        } else if (err.message.includes('propio') || err.message.includes('mismo')) {
          errorMessage = '⚠️ No puedes eliminar tu propia cuenta';
        } else if (err.message.includes('último') || err.message.includes('admin')) {
          errorMessage = '⚠️ No se puede eliminar el último administrador';
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }
      
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }, [users, showNotification, calculateStats]);

  // Filtrar usuarios localmente
  const filterUsers = useCallback((searchQuery, roleFilter, statusFilter) => {
    let filtered = [...users];
    
    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => {
        return (
          user.name?.toLowerCase().includes(query) ||
          user.last_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.dni?.toLowerCase().includes(query) ||
          user.phone?.includes(query)
        );
      });
    }
    
    // Filtro de rol
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(user => user.rol === roleFilter);
    }
    
    // Filtro de estado
    if (statusFilter && statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.is_active === isActive);
    }
    
    setFilteredUsers(filtered);
  }, [users]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  return {
    // Estado
    users,
    filteredUsers,
    roles,
    loading,
    error,
    stats,
    
    // Funciones
    fetchUsers,
    createUser,
    updateUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    filterUsers,
    
    // Utilidades
    clearError: () => setError(null),
    MESSAGES
  };
};