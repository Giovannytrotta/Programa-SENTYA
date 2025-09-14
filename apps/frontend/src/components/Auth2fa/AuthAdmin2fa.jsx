// components/Auth2fa/AuthAdmin2fa.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import "./AuthAdmin2fa.css";

const Auth2faPage = () => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [qrData, setQrData] = useState(null);
    const [showSetup, setShowSetup] = useState(false);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    
    const location = useLocation();
    const navigate = useNavigate();
    
    const { email, password, isFirstTimeSetup, userId } = location.state || {};
    
    const { 
        loginWith2FA, 
        setup2FA, 
        verify2FASetup, 
        isLoading, 
        clearErrors,
        validate2FAToken,
        MESSAGES 
    } = useAuth();

    useEffect(() => {
        if (!email || !password) {
            navigate('/aossadmin');
            return;
        }
        
        if (isFirstTimeSetup) {
            handleSetup2FA();
        }
    }, [email, password, navigate, isFirstTimeSetup]);

    const handleSetup2FA = async () => {
        setIsSettingUp(true);
        setError('');
        try {
            const response = await setup2FA();
            setQrData(response);
            setShowSetup(true);
            setSetupStep(1);
        } catch (error) {
            setError(error.message || 'Error al configurar autenticación');
        } finally {
            setIsSettingUp(false);
        }
    };

    const handleVerifySetup = async (e) => {
        e.preventDefault();
        
        const validationError = validate2FAToken(token);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        try {
            const result = await verify2FASetup(token, isFirstTimeSetup);
            
            if (isFirstTimeSetup && result.success) {
                return;
            }
            
            if (!isFirstTimeSetup) {
                const loginResult = await loginWith2FA({ 
                    email, 
                    password, 
                    token_2fa: token 
                });
                
                if (!loginResult.success) {
                    setError(loginResult.error || 'Código incorrecto');
                }
            }
        } catch (error) {
            setError(error.message || 'Código de verificación inválido');
        }
    };

    const handleLogin2FA = async (e) => {
        e.preventDefault();
        
        const validationError = validate2FAToken(token);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        const result = await loginWith2FA({ email, password, token_2fa: token });
        if (!result.success) {
            setError(result.error || 'Código de verificación inválido');
        }
    };

    const handleTokenChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setToken(value);
        if (error) setError('');
    };

    // Setup inicial (primera vez)
    if (isFirstTimeSetup && showSetup) {
        return (
            <div className="auth2fa-container">
                {/* Orbs flotantes de fondo */}
                <div className="floating-orbs">
                    <div className="orb"></div>
                    <div className="orb"></div>
                    <div className="orb"></div>
                </div>
                
                <div className="auth2fa-wrapper">
                    <div className="maintenance-header">
                        <div className="logo-container">
                            <div className="main-logo">SENTYA</div>
                            <div className="logo-accent"></div>
                        </div>
                        <h1 className="maintenance-title">
                            Configuración de Seguridad Avanzada
                        </h1>
                        <span className="subtitle-badge">CONFIGURACIÓN INICIAL</span>
                    </div>

                    {setupStep === 1 ? (
                        <div className="setup-content">
                            <div className="security-icon">
                                <div className="security-shield">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" 
                                              stroke="currentColor" strokeWidth="2"/>
                                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="setup-instructions">
                                <h3 style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '24px' }}>
                                    Autenticación de Dos Factores
                                </h3>
                                <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '32px', lineHeight: '1.6' }}>
                                    Para proteger tu cuenta administrativa, es obligatorio configurar 
                                    la autenticación de dos factores. Este proceso solo toma un minuto.
                                </p>
                                
                                <div style={{ 
                                    background: 'rgba(255,255,255,0.05)', 
                                    padding: '24px', 
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    marginBottom: '32px'
                                }}>
                                    <h4 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '16px' }}>
                                        Pasos a seguir:
                                    </h4>
                                    <ol style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '2' }}>
                                        <li>Instala una aplicación autenticadora en tu móvil</li>
                                        <li>Escanea el código QR que aparecerá a continuación</li>
                                        <li>Ingresa el código de 6 dígitos para verificar</li>
                                    </ol>
                                </div>

                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(3, 1fr)', 
                                    gap: '16px',
                                    marginBottom: '32px'
                                }}>
                                    <div style={{ 
                                        padding: '16px', 
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                                            Google Auth
                                        </div>
                                    </div>
                                    <div style={{ 
                                        padding: '16px', 
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                                            Microsoft Auth
                                        </div>
                                    </div>
                                    <div style={{ 
                                        padding: '16px', 
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                                            Authy
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {qrData?.qr_data_uri && (
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    <div className="qr-container">
                                        <div className="qr-corners"></div>
                                        <img 
                                            src={qrData.qr_data_uri} 
                                            alt="Código QR para autenticación" 
                                            className="qr-code"
                                            style={{ width: '220px', height: '220px' }}
                                        />
                                    </div>
                                    <p style={{ 
                                        color: 'rgba(255,255,255,0.6)', 
                                        fontSize: '0.875rem',
                                        marginTop: '16px'
                                    }}>
                                        Escanea este código con tu aplicación autenticadora
                                    </p>
                                </div>
                            )}

                            <button 
                                className="verify-button"
                                onClick={() => setSetupStep(2)}
                            >
                                Continuar con la verificación
                            </button>
                        </div>
                    ) : (
                        <div className="setup-content">
                            <div className="security-icon">
                                <div className="security-shield" style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.1), rgba(34,197,94,0.1))' }}>
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                            </div>

                            <h3 style={{ 
                                color: 'rgba(255,255,255,0.95)', 
                                textAlign: 'center',
                                marginBottom: '16px'
                            }}>
                                Verificación del Código
                            </h3>
                            <p style={{ 
                                color: 'rgba(255,255,255,0.7)', 
                                textAlign: 'center',
                                marginBottom: '32px'
                            }}>
                                Ingresa el código de 6 dígitos que aparece en tu aplicación
                            </p>

                            <form onSubmit={handleVerifySetup} className="token-form">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        value={token}
                                        onChange={handleTokenChange}
                                        className={`token-input ${error ? 'error' : ''}`}
                                        maxLength="6"
                                        disabled={isLoading}
                                        autoFocus
                                        autoComplete="off"
                                    />
                                </div>
                                
                                {error && (
                                    <div className="error-message">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="12" y1="8" x2="12" y2="12"/>
                                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                                        </svg>
                                        {error}
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button 
                                        type="button"
                                        className="secondary-button"
                                        onClick={() => setSetupStep(1)}
                                        disabled={isLoading}
                                        style={{ flex: 1 }}
                                    >
                                        Volver al código QR
                                    </button>
                                    
                                    <button 
                                        type="submit"
                                        className={`verify-button ${isLoading ? 'loading' : ''}`}
                                        disabled={isLoading || token.length !== 6}
                                        style={{ flex: 1 }}
                                    >
                                        {!isLoading && 'Verificar y Continuar'}
                                    </button>
                                </div>
                            </form>

                            <div className="help-section" style={{ marginTop: '32px' }}>
                                <details>
                                    <summary>¿El código no funciona?</summary>
                                    <div className="help-content">
                                        <p>Posibles soluciones:</p>
                                        <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                                            <li>Verifica que la hora de tu dispositivo esté sincronizada</li>
                                            <li>Espera a que aparezca un nuevo código (cambia cada 30 segundos)</li>
                                            <li>Asegúrate de estar usando la cuenta correcta en tu aplicación</li>
                                        </ul>
                                    </div>
                                </details>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Vista normal de 2FA (usuario ya configurado)
    return (
        <div className="auth2fa-container">
            <div className="floating-orbs">
                <div className="orb"></div>
                <div className="orb"></div>
                <div className="orb"></div>
            </div>
            
            <div className="auth2fa-wrapper">
                <div className="maintenance-header">
                    <div className="logo-container">
                        <div className="main-logo">SENTYA</div>
                        <div className="logo-accent"></div>
                    </div>
                    <h1 className="maintenance-title">Verificación de Seguridad</h1>
                    <span className="subtitle-badge">AUTENTICACIÓN REQUERIDA</span>
                </div>

                <div className="maintenance-content">
                    <div className="security-icon">
                        <div className="security-shield">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" 
                                      stroke="currentColor" strokeWidth="2"/>
                                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        </div>
                    </div>

                    <p style={{ 
                        color: 'rgba(255,255,255,0.8)', 
                        textAlign: 'center',
                        marginBottom: '40px',
                        fontSize: '1.125rem'
                    }}>
                        Ingresa el código de verificación de tu aplicación autenticadora
                    </p>

                    <form onSubmit={handleLogin2FA} className="token-form">
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="000000"
                                value={token}
                                onChange={handleTokenChange}
                                className={`token-input ${error ? 'error' : ''}`}
                                maxLength="6"
                                disabled={isLoading}
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        
                        {error && (
                            <div className="error-message">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                {error}
                            </div>
                        )}
                        
                        <button 
                            type="submit"
                            className={`verify-button ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading || token.length !== 6}
                        >
                            {!isLoading && 'Verificar Código'}
                        </button>
                    </form>
                </div>

                <div className="footer-section">
                    <p className="footer-text">Sistema de Seguridad SENTYA</p>
                </div>
            </div>
        </div>
    );
};

export default Auth2faPage;