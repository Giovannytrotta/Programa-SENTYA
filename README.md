#  SENTYA - Sistema de Gestión de Talleres Sociales
Sistema web para gestionar talleres, sesiones, asistencias y usuarios 
en Centros de Servicios Sociales de Sevilla.

##  Quick Start

### Requisitos
- Python 3.13
- Node.js 18+
- PostgreSQL 14+

### Instalación Local
\`\`\`bash
# Backend
cd apps/backend
pipenv install
pipenv run start

# Frontend
cd apps/frontend
npm install
npm run dev
\`\`\`

 **[Ver documentación completa de deploy](./docs/DEPLOY.md)**

##  Documentación

- [ Guía de Deploy](./docs/DEPLOY.md)
- [ Arquitectura](./docs/ARCHITECTURE.md)
- [ API Reference](./docs/API.md)

#  SENTYA - Sistema de Gestión de Talleres Sociales

<div align="center">

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1.2-green?logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-19.1.1-blue?logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Sistema integral para la gestión de talleres, sesiones, asistencias y usuarios en Centros de Servicios Sociales**

[Características](#-características) •
[Instalación](#-instalación-rápida) •
[Documentación](#-documentación) •
[Contribuir](#-contribuir)

</div>

---

##  Descripción

**SENTYA** es una aplicación web full-stack diseñada para optimizar la gestión de talleres sociales en los 14 Centros de Servicios Sociales (CSS) de Sevilla. El sistema permite:

-  Gestión completa de usuarios con roles diferenciados
-  Administración de talleres por áreas temáticas
-  Control de sesiones y horarios
-  Registro de asistencias en tiempo real
-  Autenticación segura con 2FA (TOTP)
-  Reportes y exportación de datos
-  Gestión multi-centro (14 CSS)

---

##  Características

###  Autenticación y Seguridad
- Sistema de login local con JWT (cookies HttpOnly)
- Autenticación de dos factores (2FA) con Google Authenticator
- Cifrado de contraseñas con Bcrypt
- Gestión de roles: Administrador, Coordinador, Profesional, Técnico CSS, Cliente

###  Gestión de Usuarios
- Registro y alta de beneficiarios
- Perfiles completos con datos personales
- Sistema de avatares personalizables (DiceBear + Initials)
- Historial de participación en talleres

###  Talleres
- áreas temáticas predefinidas (Autoestima, Risoterapia, Memoria, etc.)
- Control de capacidad y lista de espera
- Asignación de profesionales responsables
- Estados: Pendiente, Activo, Pausado, Finalizado

###  Sesiones y Asistencias
- Calendario de sesiones por taller
- Registro de asistencia individual
- Observaciones y notas por sesión
- Exportación de reportes a Excel

###  Multi-Centro
- Gestión de 14 Centros CSS de Sevilla
- Asignación de usuarios por centro
- Reportes por centro específico

---

##  Instalación Rápida

### Requisitos Previos
- **Python 3.13+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Pipenv** (opcional pero recomendado)

### 1️ Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/Programa-SENTYA.git
cd Programa-SENTYA
```

### 2 Configurar Backend
```bash
cd apps/backend

# Instalar dependencias
pipenv install  # o: pip install -r requirements.txt

# Copiar variables de entorno

cp .env.example .env

# Editar .env con tus credenciales

# Crear base de datos PostgreSQL
psql -U postgres
CREATE DATABASE sentya_db;
\q

# Ejecutar migraciones
pipenv run upgrade

# Iniciar servidor backend (puerto 3001)
pipenv run start
```

### 3️ Configurar Frontend
```bash
cd apps/frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
echo "VITE_API_URL=http://localhost:3001" > .env

# Iniciar servidor de desarrollo (puerto 5173)
npm run dev
```

### 4️ Acceder a la aplicación
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

**Usuario admin por defecto panel administrador:** 

- Email: `admin@sentya.com`
- Password: `admin1234` **Cambiar inmediatamente**

---

##  Arquitectura

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   React SPA     │─────▶│   Flask API     │─────▶│   PostgreSQL    │
│   (Frontend)    │      │   (Backend)     │      │   (Database)    │
│   Port: 5173    │      │   Port: 3001    │      │   Port: 5432    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
      Vite 7.1                Flask 3.1                 PG 14+
```

**Stack Tecnológico:**
- **Frontend:** React 19, React Router, Lucide Icons
- **Backend:** Flask 3.1, SQLAlchemy, Alembic, JWT, PyOTP
- **Base de Datos:** PostgreSQL 14+

---

##  Documentación

| Documento | Descripción |
|-----------|-------------|
| **[ DEPLOY.md](./docs/DEPLOY.md)** | Guía completa de despliegue en producción |
| **[ ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | Arquitectura del sistema y decisiones técnicas |
| **[ API.md](./docs/API.md)** | Referencia completa de endpoints de la API |
| **[ DATABASE.md](./docs/DATABASE.md)** | Esquema de base de datos y relaciones |
| **[ DEVELOPMENT.md](./docs/DEVELOPMENT.md)** | Guía para desarrolladores y c |

---

##  Estructura del Proyecto

```
Programa-SENTYA/
├── apps/
│   ├── backend/              # API Flask
│   │   ├── app/
│   │   │   ├── models/       # Modelos SQLAlchemy
│   │   │   ├── routes/       # Blueprints y endpoints
│   │   │   ├── extensions.py # Inicialización de extensiones
│   │   │   └── main.py       # Punto de entrada
│   │   ├── migrations/       # Migraciones Alembic
│   │   ├── Pipfile           # Dependencias Python
│   │   └── .env.example      # Template variables de entorno
│   └── frontend/             # Cliente React
│       ├── src/
│       │   ├── components/   # Componentes React
│       │   ├── pages/        # Vistas principales
│       │   └── services/     # Llamadas API
│       ├── package.json
│       └── vite.config.js
├── docs/                     # Documentación
│   ├── DEPLOY.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   └── DEVELOPMENT.md
├── .gitignore
└── README.md
```

---

##  Scripts Útiles

### Backend

```bash
# Desarrollo
pipenv run start              # Iniciar servidor (puerto 3001)

# Migraciones
pipenv run migrate   # Generar migración
pipenv run upgrade   # Aplicar migraciones
pipenv run downgrade # Revertir última migración


### Frontend
```bash
npm run dev         # Servidor desarrollo (puerto 5173)
npm run build       # Build de producción
npm run preview     # Preview del build
```

---

##  Deploy en Producción


### Opción 2: VPS Manual
Ver [documentación completa de deploy](./docs/DEPLOY.md)

### Checklist de Seguridad
- [ ] Cambiar `SECRET_KEY` y `JWT_SECRET_KEY`
- [ ] Activar `JWT_COOKIE_SECURE=True` (HTTPS)
- [ ] Cambiar contraseña admin por defecto
- [ ] Configurar CORS para dominio específico
- [ ] Configurar backups automáticos de PostgreSQL
- [ ] Activar HTTPS con certificado SSL

---


Ver [DEVELOPMENT.md](./docs/DEVELOPMENT.md) para más detalles.

---

##  Roadmap

###  Versión 1.0 (Actual)
- [x] Sistema de autenticación con 2FA
- [x] Panel de administrador privado
- [x] Gestión de usuarios y roles
- [x] CRUD de talleres y sesiones
- [x] Registro de asistencias
- [x] Multi-centro 
- [x] Marcaje de asistencia
- [x] Sistema de reportes 
- [x] Sistema de reportes con excel
- [x] Dashboard dependiendo el rol 
- [x] Calendario personalizado (por mes semana y dia)



---

##  Equipo

Desarrollado con ❤️ para los Centros de Servicios Sociales de Sevilla.

**Creadores y Mantenedores:**
- Sergio Gala (Desarollador)
- Giovanny Trotta (Desarollador)

---

##  Soporte

¿Encontraste un bug? ¿Tienes una sugerencia?


- **Documentación:** [docs/](./docs/)

---

<div align="center">

** Si te gusta el proyecto, dale una estrella en GitHub ⭐**

Hecho con  para mejorar la gestión social

</div>