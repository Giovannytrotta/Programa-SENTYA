import React from 'react';
import './Loading.css';

const Loading = ({ message = "Cargando..." }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-card">
          
          {/* Logo */}
          <div className="loading-logo">
            <img 
              src="/Sentya.png" 
              alt="SENTYA" 
              className="logo-image"
            />
          </div>

          {/* Spinner principal */}
          <div className="loading-spinner-container">
            <div className="loading-spinner">
              <div className="spinner-inner"></div>
            </div>
          </div>

          {/* Mensaje */}
          <p className="loading-message">{message}</p>

          {/* Puntos animados */}
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;