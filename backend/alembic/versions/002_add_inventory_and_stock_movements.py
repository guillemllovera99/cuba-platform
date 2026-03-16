"""002_add_inventory_and_stock_movements

Creates the inventory and stock_movements tables.
Populates inventory from existing products.stock_quantity so that
every product has an inventory record from day one.

Revision ID: 002_add_inventory
Revises: 001_baseline
Create Date: 2026-03-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002_add_inventory"
down_revision: Union[str, None] = "001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── inventory table ──
    op.create_table(
        "inventory",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "product_id",
            sa.String(36),
            sa.ForeignKey("products.id"),
            unique=True,
            nullable=False,
        ),
        sa.Column("available_qty", sa.Integer, nullable=False, server_default="0"),
        sa.Column("reserved_qty", sa.Integer, nullable=False, server_default="0"),
        sa.Column("low_stock_threshold", sa.Integer, server_default="5"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("idx_inventory_product", "inventory", ["product_id"])

    # ── stock_movements table ──
    op.create_table(
        "stock_movements",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "product_id",
            sa.String(36),
            sa.ForeignKey("products.id"),
            nullable=False,
        ),
        sa.Column("movement_type", sa.String(30), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("reference_type", sa.String(30), nullable=True),
        sa.Column("reference_id", sa.String(36), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index(
        "idx_stock_movements_product_date",
        "stock_movements",
        ["product_id", sa.text("created_at DESC")],
    )

    # ── Populate inventory from existing products ──
    # Every product gets one inventory row with available_qty = stock_quantity.
    # Uses gen_random_uuid() for the id (PostgreSQL 13+).
    # If your PG version doesn't have gen_random_uuid(), this will use
    # uuid_generate_v4() from the uuid-ossp extension instead.
    op.execute("""
        INSERT INTO inventory (id, product_id, available_qty, reserved_qty, version, updated_at)
        SELECT
            gen_random_uuid()::text,
            id,
            stock_quantity,
            0,
            1,
            NOW()
        FROM products
    """)


def downgrade() -> None:
    op.drop_index("idx_stock_movements_product_date", table_name="stock_movements")
    op.drop_table("stock_movements")
    op.drop_index("idx_inventory_product", table_name="inventory")
    op.drop_table("inventory")
