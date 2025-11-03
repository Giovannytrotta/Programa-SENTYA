# fix_password.py
from app.extensions import db, bcrypt
from app.models.user import SystemUser
from app.main import app  # ✅ Importar desde app.main

with app.app_context():
    # Datos del usuario
    email_usuario = "admin@sentya.com"
    nueva_password = "admin1234"
    
    # Buscar usuario
    user = SystemUser.query.filter_by(email=email_usuario).first()
    
    if user:
        # Hashear correctamente la contraseña
        user.password = bcrypt.generate_password_hash(nueva_password).decode('utf-8')
        db.session.commit()
        print(f"✅ Contraseña actualizada exitosamente")
        print(f"Email: {user.email}")
        print(f"Nueva contraseña: {nueva_password}")
        print(f"\n🎉 Ya puedes hacer login con estas credenciales")
    else:
        print(f"❌ Usuario no encontrado: {email_usuario}")
        print("Verifica que el email sea correcto")