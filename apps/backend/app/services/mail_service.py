from jinja2 import TemplateNotFound
from flask_mail import Message
from app.extensions import mail
from flask import render_template,current_app
from flask_jwt_extended import create_access_token
from app.exceptions import AppError,ValidationError
import os
from dotenv import load_dotenv

load_dotenv()
FRONTEND_URL = os.getenv('FRONTEND_URL')

def send_reset_password_email(user_email: str)-> bool:
    #Envía el e-mail para restablecer contraseña. Lanza AppError si falla.
    if not user_email or "@" not in user_email:
        current_app.logger.error("send_reset_password_email: email inválido: %r", user_email)
        raise ValidationError("Email inválido para envío de restablecimiento.")
    expires = current_app.config["RESET_TOKEN_EXPIRES"]
    if not expires:
        current_app.logger.error("send_reset_password_email: falta RESET_TOKEN_EXPIRES en config")
        raise AppError("Configuración de expiración de token faltante.")
    try:
        token   = create_access_token(
            identity=user_email,
            expires_delta=expires,
            additional_claims={"purpose": "reset_password"}
        )
        reset_url = f"{os.getenv('FRONTEND_URL')}/reset-password?token={token}"
        minutes = current_app.config["RESET_TOKEN_EXPIRES"]
        print("minutes",minutes)
    
        html = render_template("emails/reset.html",reset_url=reset_url,minutes=minutes,app_name=current_app.config.get('APP_NAME') )
    
        msg = Message(subject=f"{current_app.config.get('APP_NAME')} - Restablece Tu Contraseña",recipients=[user_email],html=html)
        mail.send(msg)
        current_app.logger.info("Reset-password email sent to %s", user_email)
        
    except TemplateNotFound as template_error:
        current_app.logger.error("Template Not Found: %s", template_error)
        raise AppError("Plantilla de email de restablecimiento no encontrada.")
    except Exception as error: 
        current_app.logger.error("Error sending reset-password email to %s:%s", user_email,error)
        raise AppError("No se pudo enviar el correo de restablecimiento.")