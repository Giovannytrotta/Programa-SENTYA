import qrcode, io, base64
from functools import wraps
from flask_jwt_extended import JWTManager,create_access_token,get_jwt,jwt_required
from app.models.user import SystemUser
from app.exceptions import ValidationError
import re

def build_qr_data_uri(otpauth_uri):
        """Generador de codigo QR para frontend"""
        qr = qrcode.QRCode(
            version= 1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=5
        )
        qr.add_data(otpauth_uri)
        qr.make(fit=True)
        # Convertimos a imagen
        img = qr.make_image(fill_color="black", back_color="white")
        
        #Convertimos a base64 para enviar al frontend permitimos la transferencia y el almacenamiento seguro de datos binarios
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')                              #   POR VERIFICAR ESTRUCTURA
        img_base64 = base64.b64encode(buffer.getvalue()).decode()   # 
        return f"data:image/png;base64,{img_base64}"                #
    
def issue_tokens_for_user(user: SystemUser):
    claims = {"role": user.rol.value, "email": user.email}
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    return access_token

# ==========                                     ==========
# ==========  VALIDACIÓN DE NUMERO DE TELEFONO   ==========
# ==========                                     ==========

def normalize_phone_number(clean_phone):
    """
    Normaliza números de teléfono para almacenamiento.
    Los números españoles sin código se les agrega +34 automáticamente.
    """
    # Si es un número español local (9 dígitos que empiezan con 6-9), agregar +34
    if re.match(r'^[6-9]\d{8}$', clean_phone):
        return f"+34{clean_phone}"
    
    # Si ya tiene código pero no tiene +, agregarlo
    if len(clean_phone) > 0 and clean_phone[0] != '+' and len(clean_phone) > 9:
        return f"+{clean_phone}"
    
    # Si ya tiene +, devolverlo tal como está
    if len(clean_phone) > 0 and clean_phone[0] == '+':
        return clean_phone
    
    # Por defecto, devolver tal como está
    return clean_phone

def validate_international_phone(phone_number):
    """
    Valida números de teléfono internacionales con formatos flexibles.
    
    Retorna: (is_valid: bool, result: str)
    - Si es válido: (True, número_normalizado)  
    - Si es inválido: (False, mensaje_error)
    Ejemplos:
    - validate_international_phone("612345678") → (True, "+34612345678")
    - validate_international_phone("+39333123456") → (True, "+39333123456") 
    - validate_international_phone("123") → (False, "El teléfono debe tener entre 9 y 16 dígitos")
    """
    if not phone_number:
        raise ValidationError("El teléfono no puede estar vacío")
    
    # Limpiar el número: quitar espacios, guiones, paréntesis
    clean_phone = re.sub(r'[\s\-\(\)\.]', '', phone_number.strip())
    
    # Verificar longitud general (no muy corto, no muy largo)
    if len(clean_phone) < 9 or len(clean_phone) > 16:
        raise ValidationError("El teléfono debe tener entre 9 y 16 dígitos")
    
    # Verificar que solo contenga números, + y caracteres permitidos
    if not re.match(r'^[\+\d\s\-\(\)\.]+$', phone_number):
        raise ValidationError("El teléfono solo puede contener números, +, espacios, guiones y paréntesis")
    
    # Patrones aceptados
    patterns = [
        # Números internacionales (OBLIGATORIO código de país para extranjeros)
        r'^\+?34[6-9]\d{8}$',    # España: +34 6XXXXXXXX (permite sin +)
        r'^\+39[3]\d{8,9}$',     # Italia: +39 3XXXXXXXX (OBLIGATORIO +39)
        r'^\+33[6-7]\d{8}$',     # Francia: +33 6XXXXXXXX (OBLIGATORIO +33)  
        r'^\+49[1]\d{9,10}$',    # Alemania: +49 1XXXXXXXXX (OBLIGATORIO +49)
        r'^\+351[9]\d{8}$',      # Portugal: +351 9XXXXXXXX (OBLIGATORIO +351)
        r'^\+1[2-9]\d{9}$',      # EEUU/Canadá: +1 XXXXXXXXXX (OBLIGATORIO +1)
        
        # SOLO números españoles pueden ir sin código de país (son locales por defecto)
        r'^[6-9]\d{8}$',         # Móvil español local (se asume +34)
    ]
    
    # Probar cada patrón
    for pattern in patterns:
        if re.match(pattern, clean_phone):
            # Normalizar el número para almacenamiento
            normalized_phone = normalize_phone_number(clean_phone)
            return normalized_phone
    
    # Si no coincide con ningún patrón
    raise ValidationError("Formato no válido.")

