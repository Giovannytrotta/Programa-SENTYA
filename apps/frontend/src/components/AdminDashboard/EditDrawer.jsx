
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './EditDrawer.css';
import { countries, popularCountries } from './countries.js';

const EditDrawer = ({
  user,
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    dni: '',
    phone: '',
    birth_date: '',
    age: '',
    address: '',
    observations: '',
    rol: 'client',
    is_active: true
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para el selector de países personalizado
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [phonePrefix, setPhonePrefix] = useState('+34');
  const [phoneNumber, setPhoneNumber] = useState('');
  const dropdownRef = useRef(null);

  // Calcular edad automáticamente
  const calculateAge = useCallback((birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age.toString();
  }, []);

  // Filtrar países basándose en búsqueda
  const filteredCountries = countrySearch 
    ? countries.filter(country => 
        country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.code.includes(countrySearch) ||
        country.countryCode.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : countries.filter(country => 
        !popularCountries.some(pop => pop.code === country.code && pop.country === country.country)
      );

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCountryDropdown]);

  // Inicializar datos cuando se abre el modal
  useEffect(() => {
    if (user && isOpen) {
      // Separar prefijo y número si existe un teléfono
      let prefix = '+34';
      let number = '';
      
      if (user.phone) {
        const foundCountry = countries.find(country => user.phone.startsWith(country.code));
        if (foundCountry) {
          prefix = foundCountry.code;
          number = user.phone.replace(foundCountry.code, '').trim();
        } else {
          number = user.phone;
        }
      }

      setPhonePrefix(prefix);
      setPhoneNumber(number);
      
      // Establecer el país seleccionado
      const country = countries.find(c => c.code === prefix);
      setSelectedCountry(country || { code: '+34', country: 'España', countryCode: 'ES', flag: '🇪🇸' });

      const userData = {
        name: user.name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        dni: user.dni || '',
        phone: user.phone || '',
        birth_date: user.birth_date || '',
        age: user.age || '',
        address: user.address || '',
        observations: user.observations || '',
        rol: user.rol || 'client',
        is_active: user.is_active ?? true
      };
      setFormData(userData);
      setHasChanges(false);
      setErrors({});
    }
  }, [user, isOpen, countries]);

  // Función para manejar cambio de prefijo
  const handlePrefixChange = (newPrefix) => {
    setPhonePrefix(newPrefix);
    const fullPhone = phoneNumber ? newPrefix + ' ' + phoneNumber : newPrefix;
    handleChange('phone', fullPhone);
  };

  // Función para manejar cambio de número
  const handlePhoneNumberChange = (value) => {
    setPhoneNumber(value);
    const fullPhone = value ? phonePrefix + ' ' + value : phonePrefix;
    handleChange('phone', fullPhone);
  };

  // Manejar cambios en formulario
  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Calcular edad si cambia la fecha de nacimiento
      if (field === 'birth_date') {
        newData.age = calculateAge(value);
      }

      return newData;
    });

    setHasChanges(true);

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validaciones
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Los apellidos son requeridos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI/NIE es requerido';
    } else {
      const dni = formData.dni.toUpperCase();
      const dniPattern = /^[0-9]{8}[A-Z]$/;
      const niePattern = /^[XYZ][0-9]{7}[A-Z]$/;
      if (!(dniPattern.test(dni) || niePattern.test(dni))) {
        newErrors.dni = 'Formato de DNI/NIE inválido';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^[+]?[0-9\s\-()]{9,20}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18 || age > 120) {
        newErrors.birth_date = 'La edad debe estar entre 18 y 120 años';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasChanges || !validateForm()) return;

    setIsSaving(true);
    try {
      // Solo enviar campos que realmente cambiaron
      const changedFields = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== (user[key] || '')) {
          changedFields[key] = formData[key];
        }
      });

      await onSave(user.id, changedFields);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Resetear formulario
  const handleReset = () => {
    if (user) {
      // Separar prefijo y número si existe un teléfono
      let prefix = '+34';
      let number = '';
      
      if (user.phone) {
        const foundCountry = countries.find(country => user.phone.startsWith(country.code));
        if (foundCountry) {
          prefix = foundCountry.code;
          number = user.phone.replace(foundCountry.code, '').trim();
        } else {
          number = user.phone;
        }
      }

      setPhonePrefix(prefix);
      setPhoneNumber(number);
      
      // Establecer el país seleccionado  
      const country = countries.find(c => c.code === prefix);
      setSelectedCountry(country || { code: '+34', country: 'España', countryCode: 'ES', flag: '🇪🇸' });

      const userData = {
        name: user.name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        dni: user.dni || '',
        phone: user.phone || '',
        birth_date: user.birth_date || '',
        age: user.age || '',
        address: user.address || '',
        observations: user.observations || '',
        rol: user.rol || 'client',
        is_active: user.is_active ?? true
      };
      setFormData(userData);
      setErrors({});
      setHasChanges(false);
    }
  };

  const getRoleName = (role) => {
    const roleNames = {
      'administrator': 'Administrador',
      'coordinator': 'Coordinador',
      'professional': 'Profesor',
      'css_technician': 'Trabajador CSS',
      'client': 'Usuario'
    };
    return roleNames[role] || role;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Overlay */}
      <div className="edit-drawer-overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="edit-drawer">
        {/* Header fijo */}
        <div className="edit-drawer-header">
          <div className="header-gradient" />

          <div className="header-top">
            <div>
              <h2 className="header-title">Editar Usuario</h2>
              <p className="header-subtitle">Modifica los datos del usuario</p>
            </div>
            <button
              className="close-button"
              onClick={onClose}
              disabled={isSaving}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Avatar y info básica */}
          <div className="user-info-card">
            <div className="user-avatar">
              {user.name?.charAt(0)?.toUpperCase()}{user.last_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">
                {user.name} {user.last_name}
              </div>
              <div className="user-email">{user.email}</div>
              <div className="user-date">
                Registrado: {formatDate(user.created_at)}
              </div>
            </div>
            <div className="user-status">
              <div className={`status-indicator ${user.is_active ? 'active' : 'inactive'}`} />
              <span className="user-role">{getRoleName(user.rol)}</span>
            </div>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <form onSubmit={handleSubmit} className="edit-drawer-form">
          <div className="form-content">
            <div className="form-sections">

              {/* Información personal */}
              <div className="form-section">
                <h3 className="section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Información Personal
                </h3>

                <div className="section-fields">
                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label">Nombre *</label>
                      <input
                        type="text"
                        className={`field-input ${errors.name ? 'error' : ''}`}
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        disabled={isSaving}
                      />
                      {errors.name && <span className="field-error">{errors.name}</span>}
                    </div>

                    <div className="field-group">
                      <label className="field-label">Apellidos *</label>
                      <input
                        type="text"
                        className={`field-input ${errors.last_name ? 'error' : ''}`}
                        value={formData.last_name}
                        onChange={(e) => handleChange('last_name', e.target.value)}
                        disabled={isSaving}
                      />
                      {errors.last_name && <span className="field-error">{errors.last_name}</span>}
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label">DNI/NIE *</label>
                      <input
                        type="text"
                        className={`field-input ${errors.dni ? 'error' : ''}`}
                        value={formData.dni}
                        onChange={(e) => handleChange('dni', e.target.value.toUpperCase())}
                        disabled={isSaving}
                        maxLength="9"
                      />
                      {errors.dni && <span className="field-error">{errors.dni}</span>}
                    </div>

                    <div className="field-group">
                      <label className="field-label">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        className={`field-input ${errors.birth_date ? 'error' : ''}`}
                        value={formData.birth_date}
                        onChange={(e) => handleChange('birth_date', e.target.value)}
                        disabled={isSaving}
                      />
                      {errors.birth_date && <span className="field-error">{errors.birth_date}</span>}
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Edad</label>
                    <input
                      type="text"
                      className="field-input"
                      value={formData.age}
                      readOnly
                      disabled
                    />
                    <small className="field-hint">
                      Se calcula automáticamente desde la fecha de nacimiento
                    </small>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="form-section">
                <h3 className="section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Contacto
                </h3>

                <div className="section-fields">
                  <div className="field-group">
                    <label className="field-label">Email *</label>
                    <input
                      type="email"
                      className={`field-input ${errors.email ? 'error' : ''}`}
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={isSaving}
                    />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>

                  <div className="field-group">
                    <label className="field-label">Teléfono *</label>
                    <div className="phone-group">
                      <div className="custom-country-selector" ref={dropdownRef}>
                        <button
                          type="button"
                          className="country-selector-button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          disabled={isSaving}
                          aria-expanded={showCountryDropdown}
                        >
                          <span className="country-flag">{selectedCountry?.flag || '🌍'}</span>
                          <span className="country-code">{phonePrefix}</span>
                          <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </button>
                        
                        {showCountryDropdown && (
                          <div className="country-dropdown">
                            <div className="country-search">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                              </svg>
                              <input
                                type="text"
                                placeholder="Buscar país..."
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                className="country-search-input"
                                autoFocus
                              />
                            </div>
                            
                            <div className="country-list">
                              {countrySearch === '' && (
                                <>
                                  <div className="country-section-title">Países populares</div>
                                  {popularCountries.map((country) => (
                                    <button
                                      key={`pop-${country.code}-${country.country}`}
                                      type="button"
                                      className={`country-option ${phonePrefix === country.code ? 'selected' : ''}`}
                                      onClick={() => {
                                        handlePrefixChange(country.code);
                                        setSelectedCountry(country);
                                        setShowCountryDropdown(false);
                                        setCountrySearch('');
                                      }}
                                    >
                                      <span className="country-flag">{country.flag}</span>
                                      <span className="country-name">{country.country}</span>
                                      <span className="country-code">{country.code}</span>
                                    </button>
                                  ))}
                                  <div className="country-divider"></div>
                                  <div className="country-section-title">Todos los países</div>
                                </>
                              )}
                              
                              {filteredCountries.map((country) => (
                                <button
                                  key={`${country.code}-${country.country}`}
                                  type="button"
                                  className={`country-option ${phonePrefix === country.code ? 'selected' : ''}`}
                                  onClick={() => {
                                    handlePrefixChange(country.code);
                                    setSelectedCountry(country);
                                    setShowCountryDropdown(false);
                                    setCountrySearch('');
                                  }}
                                >
                                  <span className="country-flag">{country.flag}</span>
                                  <span className="country-name">{country.country}</span>
                                  <span className="country-code">{country.code}</span>
                                </button>
                              ))}
                              
                              {filteredCountries.length === 0 && (
                                <div className="no-results">No se encontraron países</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="tel"
                        className={`phone-number-input ${errors.phone ? 'error' : ''}`}
                        value={phoneNumber}
                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                        disabled={isSaving}
                        placeholder="612 345 678"
                      />
                    </div>
                    {errors.phone && <span className="field-error">{errors.phone}</span>}
                    <small className="field-hint">
                      Selecciona el país y escribe tu número
                    </small>
                  </div>
                </div>
              </div>

              {/* Configuración de cuenta */}
              <div className="form-section">
                <h3 className="section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
                  </svg>
                  Configuración
                </h3>

                <div className="section-fields">
                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label">Rol</label>
                      <select
                        className="field-select"
                        value={formData.rol}
                        onChange={(e) => handleChange('rol', e.target.value)}
                        disabled={isSaving}
                      >
                        <option value="client">Usuario</option>
                        <option value="css_technician">Trabajador CSS</option>
                        <option value="professional">Profesor</option>
                        <option value="coordinator">Coordinador</option>
                        <option value="administrator">Administrador</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Estado</label>
                      <select
                        className="field-select"
                        value={formData.is_active}
                        onChange={(e) => handleChange('is_active', e.target.value === 'true')}
                        disabled={isSaving}
                      >
                        <option value={true}>Activo</option>
                        <option value={false}>Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicador de cambios */}
              {hasChanges && (
                <div className="notification info">
                  <div className="notification-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">Cambios pendientes</div>
                    <div className="notification-text">Guarda para aplicar las modificaciones</div>
                  </div>
                </div>
              )}

              {/* Mostrar errores si los hay */}
              {Object.keys(errors).length > 0 && (
                <div className="notification error">
                  <div className="notification-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">Errores de validación</div>
                    <div className="notification-text">Corrige los campos marcados en rojo</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer fijo con botones */}
          <div className="edit-drawer-footer">
            <button
              type="button"
              className="footer-button reset"
              onClick={handleReset}
              disabled={isSaving || !hasChanges}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6m16 6v6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              Resetear
            </button>

            <button
              type="button"
              className="footer-button cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={`footer-button save ${hasChanges && !isSaving && Object.keys(errors).length === 0 ? 'enabled' : 'disabled'}`}
              disabled={isSaving || !hasChanges || Object.keys(errors).length > 0}
            >
              {isSaving ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17L4 12" />
                  </svg>
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditDrawer;