// src/components/Layout/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, User, Sparkles, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNavLinks } from '../../utils/navConfig';
import { useScroll } from '../../hooks/useScroll';
import ExitToggle from '../AdminDashboard/ExitToggle';
import './Navbar.css';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isScrolled = useScroll(50);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredLink, setHoveredLink] = useState(null);

  const navLinks = getNavLinks(user?.rol || user?.role);

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
                      
                      {/* Partículas orbitando el icono */}
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

          {/* User Menu Premium */}
          <div className="navbar-user">
            <button 
              className="user-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              aria-label="User menu"
            >
              <div className="user-avatar">
                <User size={18} />
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
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    <User size={24} />
                  </div>
                  <div className="dropdown-user-info">
                    <p className="user-email">{user?.email}</p>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                {/* ExitToggle Component - Puerta Premium */}
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
            </div>

            {/* ExitToggle en Mobile - Al final del drawer */}
            <div className="mobile-exit-section">
              <ExitToggle />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;