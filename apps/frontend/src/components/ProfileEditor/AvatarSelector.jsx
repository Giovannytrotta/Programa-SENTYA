// apps/frontend/src/components/ProfileEditor/AvatarSelector.jsx

import React, { useState, useEffect } from 'react';
import { Check, Sparkles, RefreshCw } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import './AvatarSelector.css';

// 🎨 ESTILOS DE DICEBEAR (avatares generados por IA)
const DICEBEAR_STYLES = [
  // ========== PERSONAS REALISTAS ==========
  { id: 'adventurer', name: 'Adventurer', category: 'realistic' },
  { id: 'adventurer-neutral', name: 'Adventurer Neutral', category: 'realistic' },
  { id: 'lorelei', name: 'Lorelei', category: 'realistic' },
  { id: 'lorelei-neutral', name: 'Lorelei Neutral', category: 'realistic' },
  { id: 'micah', name: 'Micah', category: 'realistic' },
  { id: 'personas', name: 'Personas', category: 'realistic' },
  { id: 'notionists', name: 'Notionists', category: 'realistic' },
  { id: 'notionists-neutral', name: 'Notionists Neutral', category: 'realistic' },
  
  // ========== CARTOON / DIBUJOS ANIMADOS ==========
  { id: 'avataaars', name: 'Avataaars', category: 'cartoon' },
  { id: 'avataaars-neutral', name: 'Avataaars Neutral', category: 'cartoon' },
  { id: 'big-ears', name: 'Big Ears', category: 'cartoon' },
  { id: 'big-ears-neutral', name: 'Big Ears Neutral', category: 'cartoon' },
  { id: 'big-smile', name: 'Big Smile', category: 'cartoon' },
  { id: 'croodles', name: 'Croodles', category: 'cartoon' },
  { id: 'croodles-neutral', name: 'Croodles Neutral', category: 'cartoon' },
  { id: 'miniavs', name: 'Miniavs', category: 'cartoon' },
  { id: 'open-peeps', name: 'Open Peeps', category: 'cartoon' },
  
  // ========== DIVERTIDOS / FUN ==========
  { id: 'bottts', name: 'Bottts (Robots)', category: 'fun' },
  { id: 'bottts-neutral', name: 'Bottts Neutral', category: 'fun' },
  { id: 'fun-emoji', name: 'Fun Emoji', category: 'fun' },
  { id: 'thumbs', name: 'Thumbs', category: 'fun' },
  
  // ========== RETRO / PIXEL ART ==========
  { id: 'pixel-art', name: 'Pixel Art', category: 'retro' },
  { id: 'pixel-art-neutral', name: 'Pixel Art Neutral', category: 'retro' },
  
  // ========== ABSTRACTOS / GEOMÉTRICOS ==========
  { id: 'shapes', name: 'Shapes', category: 'abstract' },
  { id: 'rings', name: 'Rings', category: 'abstract' },
  { id: 'identicon', name: 'Identicon', category: 'abstract' },
  { id: 'icons', name: 'Icons', category: 'abstract' }
];

// 🎨 PALETA DE COLORES PARA INICIALES
const INITIAL_COLORS = [
  { name: 'Naranja', bg: 'E9531A', text: 'FFFFFF' },
  { name: 'Rojo', bg: 'dc2626', text: 'FFFFFF' },
  { name: 'Azul', bg: '3b82f6', text: 'FFFFFF' },
  { name: 'Verde', bg: '10b981', text: 'FFFFFF' },
  { name: 'Púrpura', bg: '8b5cf6', text: 'FFFFFF' },
  { name: 'Rosa', bg: 'ec4899', text: 'FFFFFF' },
  { name: 'Amarillo', bg: 'f59e0b', text: '000000' },
  { name: 'Turquesa', bg: '06b6d4', text: 'FFFFFF' }
];

const AvatarSelector = ({ currentAvatar, currentType, userName, userEmail }) => {
  const { updateAvatar, loading } = useProfile();
  const { user } = useAuth();
  
  const [selectedType, setSelectedType] = useState(currentType || 'dicebear');
  const [selectedStyle, setSelectedStyle] = useState('adventurer');
  const [selectedColor, setSelectedColor] = useState('E9531A');
  const [seed, setSeed] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Generar seed único basado en el usuario
  useEffect(() => {
    const userSeed = userEmail?.split('@')[0] || userName?.replace(/\s+/g, '') || 'user';
    setSeed(userSeed);
  }, [userEmail, userName]);

  // Actualizar preview cuando cambian los valores
  useEffect(() => {
    updatePreview();
  }, [selectedType, selectedStyle, selectedColor, seed]);

  // Cargar configuración actual del usuario
  useEffect(() => {
    if (currentAvatar && currentType) {
      if (currentType === 'dicebear') {
        // Extraer style del URL de DiceBear
        const match = currentAvatar.match(/\/api\/(\w+)\//);
        if (match) setSelectedStyle(match[1]);
      } else if (currentType === 'initials') {
        // Extraer color del URL de UI Avatars
        const match = currentAvatar.match(/background=([A-Fa-f0-9]{6})/);
        if (match) setSelectedColor(match[1]);
      }
      setSelectedType(currentType);
    }
  }, [currentAvatar, currentType]);

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

  // Generar URL del avatar según el tipo
  const generateAvatarUrl = (type, style, color) => {
    switch (type) {
      case 'dicebear':
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&size=200`;
      
      case 'initials':
        const initials = getInitials(userName);
        const selectedColorObj = INITIAL_COLORS.find(c => c.bg === color) || INITIAL_COLORS[0];
        return `https://ui-avatars.com/api/?name=${initials}&size=200&background=${selectedColorObj.bg}&color=${selectedColorObj.text}&bold=true&font-size=0.4`;
      
      default:
        return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&size=200`;
    }
  };

  const updatePreview = () => {
    const url = generateAvatarUrl(selectedType, selectedStyle, selectedColor);
    setPreviewUrl(url);
  };

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setSelectedType('dicebear');
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setSelectedType('initials');
  };

  const handleRandomize = () => {
    setSeed(Math.random().toString(36).substring(7));
  };

  const handleSave = async () => {
    try {
      const avatarUrl = generateAvatarUrl(selectedType, selectedStyle, selectedColor);
      
      await updateAvatar({
        avatar_type: selectedType,
        avatar_url: avatarUrl,
        // Metadata adicional para regenerar
        avatar_style: selectedStyle,
        avatar_color: selectedColor,
        avatar_seed: seed
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  // Filtrar estilos por categoría
  const filteredStyles = categoryFilter === 'all' 
    ? DICEBEAR_STYLES 
    : DICEBEAR_STYLES.filter(s => s.category === categoryFilter);

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'realistic', name: 'Realista' },
    { id: 'cartoon', name: 'Cartoon' },
    { id: 'fun', name: 'Divertido' },
    { id: 'abstract', name: 'Abstracto' },
    { id: 'retro', name: 'Retro' }
  ];

  return (
    <div className="avatar-selector">
      {/* Preview Grande */}
      <div className="avatar-preview-section">
        <div className="preview-header">
          <h3>Vista Previa</h3>
          <button 
            className="btn-randomize"
            onClick={handleRandomize}
            title="Generar variación aleatoria"
          >
            <RefreshCw size={16} />
            Aleatorio
          </button>
        </div>
        
        <div className="avatar-preview-large">
          {previewUrl && (
            <img 
              src={previewUrl} 
              alt="Avatar Preview"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${getInitials(userName)}&size=200&background=E9531A&color=FFFFFF`;
              }}
            />
          )}
        </div>

        <p className="preview-info">
          {selectedType === 'dicebear' && `Estilo: ${DICEBEAR_STYLES.find(s => s.id === selectedStyle)?.name || selectedStyle}`}
          {selectedType === 'initials' && `Color: ${INITIAL_COLORS.find(c => c.bg === selectedColor)?.name || 'Personalizado'}`}
        </p>
      </div>

      {/* Selector de Tipo */}
      <div className="avatar-type-selector">
        <button
          className={`type-btn ${selectedType === 'dicebear' ? 'active' : ''}`}
          onClick={() => setSelectedType('dicebear')}
        >
          <Sparkles size={18} />
          Avatares Generados
        </button>
        <button
          className={`type-btn ${selectedType === 'initials' ? 'active' : ''}`}
          onClick={() => setSelectedType('initials')}
        >
          <span className="initials-icon">{getInitials(userName)}</span>
          Iniciales
        </button>
      </div>

      {/* Opciones: DiceBear Styles */}
      {selectedType === 'dicebear' && (
        <>
          {/* Filtro de categorías */}
          <div className="category-filter">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-btn ${categoryFilter === cat.id ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="avatar-options">
            {filteredStyles.map(style => {
              const styleUrl = `https://api.dicebear.com/7.x/${style.id}/svg?seed=${seed}&size=100`;
              const isSelected = selectedType === 'dicebear' && selectedStyle === style.id;
              
              return (
                <div
                  key={style.id}
                  className={`avatar-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleStyleSelect(style.id)}
                >
                  <div className="avatar-option-preview">
                    <img 
                      src={styleUrl} 
                      alt={style.name}
                      loading="lazy"
                    />
                  </div>
                  <span className="avatar-option-name">{style.name}</span>
                  {isSelected && (
                    <div className="selected-badge">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Opciones: Colores para Iniciales */}
      {selectedType === 'initials' && (
        <div className="color-options">
          {INITIAL_COLORS.map(color => {
            const isSelected = selectedType === 'initials' && selectedColor === color.bg;
            const initials = getInitials(userName);
            
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
                    <Check size={16} />
                  </div>
                )}
              </div>
            );
          })}
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