"""
Phase 10 — Partner Portal
Local distribution partners in Cuba: manage assigned orders,
confirm deliveries, view pickup points.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import (
    PartnerProfile, Order, Shipment, PickupPoint,
    DeliveryConfirmation, OrderFeedback, User,
)
from schemas import PartnerProfileCreate, PartnerProfileOut
from auth import require_auth, require_admin

router = APIRouter(prefix="/api/v1/partner", tags=["partner"])


# ── Register as partner ──
@router.post("/register", response_model=PartnerProfileOut)
async def register_partner(
    data: PartnerProfileCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    existing = await db.execute(
        select(PartnerProfile).where(PartnerProfile.user_id == user["sub"])
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Partner profile already exists")

    profile = PartnerProfile(
        user_id=user["sub"],
        company_name=data.company_name,
        region=data.region,
        contact_phone=data.contact_phone,
        contact_name=data.contact_name,
    )
    db.add(profile)

    # Update user role
    u_result = await db.execute(select(User).where(User.id == user["sub"]))
    u = u_result.scalar_one()
    u.account_type = "partner"
    await db.commit()
    await db.refresh(profile)

    return PartnerProfileOut(
        id=profile.id, user_id=profile.user_id,
        company_name=profile.company_name, region=profile.region,
        contact_phone=profile.contact_phone, contact_name=profile.contact_name,
        status=profile.status, approved_at=str(profile.approved_at) if profile.approved_at else None,
        notes=profile.notes, created_at=str(profile.created_at),
        user_email=u.email if u else None, user_name=u.full_name if u else None,
    )


# ── Get my partner profile ──
@router.get("/profile", response_model=PartnerProfileOut)
async def get_partner_profile(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    result = await db.execute(
        select(PartnerProfile).where(PartnerProfile.user_id == user["sub"])
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Partner profile not found. Register first.")
    return PartnerProfileOut(
        id=profile.id, user_id=profile.user_id,
        company_name=profile.company_name, region=profile.region,
        contact_phone=profile.contact_phone, contact_name=profile.contact_name,
        status=profile.status, approved_at=str(profile.approved_at) if profile.approved_at else None,
        notes=profile.notes, created_at=str(profile.created_at),
    )


# ── Partner dashboard: orders assigned to their region ──
@router.get("/orders")
async def partner_orders(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    # Get partner profile
    p_result = await db.execute(
        select(PartnerProfile).where(PartnerProfile.user_id == user["sub"])
    )
    partner = p_result.scalar_one_or_none()
    if not partner or partner.status != "approved":
        raise HTTPException(403, "Partner profile not approved")

    # Get orders in partner's region (or all if no region set)
    q = select(Order).order_by(Order.created_at.desc())
    if partner.region:
        q = q.where(Order.recipient_city == partner.region)
    if status:
        q = q.where(Order.status == status)

    result = await db.execute(q)
    orders = result.scalars().all()

    out = []
    for o in orders:
        # Check delivery confirmation
        dc_result = await db.execute(
            select(DeliveryConfirmation).where(DeliveryConfirmation.order_id == o.id)
        )
        dc = dc_result.scalar_one_or_none()

        out.append({
            "id": o.id,
            "order_code": o.order_code,
            "status": o.status,
            "recipient_name": o.recipient_name,
            "recipient_phone": o.recipient_phone,
            "recipient_city": o.recipient_city,
            "recipient_address": o.recipient_address,
            "total_usd": float(o.total_usd) if o.total_usd else None,
            "created_at": str(o.created_at),
            "delivery_confirmed": dc is not None,
            "pickup_code": dc.pickup_code if dc else None,
        })
    return out


# ── Partner stats ──
@router.get("/stats")
async def partner_stats(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    p_result = await db.execute(
        select(PartnerProfile).where(PartnerProfile.user_id == user["sub"])
    )
    partner = p_result.scalar_one_or_none()
    if not partner or partner.status != "approved":
        raise HTTPException(403, "Not an approved partner")

    from sqlalchemy import func

    # Count deliveries confirmed by this partner
    confirmed = await db.execute(
        select(func.count()).select_from(DeliveryConfirmation)
        .where(DeliveryConfirmation.confirmed_by == user["sub"])
    )
    # Feedback from orders in region
    feedback_count = await db.execute(
        select(func.count()).select_from(OrderFeedback)
        .join(Order, Order.id == OrderFeedback.order_id)
        .where(Order.recipient_city == partner.region if partner.region else True)
    )
    return {
        "deliveries_confirmed": confirmed.scalar(),
        "feedback_received": feedback_count.scalar(),
        "region": partner.region,
    }


# ── Admin: list all partners ──
@router.get("/admin/all", response_model=list[PartnerProfileOut])
async def admin_list_partners(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    q = select(PartnerProfile).order_by(PartnerProfile.created_at.desc())
    if status:
        q = q.where(PartnerProfile.status == status)
    result = await db.execute(q)

    out = []
    for p in result.scalars().all():
        u_result = await db.execute(select(User).where(User.id == p.user_id))
        u = u_result.scalar_one_or_none()
        out.append(PartnerProfileOut(
            id=p.id, user_id=p.user_id,
            company_name=p.company_name, region=p.region,
            contact_phone=p.contact_phone, contact_name=p.contact_name,
            status=p.status,
            approved_at=str(p.approved_at) if p.approved_at else None,
            notes=p.notes, created_at=str(p.created_at),
            user_email=u.email if u else None,
            user_name=u.full_name if u else None,
        ))
    return out


# ── Admin: approve/reject partner ──
@router.put("/admin/{profile_id}/approve")
async def admin_approve_partner(
    profile_id: str,
    status: str,  # approved | suspended
    notes: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    result = await db.execute(select(PartnerProfile).where(PartnerProfile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Partner not found")

    from models import utcnow
    profile.status = status
    if status == "approved":
        profile.approved_at = utcnow()
    if notes:
        profile.notes = notes
    await db.commit()
    return {"status": "updated", "new_status": status}
