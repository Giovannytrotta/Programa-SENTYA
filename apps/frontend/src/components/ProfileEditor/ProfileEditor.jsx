// apps/frontend/src/components/ProfileEditor/ProfileEditor.jsx

import React, { useState, useEffect } from 'react';
import { User, Lock, Image, Mail, Phone, MapPin, Calendar, X } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import AvatarSelector from './AvatarSelector';
import PasswordForm from './PasswordForm';
import "./ProfileEditor.css"


const ProfileEditor = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { 
    profile, 
    loading, 
    fetchProfile, 
    updateProfile,
    updatePassword,
    fetchAvatars,
    avatars 
  } = useProfile();

  const [activeTab, setActiveTab] = useState('info'); // 'info', 'avatar', 'password'
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    phone: '',
    address: ''
  });

  // Cargar perfil al abrir
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      fetchAvatars();
    }
  }, [isOpen, fetchProfile, fetchAvatars]);

  // Actualizar formulario cuando cargue el perfil
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="profile-editor-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="profile-editor-modal">
        <div className="profile-editor-header">
          <h2 className="profile-editor-title">
            <User size={24} />
            Editar Perfil
          </h2>
          <button 
            className="profile-editor-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="profile-editor-tabs">
          <button
            className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <User size={18} />
            Información
          </button>
          <button
            className={`profile-tab ${activeTab === 'avatar' ? 'active' : ''}`}
            onClick={() => setActiveTab('avatar')}
          >
            <Image size={18} />
            Avatar
          </button>
          <button
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={18} />
            Contraseña
          </button>
        </div>

        <div className="profile-editor-content">
          {/* TAB: Información Personal */}
          {activeTab === 'info' && (
            <form onSubmit={handleSubmitInfo} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    <User size={16} />
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">
                    <User size={16} />
                    Apellidos
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Tus apellidos"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <Phone size={16} />
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+34 600 000 000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">
                  <MapPin size={16} />
                  Dirección
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Tu dirección"
                  rows="3"
                />
              </div>

              <button 
                type="submit" 
                className="btn-save"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          )}

          {/* TAB: Avatar */}
          {activeTab === 'avatar' && (
            <AvatarSelector 
              currentAvatar={profile?.avatar}
              currentType={profile?.avatar_type}
              avatars={avatars}
              userName={`${user?.name} ${user?.last_name}`}
              userEmail={user?.email}
            />
          )}

          {/* TAB: Contraseña */}
          {activeTab === 'password' && (
            <PasswordForm 
              onSubmit={updatePassword}
              loading={loading}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileEditor;