// apps/frontend/src/components/ProfileEditor/AvatarSelector.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Check, Upload, X, Image } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import './AvatarSelector.css';

// 🎨 PALETA DE COLORES PARA INICIALES
const INITIAL_COLORS = [
  { name: 'Naranja', bg: 'E9531A', text: 'FFFFFF' },
  { name: 'Rojo', bg: 'dc2626', text: 'FFFFFF' },
  { name: 'Azul', bg: '3b82f6', text: 'FFFFFF' },
  { name: 'Verde', bg: '10b981', text: 'FFFFFF' },
  { name: 'Púrpura', bg: '8b5cf6', text: 'FFFFFF' },
  { name: 'Rosa', bg: 'ec4899', text: 'FFFFFF' },
  { name: 'Amarillo', bg: 'f59e0b', text: '1f2937' },
  { name: 'Turquesa', bg: '06b6d4', text: 'FFFFFF' },
  { name: 'Índigo', bg: '6366f1', text: 'FFFFFF' },
  { name: 'Esmeralda', bg: '059669', text: 'FFFFFF' },
  { name: 'Ámbar', bg: 'd97706', text: 'FFFFFF' },
  { name: 'Cyan', bg: '0891b2', text: 'FFFFFF' }
];

const AvatarSelector = ({ currentAvatar, currentType, userName, userEmail }) => {
  const { updateAvatar, loading } = useProfile();
  const { user } = useAuth();
  
  const [avatarType, setAvatarType] = useState(currentType || 'initials');
  const [selectedColor, setSelectedColor] = useState('E9531A');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  
  const fileInputRef = useRef(null);

  // Cargar configuración actual
  useEffect(() => {
    if (currentType === 'initials' && currentAvatar) {
      const match = currentAvatar.match(/background=([A-Fa-f0-9]{6})/);
      if (match) setSelectedColor(match[1]);
    }
    if (currentType === 'upload' && currentAvatar) {
      setPreviewUrl(currentAvatar);
    }
    setAvatarType(currentType || 'initials');
  }, [currentAvatar, currentType]);

  // Actualizar preview cuando cambia el color
  useEffect(() => {
    if (avatarType === 'initials') {
      updatePreview();
    }
  }, [selectedColor, avatarType]);

  // Generar iniciales
  const getInitials = (name) => {
    if (!name) return 'US';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generar URL del avatar de iniciales
  const generateAvatarUrl = (color) => {
    const initials = getInitials(userName);
    const selectedColorObj = INITIAL_COLORS.find(c => c.bg === color) || INITIAL_COLORS[0];
    return `https://ui-avatars.com/api/?name=${initials}&size=200&background=${selectedColorObj.bg}&color=${selectedColorObj.text}&bold=true&font-size=0.4`;
  };

  const updatePreview = () => {
    const url = generateAvatarUrl(selectedColor);
    setPreviewUrl(url);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setAvatarType('initials');
    setUploadedFile(null);
    setUploadError('');
  };

  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadError('');

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Solo se permiten archivos JPG, PNG o WEBP');
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('La imagen no puede superar los 5MB');
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
      setUploadedFile(file);
      setAvatarType('upload');
    };
    reader.readAsDataURL(file);
  };

  // Abrir selector de archivos
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Limpiar archivo subido
  const handleClearUpload = () => {
    setUploadedFile(null);
    setPreviewUrl(generateAvatarUrl(selectedColor));
    setAvatarType('initials');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      if (avatarType === 'upload' && uploadedFile) {
        // Subir imagen
        const formData = new FormData();
        formData.append('avatar', uploadedFile);

        await updateAvatar(formData, 'upload');
      } else {
        // Guardar avatar de iniciales
        const avatarUrl = generateAvatarUrl(selectedColor);
        await updateAvatar({
          avatar_type: 'initials',
          avatar_url: avatarUrl,
          avatar_color: selectedColor,
          avatar_style: null,
          avatar_seed: null
        });
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  const initials = getInitials(userName);

  return (
    <div className="avatar-selector">
      {/* Preview Grande */}
      <div className="avatar-preview-section">
        <div className="preview-header">
          <h3>Tu Avatar</h3>
        </div>
        
        <div className="avatar-preview-large">
          {previewUrl && (
            <img 
              src={previewUrl} 
              alt="Avatar Preview"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${initials}&size=200&background=E9531A&color=FFFFFF`;
              }}
            />
          )}
          {avatarType === 'upload' && uploadedFile && (
            <button 
              className="clear-upload-btn"
              onClick={handleClearUpload}
              title="Eliminar imagen"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <p className="preview-info">
          {avatarType === 'upload' 
            ? '📷 Foto personalizada' 
            : `${initials} • ${INITIAL_COLORS.find(c => c.bg === selectedColor)?.name || 'Personalizado'}`
          }
        </p>
      </div>

      {/* Selector de Tipo */}
      <div className="avatar-type-tabs">
        <button
          className={`type-tab ${avatarType === 'initials' ? 'active' : ''}`}
          onClick={() => {
            setAvatarType('initials');
            setUploadedFile(null);
            updatePreview();
          }}
        >
          <span className="tab-icon">{initials}</span>
          Iniciales
        </button>
        <button
          className={`type-tab ${avatarType === 'upload' ? 'active' : ''}`}
          onClick={() => setAvatarType('upload')}
        >
          <Image size={20} />
          Subir Foto
        </button>
      </div>

      {/* OPCIÓN: Iniciales */}
      {avatarType === 'initials' && (
        <>
          <div className="color-selector-header">
            <h4>Elige tu color</h4>
            <p>Selecciona el color que mejor te represente</p>
          </div>

          <div className="color-options">
            {INITIAL_COLORS.map(color => {
              const isSelected = selectedColor === color.bg;
              
              return (
                <div
                  key={color.bg}
                  className={`color-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleColorSelect(color.bg)}
                  style={{
                    backgroundColor: `#${color.bg}`,
                    color: `#${color.text}`
                  }}
                >
                  <span className="color-initials">{initials}</span>
                  <span className="color-name">{color.name}</span>
                  {isSelected && (
                    <div className="selected-badge">
                      <Check size={20} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* OPCIÓN: Subir Foto */}
      {avatarType === 'upload' && (
        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {!uploadedFile ? (
            <div className="upload-area" onClick={handleUploadClick}>
              <Upload size={48} className="upload-icon" />
              <h4>Sube tu foto</h4>
              <p>JPG, PNG o WEBP (máx. 5MB)</p>
              <button type="button" className="btn-upload-trigger">
                Seleccionar archivo
              </button>
            </div>
          ) : (
            <div className="upload-success">
              <Check size={32} className="success-icon" />
              <p className="success-text">Imagen cargada correctamente</p>
              <p className="file-name">{uploadedFile.name}</p>
              <button 
                type="button" 
                className="btn-change-file"
                onClick={handleUploadClick}
              >
                Cambiar imagen
              </button>
            </div>
          )}

          {uploadError && (
            <div className="upload-error">
              <X size={16} />
              {uploadError}
            </div>
          )}
        </div>
      )}

      {/* Botón Guardar */}
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