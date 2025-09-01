import React, { useState } from 'react';

const SentyaLoginDesigns = () => {
  const [currentDesign, setCurrentDesign] = useState(0);

  const designs = [
    { name: 'Neomorfismo', class: 'neomorphism', description: 'Sombras suaves y profundidad' },
    { name: 'Glassmorfismo', class: 'glassmorphism', description: 'Efecto cristal translúcido' }, 
    { name: 'Neobrutalismo', class: 'neobrutalism', description: 'Colores vibrantes y bordes gruesos' },
    { name: 'Minimalista', class: 'minimal', description: 'Diseño limpio y elegante' },
    { name: 'Futurista Cyberpunk', class: 'cyberpunk', description: 'Futurista con efectos neón' },
    { name: 'Google canon', class: 'material', description: 'Siguiendo guías de Google' },
    { name: 'Retro 80s', class: 'retro', description: 'Gradientes y estética retro' },
    { name: 'Corporativo', class: 'corporate', description: 'Profesional empresarial' },
    { name: 'Tonos Pastel', class: 'pastel', description: 'Colores suaves y delicados' },
    { name: 'Grandes contrastes de estilos', class: 'high-contrast', description: 'Máxima accesibilidad' }
  ];

  const LoginForm = ({ designClass }) => (
    <div className={`login-form-wrapper ${designClass}`}>
      <div className="login-form">
        <div className="logo-section">
          <div className="logo-container">
            <h1 className="logo">Sentya</h1>
            <div className="logo-accent"></div>
          </div>
          <p className="tagline">Gestión integral de personas mayores</p>
        </div>
        
        <div className="form">
          <div className="input-group">
            <div className="input-container">
              <input 
                type="email" 
                placeholder="Correo electrónico"
                className="input-field"
              />
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="input-group">
            <div className="input-container">
              <input 
                type="password" 
                placeholder="Contraseña"
                className="input-field"
              />
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="options">
            <label className="checkbox-container">
              <input type="checkbox" />
              <span className="checkmark"></span>
              <span className="checkbox-text">Recordar sesión</span>
            </label>
            <a href="#" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          
          <button type="submit" className="login-button">
            <span className="button-text">Iniciar Sesión</span>
            <div className="button-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
          </button>
         
        
        
          <div className="signup-section">
            <p className="signup-text">
              ¿No tienes cuenta? 
              <a href="#" className="signup-link">Regístrate aquí</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="presentation-container">
      <div className="header-section">
        <div className="header-content">
          <div className="project-info">
            <h1 className="project-title">
              <span className="title-accent">Sentya</span>
              <span className="title-subtitle">Login Designs</span>
            </h1>
            <p className="project-description">
              Colección de formularios de login con diferentes estilos de diseño
            </p>
          </div>
          
          <div className="design-selector">
            <div className="selector-label">
              <span>Explorar Diseños</span>
              <div className="design-counter">
                {currentDesign + 1} / {designs.length}
              </div>
            </div>
            <div className="design-tabs">
              {designs.map((design, index) => (
                <button
                  key={index}
                  className={`tab ${currentDesign === index ? 'active' : ''}`}
                  onClick={() => setCurrentDesign(index)}
                >
                  <div className="tab-content">
                    <span className="tab-name">{design.name}</span>
                    <span className="tab-description">{design.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="showcase-section">
        <div className="showcase-container">
          <div className="design-info">
            <div className="current-design-badge">
              <span className="badge-text">Actual</span>
              <span className="badge-name">{designs[currentDesign].name}</span>
            </div>
            <p className="design-description">
              {designs[currentDesign].description}
            </p>
          </div>
          
          <div className="form-showcase">
            <LoginForm designClass={designs[currentDesign].class} />
          </div>
          
          <div className="navigation-controls">
            <button 
              className="nav-button prev"
              onClick={() => setCurrentDesign(currentDesign > 0 ? currentDesign - 1 : designs.length - 1)}
              disabled={currentDesign === 0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Anterior
            </button>
            
            <div className="dots-indicator">
              {designs.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${currentDesign === index ? 'active' : ''}`}
                  onClick={() => setCurrentDesign(index)}
                />
              ))}
            </div>
            
            <button 
              className="nav-button next"
              onClick={() => setCurrentDesign(currentDesign < designs.length - 1 ? currentDesign + 1 : 0)}
              disabled={currentDesign === designs.length - 1}
            >
              Siguiente
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentyaLoginDesigns;