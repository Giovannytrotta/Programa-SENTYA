import React, { useState, useEffect } from 'react';
import './SentyaLanding.css';

const SentyaLanding = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const services = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administración completa de perfiles y seguimiento personalizado',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
    {
      title: 'Talleres Terapéuticos',
      description: 'Programación y seguimiento de actividades de bienestar',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
        </svg>
      )
    },
    {
      title: 'Control de Asistencia',
      description: 'Registro y análisis de participación en tiempo real',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="9,11 12,14 22,4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      )
    }
  ];

  return (
    <div className="landing-wrapper">
      {/* Dynamic Background */}
      <div 
        className="dynamic-bg"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(37, 99, 235, 0.05) 0%, transparent 50%)`
        }}
      />
      
      {/* Main Container */}
      <div className="main-container">
        {/* Navigation */}
        <nav className="main-nav">
          <div className="nav-content">
            <div className="logo-section">
              <div className="logo-container">
                <h1 className="main-logo">SENTYA</h1>
                <div className="logo-pulse"></div>
              </div>
            </div>
            <button className="access-button">
              <span>Acceder al Sistema</span>
              <div className="button-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14m-7-7 7 7-7 7"/>
                </svg>
              </div>
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <main className="hero-container">
          <div className={`hero-content ${isVisible ? 'animate-in' : ''}`}>
            
            {/* Title Section */}
            <div className="title-section">
              <h2 className="main-title">
                Gestión Integral
                <span className="title-highlight">Personas Mayores</span>
              </h2>
              <p className="main-subtitle">
                Plataforma completa para la administración, cuidado y seguimiento 
                 del bienestar de personas mayores
              </p>
            </div>

            {/* Visual Element */}
            <div className="visual-element">
              <div className="glass-card main-card">
                <div className="card-glow"></div>
                <div className="card-content">
                  <div className="card-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <h3>Sistema Integral</h3>
                  <p>Coordinación completa entre centros de salud y profesionales especializados</p>
                </div>
              </div>
            </div>

          </div>

          {/* Services Grid */}
          <div className={`services-container ${isVisible ? 'animate-services' : ''}`}>
            {services.map((service, index) => (
              <div 
                key={service.title} 
                className="service-card"
                style={{ animationDelay: `${0.2 * index}s` }}
              >
                <div className="service-icon">
                  {service.icon}
                </div>
                <div className="service-content">
                  <h4 className="service-title">{service.title}</h4>
                  <p className="service-description">{service.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className={`cta-container ${isVisible ? 'animate-cta' : ''}`}>
            <div className="cta-glass">
              <h3>Comienza tu experiencia</h3>
              <p>Accede al sistema de gestión más completo para el cuidado profesional</p>
              <button className="primary-cta">
                <span>Iniciar Sesión</span>
                <div className="cta-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10,17 15,12 10,7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

        </main>

        {/* Footer */}
        <footer className="main-footer">
          <p>SENTYA - © 2025 AOSSA Global </p>
           <p>30 años de experiencia en servicios integrales.</p> 
        </footer>
      </div>
    </div>
  );
};

export default SentyaLanding;