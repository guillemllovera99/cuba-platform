"""Add account_type column to users table.

Revision ID: 004
Revises: 003
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"


def upgrade():
    op.add_column(
        "users",
        sa.Column("account_type", sa.String(20), server_default="buyer", nullable=False),
    )


def downgrade():
    op.drop_column("users", "account_type")
