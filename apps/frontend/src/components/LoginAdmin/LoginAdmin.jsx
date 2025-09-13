// pages/LoginAdmin.jsx
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

  const { 
    login,
    isLoading,
    error,
    requires2FA,
    clearErrors 
  } = useAuth();

  const navigate = useNavigate();

  // Limpiar errores automáticamente después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearErrors();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearErrors]);

  // Si ya requiere 2FA, redirigir a página de 2FA
  useEffect(() => {
    if (requires2FA) {
      navigate('/aossadmin/2fa', {
        state: { email: formData.email, password: formData.password }
      });
    }
  }, [requires2FA, navigate, formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const result = await login(formData);
    
    if (!result.success && result.error && !result.requires2FA) {
      setErrors({ general: result.error });
    }
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

          {/* Error del store global o del formulario */}
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

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Campo Email */}
            <div className="input-group">
              <div className={`input-container ${errors.email ? 'error' : ''}`}>
                <input
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  className="input-field"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="email"
                />
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {/* Campo Password */}
            <div className="input-group">
              <div className={`input-container ${errors.password ? 'error' : ''}`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Contraseña"
                  className="input-field"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
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
              {errors.password && <span className="error-text">{errors.password}</span>}
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