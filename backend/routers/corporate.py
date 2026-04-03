"""
Phase 7 — Corporate / B2B Orders
Endpoints for corporate account registration, admin approval,
bulk ordering with custom pricing tiers, and corporate dashboard.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import CorporateProfile, User, Order, OrderItem, Product
from schemas import (
    CorporateProfileCreate, CorporateProfileUpdate, CorporateProfileOut,
    CorporateApproval, OrderOut, OrderItemOut,
)
from auth import require_auth, require_admin
from services.invoice_service import generate_invoice_data, generate_invoice_html

router = APIRouter(prefix="/api/v1/corporate", tags=["corporate"])


# ── Helpers ────────────────────────────────────────────────────

def _profile_to_out(cp: CorporateProfile) -> CorporateProfileOut:
    return CorporateProfileOut(
        id=cp.id,
        user_id=cp.user_id,
        company_name=cp.company_name,
        tax_id=cp.tax_id,
        industry=cp.industry,
        billing_address=cp.billing_address,
        billing_city=cp.billing_city,
        billing_country=cp.billing_country,
        contact_name=cp.contact_name,
        contact_phone=cp.contact_phone,
        status=cp.status,
        approved_at=cp.approved_at.isoformat() if cp.approved_at else None,
        pricing_tier=cp.pricing_tier,
        discount_pct=float(cp.discount_pct) if cp.discount_pct else 0,
        deposit_pct=float(cp.deposit_pct) if cp.deposit_pct else 50,
        notes=cp.notes,
        created_at=cp.created_at.isoformat() if cp.created_at else "",
        user_email=cp.user.email if cp.user else None,
        user_name=cp.user.full_name if cp.user else None,
    )


# ── Corporate Registration ────────────────────────────────────

@router.post("/register", response_model=CorporateProfileOut)
async def register_corporate(
    req: CorporateProfileCreate,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Register current user as a corporate account. Requires admin approval."""
    # Check if already registered
    existing = await db.execute(
        select(CorporateProfile).where(CorporateProfile.user_id == user["sub"])
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Corporate profile already exists for this account")

    profile = CorporateProfile(
        user_id=user["sub"],
        company_name=req.company_name,
        tax_id=req.tax_id,
        industry=req.industry,
        billing_address=req.billing_address,
        billing_city=req.billing_city,
        billing_country=req.billing_country,
        contact_name=req.contact_name,
        contact_phone=req.contact_phone,
        status="pending",
    )
    db.add(profile)

    # Update user account_type
    u = await db.execute(select(User).where(User.id == user["sub"]))
    u_obj = u.scalar_one_or_none()
    if u_obj:
        u_obj.account_type = "both"  # Can still buy as individual too

    await db.commit()
    await db.refresh(profile)

    # Reload with user relationship
    result = await db.execute(
        select(CorporateProfile)
        .where(CorporateProfile.id == profile.id)
        .options(selectinload(CorporateProfile.user))
    )
    profile = result.scalar_one()
    return _profile_to_out(profile)


@router.get("/profile", response_model=CorporateProfileOut)
async def get_my_corporate_profile(
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's corporate profile."""
    result = await db.execute(
        select(CorporateProfile)
        .where(CorporateProfile.user_id == user["sub"])
        .options(selectinload(CorporateProfile.user))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "No corporate profile found")
    return _profile_to_out(profile)


@router.put("/profile", response_model=CorporateProfileOut)
async def update_corporate_profile(
    req: CorporateProfileUpdate,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's corporate profile."""
    result = await db.execute(
        select(CorporateProfile).where(CorporateProfile.user_id == user["sub"])
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "No corporate profile found")

    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        if hasattr(profile, key):
            setattr(profile, key, val)

    await db.commit()

    # Reload with user
    result2 = await db.execute(
        select(CorporateProfile)
        .where(CorporateProfile.id == profile.id)
        .options(selectinload(CorporateProfile.user))
    )
    profile = result2.scalar_one()
    return _profile_to_out(profile)


# ── Corporate Dashboard (order history, spend stats) ──────────

@router.get("/dashboard")
async def corporate_dashboard(
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard stats for a corporate user: total orders, spend, discount info."""
    # Get corporate profile
    cp_result = await db.execute(
        select(CorporateProfile)
        .where(CorporateProfile.user_id == user["sub"])
        .options(selectinload(CorporateProfile.user))
    )
    cp = cp_result.scalar_one_or_none()
    if not cp:
        raise HTTPException(404, "No corporate profile found")
    if cp.status != "approved":
        raise HTTPException(403, "Corporate account not yet approved")

    # Order stats
    orders_result = await db.execute(
        select(
            func.count(Order.id).label("total_orders"),
            func.coalesce(func.sum(Order.total_usd), 0).label("total_spend"),
        ).where(Order.client_user_id == user["sub"])
    )
    stats = orders_result.one()

    # Recent orders
    recent = await db.execute(
        select(Order)
        .where(Order.client_user_id == user["sub"])
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .limit(10)
    )
    recent_orders = recent.scalars().all()

    return {
        "profile": _profile_to_out(cp),
        "stats": {
            "total_orders": stats.total_orders,
            "total_spend": float(stats.total_spend),
            "pricing_tier": cp.pricing_tier,
            "discount_pct": float(cp.discount_pct) if cp.discount_pct else 0,
            "deposit_pct": float(cp.deposit_pct) if cp.deposit_pct else 50,
        },
        "recent_orders": [
            {
                "id": o.id,
                "order_code": o.order_code,
                "status": o.status,
                "total_usd": float(o.total_usd) if o.total_usd else 0,
                "created_at": o.created_at.isoformat() if o.created_at else "",
                "item_count": len(o.items),
            }
            for o in recent_orders
        ],
    }


# ── Corporate Bulk Order (with custom pricing) ────────────────

@router.post("/bulk-order")
async def create_bulk_order(
    req: dict,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a corporate bulk order with wholesale pricing.
    Body: { items: [{product_id, quantity}], recipient_name, recipient_phone,
            recipient_city, recipient_address, pickup_point_id?, notes? }
    """
    # Verify corporate profile is approved
    cp_result = await db.execute(
        select(CorporateProfile).where(CorporateProfile.user_id == user["sub"])
    )
    cp = cp_result.scalar_one_or_none()
    if not cp or cp.status != "approved":
        raise HTTPException(403, "Approved corporate account required for bulk orders")

    items = req.get("items", [])
    if not items:
        raise HTTPException(400, "Cart is empty")

    # Fetch products
    product_ids = [item["product_id"] for item in items]
    result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in result.scalars().all()}

    order_items = []
    subtotal = 0.0
    discount_pct = float(cp.discount_pct) if cp.discount_pct else 0

    import random, string
    order_code = "CORP-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

    for item in items:
        product = products.get(item["product_id"])
        if not product:
            raise HTTPException(400, f"Product {item['product_id']} not found")

        # Apply corporate discount
        base_price = float(product.price_usd)
        discounted_price = round(base_price * (1 - discount_pct / 100), 2)
        qty = item["quantity"]
        line_total = round(discounted_price * qty, 2)
        subtotal += line_total

        order_items.append(OrderItem(
            product_id=product.id,
            product_name=product.name,
            quantity=qty,
            unit_price_usd=discounted_price,
            subtotal_usd=line_total,
        ))
        product.stock_quantity -= qty

    # Corporate deposit: 50% upfront (configurable per profile)
    deposit_pct = float(cp.deposit_pct) if cp.deposit_pct else 50
    deposit = round(subtotal * deposit_pct / 100, 2)
    balance = round(subtotal - deposit, 2)

    order = Order(
        order_code=order_code,
        client_user_id=user["sub"],
        status="pending_deposit",
        recipient_name=req.get("recipient_name", ""),
        recipient_phone=req.get("recipient_phone", ""),
        recipient_city=req.get("recipient_city", ""),
        recipient_address=req.get("recipient_address"),
        pickup_point_id=req.get("pickup_point_id"),
        subtotal_usd=subtotal,
        total_usd=subtotal,
        deposit_amount=deposit,
        balance_amount=balance,
        notes=f"[CORPORATE:{cp.company_name}] {req.get('notes', '')}".strip(),
    )
    order.items = order_items
    db.add(order)
    await db.commit()
    await db.refresh(order, attribute_names=["items"])

    return {
        "id": order.id,
        "order_code": order.order_code,
        "status": order.status,
        "subtotal_usd": float(order.subtotal_usd),
        "total_usd": float(order.total_usd),
        "deposit_amount": float(order.deposit_amount),
        "balance_amount": float(order.balance_amount),
        "discount_applied_pct": discount_pct,
        "deposit_pct": deposit_pct,
        "items": [
            {
                "product_id": i.product_id,
                "product_name": i.product_name,
                "quantity": i.quantity,
                "unit_price_usd": float(i.unit_price_usd),
                "subtotal_usd": float(i.subtotal_usd),
            }
            for i in order.items
        ],
    }


# ── Admin: Corporate Account Management ───────────────────────

@router.get("/admin/all", response_model=list[CorporateProfileOut])
async def admin_list_corporates(
    status: str | None = None,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all corporate profiles. Optionally filter by status."""
    q = select(CorporateProfile).options(selectinload(CorporateProfile.user))
    if status:
        q = q.where(CorporateProfile.status == status)
    q = q.order_by(CorporateProfile.created_at.desc())
    result = await db.execute(q)
    return [_profile_to_out(cp) for cp in result.scalars().all()]


@router.put("/admin/{profile_id}/approve", response_model=CorporateProfileOut)
async def admin_approve_corporate(
    profile_id: str,
    req: CorporateApproval,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a corporate profile and set pricing tier."""
    result = await db.execute(
        select(CorporateProfile).where(CorporateProfile.id == profile_id)
    )
    cp = result.scalar_one_or_none()
    if not cp:
        raise HTTPException(404, "Corporate profile not found")

    if req.status not in ("approved", "rejected"):
        raise HTTPException(400, "Status must be 'approved' or 'rejected'")

    cp.status = req.status
    if req.status == "approved":
        cp.approved_at = datetime.now(timezone.utc)
        cp.approved_by = admin["sub"]
        if req.pricing_tier:
            cp.pricing_tier = req.pricing_tier
        if req.discount_pct is not None:
            cp.discount_pct = req.discount_pct
        if req.deposit_pct is not None:
            cp.deposit_pct = req.deposit_pct
    if req.notes:
        cp.notes = req.notes

    await db.commit()

    # Reload with user
    result2 = await db.execute(
        select(CorporateProfile)
        .where(CorporateProfile.id == cp.id)
        .options(selectinload(CorporateProfile.user))
    )
    cp = result2.scalar_one()
    return _profile_to_out(cp)


@router.get("/admin/{profile_id}", response_model=CorporateProfileOut)
async def admin_get_corporate(
    profile_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific corporate profile by ID."""
    result = await db.execute(
        select(CorporateProfile)
        .where(CorporateProfile.id == profile_id)
        .options(selectinload(CorporateProfile.user))
    )
    cp = result.scalar_one_or_none()
    if not cp:
        raise HTTPException(404, "Corporate profile not found")
    return _profile_to_out(cp)


# ── Invoice Generation ────────────────────────────────────────

@router.get("/invoice/{order_id}")
async def get_invoice_data(
    order_id: str,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get invoice data (JSON) for a specific order."""
    order_result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if user["role"] != "admin" and order.client_user_id != user["sub"]:
        raise HTTPException(403, "Not authorized")

    # Check for corporate profile
    cp_result = await db.execute(
        select(CorporateProfile).where(CorporateProfile.user_id == order.client_user_id)
    )
    cp = cp_result.scalar_one_or_none()

    return generate_invoice_data(order, cp)


@router.get("/invoice/{order_id}/html")
async def get_invoice_html(
    order_id: str,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get a printable HTML invoice for an order."""
    from fastapi.responses import HTMLResponse

    order_result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if user["role"] != "admin" and order.client_user_id != user["sub"]:
        raise HTTPException(403, "Not authorized")

    cp_result = await db.execute(
        select(CorporateProfile).where(CorporateProfile.user_id == order.client_user_id)
    )
    cp = cp_result.scalar_one_or_none()

    invoice_data = generate_invoice_data(order, cp)
    html = generate_invoice_html(invoice_data)
    return HTMLResponse(content=html)
