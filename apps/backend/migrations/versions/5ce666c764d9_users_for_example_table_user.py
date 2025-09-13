"""users for example table user

Revision ID: 5ce666c764d9
Revises: 3dabdccb7213
Create Date: 2025-09-06 12:05:04.485734

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, date, timezone
from werkzeug.security import generate_password_hash

# revision identifiers, used by Alembic.
revision = '5ce666c764d9'
down_revision = '3dabdccb7213'
branch_labels = None
depends_on = None


def upgrade():
    now = datetime.now(timezone.utc)
    system_users = sa.table(
            'system_users',
            sa.column('email',sa.String),
            sa.column('name',sa.String),
            sa.column('last_name',sa.String),
            sa.column('password',sa.String),
            sa.column('dni', sa.String),
            sa.column('age', sa.String),
            sa.column('birth_date',sa.Date),
            sa.column('rol', sa.String),
            sa.column('auth_provider', sa.String),
            sa.column('is_active',sa.Boolean),
            sa.column('two_factor_enabled', sa.Boolean),
            sa.column('two_factor_secret',sa.String),
            sa.column('phone', sa.String),
            sa.column('address', sa.Text),
            sa.column('created_at',sa.DateTime(timezone=True)),
            sa.column('updated_at',sa.DateTime(timezone=True)),
            sa.column('last_login',sa.DateTime(timezone=True))
        )
    pw = generate_password_hash("admin1234")
    
    op.bulk_insert(system_users,[
        {
             # ==================== ADMINISTRADOR ====================
             
            'email':'admin@sentya.com',
            'name':'sergioAdmin',
            'last_name':'ejemplo',
            'password': pw,
            'dni':'1234567A',
            'birth_date':date(1999,4,13),
            'age': '26',
            'rol':'ADMINISTRATOR',
            'auth_provider': 'LOCAL',
            'is_active':True,
            'two_factor_enabled':False,
            'two_factor_secret':None,
            'phone':'333555664',
            'address':'italy',
            'created_at':now,
            'updated_at':now,
            'last_login':None
            }
        ])
    


def downgrade():
     # Eliminar solo los usuarios de prueba que insertamos
    op.execute(
       "DELETE FROM system_users WHERE email = 'admin@sentya.com'"
    )
