from sqlalchemy import String, Boolean, Integer, DateTime, Date, Text, Enum,ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List,Optional,TYPE_CHECKING
from datetime import datetime,timezone
from app.extensions import db 
import enum
import pyotp


#Para generar codigos QR e implementacion de authenticacion en dos pasos instalamos las siguientes dependencias principales:
# pyotp, qrcode[pil], pillow 
# pyotp: TOTP generacion y verificacion de TOTP
#  RFC 6238 compliant (estándar oficial)
#  Compatible con Google Authenticator, Authy, etc.
# qrcode[pil]:# QR Code generation (incluye pillow automaticamente) qrcode[pil]==7.4.2
#  Librería QR más usada en Python (confiable)  
#  Control total sobre calidad y tamaño
# Fácil conversión a base64 para web
# pillow:
#  Estándar de la industria para imágenes Python
#  Usado por Django, Flask, FastAPI, etc.
#  Soporte para PNG, JPEG, WebP, etc.
#  Optimización automática de imágenes
# ¿Qué instala qrcode[pil]?
# - qrcode (librería principal QR)
# - pillow (manejo de imágenes)
# - colorama  (colores en terminal)

if TYPE_CHECKING:
    from .css import Css
    from .workshops import Workshop
    from .audit_logs import AuditLog
    from .attendance import Attendance
    from .thematic_areas import ThematicArea
    from .sessions import Session
    from .workshop_users import WorkshopUser
    
    
class AuthProvider(enum.Enum):
    MICROSOFT = "microsoft" #Preparado para posible fase dos con Microsoft 365 integration
    LOCAL = "local"
    
class UserRole(enum.Enum):
    ADMINISTRATOR = "administrator"
    COORDINATOR = "coordinator"
    PROFESSIONAL = "professional"
    CSS_TECHNICIAN = "css_technician"
    CLIENT = "client" # <- Para usuarios con login local
    PENDING = "pending"
    
class SystemUser(db.Model):
    __tablename__="system_users"
    #Campos básicos
    id: Mapped[int] = mapped_column(Integer(),primary_key=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(150), nullable=False)
    # Autenticación ESTE CAMPO LO VAMOS A AGREGAR PARA UNA SEGUNDA VERSION DE MOMENTO SE DEJA COMENTADO
    # auth_provider: Mapped[AuthProvider] = mapped_column(Enum(AuthProvider), default=AuthProvider.LOCAL, nullable=False,comment="Solo LOCAL por ahora, MICROSOFT para posible Fase 2") 
    password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="Solo para auth_provider=LOCAL") 
    #autenticacion 2 pasos
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False,comment="Si el usuario tiene 2FA habilitado")
    two_factor_secret: Mapped[Optional[str]] = mapped_column(String(64), nullable=True,comment="Secret Base32 para TOTP - SE ALMACENA EN BD LOCAL")#pyotp.random_base32() secret compartido entre servidor y cliente
    two_factor_enabled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)#"Última vez que usó 2FA"

    #PARA AGREGAR A OTRA VERSION MAS ROBUSTA FASE 2 - ROBUSTEZ 2FA (comentados para roadmap)
    #two_factor_last_counter: Mapped[Optional[int]] = mapped_column(Integer, nullable=True,comment="Último time-step TOTP aceptado (previene replay)")
    #two_factor_locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True,comment="Si está bloqueado por rate limiting, hasta cuándo")
    #two_factor_setup_complete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False,comment="Si completó la configuración inicial de 2FA")#Usuario click "habilitar 2FA Sistema genera secret, muestra QR
    #backup_codes: Mapped[Optional[str]] = mapped_column(Text)#Código de emergencia por si pierdes el teléfono
    #failed_2fa_attempts: Mapped[int] = mapped_column(Integer, default=0)#Que hace? Contador de intentos fallidos consecutivos, bloquear después de X fallos
    # Campos específicos para clientes 
    dni: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, comment='DNI obligatorio para identificación')#Campos específicos para clientes (cuando auth_provider=local)
    #campo edad
    age: Mapped[str] = mapped_column(String(20))
    # contacto
    phone: Mapped[str] = mapped_column(String(20))
    birth_date: Mapped[Date] = mapped_column(Date)
    address: Mapped[Optional[str]] = mapped_column(Text)
    observations: Mapped[Optional[str]] = mapped_column(Text)
    # Sistema de roles y organizacion
    rol: Mapped[UserRole] = mapped_column(Enum(UserRole),default=UserRole.PENDING,nullable=False)
    css_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('css.id'), nullable=True)
    # Control de estado
    is_active: Mapped[bool] = mapped_column(Boolean(),default=True)
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(),default=lambda: datetime.now(timezone.utc))#AGREGADO
    updated_at: Mapped[datetime] = mapped_column(DateTime(), default=lambda: datetime.now(timezone.utc))
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('system_users.id'))
    #Relaciones
    css = relationship("Css", back_populates="system_users")
    created_workshops = relationship("Workshop", foreign_keys="Workshop.created_by", back_populates="creator")
    assigned_workshops = relationship("Workshop", foreign_keys="Workshop.professional_id", back_populates="professional")
    workshop_assignments = relationship("WorkshopUser", foreign_keys="WorkshopUser.user_id",back_populates="user")
    sessions_taught = relationship("Session", foreign_keys="Session.professional_id", back_populates="professional")
    attendances = relationship("Attendance", foreign_keys="Attendance.user_id", back_populates="user")
    attendances_recorded = relationship("Attendance", foreign_keys="Attendance.recorded_by", back_populates="recorder")
    audit_logs = relationship("AuditLog", back_populates="user")
    
    def generate_2fa_secret(self):
        """Genera un secreto para 2FA DÓNDE SE ALMACENA -> En la BD local, campo two_factor_secret"""
        if not self.two_factor_secret:
            self.two_factor_secret = pyotp.random_base32()
            db.session.commit()
        return self.two_factor_secret
    
    def get_2fa_uri(self):
        """Genera URI para el código QR de 2FA Generamos el código QR para configurar app authenticator"""
        if not self.two_factor_secret:
            return None
        # Crear URI compatible con apps authenticator
        return pyotp.totp.TOTP(self.two_factor_secret).provisioning_uri(
            name=self.email,  # Nombre que aparece en la app
            issuer_name="SENTYA"  # Nombre de tu aplicación
        )
    
    def verify_2fa_token(self, token):
        """Verifica el token de 2FA. OJO: NO depende de two_factor_enabled, así permite verificar durante el setup."""
        if not self.two_factor_secret:
            return False

        token = (token or "").strip().replace(" ", "")
        if len(token) != 6 or not token.isdigit():
            return False

        totp = pyotp.TOTP(self.two_factor_secret)
        is_valid = totp.verify(token, valid_window=1)  # 30 tolerancia
        if is_valid:
            #FASE aqui dejamos la primera vez que authentica con 2 pasos
            self.two_factor_enabled_at = datetime.now(timezone.utc)
            db.session.commit()
        return is_valid
    
    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "last_name": self.last_name,
            "rol": self.rol.value,#Le pasamos value para referirnos al valor del rol (descripcion,estado,identificador numerico)
            "auth_provider": self.auth_provider.value,
            "created_at": self.created_at,
            "is_active": self.is_active
        }