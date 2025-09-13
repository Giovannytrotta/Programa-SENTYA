"""users for example table user

Revision ID: 121566dc49e3
Revises: a04cb532d908
Create Date: 2025-09-08 18:08:00.347399

"""
from alembic import op
import sqlalchemy as sa
from bcrypt import hashpw,gensalt

# revision identifiers, used by Alembic.
revision = '121566dc49e3'
down_revision = 'a04cb532d908'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    
    pw_bcrypt = hashpw(b"admin1234", gensalt()).decode("utf-8")

    
    conn.execute(
        sa.text("""
            UPDATE system_users
               SET password = :pw
             WHERE email = :em
        """),
        {"pw": pw_bcrypt, "em": "admin@sentya.com"}
    )

def downgrade():
    pass
