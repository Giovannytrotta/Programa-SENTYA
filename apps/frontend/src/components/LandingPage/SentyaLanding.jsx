import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { Heart, Target, TrendingUp, Users, Award, Rocket } from 'lucide-react';

import "./SentyaLanding.css"



const SentyaLanding = () => {

  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();



  useEffect(() => {

    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const transform = `translateY(${scrollY * 0.1}px)`;



  // 🔥 Funciones de navegación usando React Router

  const goToLogin = () => {

    navigate('/login');

  };



  const goToTutorial = () => {

    navigate('/tutorial');

  };



  return (

    <div className="sentya-landing">

      {/* Header */}

      <header className="main-header">

        <div className="header-container">

          <div className="logo-section">

            <div className="logo-info">

              <img className="logo-sentya" src="/Sentya.png" alt="Sentya Logo" />

              <p className="brand-subtitle">by</p>

              <div className="aossa-logo">

                <img className="img-aossa" src="https://aossa.es/wp-content/uploads/2021/07/logo-aossa-global.png" alt="logo Aossa" />

              </div>

            </div>

          </div>

          {/* 🆕 Conectar botón de login */}

          <button

            className="sentya-login-btn"

            onClick={goToLogin}

          >

         <span className="button-text-z">Iniciar sesión</span>

          </button>

        </div>

      </header>



      {/* Hero */}

      <section className="hero-section">

        <div className="hero-container">

          <div className="hero-grid">

            <div className="hero-content">

              <div className="hero-badge">

                <span className="badge-text">Para personas mayores y sus cuidadores</span>

              </div>



              <h1 className="hero-title">

                Tu vida.

                <br />

                Tus actividades.

                <br />

                <span className="hero-highlight">Tu bienestar.</span>

              </h1>



              <p className="hero-description">

                Una plataforma pensada para que puedas gestionar tus talleres,

                ver tu progreso y mantenerte conectado con tu centro de día.

              </p>



              {/* 🆕 Conectar botón principal */}

              <button

                className="hero-cta"

                onClick={goToLogin}

              >

                Explorar SENTYA

              </button>

            </div>



            <div className="hero-visual" style={{ transform }}>

              <div className="visual-card">

                <div className="visual-content">

                  <div className="visual-icon">

                    <Heart size={64} strokeWidth={1.5} />

                  </div>

                  <h3 className="visual-title">¿Es tu primera vez usando Sentya?</h3>

                  <p className="visual-text">

                    Accede a un rápido tutorial para conocer los primeros pasos que has de realizar en nuestra aplicación

                  </p>

                  {/* 🔥 Tutorial sigue igual (ya funciona) */}

                  <button

                    className="hero-cta"

                    onClick={goToTutorial}

                  >

                    <span className="button-text-z">Accede al Tutorial</span>


                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* Funcionalidades */}

      <section className="features-section">

        <div className="features-container">

          <h2 className="features-title">¿Qué puedes hacer con SENTYA?</h2>

          <div className="features-list">

            {/* Talleres */}

            <div className="feature-item">

              <div className="feature-content">

                <div className="feature-icon-large">

                  <Target size={48} />

                </div>

                <h3 className="feature-title">Apúntate a talleres</h3>

                <p className="feature-description">

                  Desde yoga suave hasta talleres de memoria.

                  Elige las actividades que más te gusten y apúntate con un solo clic.

                </p>

                <div className="feature-quote">

                  <p className="quote-text">

                    "Ahora puedo ver todos mis talleres de la semana de un vistazo"

                  </p>

                </div>

              </div>

              <div className="feature-visual">

                <div className="visual-box orange-gradient">

                  <div className="visual-center">

                    <div className="visual-large-icon">

                      <Target size={80} />

                    </div>

                    <h4 className="visual-heading">Fácil y rápido</h4>

                    <p className="visual-subtext">

                      Sin complicaciones, sin formularios largos

                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* Progreso */}

            <div className="feature-item feature-reverse">

              <div className="feature-visual">

                <div className="visual-box teal-gradient">

                  <div className="visual-center">

                    <div className="visual-large-icon">

                      <TrendingUp size={80} />

                    </div>

                    <h4 className="visual-heading">Tu evolución</h4>

                    <p className="visual-subtext">

                      Ve cómo mejoras semana a semana

                    </p>

                  </div>

                </div>

              </div>

              <div className="feature-content">

                <div className="feature-icon-large">

                  <TrendingUp size={48} />

                </div>

                <h3 className="feature-title">Sigue tu progreso</h3>

                <p className="feature-description">

                  Mira cuántos talleres has completado, qué actividades te gustan más

                  y cómo has ido mejorando en diferentes áreas.

                </p>

                <div className="feature-quote">

                  <p className="quote-text">

                    "Me motiva ver que cada mes participo más en actividades"

                  </p>

                </div>

              </div>

            </div>

            {/* Conectar */}

            <div className="feature-item">

              <div className="feature-content">

                <div className="feature-icon-large">

                  <Users size={48} />

                </div>

                <h3 className="feature-title">Conecta con otros</h3>

                <p className="feature-description">

                  Ve quién más va a tus talleres favoritos.

                  Haz nuevos amigos y mantente en contacto con tu familia.

                </p>

                <div className="feature-quote">

                  <p className="quote-text">

                    "He conocido a personas maravillosas en los talleres"

                  </p>

                </div>

              </div>

              <div className="feature-visual">

                <div className="visual-box purple-gradient">

                  <div className="visual-center">

                    <div className="visual-large-icon">

                      <Users size={80} />

                    </div>

                    <h4 className="visual-heading">Comunidad</h4>

                    <p className="visual-subtext">

                      Nunca estarás solo en tu camino

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* Respaldo AOSSA */}

      <section className="aossa-section">

        <div className="aossa-container">

          <div className="aossa-card">

            <div className="aossa-icon">

              <Award size={80} />

            </div>

            <h2 className="aossa-title">

              Respaldado por 30 años de experiencia

            </h2>

            <p className="aossa-description">

              AOSSA Global lleva tres décadas cuidando de personas mayores.

              SENTYA es la evolución digital de todo ese conocimiento y cariño.

            </p>

            <div className="stats-grid">

              <div className="stat-item">

                <div className="stat-number">500+</div>

                <p className="stat-label">Centros de día</p>

              </div>

              <div className="stat-item">

                <div className="stat-number">50,000+</div>

                <p className="stat-label">Personas cuidadas</p>

              </div>

              <div className="stat-item">

                <div className="stat-number">30</div>

                <p className="stat-label">Años de experiencia</p>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* CTA Final */}

      <section className="final-cta">

        <div className="cta-container">

          <div className="cta-icon">

            <Rocket size={80} />

          </div>

          <h2 className="cta-title">

            Tu nueva vida digital

            <br />

            <span className="cta-highlight">empieza aquí</span>

          </h2>

          <p className="cta-description">

            Únete al resto de personas que ya han mejorado su bienestar con SENTYA

</p>

{/* 🆕 Conectar botón final */}

<button className="cta-button"
onClick={goToLogin}>
  
Comenzar mi experiencia

</button>

</div>

<div className="cta-decoration-1" style={{ transform }} />
<div className="cta-decoration-2" style={{ transform: `translateY(${-scrollY * 0.05}px)` }} />
</section>



      {/* Footer */}

      <footer className="main-footer">

        <div className="footer-container">

          <div className="footer-logo">

            <div className="footer-logos-group">

              <img className="logo-sentya" src="/Sentya.png" alt="Sentya logo" />

              <span className="footer-by">by</span>

              <img className="img-aossa" src="https://aossa.es/wp-content/uploads/2021/07/logo-aossa-global.png" alt="logo Aossa" />

            </div>

          </div>

          <p className="footer-text">

            © 2025 AOSSA Global • Cuidando personas desde 1995

          </p>

        </div>

      </footer>

    </div>

  );

};

export default SentyaLanding;