import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    String, Text, Numeric, Integer, Boolean, DateTime, ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def utcnow():
    return datetime.now(timezone.utc)


def new_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="client")  # client | admin
    account_type: Mapped[str] = mapped_column(String(20), default="buyer", server_default="buyer", nullable=True)  # buyer | seller | both
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ShipmentWindow(Base):
    """
    Preorder shipment windows. Admin creates windows like "April 2026 Shipment".
    Products linked to a window inherit its deadline and ship date.
    """
    __tablename__ = "shipment_windows"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g. "April 2026 Caribbean Shipment"
    description: Mapped[str] = mapped_column(Text, nullable=True)
    order_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estimated_departure: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estimated_arrival: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    price_usd: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Preorder fields (Phase 4)
    is_preorder: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    preorder_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_ship_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    shipment_window_id: Mapped[str] = mapped_column(String(36), ForeignKey("shipment_windows.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    order_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    client_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending_payment")
    # recipient info (flat in MVP)
    recipient_name: Mapped[str] = mapped_column(String(255), nullable=True)
    recipient_phone: Mapped[str] = mapped_column(String(50), nullable=True)
    recipient_city: Mapped[str] = mapped_column(String(255), nullable=True)
    recipient_address: Mapped[str] = mapped_column(Text, nullable=True)
    # totals
    subtotal_usd: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    total_usd: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    # Split payment (20% deposit flow)
    deposit_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    balance_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    deposit_paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    balance_paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"))
    product_name: Mapped[str] = mapped_column(String(500), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_usd: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal_usd: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")


# ════════════════════════════════════════════════════════════════
# INVENTORY — Added in Phase 2 (inventory foundation)
# These tables exist alongside products.stock_quantity for now.
# Checkout still uses stock_quantity directly; a future task will
# wire checkout to use inventory + atomic reservations instead.
# ════════════════════════════════════════════════════════════════

class Inventory(Base):
    """
    One row per product. Tracks available vs reserved stock separately.
    The `version` column supports optimistic concurrency control:
    every UPDATE bumps it, so concurrent writes can be detected.
    """
    __tablename__ = "inventory"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id"), unique=True, nullable=False
    )
    available_qty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved_qty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    product: Mapped["Product"] = relationship()


class StockMovement(Base):
    """
    Immutable audit log of every inventory change.
    Every reserve, release, sale confirmation, restock, or manual
    adjustment creates one row here. Never updated or deleted.
    """
    __tablename__ = "stock_movements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id"), nullable=False
    )
    movement_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # Valid types: reservation, release, sale_confirmed, restock, adjustment
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    # Positive = stock increase, negative = stock decrease
    reference_type: Mapped[str] = mapped_column(String(30), nullable=True)
    # e.g. "order", "manual", "return"
    reference_id: Mapped[str] = mapped_column(String(36), nullable=True)
    # FK to orders.id or other entity (not enforced to stay flexible)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(String(36), nullable=True)
    # FK to users.id (nullable for system-initiated movements)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )


# ════════════════════════════════════════════════════════════════
# SHIPMENTS — Added in Phase 3 (delivery coordination / US-12)
# Tracks the fulfillment lifecycle: packing → in-transit → delivered
# ════════════════════════════════════════════════════════════════

class Shipment(Base):
    """
    One shipment per order (1:1 in MVP; could become 1:N for split shipments later).
    Created when admin moves an order to 'processing'.
    """
    __tablename__ = "shipments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    carrier: Mapped[str] = mapped_column(String(100), nullable=True)
    tracking_number: Mapped[str] = mapped_column(String(200), nullable=True)
    estimated_delivery: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_delivery: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="preparing")
    # Valid statuses: preparing, packed, in_transit, customs, out_for_delivery, delivered, failed
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    order: Mapped["Order"] = relationship()
    events: Mapped[list["ShipmentEvent"]] = relationship(
        back_populates="shipment", cascade="all, delete-orphan",
        order_by="ShipmentEvent.created_at"
    )


class ShipmentEvent(Base):
    """
    Immutable timeline of shipment milestones.
    Each status change or location update creates one row.
    """
    __tablename__ = "shipment_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    shipment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    shipment: Mapped["Shipment"] = relationship(back_populates="events")
