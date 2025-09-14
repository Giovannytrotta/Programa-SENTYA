// pages/Auth2faPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import "./AuthAdmin2fa.css";

const Auth2faPage = () => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [qrData, setQrData] = useState(null);
    const [showSetup, setShowSetup] = useState(false);
    const [isSettingUp, setIsSettingUp] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();
    
    // Datos del login anterior (enviados desde LoginAdmin)
    const { email, password, isFirstTimeSetup } = location.state || {};
    
    // Hook de autenticación
    const { 
        loginWith2FA, 
        setup2FA, 
        verify2FASetup, 
        isLoading, 
        clearErrors 
    } = useAuth();

    useEffect(() => {
        // Si no hay credenciales del login anterior, redirigir al login
        if (!email || !password) {
            navigate('/aossadmin');
            return;
        }
        
        // Si es primera vez (setup inicial), mostrar QR automáticamente
        if (isFirstTimeSetup) {
            handleSetup2FA();
        }
    }, [email, password, navigate, isFirstTimeSetup]);

    // Configurar 2FA por primera vez
    const handleSetup2FA = async () => {
        setIsSettingUp(true);
        try {
            const response = await setup2FA();
            setQrData(response);
            setShowSetup(true);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsSettingUp(false);
        }
    };

    // Verificar código durante setup inicial
    const handleVerifySetup = async (e) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(token)) {
            setError('El código debe tener 6 dígitos');
            return;
        }

        try {
            await verify2FASetup(token);
            // Después de configurar 2FA, hacer login con el token
            const result = await loginWith2FA({ email, password, token_2fa: token });
            if (!result.success) {
                setError(result.error || 'Error en la verificación');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    // Login con código 2FA (usuario ya tiene 2FA configurado)
    const handleLogin2FA = async (e) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(token)) {
            setError('El código debe tener 6 dígitos');
            return;
        }

        const result = await loginWith2FA({ email, password, token_2fa: token });
        if (!result.success) {
            setError(result.error || 'Código incorrecto');
        }
    };

    const handleTokenChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setToken(value);
        if (error) setError('');
    };

    // Si estamos en modo setup
    if (showSetup) {
        return (
            <div className="auth2fa-container">
                <div className="dynamic-bg"></div>
                
                <div className="auth2fa-wrapper">
                    <div className="maintenance-header">
                        <div className="logo-container">
                            <div className="main-logo">AOSSA</div>
                            <div className="logo-accent"></div>
                        </div>
                        <h1 className="maintenance-title">Configurar Autenticación 2FA</h1>
                    </div>

                    <div className="setup-content">
                        <div className="qr-container">
                            {qrData?.qr_data_uri && (
                                <img 
                                    src={qrData.qr_data_uri} 
                                    alt="QR Code para 2FA" 
                                    className="qr-code"
                                />
                            )}
                        </div>
                        
                        <div className="setup-instructions">
                            <h3>Pasos para configurar:</h3>
                            <ol>
                                <li>Descarga Google Authenticator o similar</li>
                                <li>Escanea el código QR</li>
                                <li>Ingresa el código de 6 dígitos</li>
                            </ol>
                        </div>

                        <form onSubmit={handleVerifySetup} className="token-form">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Código de 6 dígitos"
                                    value={token}
                                    onChange={handleTokenChange}
                                    className={`token-input ${error ? 'error' : ''}`}
                                    maxLength="6"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>
                            
                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}
                            
                            <button 
                                type="submit"
                                className={`verify-button ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading || token.length !== 6}
                            >
                                {isLoading ? 'Verificando...' : 'Verificar y Continuar'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth2fa-container">
            <div className="dynamic-bg"></div>
            
            <div className="auth2fa-wrapper">
                <div className="maintenance-header">
                    <div className="logo-container">
                        <div className="main-logo">AOSSA</div>
                        <div className="logo-accent"></div>
                    </div>
                    <h1 className="maintenance-title">Autenticación de Dos Factores</h1>
                </div>

                <div className="maintenance-content">
                    <div className="security-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>

                    <p className="maintenance-description">
                        Ingresa el código de 6 dígitos de tu aplicación autenticadora.
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
                            />
                        </div>
                        
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}
                        
                        <button 
                            type="submit"
                            className={`verify-button ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading || token.length !== 6}
                        >
                            {isLoading ? 'Verificando...' : 'Verificar Código'}
                        </button>
                    </form>

                    <div className="setup-option">
                        <p>¿Primera vez usando 2FA?</p>
                        <button 
                            onClick={handleSetup2FA}
                            className="setup-button"
                            disabled={isSettingUp}
                        >
                            {isSettingUp ? 'Configurando...' : 'Configurar 2FA'}
                        </button>
                    </div>
                </div>

                <div className="action-buttons">
                    <Link to="/aossadmin" className="back-button">
                        <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="button-text">Volver al Login</span>
                    </Link>
                </div>

                <div className="footer-section">
                    <p className="footer-text">Panel de Administración AOSSA</p>
                </div>
            </div>
        </div>
    );
};

export default Auth2faPage;