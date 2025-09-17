import React, { useState, useEffect, useCallback } from 'react';

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

  // Inicializar datos cuando se abre el modal
  useEffect(() => {
    if (user && isOpen) {
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
  }, [user, isOpen]);

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
    } else if (!/^[6-9][0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido (9 dígitos, 6-9)';
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
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '460px',
        maxWidth: '90vw',
        height: '100vh',
        background: 'rgba(248, 250, 252, 0.12)',
        backdropFilter: 'blur(28px)',
        border: '1px solid rgba(248, 250, 252, 0.25)',
        borderRight: 'none',
        borderTopLeftRadius: '20px',
        borderBottomLeftRadius: '20px',
        boxShadow: '-20px 0 50px rgba(37, 99, 235, 0.15)',
        zIndex: 1001,
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header fijo */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid rgba(248, 250, 252, 0.15)',
          background: 'rgba(248, 250, 252, 0.05)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #2563eb, #059669, #f97316)',
            backgroundSize: '300% 100%',
            animation: 'shimmer 3s ease-in-out infinite'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'rgba(248, 250, 252, 0.95)',
                margin: '0 0 4px 0',
                lineHeight: '1.2'
              }}>
                Editar Usuario
              </h2>
              <p style={{
                color: 'rgba(248, 250, 252, 0.6)',
                fontSize: '0.9rem',
                margin: 0
              }}>
                Modifica los datos del usuario
              </p>
            </div>
            <button 
              onClick={onClose}
              disabled={isSaving}
              style={{
                width: '36px',
                height: '36px',
                border: 'none',
                borderRadius: '8px',
                background: 'rgba(248, 250, 252, 0.1)',
                color: 'rgba(248, 250, 252, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Avatar y info básica */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'rgba(248, 250, 252, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(248, 250, 252, 0.15)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #2563eb, #059669)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              {user.name?.charAt(0)?.toUpperCase()}{user.last_name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                color: 'rgba(248, 250, 252, 0.95)',
                fontWeight: '600',
                marginBottom: '2px'
              }}>
                {user.name} {user.last_name}
              </div>
              <div style={{
                color: 'rgba(248, 250, 252, 0.7)',
                fontSize: '0.85rem'
              }}>
                {user.email}
              </div>
              <div style={{
                color: 'rgba(248, 250, 252, 0.6)',
                fontSize: '0.75rem',
                marginTop: '2px'
              }}>
                Registrado: {formatDate(user.created_at)}
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: user.is_active ? '#22c55e' : '#64748b',
                boxShadow: user.is_active ? '0 0 0 0 rgba(34, 197, 94, 0.5)' : 'none',
                animation: user.is_active ? 'pulse 2s infinite' : 'none'
              }} />
              <span style={{
                fontSize: '0.75rem',
                color: 'rgba(248, 250, 252, 0.6)',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.05em'
              }}>
                {getRoleName(user.rol)}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <form onSubmit={handleSubmit} style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            scrollbarWidth: 'thin'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Información personal */}
              <div>
                <h3 style={{
                  color: 'rgba(248, 250, 252, 0.95)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Información Personal
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        color: 'rgba(248, 250, 252, 0.8)',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        disabled={isSaving}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'rgba(248, 250, 252, 0.08)',
                          border: `1.5px solid ${errors.name ? '#ef4444' : 'rgba(248, 250, 252, 0.2)'}`,
                          borderRadius: '10px',
                          color: 'rgba(248, 250, 252, 0.95)',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(12px)',
                          boxSizing: 'border-box'
                        }}
                      />
                      {errors.name && (
                        <span style={{
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          marginTop: '4px',
                          display: 'block'
                        }}>
                          {errors.name}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        color: 'rgba(248, 250, 252, 0.8)',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => handleChange('last_name', e.target.value)}
                        disabled={isSaving}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'rgba(248, 250, 252, 0.08)',
                          border: `1.5px solid ${errors.last_name ? '#ef4444' : 'rgba(248, 250, 252, 0.2)'}`,
                          borderRadius: '10px',
                          color: 'rgba(248, 250, 252, 0.95)',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(12px)',
                          boxSizing: 'border-box'
                        }}
                      />
                      {errors.last_name && (
                        <span style={{
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          marginTop: '4px',
                          display: 'block'
                        }}>
                          {errors.last_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        color: 'rgba(248, 250, 252, 0.8)',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        DNI/NIE *
                      </label>
                      <input
                        type="text"
                        value={formData.dni}
                        onChange={(e) => handleChange('dni', e.target.value.toUpperCase())}
                        disabled={isSaving}
                        maxLength="9"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'rgba(248, 250, 252, 0.08)',
                          border: `1.5px solid ${errors.dni ? '#ef4444' : 'rgba(248, 250, 252, 0.2)'}`,
                          borderRadius: '10px',
                          color: 'rgba(248, 250, 252, 0.95)',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(12px)',
                          boxSizing: 'border-box'
                        }}
                      />
                      {errors.dni && (
                        <span style={{
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          marginTop: '4px',
                          display: 'block'
                        }}>
                          {errors.dni}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        color: 'rgba(248, 250, 252, 0.8)',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => handleChange('birth_date', e.target.value)}
                        disabled={isSaving}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'rgba(248, 250, 252, 0.08)',
                          border: `1.5px solid ${errors.birth_date ? '#ef4444' : 'rgba(248, 250, 252, 0.2)'}`,
                          borderRadius: '10px',
                          color: 'rgba(248, 250, 252, 0.95)',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(12px)',
                          boxSizing: 'border-box'
                        }}
                      />
                      {errors.birth_date && (
                        <span style={{
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          marginTop: '4px',
                          display: 'block'
                        }}>
                          {errors.birth_date}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(248, 250, 252, 0.8)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Edad
                    </label>
                    <input
                      type="text"
                      value={formData.age}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(248, 250, 252, 0.05)',
                        border: '1.5px solid rgba(248, 250, 252, 0.15)',
                        borderRadius: '10px',
                        color: 'rgba(248, 250, 252, 0.7)',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        outline: 'none',
                        backdropFilter: 'blur(12px)',
                        boxSizing: 'border-box',
                        cursor: 'not-allowed'
                      }}
                    />
                    <small style={{
                      color: 'rgba(248, 250, 252, 0.5)',
                      fontSize: '0.75rem',
                      marginTop: '4px',
                      display: 'block'
                    }}>
                      Se calcula automáticamente desde la fecha de nacimiento
                    </small>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div>
                <h3 style={{
                  color: 'rgba(248, 250, 252, 0.95)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Contacto
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(248, 250, 252, 0.8)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(248, 250, 252, 0.08)',
                        border: `1.5px solid ${errors.email ? '#ef4444' : 'rgba(248, 250, 252, 0.2)'}`,
                        borderRadius: '10px',
                        color: 'rgba(248, 250, 252, 0.95)',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(12px)',
                        boxSizing: 'border-box'
                      }}
                    />
                    {errors.email && (
                      <span style={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        marginTop: '4px',
                        display: 'block'
                      }}>
                        {errors.email}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(248, 250, 252, 0.8)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(248, 250, 252, 0.08)',
                        border: `1.5px solid ${errors.phone ? '#ef4444' : 'rgba(248, 250, 252, 0.2)'}`,
                        borderRadius: '10px',
                        color: 'rgba(248, 250, 252, 0.95)',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(12px)',
                        boxSizing: 'border-box'
                      }}
                    />
                    {errors.phone && (
                      <span style={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        marginTop: '4px',
                        display: 'block'
                      }}>
                        {errors.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Configuración de cuenta */}
              <div>
                <h3 style={{
                  color: 'rgba(248, 250, 252, 0.95)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
                Configuración
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(248, 250, 252, 0.8)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Rol
                    </label>
                    <select
                      value={formData.rol}
                      onChange={(e) => handleChange('rol', e.target.value)}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(248, 250, 252, 0.08)',
                        border: '1.5px solid rgba(248, 250, 252, 0.2)',
                        borderRadius: '10px',
                        color: 'rgba(248, 250, 252, 0.95)',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(12px)',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23f8fafc' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                        backgroundPosition: 'right 12px center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '16px',
                        paddingRight: '40px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="client">Usuario</option>
                      <option value="css_technician">Trabajador CSS</option>
                      <option value="professional">Profesor</option>
                      <option value="coordinator">Coordinador</option>
                      <option value="administrator">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(248, 250, 252, 0.8)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Estado
                    </label>
                    <select
                      value={formData.is_active}
                      onChange={(e) => handleChange('is_active', e.target.value === 'true')}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(248, 250, 252, 0.08)',
                        border: '1.5px solid rgba(248, 250, 252, 0.2)',
                        borderRadius: '10px',
                        color: 'rgba(248, 250, 252, 0.95)',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(12px)',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23f8fafc' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                        backgroundPosition: 'right 12px center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '16px',
                        paddingRight: '40px',
                        boxSizing: 'border-box'
                      }}
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
              <div style={{
                background: 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: 'rgba(37, 99, 235, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                  flexShrink: 0
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <div>
                  <div style={{
                    color: 'rgba(248, 250, 252, 0.95)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '2px'
                  }}>
                    Cambios pendientes
                  </div>
                  <div style={{
                    color: 'rgba(248, 250, 252, 0.7)',
                    fontSize: '0.8rem',
                    lineHeight: '1.3'
                  }}>
                    Guarda para aplicar las modificaciones
                  </div>
                </div>
              </div>
            )}

            {/* Mostrar errores si los hay */}
            {Object.keys(errors).length > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  flexShrink: 0
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div>
                  <div style={{
                    color: 'rgba(248, 250, 252, 0.95)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '2px'
                  }}>
                    Errores de validación
                  </div>
                  <div style={{
                    color: 'rgba(248, 250, 252, 0.7)',
                    fontSize: '0.8rem',
                    lineHeight: '1.3'
                  }}>
                    Corrige los campos marcados en rojo
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer fijo con botones */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(248, 250, 252, 0.15)',
          background: 'rgba(248, 250, 252, 0.05)',
          display: 'flex',
          gap: '12px'
        }}>
          <button 
            type="button"
            onClick={handleReset}
            disabled={isSaving || !hasChanges}
            style={{
              padding: '12px 16px',
              background: 'rgba(248, 250, 252, 0.08)',
              border: '1.5px solid rgba(248, 250, 252, 0.2)',
              borderRadius: '10px',
              color: 'rgba(248, 250, 252, 0.8)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: hasChanges && !isSaving ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: hasChanges && !isSaving ? 1 : 0.5
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M1 4v6h6m16 6v6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            Resetear
          </button>

          <button 
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(100, 116, 139, 0.1)',
              border: '1.5px solid rgba(100, 116, 139, 0.2)',
              borderRadius: '10px',
              color: 'rgba(100, 116, 139, 0.8)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Cancelar
          </button>
          
          <button 
            type="submit"
            disabled={isSaving || !hasChanges || Object.keys(errors).length > 0}
            style={{
              flex: 2,
              padding: '12px 16px',
              background: hasChanges && !isSaving && Object.keys(errors).length === 0
                ? 'linear-gradient(135deg, #2563eb, #059669)' 
                : 'rgba(100, 116, 139, 0.6)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: hasChanges && !isSaving && Object.keys(errors).length === 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: hasChanges && !isSaving && Object.keys(errors).length === 0 ? 1 : 0.6
            }}
          >
            {isSaving ? (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 6L9 17L4 12"/>
                </svg>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 480px) {
          .drawer {
            width: 100vw !important;
            borderRadius: 0 !important;
          }
        }

        /* Estilos para select options */
        select option {
          background-color: #1e293b;
          color: rgba(248, 250, 252, 0.95);
          padding: 12px 16px;
          font-weight: 500;
        }

        /* Scrollbar personalizada */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(248, 250, 252, 0.1);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(248, 250, 252, 0.3);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(248, 250, 252, 0.5);
        }
      `}</style>
    </>
  );
};

export default EditDrawer;