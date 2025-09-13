
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './LoginAdmin.css';

const LoginAdminPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});

  const { 
    login,
    isLoading,
    error,
    clearErrors,
    validateLoginForm,
    MESSAGES
  } = useAuth();

  const navigate = useNavigate();

  // Limpiar errores globales después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearErrors();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearErrors]);

  // Validación en tiempo real
  const validateField = (name, value) => {
    let fieldError = '';
    
    if (name === 'email') {
      if (!value) {
        fieldError = MESSAGES.VALIDATION.EMAIL_REQUIRED;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        fieldError = MESSAGES.VALIDATION.EMAIL_INVALID;
      }
    }
    
    if (name === 'password') {
      if (!value) {
        fieldError = MESSAGES.VALIDATION.PASSWORD_REQUIRED;
      } else if (value.length < 8) {
        fieldError = MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH;
      }
    }
    
    return fieldError;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validar solo si el campo ha sido tocado
    if (touched[name]) {
      const fieldError = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: fieldError
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    const fieldError = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Marcar todos los campos como tocados
    setTouched({ email: true, password: true });
    
    // Validar todo el formulario
    const validationErrors = validateLoginForm(formData);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Intentar login
    const result = await login(formData);
    
    if (!result.success && result.error && !result.requires2FA && !result.requires2FASetup) {
      // Si hay un error general, mostrarlo
      setErrors({ general: result.error });
    }
  };

  // Función para limpiar el formulario
  const clearForm = () => {
    setFormData({ email: '', password: '' });
    setErrors({});
    setTouched({});
    clearErrors();
  };

  return (
    <div className="login-admin-container">
      <div className="login-admin-wrapper">
        <div className="login-admin-form">
          {/* Header */}
          <div className="login-header">
            <div className="logo-container">
              <h1 className="logo">Sentya</h1>
              <div className="logo-accent"></div>
            </div>
            <h2 className="login-title">Panel de Administración</h2>
            <p className="login-subtitle">Sistema de gestión integral</p>
          </div>

          {/* Error general */}
          {(error || errors.general) && (
            <div className="error-message general">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error || errors.general}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Campo Email */}
            <div className="input-group">
              <div className={`input-container ${errors.email && touched.email ? 'error' : ''}`}>
                <input
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  className="input-field"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>
              {errors.email && touched.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            {/* Campo Password */}
            <div className="input-group">
              <div className={`input-container ${errors.password && touched.password ? 'error' : ''}`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Contraseña"
                  className="input-field"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex="-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && touched.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            {/* Opciones adicionales */}
            <div className="form-options">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">Recordar sesión</span>
              </label>

              <a href="#" className="forgot-password">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón de envío */}
            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span className="button-text">Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span className="button-text">Iniciar Sesión</span>
                  <div className="button-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10,17 15,12 10,7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                  </div>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="footer-text">
              © 2025 AOSSA Global.
            </p>
            <p className="footer-text">30 años de experiencia en servicios integrales.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginAdminPage;