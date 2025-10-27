// apps/frontend/src/components/ProfileEditor/AvatarSelector.jsx

import React, { useState } from 'react';
import { Check, User } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import "./AvatarSelector.css"


const AvatarSelector = ({ currentAvatar, currentType, avatars, userName, userEmail }) => {
  const { updateAvatar, loading } = useProfile();
  const [selectedType, setSelectedType] = useState(currentType || 'initials');
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  // Generar iniciales
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generar Gravatar URL
  const getGravatarUrl = (email) => {
    // Implementar hash MD5 del email para Gravatar
    return `https://www.gravatar.com/avatar/${email}?d=identicon&s=200`;
  };

  const handleSelectAvatar = async (avatarId, type) => {
    setSelectedAvatar(avatarId);
    setSelectedType(type);
  };

  const handleSave = async () => {
    try {
      await updateAvatar({
        avatar_type: selectedType,
        avatar_id: selectedAvatar
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  return (
    <div className="avatar-selector">
      {/* Preview */}
      <div className="avatar-preview-section">
        <h3>Vista Previa</h3>
        <div className="avatar-preview-large">
          {selectedType === 'initials' && (
            <div className="avatar-initials-large">
              {getInitials(userName)}
            </div>
          )}
          {selectedType === 'predefined' && selectedAvatar && (
            <img src={selectedAvatar} alt="Avatar" />
          )}
          {selectedType === 'gravatar' && (
            <img src={getGravatarUrl(userEmail)} alt="Gravatar" />
          )}
        </div>
      </div>

      {/* Opciones */}
      <div className="avatar-options">
        {/* Iniciales */}
        <div 
          className={`avatar-option ${selectedType === 'initials' ? 'selected' : ''}`}
          onClick={() => handleSelectAvatar(null, 'initials')}
        >
          <div className="avatar-option-preview avatar-initials">
            {getInitials(userName)}
          </div>
          <span>Iniciales</span>
          {selectedType === 'initials' && <Check size={16} />}
        </div>

        {/* Gravatar */}
        <div 
          className={`avatar-option ${selectedType === 'gravatar' ? 'selected' : ''}`}
          onClick={() => handleSelectAvatar(userEmail, 'gravatar')}
        >
          <div className="avatar-option-preview">
            <img src={getGravatarUrl(userEmail)} alt="Gravatar" />
          </div>
          <span>Gravatar</span>
          {selectedType === 'gravatar' && <Check size={16} />}
        </div>

        {/* Avatares Predefinidos */}
        {avatars.map(avatar => (
          <div 
            key={avatar.id}
            className={`avatar-option ${selectedType === 'predefined' && selectedAvatar === avatar.url ? 'selected' : ''}`}
            onClick={() => handleSelectAvatar(avatar.url, 'predefined')}
          >
            <div className="avatar-option-preview">
              <img src={avatar.url} alt={`Avatar ${avatar.id}`} />
            </div>
            {selectedType === 'predefined' && selectedAvatar === avatar.url && <Check size={16} />}
          </div>
        ))}
      </div>

      <button 
        className="btn-save"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Guardando...' : 'Guardar Avatar'}
      </button>
    </div>
  );
};

export default AvatarSelector;