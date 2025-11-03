Visión General
Motor: PostgreSQL 14+
ORM: SQLAlchemy 2.0
Migraciones: Alembic
Total de Tablas: 8
Charset: UTF-8
Principios de Diseño

Normalización: 3NF (Tercera Forma Normal)
Integridad Referencial: Foreign Keys con ON DELETE CASCADE/RESTRICT
Auditoría: Campos created_at, updated_at en todas las tablas
Soft Deletes: Campo is_active en lugar de borrado físico
Naming Convention: snake_case para tablas y columnas


🏗️ Diagrama ER (Entity-Relationship)
┌─────────────────────────────────────────────────────────────────────┐
│                         DIAGRAMA ENTIDAD-RELACIÓN                    │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │     css      │
                    │ (Centros)    │
                    ├──────────────┤
                    │ id (PK)      │
                    │ name         │
                    │ code         │
                    │ address      │
                    └──────┬───────┘
                           │ 1
                           │
                           │ N
                    ┌──────▼───────┐
                    │ system_users │
                    │ (Usuarios)   │
                    ├──────────────┤
                    │ id (PK)      │
                    │ email        │
                    │ password     │
                    │ rol (ENUM)   │
                    │ css_id (FK)  │
                    │ 2FA_enabled  │
                    └──────┬───────┘
                           │ 1
                ┌──────────┼──────────┐
                │          │          │
                │ N        │ 1        │ N
                │          │          │
    ┌───────────▼─┐    ┌───▼──────────▼───┐       ┌──────────────┐
    │ attendances │    │    workshops     │───────│thematic_areas│
    │(Asistencias)│    │    (Talleres)    │   1:N │  (Áreas)     │
    ├─────────────┤    ├──────────────────┤       ├──────────────┤
    │ id (PK)     │    │ id (PK)          │       │ id (PK)      │
    │ session(FK) │◄───┤ name             │       │ name         │
    │ user_id(FK) │    │ thematic_id (FK) │       │ description  │
    │ present     │    │ professional(FK) │       │ color        │
    └─────────────┘    │ css_id (FK)      │       └──────────────┘
                       │ max_capacity     │
                       │ status (ENUM)    │
                       └─────┬────────────┘
                             │ 1
                             │
                   ┌─────────┼─────────┐
                   │         │         │
                   │ N       │ 1       │ N
                   │         │         │
    ┌──────────────▼─┐   ┌───▼──────┐ └──────────────┐
    │ workshop_users │   │ sessions │                │
    │ (Inscripciones)│   │(Sesiones)│                │
    ├────────────────┤   ├──────────┤                │
    │ id (PK)        │   │ id (PK)  │                │
    │ workshop (FK)  │   │ workshop │◄───────────────┘
    │ user_id (FK)   │   │ date     │
    │ waitlist_pos   │   │ topic    │
    └────────────────┘   │ status   │
                         └──────────┘

                    ┌──────────────┐
                    │  audit_logs  │
                    │  (Auditoría) │
                    ├──────────────┤
                    │ id (PK)      │
                    │ table_name   │
                    │ action       │
                    │ user_id (FK) │
                    │ old_data     │
                    │ new_data     │
                    └──────────────┘

 Tablas

1. system_users
Descripción: Almacena todos los usuarios del sistema (personal y clientes).
Estructura
sqlCREATE TABLE system_users (
    -- Identificador
    id SERIAL PRIMARY KEY,
    
    -- Datos básicos
    email VARCHAR(255) UNIQUE,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    
    -- Autenticación
    password VARCHAR(255) COMMENT 'Hash Bcrypt',
    
    -- Autenticación 2FA
    two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    two_factor_secret VARCHAR(64) COMMENT 'Secret TOTP Base32',
    two_factor_enabled_at TIMESTAMP,
    
    -- Datos personales (obligatorios para clientes)
    dni VARCHAR(20) UNIQUE NOT NULL,
    age VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    address TEXT,
    observations TEXT,
    
    -- Sistema de avatares
    avatar_url VARCHAR(500),
    avatar_type VARCHAR(20) COMMENT 'dicebear | initials',
    avatar_style VARCHAR(50) COMMENT 'adventurer, avataaars, etc.',
    avatar_color VARCHAR(10) COMMENT 'Hex color for initials',
    avatar_seed VARCHAR(100),
    
    -- Roles y permisos
    rol VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    css_id INTEGER REFERENCES css(id),
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login TIMESTAMP,
    created_by INTEGER REFERENCES system_users(id)
);

Enums
pythonclass UserRole(enum.Enum):
    ADMINISTRATOR = "administrator"   # Control total del sistema
    COORDINATOR = "coordinator"       # Gestión de talleres
    PROFESSIONAL = "professional"     # Imparte talleres
    CSS_TECHNICIAN = "css_technician" # Técnico de centro
    CLIENT = "client"                 # Usuario inscrito
    PENDING = "pending"               # Pendiente aprobación
Índices

sqlCREATE INDEX idx_users_email ON system_users(email);
CREATE INDEX idx_users_dni ON system_users(dni);
CREATE INDEX idx_users_rol ON system_users(rol);
CREATE INDEX idx_users_css_id ON system_users(css_id);
Ejemplo de Registro
sqlINSERT INTO system_users (
    email, name, last_name, password, dni, age, phone, 
    birth_date, rol, is_active
) VALUES (
    'admin@sentya.com',
    'Sergio',
    'Admin',
    '$2b$12$...', -- Hash Bcrypt
    '1234567A',
    '26',
    '333555664',
    '1999-04-13',
    'ADMINISTRATOR',
    TRUE
);

2. css
Descripción: Centros de Servicios Sociales (14 centros en Sevilla).
Estructura
sqlCREATE TABLE css (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    manager VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
Ejemplo de Registro
sqlINSERT INTO css (name, code, address, is_active) VALUES
('Cerro - Su Eminencia', 'CSS001', 'Pendiente de confirmar', TRUE),
('Casco Antiguo', 'CSS002', 'Pendiente de confirmar', TRUE),
('Triana-Los Remedios', 'CSS003', 'Pendiente de confirmar', TRUE);

3. thematic_areas
Descripción: Áreas temáticas de los talleres (6 predefinidas).
Estructura
sqlCREATE TABLE thematic_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) COMMENT 'Hex color (#EBAA20)',
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

Ejemplo de Registro
sqlINSERT INTO thematic_areas (name, description, color, active) VALUES
('Autoestima', 'Talleres enfocados en fortalecer la autoestima', '#EBAA20', TRUE),
('Risoterapia', 'Terapia a través de la risa', '#4ECDC4', TRUE),
('Memoria', 'Estimulación cognitiva', '#AA96DA', TRUE);

4. workshops

Descripción: Talleres/cursos que se imparten en los centros.
Estructura
sqlCREATE TABLE workshops (
    -- Identificador
    id SERIAL PRIMARY KEY,
    
    -- Información básica
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Relaciones
    thematic_area_id INTEGER NOT NULL REFERENCES thematic_areas(id),
    css_id INTEGER NOT NULL REFERENCES css(id),
    professional_id INTEGER NOT NULL REFERENCES system_users(id),
    
    -- Capacidad
    max_capacity INTEGER NOT NULL DEFAULT 30,
    current_capacity INTEGER DEFAULT 0 NOT NULL,
    
    -- Cronograma
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    week_days VARCHAR(20) NOT NULL COMMENT 'L,M,X,J,V,S,D',
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Información adicional
    location VARCHAR(200),
    session_duration INTEGER COMMENT 'Duración en minutos',
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    observations TEXT,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER NOT NULL REFERENCES system_users(id)
);

Enums
pythonclass WorkshopStatus(enum.Enum):
    PENDING = "pending"    # Pendiente de inicio
    ACTIVE = "active"      # En curso
    PAUSED = "paused"      # Pausado temporalmente
    FINISHED = "finished"  # Finalizado
Índices
sqlCREATE INDEX idx_workshops_css_id ON workshops(css_id);
CREATE INDEX idx_workshops_thematic ON workshops(thematic_area_id);
CREATE INDEX idx_workshops_professional ON workshops(professional_id);
CREATE INDEX idx_workshops_status ON workshops(status);
Ejemplo de Registro
sqlINSERT INTO workshops (
    name, description, thematic_area_id, css_id, professional_id,
    max_capacity, start_time, end_time, week_days, start_date, created_by
) VALUES (
    'Taller de Autoestima para Mayores',
    'Taller enfocado en fortalecer la autoestima de personas mayores',
    1,  -- Autoestima
    3,  -- Triana-Los Remedios
    5,  -- María García (Professional)
    30,
    '10:00',
    '12:00',
    'L,X,V',
    '2025-02-01',
    1   -- Admin
);

5. sessions

Descripción: Sesiones individuales de cada taller.
Estructura
sqlCREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    topic VARCHAR(255),
    observations TEXT,
    professional_id INTEGER NOT NULL REFERENCES system_users(id),
    status VARCHAR(20) DEFAULT 'scheduled' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
Estados Posibles

scheduled: Programada (pendiente)
in_progress: En curso
completed: Completada
cancelled: Cancelada

Índices
sqlCREATE INDEX idx_sessions_workshop ON sessions(workshop_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_professional ON sessions(professional_id);

6. workshop_users

Descripción: Inscripciones de usuarios a talleres (relación muchos a muchos).
Estructura
sqlCREATE TABLE workshop_users (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES system_users(id),
    assigned_by INTEGER REFERENCES system_users(id),
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    unassignment_reason TEXT,
    unassignment_date TIMESTAMP,
    waitlist_position INTEGER COMMENT 'NULL = inscrito, N = en lista de espera',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES system_users(id),
    
    UNIQUE(workshop_id, user_id)
);

Índices
sqlCREATE INDEX idx_workshop_users_workshop ON workshop_users(workshop_id);
CREATE INDEX idx_workshop_users_user ON workshop_users(user_id);
CREATE INDEX idx_workshop_users_waitlist ON workshop_users(waitlist_position);
Ejemplo de Registro
sql-- Usuario inscrito (no en lista de espera)
INSERT INTO workshop_users (workshop_id, user_id, assigned_by) VALUES
(1, 12, 5);  -- waitlist_position = NULL

-- Usuario en lista de espera (taller lleno)

INSERT INTO workshop_users (workshop_id, user_id, assigned_by, waitlist_position) VALUES
(1, 26, 5, 1);  -- Primera posición en lista de espera

7. attendances
Descripción: Registro de asistencia de usuarios a sesiones.
Estructura
sqlCREATE TABLE attendances (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES system_users(id),
    present BOOLEAN DEFAULT FALSE NOT NULL,
    observations TEXT,
    recorded_by INTEGER NOT NULL REFERENCES system_users(id),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    UNIQUE(session_id, user_id)
);

Índices
sqlCREATE INDEX idx_attendances_session ON attendances(session_id);
CREATE INDEX idx_attendances_user ON attendances(user_id);
CREATE INDEX idx_attendances_present ON attendances(present);
Ejemplo de Registro
sqlINSERT INTO attendances (session_id, user_id, present, observations, recorded_by) VALUES
(45, 12, TRUE, 'Participación activa', 5),
(45, 14, FALSE, 'Avisó por teléfono', 5);

8. audit_logs

Descripción: Logs de auditoría para trazabilidad de cambios.
Estructura
sqlCREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL COMMENT 'INSERT, UPDATE, DELETE',
    old_data TEXT COMMENT 'JSON con datos anteriores',
    new_data TEXT COMMENT 'JSON con datos nuevos',
    user_id INTEGER REFERENCES system_users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role_assigned_by INTEGER,
    role_assignment_date TIMESTAMP,
    two_factor_last_used TIMESTAMP
);

Índices

sqlCREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);

🔗 Relaciones
Resumen de Foreign Keys
TablaForeign KeyReferenciaON DELETEsystem_userscss_idcss(id)SET NULLsystem_userscreated_bysystem_users(id)SET NULLworkshopsthematic_area_idthematic_areas(id)RESTRICTworkshopscss_idcss(id)RESTRICTworkshopsprofessional_idsystem_users(id)RESTRICTworkshopscreated_bysystem_users(id)SET NULLsessionsworkshop_idworkshops(id)CASCADEsessionsprofessional_idsystem_users(id)RESTRICTworkshop_usersworkshop_idworkshops(id)CASCADEworkshop_usersuser_idsystem_users(id)RESTRICTattendancessession_idsessions(id)CASCADEattendancesuser_idsystem_users(id)RESTRICTattendancesrecorded_bysystem_users(id)RESTRICTaudit_logsuser_idsystem_users(id)SET NULL
Cardinalidad
css (1) ←──────→ (N) system_users
css (1) ←──────→ (N) workshops
thematic_areas (1) ←──────→ (N) workshops
system_users (1) ←──────→ (N) workshops [professional]
workshops (1) ←──────→ (N) sessions
workshops (N) ←──────→ (N) system_users [workshop_users]
sessions (1) ←──────→ (N) attendances
system_users (1) ←──────→ (N) attendances

Índices

Índices de Rendimiento
sql-- Búsquedas frecuentes
CREATE INDEX idx_users_email_active ON system_users(email, is_active);
CREATE INDEX idx_workshops_status_css ON workshops(status, css_id);
CREATE INDEX idx_sessions_date_workshop ON sessions(date, workshop_id);

-- Full-text search (futuro)
CREATE INDEX idx_users_name_search ON system_users 
    USING GIN (to_tsvector('spanish', name || ' ' || last_name));

 Migraciones
Historial de Migraciones
bash# Listar migraciones aplicadas
flask db history

# Última migración
flask db current

# Aplicar migraciones pendientes
flask db upgrade

# Revertir última migración
flask db downgrade
Migraciones con Datos Semilla

71573563708c_seed_css_centros.py - 14 centros CSS
56948dd2bef6_seed_thematic_area.py - 6 áreas temáticas
5ce666c764d9_users_for_example_table_user.py - Usuario admin


Datos Semilla

Script de Inicialización Completo
sql-- 1. Crear áreas temáticas
INSERT INTO thematic_areas (name, description, color, active) VALUES
('Autoestima', 'Talleres enfocados en fortalecer la autoestima', '#EBAA20', TRUE),
('Risoterapia', 'Terapia a través de la risa', '#4ECDC4', TRUE),
('Gestión Emocional', 'Manejo y regulación de emociones', '#95E1D3', TRUE),
('Nuevas Tecnologías', 'Alfabetización digital', '#F38181', TRUE),
('Memoria', 'Estimulación cognitiva', '#AA96DA', TRUE),
('Gimnasia Adaptada', 'Actividad física adaptada', '#FCBAD3', TRUE);

-- 2. Crear centros CSS (14 centros de Sevilla)

INSERT INTO css (name, code, is_active) VALUES
('Cerro - Su Eminencia', 'CSS001', TRUE),
('Casco Antiguo', 'CSS002', TRUE),
('Triana-Los Remedios', 'CSS003', TRUE),
-- ... (resto de centros)

-- 3. Usuario administrador
INSERT INTO system_users (
    email, name, last_name, password, dni, age, phone, 
    birth_date, rol, is_active
) VALUES (
    'admin@sentya.com',
    'Admin',
    'SENTYA',
    '$2b$12$...hash_bcrypt...',
    '00000000X',
    '30',
    '666555444',
    '1995-01-01',
    'ADMINISTRATOR',
    TRUE
);

Queries Útiles

1. Obtener talleres activos con plazas disponibles
sqlSELECT 
    w.id,
    w.name,
    w.max_capacity,
    w.current_capacity,
    (w.max_capacity - w.current_capacity) AS available_spots,
    ta.name AS thematic_area,
    c.name AS css_name,
    u.name || ' ' || u.last_name AS professional
FROM workshops w
JOIN thematic_areas ta ON w.thematic_area_id = ta.id
JOIN css c ON w.css_id = c.id
JOIN system_users u ON w.professional_id = u.id
WHERE w.status = 'active'
  AND w.current_capacity < w.max_capacity
ORDER BY available_spots DESC;
2. Tasa de asistencia por taller
sqlSELECT 
    w.name AS taller,
    COUNT(DISTINCT s.id) AS total_sesiones,
    COUNT(a.id) AS total_registros,
    SUM(CASE WHEN a.present THEN 1 ELSE 0 END) AS asistencias,
    ROUND(
        100.0 * SUM(CASE WHEN a.present THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0),
        2
    ) AS tasa_asistencia_pct
FROM workshops w
JOIN sessions s ON w.id = s.workshop_id
LEFT JOIN attendances a ON s.id = a.session_id
WHERE w.status = 'active'
GROUP BY w.id, w.name
ORDER BY tasa_asistencia_pct DESC;
3. Usuarios en lista de espera
sqlSELECT 
    u.name || ' ' || u.last_name AS usuario,
    u.dni,
    u.phone,
    w.name AS taller,
    wu.waitlist_position,
    wu.assignment_date
FROM workshop_users wu
JOIN system_users u ON wu.user_id = u.id
JOIN workshops w ON wu.workshop_id = w.id
WHERE wu.waitlist_position IS NOT NULL
ORDER BY w.name, wu.waitlist_position;
4. Talleres por profesional
sqlSELECT 
    u.name || ' ' || u.last_name AS profesional,
    COUNT(w.id) AS talleres_activos,
    STRING_AGG(w.name, ', ') AS talleres
FROM system_users u
LEFT JOIN workshops w ON u.id = w.professional_id AND w.status = 'active'
WHERE u.rol = 'PROFESSIONAL'
GROUP BY u.id, u.name, u.last_name
ORDER BY talleres_activos DESC;
5. Próximas sesiones (hoy + 7 días)
sqlSELECT 
    s.date,
    s.start_time,
    w.name AS taller,
    u.name || ' ' || u.last_name AS profesional,
    c.name AS centro
FROM sessions s
JOIN workshops w ON s.workshop_id = w.id
JOIN system_users u ON s.professional_id = u.id
JOIN css c ON w.css_id = c.id
WHERE s.date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND s.status = 'scheduled'
ORDER BY s.date, s.start_time;
6. Backup completo (SQL dump)
bash# Backup
pg_dump -U sentya_user -h localhost sentya_db > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U sentya_user -h localhost sentya_db < backup_20250120.sql

Estadísticas de la Base de Datos

Tamaño de Tablas (Query)
sqlSELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
Conteo de Registros
sqlSELECT 
    'system_users' AS table_name, COUNT(*) AS count FROM system_users
UNION ALL
SELECT 'workshops', COUNT(*) FROM workshops
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'attendances', COUNT(*) FROM attendances
UNION ALL
SELECT 'workshop_users', COUNT(*) FROM workshop_users
UNION ALL
SELECT 'css', COUNT(*) FROM css
UNION ALL
SELECT 'thematic_areas', COUNT(*) FROM thematic_areas
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;

Seguridad

Permisos PostgreSQL (Producción)
sql-- Crear usuario con permisos limitados
CREATE USER sentya_app WITH PASSWORD 'password_segura';

-- Permisos solo en BD específica
GRANT CONNECT ON DATABASE sentya_db TO sentya_app;
GRANT USAGE ON SCHEMA public TO sentya_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sentya_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sentya_app;

-- Sin permisos de DROP o ALTER
REVOKE CREATE ON SCHEMA public FROM sentya_app;

Mantenimiento

Tareas Recomendadas
sql-- Vacuuming (limpiar espacio)
VACUUM ANALYZE;

-- Reindexar (mejorar rendimiento)
REINDEX DATABASE sentya_db;

-- Ver queries lentas
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

Changelog de Schema

v1.0.0 (2025-01-15)

 Creación inicial de 8 tablas
 Datos semilla (CSS + Áreas temáticas)
 Sistema de 2FA implementado

v1.1.0 (2025-02-01 - Planificado)

