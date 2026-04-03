"""
Shipment Windows CRUD — admin endpoints for managing preorder shipment windows.

A shipment window represents a scheduled container/shipment departure.
Products can be linked to a window, inheriting its deadline and ship date.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import ShipmentWindow
from schemas import ShipmentWindowCreate, ShipmentWindowOut
from auth import require_admin

router = APIRouter(prefix="/api/v1/admin/shipment-windows", tags=["shipment-windows"])


def _window_to_out(w: ShipmentWindow) -> ShipmentWindowOut:
    return ShipmentWindowOut(
        id=w.id,
        name=w.name,
        description=w.description,
        order_deadline=w.order_deadline.isoformat() if w.order_deadline else "",
        estimated_departure=w.estimated_departure.isoformat() if w.estimated_departure else "",
        estimated_arrival=w.estimated_arrival.isoformat() if w.estimated_arrival else None,
        is_active=w.is_active,
        created_at=w.created_at.isoformat() if w.created_at else "",
    )


@router.get("/", response_model=list[ShipmentWindowOut])
async def list_shipment_windows(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ShipmentWindow).order_by(ShipmentWindow.estimated_departure.desc())
    )
    return [_window_to_out(w) for w in result.scalars().all()]


@router.post("/", response_model=ShipmentWindowOut)
async def create_shipment_window(
    req: ShipmentWindowCreate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    window = ShipmentWindow(
        name=req.name,
        description=req.description,
        order_deadline=datetime.fromisoformat(req.order_deadline),
        estimated_departure=datetime.fromisoformat(req.estimated_departure),
        estimated_arrival=datetime.fromisoformat(req.estimated_arrival) if req.estimated_arrival else None,
    )
    db.add(window)
    await db.commit()
    await db.refresh(window)
    return _window_to_out(window)


@router.put("/{window_id}", response_model=ShipmentWindowOut)
async def update_shipment_window(
    window_id: str,
    req: ShipmentWindowCreate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ShipmentWindow).where(ShipmentWindow.id == window_id)
    )
    window = result.scalar_one_or_none()
    if not window:
        raise HTTPException(404, "Shipment window not found")

    window.name = req.name
    window.description = req.description
    window.order_deadline = datetime.fromisoformat(req.order_deadline)
    window.estimated_departure = datetime.fromisoformat(req.estimated_departure)
    window.estimated_arrival = datetime.fromisoformat(req.estimated_arrival) if req.estimated_arrival else None

    await db.commit()
    await db.refresh(window)
    return _window_to_out(window)


@router.delete("/{window_id}")
async def delete_shipment_window(
    window_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ShipmentWindow).where(ShipmentWindow.id == window_id)
    )
    window = result.scalar_one_or_none()
    if not window:
        raise HTTPException(404, "Shipment window not found")

    await db.delete(window)
    await db.commit()
    return {"ok": True}


# ── Public endpoint: list active windows (for catalog display) ──
@router.get("/active", response_model=list[ShipmentWindowOut])
async def list_active_windows(
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — no auth required. Returns active shipment windows."""
    result = await db.execute(
        select(ShipmentWindow)
        .where(ShipmentWindow.is_active == True)
        .order_by(ShipmentWindow.estimated_departure.asc())
    )
    return [_window_to_out(w) for w in result.scalars().all()]
