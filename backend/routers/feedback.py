"""
Phase 9 — Recipient View & Anonymous Feedback
No authentication required for feedback submission (anonymous by order code).
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Order, OrderFeedback, DeliveryConfirmation, Shipment, ShipmentEvent, PickupPoint
from schemas import (
    FeedbackCreate, FeedbackOut, RecipientTrackingOut,
    DeliveryConfirmationCreate, DeliveryConfirmationOut, ShipmentEventOut,
)
from auth import require_auth, require_admin

router = APIRouter(prefix="/api/v1/feedback", tags=["feedback"])


# ── Public: recipient tracking by order code (no auth) ──
@router.get("/recipient/{order_code}", response_model=RecipientTrackingOut)
async def recipient_tracking(order_code: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint: recipient in Cuba checks delivery status by order code."""
    result = await db.execute(select(Order).where(Order.order_code == order_code))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    # Get shipment info
    ship_result = await db.execute(select(Shipment).where(Shipment.order_id == order.id))
    shipment = ship_result.scalar_one_or_none()

    events = []
    shipment_status = None
    estimated_delivery = None
    if shipment:
        shipment_status = shipment.status
        estimated_delivery = str(shipment.estimated_delivery) if shipment.estimated_delivery else None
        ev_result = await db.execute(
            select(ShipmentEvent)
            .where(ShipmentEvent.shipment_id == shipment.id)
            .order_by(ShipmentEvent.created_at)
        )
        events = [
            ShipmentEventOut(
                id=e.id, status=e.status,
                location=e.location, description=e.description,
                created_by=e.created_by,
                created_at=str(e.created_at)
            )
            for e in ev_result.scalars().all()
        ]

    # Get pickup point info
    pickup_name = None
    pickup_address = None
    if order.pickup_point_id:
        pp_result = await db.execute(select(PickupPoint).where(PickupPoint.id == order.pickup_point_id))
        pp = pp_result.scalar_one_or_none()
        if pp:
            pickup_name = pp.name
            pickup_address = pp.address

    # Check delivery confirmation
    dc_result = await db.execute(
        select(DeliveryConfirmation).where(DeliveryConfirmation.order_id == order.id)
    )
    dc = dc_result.scalar_one_or_none()

    # Check if feedback exists
    fb_result = await db.execute(
        select(func.count()).select_from(OrderFeedback).where(OrderFeedback.order_id == order.id)
    )
    has_feedback = fb_result.scalar() > 0

    return RecipientTrackingOut(
        order_code=order.order_code,
        status=order.status,
        recipient_name=order.recipient_name,
        recipient_city=order.recipient_city,
        pickup_point_name=pickup_name,
        pickup_point_address=pickup_address,
        estimated_delivery=estimated_delivery,
        shipment_status=shipment_status,
        shipment_events=events,
        delivery_confirmed=dc is not None,
        pickup_code=dc.pickup_code if dc else None,
        has_feedback=has_feedback,
    )


# ── Public: submit anonymous feedback (no auth) ──
@router.post("/submit", response_model=FeedbackOut)
async def submit_feedback(data: FeedbackCreate, db: AsyncSession = Depends(get_db)):
    """Anonymous feedback from recipient. Only needs order_code."""
    result = await db.execute(select(Order).where(Order.order_code == data.order_code))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    if data.rating not in ("ok", "problem"):
        raise HTTPException(400, "Rating must be 'ok' or 'problem'")

    fb = OrderFeedback(
        order_id=order.id,
        order_code=data.order_code,
        rating=data.rating,
        comment=data.comment,
        category=data.category,
    )
    db.add(fb)
    await db.commit()
    await db.refresh(fb)

    return FeedbackOut(
        id=fb.id, order_id=fb.order_id, order_code=fb.order_code,
        rating=fb.rating, comment=fb.comment, category=fb.category,
        photo_url=fb.photo_url, created_at=str(fb.created_at),
    )


# ── Admin: list all feedback ──
@router.get("/admin/all", response_model=list[FeedbackOut])
async def admin_list_feedback(
    rating: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    q = select(OrderFeedback).order_by(OrderFeedback.created_at.desc())
    if rating:
        q = q.where(OrderFeedback.rating == rating)
    result = await db.execute(q)
    return [
        FeedbackOut(
            id=f.id, order_id=f.order_id, order_code=f.order_code,
            rating=f.rating, comment=f.comment, category=f.category,
            photo_url=f.photo_url, created_at=str(f.created_at),
        )
        for f in result.scalars().all()
    ]


# ── Admin: feedback stats ──
@router.get("/admin/stats")
async def admin_feedback_stats(
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    total = await db.execute(select(func.count()).select_from(OrderFeedback))
    ok_count = await db.execute(
        select(func.count()).select_from(OrderFeedback).where(OrderFeedback.rating == "ok")
    )
    problem_count = await db.execute(
        select(func.count()).select_from(OrderFeedback).where(OrderFeedback.rating == "problem")
    )
    return {
        "total": total.scalar(),
        "ok": ok_count.scalar(),
        "problem": problem_count.scalar(),
    }


# ── Delivery confirmations (used by partner portal, Phase 10) ──
@router.post("/delivery/confirm", response_model=DeliveryConfirmationOut)
async def confirm_delivery(
    data: DeliveryConfirmationCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    """Partner or admin confirms delivery with pickup code verification."""
    result = await db.execute(select(Order).where(Order.id == data.order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    # Check if already confirmed
    existing = await db.execute(
        select(DeliveryConfirmation).where(DeliveryConfirmation.order_id == data.order_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Delivery already confirmed for this order")

    dc = DeliveryConfirmation(
        order_id=data.order_id,
        confirmed_by=user["sub"],
        pickup_code=data.pickup_code,
        recipient_id_check=data.recipient_id_check,
        notes=data.notes,
    )
    db.add(dc)

    # Update order status to delivered
    order.status = "delivered"
    await db.commit()
    await db.refresh(dc)

    return DeliveryConfirmationOut(
        id=dc.id, order_id=dc.order_id,
        confirmed_by=dc.confirmed_by, pickup_code=dc.pickup_code,
        recipient_id_check=dc.recipient_id_check,
        photo_url=dc.photo_url, notes=dc.notes,
        confirmed_at=str(dc.confirmed_at),
    )


@router.get("/delivery/{order_id}", response_model=DeliveryConfirmationOut)
async def get_delivery_confirmation(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    result = await db.execute(
        select(DeliveryConfirmation).where(DeliveryConfirmation.order_id == order_id)
    )
    dc = result.scalar_one_or_none()
    if not dc:
        raise HTTPException(404, "Delivery confirmation not found")
    return DeliveryConfirmationOut(
        id=dc.id, order_id=dc.order_id,
        confirmed_by=dc.confirmed_by, pickup_code=dc.pickup_code,
        recipient_id_check=dc.recipient_id_check,
        photo_url=dc.photo_url, notes=dc.notes,
        confirmed_at=str(dc.confirmed_at),
    )
