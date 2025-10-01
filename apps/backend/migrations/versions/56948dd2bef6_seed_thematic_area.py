"""seed_thematic_area

Revision ID: 56948dd2bef6
Revises: 71573563708c
Create Date: 2025-09-30 19:23:33.058296

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime,timezone


# revision identifiers, used by Alembic.
revision = '56948dd2bef6'
down_revision = '71573563708c'
branch_labels = None
depends_on = None


def upgrade():
    now = datetime.now(timezone.utc)
    
    thematic_areas = sa.table(
        'thematic_areas',
        sa.column('name', sa.String),
        sa.column('description', sa.Text),
        sa.column('color', sa.String),
        sa.column('active', sa.Boolean),
        sa.column('created_at', sa.DateTime)
    )
    
    areas_data = [
        {
            'name': 'Autoestima',
            'description': 'Talleres enfocados en fortalecer la autoestima y confianza personal',
            'color': "#EBAA20",
            'active': True,
            'created_at': now
        },
        {
            'name': 'Risoterapia',
            'description': 'Terapia a través de la risa y el humor',
            'color': '#4ECDC4',
            'active': True,
            'created_at': now
        },
        {
            'name': 'Gestión Emocional',
            'description': 'Manejo y regulación de emociones',
            'color': '#95E1D3',
            'active': True,
            'created_at': now
        },
        {
            'name': 'Nuevas Tecnologías',
            'description': 'Alfabetización digital y uso de tecnología',
            'color': '#F38181',
            'active': True,
            'created_at': now
        },
        {
            'name': 'Memoria',
            'description': 'Estimulación cognitiva y ejercicios de memoria',
            'color': '#AA96DA',
            'active': True,
            'created_at': now
        },
        {
            'name': 'Gimnasia Adaptada',
            'description': 'Actividad física adaptada a capacidades individuales',
            'color': '#FCBAD3',
            'active': True,
            'created_at': now
        }
    ]
    
    op.bulk_insert(thematic_areas, areas_data)

def downgrade():
    op.execute("DELETE FROM thematic_areas WHERE name IN ('Autoestima', 'Risoterapia', 'Gestión Emocional', 'Nuevas Tecnologías', 'Memoria', 'Gimnasia Adaptada')")