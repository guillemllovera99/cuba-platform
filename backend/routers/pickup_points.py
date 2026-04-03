"""Pickup Points endpoints: public listing + admin CRUD."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import PickupPoint
from schemas import PickupPointCreate, PickupPointOut
from auth import require_admin

router = APIRouter(prefix="/api/v1/pickup-points", tags=["pickup-points"])


# ── Public ──────────────────────────────────────────────────────
# GET all active pickup points grouped by city


@router.get("/", response_model=dict)
async def list_pickup_points(db: AsyncSession = Depends(get_db)):
    """
    Public endpoint: return active pickup points grouped by city.
    Response format: { "city_name": [{"id": "...", "name": "...", ...}, ...], ... }
    """
    result = await db.execute(
        select(PickupPoint)
        .where(PickupPoint.is_active == True)
        .order_by(PickupPoint.city, PickupPoint.name)
    )
    points = result.scalars().all()

    # Group by city
    grouped = {}
    for point in points:
        if point.city not in grouped:
            grouped[point.city] = []
        grouped[point.city].append(PickupPointOut.model_validate(point, from_attributes=True))

    return grouped


# ── Admin ───────────────────────────────────────────────────────

@router.get("/admin/", response_model=list[PickupPointOut])
async def list_all_pickup_points(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: list all pickup points (including inactive)."""
    result = await db.execute(
        select(PickupPoint).order_by(PickupPoint.city, PickupPoint.name)
    )
    points = result.scalars().all()
    return [PickupPointOut.model_validate(p, from_attributes=True) for p in points]


@router.post("/admin/", response_model=PickupPointOut)
async def create_pickup_point(
    req: PickupPointCreate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: create a new pickup point."""
    point = PickupPoint(**req.model_dump())
    db.add(point)
    await db.commit()
    await db.refresh(point)
    return PickupPointOut.model_validate(point, from_attributes=True)


@router.put("/admin/{pickup_point_id}", response_model=PickupPointOut)
async def update_pickup_point(
    pickup_point_id: str,
    req: PickupPointCreate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: update an existing pickup point."""
    result = await db.execute(
        select(PickupPoint).where(PickupPoint.id == pickup_point_id)
    )
    point = result.scalar_one_or_none()
    if not point:
        raise HTTPException(404, "Pickup point not found")

    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(point, key, val)
    await db.commit()
    await db.refresh(point)
    return PickupPointOut.model_validate(point, from_attributes=True)


@router.delete("/admin/{pickup_point_id}")
async def delete_pickup_point(
    pickup_point_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: soft-delete (deactivate) a pickup point."""
    result = await db.execute(
        select(PickupPoint).where(PickupPoint.id == pickup_point_id)
    )
    point = result.scalar_one_or_none()
    if not point:
        raise HTTPException(404, "Pickup point not found")

    point.is_active = False
    await db.commit()
    return {"ok": True}
