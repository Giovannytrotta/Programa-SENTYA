"""seed_css_centros

Revision ID: 71573563708c
Revises: 121566dc49e3
Create Date: 2025-09-26 15:03:27.661596

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone


# revision identifiers, used by Alembic.
revision = '71573563708c'
down_revision = '121566dc49e3'
branch_labels = None
depends_on = None


def upgrade():
    # Crear tabla temporal para insertar datos
    now = datetime.now(timezone.utc)
    
    css = sa.table(
        'css',
        sa.column('name', sa.String),
        sa.column('code', sa.String),
        sa.column('address', sa.Text),
        sa.column('phone', sa.String),
        sa.column('email', sa.String),
        sa.column('manager', sa.String),
        sa.column('is_active', sa.Boolean),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime)
    )
    
    # Datos de los 14 centros CSS
    css_data = [
        {
            'name': 'Cerro - Su Eminencia',
            'code': 'CSS001',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Casco Antiguo',
            'code': 'CSS002',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Triana-Los Remedios',
            'code': 'CSS003',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Sevilla Este-Alcosa',
            'code': 'CSS004',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Torreblanca',
            'code': 'CSS005',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Tres Barrios-Amate',
            'code': 'CSS006',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'San Pablo - Santa Justa',
            'code': 'CSS007',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Nervión',
            'code': 'CSS008',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Bermejales',
            'code': 'CSS009',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Polígono Sur',
            'code': 'CSS010',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Macarena',
            'code': 'CSS011',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Polígono Norte',
            'code': 'CSS012',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'San Jerónimo',
            'code': 'CSS013',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        },
        {
            'name': 'Los Carteros',  # El 14vo centro
            'code': 'CSS014',
            'address': 'Pendiente de confirmar',
            'phone': None,
            'email': None,
            'manager': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        }
    ]
    
    # Insertar todos los datos
    op.bulk_insert(css, css_data)

def downgrade():
    # Eliminar los datos insertados si necesitas hacer rollback
    op.execute("DELETE FROM css WHERE code LIKE 'CSS%'")

