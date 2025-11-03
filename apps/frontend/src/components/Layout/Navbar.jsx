// apps/frontend/src/components/Layout/Navbar.jsx
// ACTUALIZACIÓN PARA MOSTRAR AVATARES EN VEZ DEL ICONO USER

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, User, Sparkles, Menu, X, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNavLinks } from '../../utils/navConfig';
import { useScroll } from '../../hooks/useScroll';
import ExitToggle from '../AdminDashboard/ExitToggle';
import ProfileEditor from '../ProfileEditor/ProfileEditor';
import './Navbar.css';

// 🎨 GENERAR URL DE AVATAR
const generateAvatarUrl = (user) => {
  // Si el usuario tiene avatar configurado
  if (user?.avatar_url) {
    return user.avatar_url;
  }

  // Si tiene tipo de avatar y metadata para regenerar
  if (user?.avatar_type === 'dicebear' && user?.avatar_style) {
    const seed = user?.avatar_seed || user?.email?.split('@')[0] || user?.name?.replace(/\s+/g, '') || 'user';
    return `https://api.dicebear.com/7.x/${user.avatar_style}/svg?seed=${seed}&size=200`;
  }

  if (user?.avatar_type === 'initials' && user?.avatar_color) {
    const initials = getInitials(user?.name);
    return `https://ui-avatars.com/api/?name=${initials}&size=200&background=${user.avatar_color}&color=FFFFFF&bold=true&font-size=0.4`;
  }

  // Fallback: generar avatar por defecto con DiceBear
  const seed = user?.email?.split('@')[0] || user?.name?.replace(/\s+/g, '') || 'user';
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&size=200`;
};

// Generar iniciales
const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isScrolled = useScroll(50);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredLink, setHoveredLink] = useState(null);

  const navLinks = getNavLinks(user?.rol || user?.role);

  // ✅ CALCULAR AVATAR DIRECTAMENTE (sin useEffect ni estado local)
  const avatarUrl = user ? generateAvatarUrl(user) : '';

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => setShowUserMenu(false);
    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  // Cerrar mobile menu en resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenProfileEditor = () => {
    setShowProfileEditor(true);
    setShowUserMenu(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        {/* Gradient Orb que sigue al mouse */}
        {!isScrolled && (
          <div 
            className="mouse-gradient"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y}px`
            }}
          />
        )}

        {/* Barra de progreso de scroll */}
        <div 
          className="scroll-progress"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="navbar-container">
          {/* Logo Premium */}
          <Link to="/dashboard" className="navbar-logo">
            <div className="logo-icon">
              <img className="logo-sentya-navbar" src="/Sentya.png" alt="Sentya Logo" />
            </div>
            <div className="logo-glow"></div>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="navbar-links">
            {navLinks.map((link, index) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  style={{ '--delay': `${index * 0.1}s` }}
                  onMouseEnter={() => setHoveredLink(link.path)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <div className="nav-link-content">
                    <div className="nav-icon-wrapper">
                      <Icon className="nav-icon" size={20} />
                      <div className="icon-glow"></div>
                      
                      <div className="icon-particles">
                        {[...Array(4)].map((_, i) => (
                          <div 
                            key={i}
                            className="icon-particle"
                            style={{
                              '--angle': `${i * 90}deg`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="nav-label">{link.label}</span>
                  </div>
                  {isActive && <div className="active-indicator"></div>}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* User Menu Premium con AVATAR */}
          <div className="navbar-user">
            <button 
              className="user-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              aria-label="User menu"
            >
              {/* 🎨 AVATAR EN VEZ DE ICONO */}
              <div className="user-avatar">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={user?.name || 'User'} 
                    className="user-avatar-img"
                    key={avatarUrl} // ✅ Key para forzar re-render cuando cambia la URL
                    onError={(e) => {
                      // Fallback si falla la imagen
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('fallback');
                    }}
                  />
                ) : (
                  <User size={18} />
                )}
                <div className="avatar-ring"></div>
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
              </div>
              <ChevronDown size={16} className={`chevron ${showUserMenu ? 'rotate' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-glow"></div>
                
                {/* Header con avatar y info del usuario */}
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={user?.name || 'User'} 
                        className="dropdown-avatar-img"
                        key={avatarUrl} // ✅ Key para forzar re-render cuando cambia la URL
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.classList.add('fallback');
                        }}
                      />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div className="dropdown-user-info">
                    <p className="user-email">{user?.email}</p>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                {/* Botón de Editar Perfil */}
                <button
                  className="dropdown-item"
                  onClick={handleOpenProfileEditor}
                >
                  <Settings size={18} />
                  <span>Editar Perfil</span>
                </button>

                <div className="dropdown-divider"></div>
                
                {/* ExitToggle Component */}
                <div className="dropdown-exit-section">
                  <ExitToggle />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div 
            className="mobile-backdrop" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-drawer">
            <div className="mobile-drawer-header">
              <span className="mobile-drawer-title">SENTYA</span>
              <button 
                className="mobile-close-btn" 
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mobile-nav-links">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="mobile-nav-icon" size={20} />
                    <span className="mobile-nav-label">{link.label}</span>
                  </Link>
                );
              })}

              {/* Botón de Editar Perfil en Mobile */}
              <button
                className="mobile-nav-link"
                onClick={handleOpenProfileEditor}
              >
                <Settings className="mobile-nav-icon" size={20} />
                <span className="mobile-nav-label">Editar Perfil</span>
              </button>
            </div>

            {/* ExitToggle en Mobile */}
            <div className="mobile-exit-section">
              <ExitToggle />
            </div>
          </div>
        </>
      )}

      {/* Modal de Edición de Perfil */}
      <ProfileEditor 
        isOpen={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
      />
    </>
  );
};

export default Navbar;