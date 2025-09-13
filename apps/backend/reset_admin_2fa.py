# reset_admin_2fa.py
# Ejecutar desde apps/backend con: python reset_admin_2fa.py

from app.main import create_app
from app.extensions import db
from app.models.user import SystemUser

def reset_admin_2fa():
    """
    Resetea el admin para forzar configuración de 2FA en el próximo login
    """
    app = create_app()
    
    with app.app_context():
        # Buscar el usuario admin
        admin = SystemUser.query.filter_by(email='admin@sentya.com').first()
        
        if not admin:
            print("❌ Usuario admin no encontrado")
            print("   Verifica que las migraciones estén aplicadas")
            return False
        
        print(f"📧 Usuario encontrado: {admin.email}")
        print(f"   Nombre: {admin.name} {admin.last_name}")
        print(f"   2FA actual: {'Habilitado' if admin.two_factor_enabled else 'Deshabilitado'}")
        
        # Resetear configuración 2FA
        admin.two_factor_enabled = False
        admin.two_factor_secret = None
        admin.two_factor_enabled_at = None
        
        # Opcional: resetear last_login para simular primera vez
        # admin.last_login = None
        
        # Mantener activo para que pueda hacer login
        admin.is_active = True
        
        db.session.commit()
        
        print("\n✅ Admin reseteado exitosamente:")
        print("   - 2FA deshabilitado")
        print("   - Se pedirá configuración en el próximo login")
        print("\n🔑 Credenciales:")
        print("   Email: admin@sentya.com")
        print("   Password: admin1234")
        print("\n📱 En el próximo login se pedirá configurar 2FA obligatoriamente")
        
        return True

if __name__ == "__main__":
    reset_admin_2fa()