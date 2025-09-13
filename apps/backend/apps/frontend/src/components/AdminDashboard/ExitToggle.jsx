import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExitToggle.css';

const ExitToggle = () => {
  const [isOpening, setIsOpening] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsOpening(true);
    
    // Simular logout delay para mostrar la animación
    setTimeout(() => {
      // Aquí irían las acciones de logout (limpiar tokens, etc.)
      localStorage.removeItem('authToken'); // Ejemplo
      sessionStorage.clear(); // Ejemplo
      
      // Redirigir a /aossadmin
      navigate('/aossadmin');
    }, 1200); // 800ms para mostrar la animación completa
  };

  return (
    <div className="exit-toggle-container">
      <button 
        className={`exit-toggle ${isOpening ? 'opening' : ''}`}
        onClick={handleLogout}
        disabled={isOpening}
        aria-label="Cerrar sesión"
      >
        {/* Marco de la puerta */}
        <div className="door-frame">
          {/* Puerta */}
          <div className="door">
            {/* Panel de la puerta */}
            <div className="door-panel">
              {/* Ventana de la puerta */}
              <div className="door-window"></div>
              {/* Manija */}
              <div className="door-handle"></div>
            </div>
          </div>
          
          {/* Icono EXIT dentro del marco */}
          <div className="exit-sign">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        {/* Texto de estado */}
        <span className="exit-text">
          {isOpening ? 'Saliendo...' : 'Salir'}
        </span>
        
        {/* Efecto de luz cuando se abre */}
        <div className="light-beam"></div>
      </button>
    </div>
  );
};

export default ExitToggle;