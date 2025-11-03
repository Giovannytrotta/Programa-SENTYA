# 📋 SENTYA - Especificaciones Técnicas para Deploy

## 🎯 Información General del Proyecto

**Nombre:** Sistema SENTYA (Sistema de Gestión de Talleres Sociales)  
**Tipo:** Aplicación Web Full-Stack (Monorepo)  
**Estructura:** Frontend (React) + Backend (Flask Python)  
**Base de Datos:** PostgreSQL

---

## 📦 Estructura del Proyecto

```
Programa-SENTYA/
├── apps/
│   ├── backend/          # API Flask
│   │   ├── app/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── extensions.py
│   │   │   └── main.py
│   │   ├── migrations/
│   │   ├── Pipfile
│   │   ├── Pipfile.lock
│   │   └── requirements.txt
│   └── frontend/         # Cliente React
│       ├── src/
│       ├── package.json
│       └── vite.config.js
└── requirements.txt
```

---

## 🐍 Backend - Flask API

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| **Runtime** | Python | 3.13 |
| **Framework** | Flask | 3.1.2 |
| **ORM** | SQLAlchemy | 2.0.43 |
| **Migraciones** | Alembic | 1.12.1 |
| **Servidor WSGI** | Gunicorn | 21.2.0 |
| **Base de Datos** | PostgreSQL | 12+ (recomendado 14+) |

### Dependencias Principales

```txt
# Core Framework
Flask==3.1.2
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.1.0
Flask-CORS==4.0.0

# Autenticación y Seguridad
Flask-JWT-Extended==4.7.1
Flask-Bcrypt==1.0.1
authlib==1.2.1
python-jose==3.3.0
pyotp==2.9.0            # 2FA (TOTP)
qrcode==8.2             # Generación QR 2FA
Pillow==11.3.0          # Procesamiento imágenes

# Base de Datos
psycopg==3.2.9
psycopg2-binary==2.9.10
alembic==1.12.1

# Serialización y Validación
marshmallow==3.20.1
marshmallow-sqlalchemy==1.4.2
Flask-Marshmallow==1.3.0

# API REST
Flask-RESTX==1.3.0

# Email
Flask-Mail==0.10.0

# Testing
pytest==7.4.2
pytest-flask==1.3.0
pytest-cov==4.1.0

# Utils
python-dotenv==1.1.1
```

### Variables de Entorno Requeridas

Crear archivo `.env` en `apps/backend/`:

```bash
# Aplicación
APP_NAME=SENTYA
SECRET_KEY=<generar-clave-segura-produccion>

# JWT
JWT_SECRET_KEY=<generar-clave-segura-jwt>
JWT_ACCESS_DAYS=7

# Base de Datos PostgreSQL
DB_USER=<usuario_postgres>
DB_PASSWORD=<password_segura>
DB_HOST=<host_bd>        # localhost o IP del servidor
DB_PORT=5432
DB_NAME=sentya_db

# Email (para recuperación de contraseña)
MAIL_SERVER=smtp.gmail.com    # o tu servidor SMTP
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=<correo@ejemplo.com>
MAIL_PASSWORD=<password_app_correo>
MAIL_DEFAULT_SENDER=<correo@ejemplo.com>
RESET_TOKEN_MIN=15

# URLs
FRONTEND_URL=https://tudominio.com
BACKEND_URL=https://api.tudominio.com

# Flask
FLASK_APP=app/main.py
FLASK_DEBUG=False  #  SIEMPRE False en producción
```

### Comandos de Ejecución

#### Desarrollo Local
```bash
cd apps/backend
pipenv install
pipenv run start  # Corre en puerto 3001
```

#### Producción

```bash
cd apps/backend
pip install --break-system-packages -r requirements.txt
flask db upgrade  # Ejecutar migraciones
gunicorn -w 4 -b 0.0.0.0:3001 app.main:app
```

### Configuración de Base de Datos

**PostgreSQL 12+** es requerido. El sistema usa:
- **Schemas:** 8 tablas principales
- **Relaciones:** Foreign Keys entre usuarios, talleres, sesiones, asistencias
- **Migraciones:** Alembic (carpeta `migrations/`)

**Pasos de inicialización:**

```bash
flask db init      # Solo primera vez
flask db migrate   # Generar migración
flask db upgrade   # Aplicar cambios
```

---

## ⚛️ Frontend - React + Vite

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| **Runtime** | Node.js | 18+ |
| **Framework** | React | 19.1.1 |
| **Build Tool** | Vite | 7.1.2 |
| **Routing** | React Router DOM | 7.8.1 |

### Dependencias Principales

```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.8.1",
    "axios": "^1.11.0",
    "lucide-react": "^0.544.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.1.2",
    "vitest": "^3.2.4",
    "@testing-library/react": "^16.3.0"
  }
}
```

### Variables de Entorno

Crear archivo `.env` en `apps/frontend/`:

```bash

VITE_API_URL=https://api.tudominio.com
VITE_APP_NAME=SENTYA

```

### Comandos de Ejecución

#### Desarrollo Local

```bash
cd apps/frontend
npm install
npm run dev  # Corre en puerto 5173
```

#### Build de Producción
```bash
cd apps/frontend
npm install
npm run build  # Genera carpeta dist/
```

### Servir Frontend en Producción

**Opciones:**
1. **Nginx** (recomendado):
```nginx
server {
    listen 80;
    server_name tudominio.com;
    root /ruta/a/apps/frontend/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:3001;
    }
}
```

2. **Vercel / Netlify** (Static)
3. **Servir desde Flask** (no recomendado en producción)

---

## 🗄️ Base de Datos PostgreSQL

### Requisitos
- **Versión mínima:** PostgreSQL 12
- **Versión recomendada:** PostgreSQL 14+
- **Extensiones:** Ninguna específica requerida

### Esquema de Base de Datos

```sql
-- Tablas principales (8):
- system_users      # Usuarios del sistema
- css               # Centros de Servicios Sociales
- thematic_areas    # Áreas temáticas
- workshops         # Talleres
- sessions          # Sesiones de talleres
- workshop_users    # Inscripciones
- attendances       # Asistencias
- audit_logs        # Logs de auditoría
```

### Configuración Inicial

```bash
# Crear base de datos
psql -U postgres
CREATE DATABASE sentya_db;
CREATE USER sentya_user WITH PASSWORD 'password_segura';
GRANT ALL PRIVILEGES ON DATABASE sentya_db TO sentya_user;
\q

# Aplicar migraciones
cd apps/backend
flask db upgrade
```

### Datos Semilla

El proyecto incluye migraciones con datos iniciales:

- **14 Centros CSS** (Sevilla)
- **6 Áreas Temáticas** predefinidas
- **Usuario Admin** por defecto:
  - Email: `admin@sentya.com`
  - Password: `admin1234` **CAMBIAR EN PRODUCCIÓN**

---

## 🔐 Seguridad y Autenticación

### Sistema de Autenticación
- **JWT** almacenado en cookies `HttpOnly`
- **Autenticación 2FA** (TOTP) con PyOTP
- **Códigos QR** para configurar apps authenticator
- **Bcrypt** para hash de contraseñas

### Roles de Usuario

```python
ADMINISTRATOR    # Control total
COORDINATOR      # Gestión de talleres
PROFESSIONAL     # Imparte talleres
CSS_TECHNICIAN   # Técnico de centro
CLIENT           # Usuario inscrito
PENDING          # Pendiente de aprobación
```

### Checklist de Seguridad en Producción

- [ ] Cambiar `SECRET_KEY` y `JWT_SECRET_KEY`
- [ ] Activar `JWT_COOKIE_SECURE=True` (HTTPS)
- [ ] Activar `JWT_COOKIE_CSRF_PROTECT=True`
- [ ] Cambiar contraseña admin por defecto
- [ ] Configurar CORS solo para dominio específico
- [ ] Usar variables de entorno (no hardcodear secretos)
- [ ] Configurar rate limiting en Nginx/API Gateway
- [ ] Backup automático de PostgreSQL

---

##  Opciones de Deploy

### Opción 1: VPS (DigitalOcean, Linode, AWS EC2)

**Backend:**
```bash
# Instalar Python 3.13
sudo apt update
sudo apt install python3.13 python3.13-venv

# Clonar proyecto
git clone <tu-repo>
cd apps/backend
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar systemd
sudo nano /etc/systemd/system/sentya-backend.service
```

**Service file:**
```ini
[Unit]
Description=SENTYA Backend API
After=network.target

[Service]
User=www-data
WorkingDirectory=/ruta/a/apps/backend
Environment="PATH=/ruta/a/venv/bin"
ExecStart=/ruta/a/venv/bin/gunicorn -w 4 -b 0.0.0.0:3001 app.main:app

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable sentya-backend
sudo systemctl start sentya-backend
```

**Frontend:**
```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

cd apps/frontend
npm install
npm run build

# Servir con Nginx
sudo cp -r dist/* /var/www/sentya/
```

### Opción 2: Docker (Recomendado)

**Dockerfile Backend:**
```dockerfile
FROM python:3.13-slim

WORKDIR /app
COPY apps/backend/ .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 3001
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:3001", "app.main:app"]
```

**Dockerfile Frontend:**

```dockerfile
FROM node:18 AS build
WORKDIR /app
COPY apps/frontend/ .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

**docker-compose.yml:**
```yaml

version: '3.8'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: sentya_db
      POSTGRES_USER: sentya_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./apps/backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://sentya_user:${DB_PASSWORD}@db:5432/sentya_db
    depends_on:
      - db

  frontend:
    build: ./apps/frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Opción 3: Serverless/PaaS

**Backend:** Heroku, Railway, Render
**Frontend:** Vercel, Netlify
**Database:** Supabase, AWS RDS

---

##  Recursos Necesarios

### Servidor Backend
- **CPU:** 2 cores mínimo
- **RAM:** 2GB mínimo (4GB recomendado)
- **Disco:** 20GB
- **Python:** 3.13

### Servidor Frontend
- **Node.js:** 18+
- **RAM:** 1GB para build
- **Disco:** 500MB

### Base de Datos
- **RAM:** 1GB mínimo
- **Disco:** 10GB inicial
- **Conexiones:** 20-50 concurrentes

---

## 🔧 Configuraciones Adicionales

### CORS (Producción)

En `apps/backend/app/main.py`:
```python
CORS(app, 
    origins=['https://tudominio.com'],  # Solo tu dominio
    methods=['GET', 'POST', 'PUT', 'DELETE'],
    allow_headers=['Content-Type', 'Authorization'],
    supports_credentials=True
)
```

### Nginx Reverse Proxy

```nginx
upstream backend {
    server localhost:3001;
}

server {
    listen 443 ssl;
    server_name api.tudominio.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

##  Checklist de Deploy

### Pre-Deploy
- [ ] Todas las variables de entorno configuradas
- [ ] Credenciales de BD creadas
- [ ] Secrets generados (`SECRET_KEY`, `JWT_SECRET_KEY`)
- [ ] CORS configurado para dominio específico
- [ ] Email SMTP configurado y probado

### Deploy
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos creada
- [ ] Migraciones aplicadas (`flask db upgrade`)
- [ ] Backend corriendo (Gunicorn)
- [ ] Frontend buildeado y servido
- [ ] Nginx/Reverse proxy configurado
- [ ] SSL/HTTPS configurado

### Post-Deploy
- [ ] Cambiar contraseña admin
- [ ] Probar login y 2FA
- [ ] Verificar envío de emails
- [ ] Configurar backups automáticos
- [ ] Monitoreo y logs configurados
- [ ] Firewall configurado (solo puertos necesarios)

---

## Soporte y Contacto

**Comandos Útiles:**
```bash
# Ver logs backend
journalctl -u sentya-backend -f

# Reiniciar backend
sudo systemctl restart sentya-backend

# Ver logs Nginx
tail -f /var/log/nginx/error.log

# Backup PostgreSQL
pg_dump -U sentya_user sentya_db > backup.sql

# Restaurar backup
psql -U sentya_user sentya_db < backup.sql
```

---

##  Notas Finales

1. **NUNCA** commitear archivos `.env` a Git
2. Usar variables de entorno para TODOS los secretos
3. Activar HTTPS en producción (Let's Encrypt gratuito)
4. Configurar backups automáticos diarios de PostgreSQL
5. Monitorear logs de errores constantemente
6. Actualizar dependencias regularmente por seguridad

**¡Listo para deploy!** 