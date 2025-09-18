# ========== services/email_service.py ==========
from jinja2 import TemplateNotFound
from flask_mail import Message
from app.extensions import mail
from flask import render_template, current_app
from flask_jwt_extended import create_access_token
from app.exceptions import AppError, ValidationError
import os
from dotenv import load_dotenv

load_dotenv()
FRONTEND_URL = os.getenv('FRONTEND_URL')

def send_reset_2fa_email(user_email: str, user_name: str = None) -> bool:
    """Envía email para restablecer 2FA del usuario.
    Similar al reset de password pero para deshabilitar 2FA."""
    
    if not user_email or "@" not in user_email:
        current_app.logger.error("send_reset_2fa_email: email inválido: %r", user_email)
        raise ValidationError("Email inválido para envío de restablecimiento 2FA.")
    
    # Usar la misma configuración de tiempo que reset password
    expires = current_app.config["RESET_TOKEN_EXPIRES"]
    if not expires:
        current_app.logger.error("send_reset_2fa_email: falta RESET_TOKEN_EXPIRES en config")
        raise AppError("Configuración de expiración de token faltante.")
    
    try:
        # Crear token con propósito específico para 2FA reset
        token = create_access_token(
            identity=user_email,
            expires_delta=expires,
            additional_claims={"purpose": "reset_2fa"}
        )
        
        # URL para resetear 2FA
        reset_url = f"{FRONTEND_URL}/reset-2fa?token={token}"
        minutes = current_app.config["RESET_TOKEN_EXPIRES"]
        app_name = current_app.config.get('APP_NAME', 'SENTYA')
        
        # HTML del email sin template (generado directamente)
        
        # Crear y enviar mensaje
        html = render_template(
            "emails/reset_2fa.html",
            reset_url=reset_url,minutes=minutes,app_name=app_name,user_name=user_name
        )
        
        msg = Message(
            subject=f"{app_name} - Restablecer Autenticación 2FA",
            recipients=[user_email],
            html=html
        )
        
        mail.send(msg)
        return True
        
    except TemplateNotFound:
        raise AppError("Plantilla de email de restablecimiento 2FA no encontrada.")
    except Exception as error:
        current_app.logger.error("Error sending reset-2FA email: %s", error)
        raise AppError("No se pudo enviar el correo de restablecimiento 2FA.")