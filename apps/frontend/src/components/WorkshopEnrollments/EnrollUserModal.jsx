import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, User } from 'lucide-react';
import { useWorkshopUsers } from '../../hooks/useWorkshopUsers';
import { apiService } from '../../services/api';
import './EnrollUserModal.css';

const EnrollUserModal = ({ workshopId, workshopName, onClose, onSuccess }) => {
  const { enrollUser, loading } = useWorkshopUsers();

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Cargar usuarios disponibles (clientes no inscritos)
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        // Obtener todos los usuarios con rol CLIENT
        const response = await apiService.getAllUsers({ role: 'client' });
        
        if (response?.users) {
          setUsers(response.users);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Filtrar usuarios por búsqueda
  const filteredUsers = users.filter(user => {
    const fullName = `${user.name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query);
  });

  const handleEnroll = async () => {
    if (!selectedUser) return;

    try {
      await enrollUser(selectedUser.id, workshopId);
      onSuccess();
    } catch (error) {
      console.error('Error enrolling user:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content enroll-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Inscribir Usuario</h2>
            {workshopName && (
              <p className="workshop-subtitle">En: {workshopName}</p>
            )}
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="enroll-content">
          {/* Búsqueda */}
          <div className="search-section">
            <div className="search-input">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <p className="search-hint">
              Mostrando {filteredUsers.length} usuario(s)
            </p>
          </div>

          {/* Lista de usuarios */}
          <div className="users-list">
            {loadingUsers ? (
              <div className="loading-users">
                <div className="loading-spinner-small"></div>
                <p>Cargando usuarios...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="no-users">
                <User size={48} />
                <p>No se encontraron usuarios</p>
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h4>{user.name} {user.last_name}</h4>
                    <p>{user.email}</p>
                  </div>
                  {selectedUser?.id === user.id && (
                    <div className="selected-check">✓</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-submit"
            onClick={handleEnroll}
            disabled={loading || !selectedUser}
          >
            {loading ? 'Inscribiendo...' : 'Inscribir Usuario'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnrollUserModal;