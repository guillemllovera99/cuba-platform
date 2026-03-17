"""Add shipments and shipment_events tables for delivery coordination (US-12).

Revision ID: 003
Revises: 002
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"


def upgrade():
    op.create_table(
        "shipments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("carrier", sa.String(100), nullable=True),
        sa.Column("tracking_number", sa.String(200), nullable=True),
        sa.Column("estimated_delivery", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actual_delivery", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(30), server_default="preparing", nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "shipment_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("shipment_id", sa.String(36), sa.ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_index("ix_shipment_events_shipment_id", "shipment_events", ["shipment_id"])


def downgrade():
    op.drop_index("ix_shipment_events_shipment_id", "shipment_events")
    op.drop_table("shipment_events")
    op.drop_table("shipments")
