"""Add ocr_text column

Revision ID: 002_add_ocr_text
Revises: 001_initial_migration
Branch Labels: 
Depends On: 

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_ocr_text'
down_revision: Union[str, None] = '001_initial_migration'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('ocr_text', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('documents', 'ocr_text')
