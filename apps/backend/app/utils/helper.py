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
        # ESPAÑA (ÚNICO que puede ir sin código - local)
        r'^[6-9]\d{8}$',              # Móvil español local (se asume +34)
        r'^\+?34[6-9]\d{8}$',         # España: +34 6XXXXXXXX
        
        # EUROPA OCCIDENTAL
        r'^\+33[6-7]\d{8}$',          # Francia: +33 6/7XXXXXXXX
        r'^\+39[3]\d{8,9}$',          # Italia: +39 3XXXXXXXX
        r'^\+49[1]\d{9,10}$',         # Alemania: +49 1XXXXXXXXX
        r'^\+351[9]\d{8}$',           # Portugal: +351 9XXXXXXXX
        r'^\+44[7]\d{9}$',            # Reino Unido: +44 7XXXXXXXXX
        r'^\+31[6]\d{8}$',            # Países Bajos: +31 6XXXXXXXX
        r'^\+32[4]\d{8}$',            # Bélgica: +32 4XXXXXXXX
        r'^\+41[7-8]\d{8}$',          # Suiza: +41 7X/8XXXXXXXX
        r'^\+43[6-9]\d{8,9}$',        # Austria: +43 6XXXXXXXXX
        
        # EUROPA NÓRDICA
        r'^\+45[2-9]\d{7}$',          # Dinamarca: +45 XXXXXXXX
        r'^\+46[7]\d{8}$',            # Suecia: +46 7XXXXXXXX
        r'^\+47[4-9]\d{7}$',          # Noruega: +47 XXXXXXXX
        
        # EUROPA ORIENTAL
        r'^\+48[5-9]\d{8}$',          # Polonia: +48 5/6/7/8/9XXXXXXXX
        r'^\+420[6-7]\d{8}$',         # República Checa: +420 6/7XXXXXXXX
        r'^\+421[9]\d{8}$',           # Eslovaquia: +421 9XXXXXXXX
        r'^\+36[2-7]\d{8}$',          # Hungría: +36 20/30/31/70XXXXXXX
        r'^\+40[7]\d{8}$',            # Rumanía: +40 7XXXXXXXX
        r'^\+359[8-9]\d{8}$',         # Bulgaria: +359 8X/9XXXXXXXX
        r'^\+30[6-9]\d{8}$',          # Grecia: +30 69XXXXXXXX
        r'^\+90[5]\d{9}$',            # Turquía: +90 5XXXXXXXXX
        
        # AMÉRICA
        r'^\+1[2-9]\d{9}$',           # EEUU/Canadá: +1 XXXXXXXXXX
        r'^\+52[1-9]\d{9}$',          # México: +52 1XXXXXXXXXX
        r'^\+54[9]\d{9}$',            # Argentina: +54 9XXXXXXXXX
        r'^\+55[1-9]\d{10}$',         # Brasil: +55 11XXXXXXXXX
        r'^\+56[9]\d{8}$',            # Chile: +56 9XXXXXXXX
        r'^\+57[3]\d{9}$',            # Colombia: +57 3XXXXXXXXX
        r'^\+58[4]\d{9}$',            # Venezuela: +58 4XXXXXXXXX
        r'^\+51[9]\d{8}$',            # Perú: +51 9XXXXXXXX
        r'^\+593[9]\d{8}$',           # Ecuador: +593 9XXXXXXXX
        r'^\+595[9]\d{8}$',           # Paraguay: +595 9XXXXXXXX
        r'^\+598[9]\d{7}$',           # Uruguay: +598 9XXXXXXX
        r'^\+591[6-7]\d{7}$',         # Bolivia: +591 6X/7XXXXXXX
    ]
    
    # Probar cada patrón
    for pattern in patterns:
        if re.match(pattern, clean_phone):
            # Normalizar el número para almacenamiento
            normalized_phone = normalize_phone_number(clean_phone)
            return normalized_phone
    
    # Si no coincide con ningún patrón
    raise ValidationError("Formato no válido.")

