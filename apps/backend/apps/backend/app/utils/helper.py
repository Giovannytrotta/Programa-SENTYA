import qrcode, io, base64
from functools import wraps
from flask_jwt_extended import JWTManager,create_access_token,get_jwt,jwt_required
from app.models.user import SystemUser

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
    
