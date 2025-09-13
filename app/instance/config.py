import os
from dotenv import load_dotenv
from datetime            import timedelta

# Cargar variables de entorno desde .env
load_dotenv()

class Config:
    #CONFIGURACION PARA SEPARACION DE DE ROLES EN LA APLICACION POR INSTANCIA CREADO EXTENSIONS.PY
    #Y ACA MANEJAMOS TODA LA CONFIGURACION DE LA APP COMO JWT BASE DE DATOS CONFIRM/TOKEN Y CUALQUIER OTRA
#INSTANCIA QUE NECESITE CONFIGURACION 
#APLICADO ESTE METODO DE TRABAJO PARA FORMA MAS LIMPIA Y ESCALABLE

# ─── Base de datos ──────────────────────────────────────────────────────
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = os.getenv("DB_NAME")
    # Cadena de conexión creada con una f-string  insertar expresiones de Python encerrandolas en {}
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS= False
    
     # ─ Claves generales ───────────────────────────────────────────────────
    # SECRET_KEY = os.getenv('SECRET_KEY')
    # APP_NAME = os.getenv('APP_NAME')
    
    # ─── CONFIGURACION DE JWT ────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY            = os.getenv("JWT_SECRET_KEY")
    JWT_TOKEN_LOCATION        = ["cookies"]#Indica que los JWT se almacenarán y leerán desde cookies
    JWT_ACCESS_COOKIE_NAME    = "accessToken"#Nombre de la cookie donde se guarda el access token (HttpOnly).
    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(days=int(os.getenv("JWT_ACCESS_DAYS"))) #TIEMPO DE EXPIRACION DEL TOKEN
    JWT_COOKIE_SECURE         = False # HTTPS only RECORDAR CAMBIAR A TRUE PARA PRODUCCION
    JWT_COOKIE_CSRF_PROTECT   = False #Activa protección CSRF: la librería generará un token extra y exigirá su envío. NOTA ACTIVAR LUEGO
    # JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_DAYS"))) #TIEMPO DE EXPIRACION DEL TOKEN REFRESH
    # JWT_REFRESH_COOKIE_NAME   = "refreshToken"#Nombre de la cookie donde se guarda el refresh token (HttpOnly).
    # JWT_ACCESS_CSRF_COOKIE_NAME  = "csrf_access_token" #Nombre de la cookie con el CSRF token para access
    # JWT_REFRESH_CSRF_COOKIE_NAME = "csrf_refresh_token" # Nombre de la cookie con el CSRF token para refresh
    # CONFIRM_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("CONFIRM_TOKEN_MIN", 30))) #CONFIRMACION DURACION
    # RESET_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("RESET_TOKEN_MIN", 15))) #CONFIRMACION DURACION
    
    
    #JWT_COOKIE_SAMESITE = 'Lax' #mitigar ataques CSRF básicos en enlaces cross-site POR APLICAR
    #Cambiar en produccion cuando JWT_COOKIE_SECURE este en True

    
    
    