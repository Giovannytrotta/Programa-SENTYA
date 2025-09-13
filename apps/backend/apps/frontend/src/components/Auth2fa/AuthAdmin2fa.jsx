import React from "react"
import { Link } from "react-router-dom"
import "./AuthAdmin2fa.css"

const Auth2fa = () => {
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
                    <div className="development-badge">En Desarrollo</div>
                </div>

                <div className="maintenance-content">
                    <div className="security-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>

                    <p className="maintenance-description">
                        Estamos implementando una capa adicional de seguridad para proteger tu cuenta.
                        Esta funcionalidad incluirá códigos QR para la autenticación de dos factores.
                    </p>

                    <div className="feature-showcase">
                        <div className="feature-item">
                            <div className="feature-icon">📱</div>
                            <span>Códigos QR seguros</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🔐</div>
                            <span>Protección avanzada</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">⚡</div>
                            <span>Configuración rápida</span>
                        </div>
                    </div>

                    <div className="progress-container">
                        <div className="progress-header">
                            <span className="progress-label">Progreso de desarrollo</span>
                            <span className="progress-value">75%</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill"></div>
                        </div>
                    </div>

                    <div className="team-message">
                        <div className="message-content">
                            <p>
                                Nuestro equipo de backend está trabajando intensamente en esta funcionalidad.
                            </p>
                            <p className="team-note">
                                Los backenders son así... pero créenos, ¡vale la pena la espera! 🫀🩹🥀❤️‍🩹
                            </p>
                        </div>
                    </div>
                </div>

                <div className="action-buttons">
                    <Link to="/aossadmin/dashboard" className="primary-button">
                        <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="button-text">Ir al Dashboard</span>
                    </Link>

                    <button className="secondary-button">
                        <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="button-text">Notificarme</span>
                    </button>
                </div>

                <div className="footer-section">
                    <p className="footer-text">Panel de Administración AOSSA</p>
                </div>
            </div>
        </div>
    )
}

export default Auth2fa;