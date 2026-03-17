"""
Shipment / delivery coordination endpoints (US-12).

Admin endpoints for managing fulfillment:
- Auto-create shipment when order moves to 'processing'
- Update shipment details (carrier, tracking, ETA)
- Add shipment events (timeline milestones)
- Transition shipment status along the delivery pipeline

Public endpoint:
- GET /api/v1/shipments/by-order-code/{code} — for customer tracking page
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Shipment, ShipmentEvent, Order
from schemas import (
    ShipmentOut, ShipmentUpdate, ShipmentEventCreate, ShipmentEventOut,
)
from auth import require_admin

router = APIRouter(prefix="/api/v1/shipments", tags=["shipments"])

VALID_SHIPMENT_STATUSES = [
    "preparing", "packed", "in_transit", "customs",
    "out_for_delivery", "delivered", "failed",
]


# ── Helpers ────────────────────────────────────────────────────

def _shipment_to_out(s: Shipment) -> ShipmentOut:
    order = s.order
    return ShipmentOut(
        id=s.id,
        order_id=s.order_id,
        order_code=order.order_code if order else None,
        carrier=s.carrier,
        tracking_number=s.tracking_number,
        estimated_delivery=s.estimated_delivery.isoformat() if s.estimated_delivery else None,
        actual_delivery=s.actual_delivery.isoformat() if s.actual_delivery else None,
        status=s.status,
        notes=s.notes,
        created_at=s.created_at.isoformat(),
        updated_at=s.updated_at.isoformat(),
        events=[
            ShipmentEventOut(
                id=e.id,
                status=e.status,
                location=e.location,
                description=e.description,
                created_by=e.created_by,
                created_at=e.created_at.isoformat(),
            )
            for e in (s.events or [])
        ],
        recipient_name=order.recipient_name if order else None,
        recipient_city=order.recipient_city if order else None,
        recipient_phone=order.recipient_phone if order else None,
        recipient_address=order.recipient_address if order else None,
        total_usd=float(order.total_usd) if order and order.total_usd else None,
    )


async def _get_shipment(db: AsyncSession, shipment_id: str) -> Shipment:
    result = await db.execute(
        select(Shipment)
        .where(Shipment.id == shipment_id)
        .options(selectinload(Shipment.events), selectinload(Shipment.order))
    )
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(404, "Shipment not found")
    return shipment


async def ensure_shipment_for_order(db: AsyncSession, order: Order) -> Shipment:
    """Get or create a shipment for an order. Called when order → processing."""
    result = await db.execute(
        select(Shipment)
        .where(Shipment.order_id == order.id)
        .options(selectinload(Shipment.events), selectinload(Shipment.order))
    )
    shipment = result.scalar_one_or_none()
    if shipment:
        return shipment

    shipment = Shipment(order_id=order.id, status="preparing")
    db.add(shipment)
    # Add initial event
    db.add(ShipmentEvent(
        shipment_id=shipment.id,
        status="preparing",
        description=f"Order {order.order_code} moved to processing. Shipment created.",
    ))
    await db.flush()
    # Re-fetch with relationships
    return await _get_shipment(db, shipment.id)


# ── Admin: List all shipments ──────────────────────────────────

@router.get("/admin/all", response_model=list[ShipmentOut])
async def admin_list_shipments(
    status: str | None = None,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Shipment)
        .options(selectinload(Shipment.events), selectinload(Shipment.order))
        .order_by(Shipment.updated_at.desc())
    )
    if status:
        q = q.where(Shipment.status == status)
    result = await db.execute(q)
    return [_shipment_to_out(s) for s in result.scalars().all()]


# ── Admin: Get single shipment ─────────────────────────────────

@router.get("/admin/{shipment_id}", response_model=ShipmentOut)
async def admin_get_shipment(
    shipment_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return _shipment_to_out(await _get_shipment(db, shipment_id))


# ── Admin: Update shipment details ─────────────────────────────

@router.put("/admin/{shipment_id}", response_model=ShipmentOut)
async def admin_update_shipment(
    shipment_id: str,
    req: ShipmentUpdate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    shipment = await _get_shipment(db, shipment_id)
    if req.carrier is not None:
        shipment.carrier = req.carrier
    if req.tracking_number is not None:
        shipment.tracking_number = req.tracking_number
    if req.estimated_delivery is not None:
        shipment.estimated_delivery = datetime.fromisoformat(req.estimated_delivery)
    if req.notes is not None:
        shipment.notes = req.notes
    await db.commit()
    return _shipment_to_out(await _get_shipment(db, shipment_id))


# ── Admin: Add a shipment event (timeline milestone) ───────────

@router.post("/admin/{shipment_id}/events", response_model=ShipmentOut)
async def admin_add_event(
    shipment_id: str,
    req: ShipmentEventCreate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    shipment = await _get_shipment(db, shipment_id)

    if req.status not in VALID_SHIPMENT_STATUSES:
        raise HTTPException(400, f"Invalid status. Must be one of: {VALID_SHIPMENT_STATUSES}")

    # Update shipment status to match the event
    shipment.status = req.status

    # If delivered, set actual_delivery timestamp and update order status
    if req.status == "delivered":
        shipment.actual_delivery = datetime.now(timezone.utc)
        order = shipment.order
        if order and order.status != "delivered":
            order.status = "delivered"

    # If shipped/in_transit, update order status to shipped
    if req.status in ("in_transit", "customs", "out_for_delivery"):
        order = shipment.order
        if order and order.status not in ("shipped", "delivered"):
            order.status = "shipped"

    db.add(ShipmentEvent(
        shipment_id=shipment.id,
        status=req.status,
        location=req.location,
        description=req.description,
        created_by=admin.get("id"),
    ))

    await db.commit()
    return _shipment_to_out(await _get_shipment(db, shipment_id))


# ── Public: Get shipment by order code (for tracking page) ─────

@router.get("/by-order-code/{order_code}", response_model=ShipmentOut | None)
async def get_shipment_by_order_code(
    order_code: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.order_code == order_code.upper())
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    result = await db.execute(
        select(Shipment)
        .where(Shipment.order_id == order.id)
        .options(selectinload(Shipment.events), selectinload(Shipment.order))
    )
    shipment = result.scalar_one_or_none()
    if not shipment:
        return None  # Order exists but no shipment yet
    return _shipment_to_out(shipment)
