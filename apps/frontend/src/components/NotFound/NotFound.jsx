import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found-overlay">
      <div className="not-found-container">
        <div className="not-found-card">
          
          {/* Logo */}
          <div className="not-found-logo">
            <img 
              src="/Sentya.png" 
              alt="SENTYA" 
              className="logo-image"
            />
          </div>

          {/* 404 Number */}
          <div className="error-number">404</div>
          
          {/* Titulo */}
          <h1 className="error-title">Página no encontrada</h1>
          
          {/* Descripción */}
          <p className="error-description">
            La página que estás buscando no existe o ha sido movida.
            No te preocupes, vamos a ayudarte a encontrar lo que necesitas.
          </p>

          {/* Botones */}
          <div className="error-actions">
            <button
              onClick={handleGoHome}
              className="primary-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              Volver al inicio
            </button>
            
            <button
              onClick={handleGoBack}
              className="secondary-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Página anterior
            </button>
          </div>

          {/* Información de ayuda */}
          <div className="help-info">
            <p>
              ¿Necesitas ayuda? Contacta con nosotros al{' '}
              <span className="phone-highlight">900 123 456</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;