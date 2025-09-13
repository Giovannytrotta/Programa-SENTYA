
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
    const [setupStep, setSetupStep] = useState(1); // 1: QR, 2: Verificar
    
    const location = useLocation();
    const navigate = useNavigate();
    
    // Datos del login anterior (enviados desde LoginAdmin)
    const { email, password, isFirstTimeSetup, userId } = location.state || {};
    
    // Hook de autenticación
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
        // Si no hay credenciales del login anterior, redirigir al login
        if (!email || !password) {
            navigate('/aossadmin');
            return;
        }
        
        // Si es primera vez (setup inicial obligatorio), mostrar QR automáticamente
        if (isFirstTimeSetup) {
            handleSetup2FA();
        }
    }, [email, password, navigate, isFirstTimeSetup]);

    // Configurar 2FA por primera vez
    const handleSetup2FA = async () => {
        setIsSettingUp(true);
        setError('');
        try {
            const response = await setup2FA();
            setQrData(response);
            setShowSetup(true);
            setSetupStep(1);
        } catch (error) {
            setError(error.message || 'Error al configurar 2FA');
        } finally {
            setIsSettingUp(false);
        }
    };

    // Verificar código durante setup inicial
    const handleVerifySetup = async (e) => {
        e.preventDefault();
        
        const validationError = validate2FAToken(token);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        try {
            // Verificar el código y completar el setup
            const result = await verify2FASetup(token, isFirstTimeSetup);
            
            if (isFirstTimeSetup && result.success) {
                // Si es setup inicial y fue exitoso, ya el hook maneja la navegación
                return;
            }
            
            // Si no es setup inicial, volver a intentar el login con 2FA
            if (!isFirstTimeSetup) {
                const loginResult = await loginWith2FA({ 
                    email, 
                    password, 
                    token_2fa: token 
                });
                
                if (!loginResult.success) {
                    setError(loginResult.error || MESSAGES.TWO_FA.INVALID_CODE);
                }
            }
        } catch (error) {
            setError(error.message || MESSAGES.TWO_FA.INVALID_CODE);
        }
    };

    // Login con código 2FA (usuario ya tiene 2FA configurado)
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
            setError(result.error || MESSAGES.TWO_FA.INVALID_CODE);
        }
    };

    const handleTokenChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setToken(value);
        if (error) setError('');
    };

    const formatToken = (value) => {
        // Formatear como XXX XXX para mejor legibilidad
        if (value.length > 3) {
            return value.slice(0, 3) + ' ' + value.slice(3);
        }
        return value;
    };

    // Si es primera vez y estamos en modo setup
    if (isFirstTimeSetup && showSetup) {
        return (
            <div className="auth2fa-container">
                <div className="dynamic-bg"></div>
                
                <div className="auth2fa-wrapper">
                    <div className="maintenance-header">
                        <div className="logo-container">
                            <div className="main-logo">SENTYA</div>
                            <div className="logo-accent"></div>
                        </div>
                        <h1 className="maintenance-title">
                            Configuración Obligatoria de Seguridad
                        </h1>
                        <span className="development-badge">PRIMERA VEZ</span>
                    </div>

                    {setupStep === 1 ? (
                        // Paso 1: Mostrar QR
                        <div className="setup-content">
                            <div className="security-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" 
                                          stroke="currentColor" strokeWidth="2"/>
                                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </div>
                            
                            <div className="setup-instructions">
                                <h3>📱 Configuración de Autenticación en Dos Pasos</h3>
                                <p className="setup-description">
                                    Para proteger tu cuenta, es obligatorio configurar la autenticación 
                                    de dos factores en tu primer inicio de sesión.
                                </p>
                                
                                <ol className="setup-steps">
                                    <li>
                                        <strong>Descarga una aplicación autenticadora</strong>
                                        <ul>
                                            <li>Google Authenticator</li>
                                            <li>Microsoft Authenticator</li>
                                            <li>Authy</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Escanea el código QR con la aplicación</strong>
                                    </li>
                                    <li>
                                        <strong>Ingresa el código de 6 dígitos que aparece en la app</strong>
                                    </li>
                                </ol>
                            </div>

                            {qrData?.qr_data_uri && (
                                <div className="qr-container">
                                    <img 
                                        src={qrData.qr_data_uri} 
                                        alt="Código QR para 2FA" 
                                        className="qr-code"
                                    />
                                    <p className="qr-note">
                                        📷 Escanea este código con tu aplicación autenticadora
                                    </p>
                                </div>
                            )}

                            <div className="manual-entry">
                                <details>
                                    <summary>¿No puedes escanear el código?</summary>
                                    <div className="manual-code">
                                        <p>Ingresa este código manualmente en tu aplicación:</p>
                                        <code className="secret-code">
                                            {qrData?.otpauth_uri?.split('secret=')[1]?.split('&')[0]}
                                        </code>
                                    </div>
                                </details>
                            </div>

                            <button 
                                className="primary-cta"
                                onClick={() => setSetupStep(2)}
                            >
                                Ya escaneé el código →
                            </button>
                        </div>
                    ) : (
                        // Paso 2: Verificar código
                        <div className="setup-content">
                            <div className="security-icon success">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </div>

                            <h3>✅ Verificación del Código</h3>
                            <p className="verification-description">
                                Ingresa el código de 6 dígitos que aparece en tu aplicación 
                                autenticadora para completar la configuración.
                            </p>

                            <form onSubmit={handleVerifySetup} className="token-form">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="000 000"
                                        value={formatToken(token)}
                                        onChange={handleTokenChange}
                                        className={`token-input large ${error ? 'error' : ''}`}
                                        maxLength="7"
                                        disabled={isLoading}
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    <label className="token-label">
                                        Código de verificación
                                    </label>
                                </div>
                                
                                {error && (
                                    <div className="error-message with-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="12" y1="8" x2="12" y2="12"/>
                                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                                        </svg>
                                        {error}
                                    </div>
                                )}
                                
                                <div className="button-group">
                                    <button 
                                        type="button"
                                        className="secondary-button"
                                        onClick={() => setSetupStep(1)}
                                        disabled={isLoading}
                                    >
                                        ← Volver al QR
                                    </button>
                                    
                                    <button 
                                        type="submit"
                                        className={`primary-button ${isLoading ? 'loading' : ''}`}
                                        disabled={isLoading || token.length !== 6}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="spinner"></div>
                                                Verificando...
                                            </>
                                        ) : (
                                            'Verificar y Continuar'
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="help-text">
                                <p>
                                    💡 <strong>Consejo:</strong> El código cambia cada 30 segundos. 
                                    Si no funciona, espera a que aparezca uno nuevo.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Vista normal de 2FA (usuario ya tiene 2FA configurado)
    return (
        <div className="auth2fa-container">
            <div className="dynamic-bg"></div>
            
            <div className="auth2fa-wrapper">
                <div className="maintenance-header">
                    <div className="logo-container">
                        <div className="main-logo">SENTYA</div>
                        <div className="logo-accent"></div>
                    </div>
                    <h1 className="maintenance-title">Verificación de Seguridad</h1>
                </div>

                <div className="maintenance-content">
                    <div className="security-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" 
                                  stroke="currentColor" strokeWidth="2"/>
                            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                    </div>

                    <p className="maintenance-description">
                        🔐 Ingresa el código de 6 dígitos de tu aplicación autenticadora 
                        para acceder al panel de administración.
                    </p>

                    <form onSubmit={handleLogin2FA} className="token-form">
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="000 000"
                                value={formatToken(token)}
                                onChange={handleTokenChange}
                                className={`token-input ${error ? 'error' : ''}`}
                                maxLength="7"
                                disabled={isLoading}
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        
                        {error && (
                            <div className="error-message with-icon">
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
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div>
                                    Verificando...
                                </>
                            ) : (
                                'Verificar Código'
                            )}
                        </button>
                    </form>

                    <div className="additional-options">
                        <details className="help-section">
                            <summary>¿Problemas con el código?</summary>
                            <div className="help-content">
                                <p>Si tienes problemas:</p>
                                <ul>
                                    <li>Verifica que la hora de tu dispositivo esté sincronizada</li>
                                    <li>Espera a que aparezca un nuevo código (cambia cada 30 segundos)</li>
                                    <li>Asegúrate de usar la cuenta correcta en tu app autenticadora</li>
                                </ul>
                            </div>
                        </details>
                    </div>
                </div>

                <div className="footer-section">
                    <p className="footer-text">Panel de Administración SENTYA - Acceso Seguro</p>
                </div>
            </div>
        </div>
    );
};

export default Auth2faPage;