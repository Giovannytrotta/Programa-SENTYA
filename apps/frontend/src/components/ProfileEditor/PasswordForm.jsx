// apps/frontend/src/components/ProfileEditor/PasswordForm.jsx

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import "./PasswordForm.css"

const PasswordForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [validation, setValidation] = useState({
    length: false,
    match: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validación en tiempo real
    if (name === 'new_password') {
      setValidation(prev => ({
        ...prev,
        length: value.length >= 8,
        match: value === formData.confirm_password
      }));
    }

    if (name === 'confirm_password') {
      setValidation(prev => ({
        ...prev,
        match: value === formData.new_password
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validation.length || !validation.match) {
      return;
    }

    try {
      await onSubmit(formData);
      // Limpiar formulario si todo fue bien
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="password-form">
      {/* Contraseña Actual */}
      <div className="form-group">
        <label htmlFor="current_password">
          <Lock size={16} />
          Contraseña Actual
        </label>
        <div className="input-with-icon">
          <input
            type={showPasswords.current ? 'text' : 'password'}
            id="current_password"
            name="current_password"
            value={formData.current_password}
            onChange={handleInputChange}
            placeholder="Tu contraseña actual"
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => togglePasswordVisibility('current')}
          >
            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Nueva Contraseña */}
      <div className="form-group">
        <label htmlFor="new_password">
          <Lock size={16} />
          Nueva Contraseña
        </label>
        <div className="input-with-icon">
          <input
            type={showPasswords.new ? 'text' : 'password'}
            id="new_password"
            name="new_password"
            value={formData.new_password}
            onChange={handleInputChange}
            placeholder="Tu nueva contraseña"
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => togglePasswordVisibility('new')}
          >
            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Confirmar Contraseña */}
      <div className="form-group">
        <label htmlFor="confirm_password">
          <Lock size={16} />
          Confirmar Nueva Contraseña
        </label>
        <div className="input-with-icon">
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleInputChange}
            placeholder="Confirma tu nueva contraseña"
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => togglePasswordVisibility('confirm')}
          >
            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Validaciones Visuales */}
      <div className="password-requirements">
        <div className={`requirement ${validation.length ? 'valid' : ''}`}>
          {validation.length ? <Check size={16} /> : <X size={16} />}
          Mínimo 8 caracteres
        </div>
        <div className={`requirement ${validation.match ? 'valid' : ''}`}>
          {validation.match ? <Check size={16} /> : <X size={16} />}
          Las contraseñas coinciden
        </div>
      </div>

      <button 
        type="submit" 
        className="btn-save"
        disabled={loading || !validation.length || !validation.match}
      >
        {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
      </button>
    </form>
  );
};

export default PasswordForm;