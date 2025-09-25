import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './UserLogin.css';

const UserLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { loginUser, isLoading, error, clearErrors, validateLoginForm, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      clearErrors();
    }
  }, [formData, clearErrors, error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateLoginForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const result = await loginUser(formData);
    } catch (err) {
      console.log('Error handled by useAuth hook');
    }
  };

  // Iconos SVG
  const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const LockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <circle cx="12" cy="16" r="1"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );

  const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  const HeartIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12,5 19,12 12,19"/>
    </svg>
  );

  return (
    <div className="user-login">
      <div className="user-login-container">
        
        {/* Header con logo */}
        <div className="user-login-header">
          <Link to="/" className="user-logo-link">
            <img 
              src="/Sentya.png" 
              alt="SENTYA" 
              className="user-logo-image"
            />
          </Link>
          <h1 className="user-login-title">¡Hola de nuevo!</h1>
          <p className="user-login-subtitle">Accede a tu cuenta de SENTYA</p>
        </div>

        {/* Formulario */}
        <div className="user-login-card">
          
          <div className="user-heart-icon-container">
            <div className="user-heart-icon">
              <HeartIcon />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="user-login-form">
            
            {/* Email */}
            <div className="user-input-group">
              <label htmlFor="email" className="user-input-label">
                Correo electrónico
              </label>
              <div className="user-input-wrapper">
                <div className="user-input-icon">
                  <UserIcon />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`user-input-field ${errors.email ? 'error' : ''}`}
                  placeholder="tu@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="user-error-message">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="user-input-group">
              <label htmlFor="password" className="user-input-label">
                Contraseña
              </label>
              <div className="user-input-wrapper">
                <div className="user-input-icon">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`user-input-field ${errors.password ? 'error' : ''}`}
                  placeholder="Tu contraseña"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="user-password-toggle"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="user-error-message">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`user-login-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="user-spinner" />
                  <span>Accediendo...</span>
                </>
              ) : (
                <>
                  <span>Acceder a SENTYA</span>
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="user-login-footer">
            <div className="user-no-account-text">
              ¿No tienes cuenta? Contacta con tu centro
            </div>
            
            <div className="user-separator">
              <div className="user-separator-line"></div>
              <span className="user-separator-text">o</span>
              <div className="user-separator-line"></div>
            </div>
            
            <Link to="/" className="user-back-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="user-back-arrow">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12,5 19,12 12,19"/>
              </svg>
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>

        {/* Help text */}
        <div className="user-help-text">
          <p>
            ¿Problemas para acceder? <br />
            Contacta con el personal de tu centro o llama al{' '}
            <span className="user-phone-number">900 123 456</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;