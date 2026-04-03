"""
Phase 10 — Supplier Portal
External suppliers: manage profiles, confirm POs, track shipments.
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import (
    SupplierProfile, PurchaseOrder, PurchaseOrderItem, User,
)
from schemas import (
    SupplierProfileCreate, SupplierProfileOut,
    PurchaseOrderCreate, PurchaseOrderOut, PurchaseOrderItemOut,
)
from routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/supplier", tags=["supplier"])


def _gen_po_number() -> str:
    return f"PO-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


# ── Register as supplier ──
@router.post("/register", response_model=SupplierProfileOut)
async def register_supplier(
    data: SupplierProfileCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    existing = await db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == user["id"])
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Supplier profile already exists")

    profile = SupplierProfile(
        user_id=user["id"],
        company_name=data.company_name,
        country=data.country,
        contact_name=data.contact_name,
        contact_email=data.contact_email,
        contact_phone=data.contact_phone,
        product_categories=data.product_categories,
    )
    db.add(profile)

    # Update user account_type
    u_result = await db.execute(select(User).where(User.id == user["id"]))
    u = u_result.scalar_one()
    u.account_type = "supplier"
    await db.commit()
    await db.refresh(profile)

    return SupplierProfileOut(
        id=profile.id, user_id=profile.user_id,
        company_name=profile.company_name, country=profile.country,
        contact_name=profile.contact_name, contact_email=profile.contact_email,
        contact_phone=profile.contact_phone,
        product_categories=profile.product_categories,
        status=profile.status,
        approved_at=str(profile.approved_at) if profile.approved_at else None,
        notes=profile.notes, created_at=str(profile.created_at),
    )


# ── Get my supplier profile ──
@router.get("/profile", response_model=SupplierProfileOut)
async def get_supplier_profile(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == user["id"])
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Supplier profile not found")
    return SupplierProfileOut(
        id=profile.id, user_id=profile.user_id,
        company_name=profile.company_name, country=profile.country,
        contact_name=profile.contact_name, contact_email=profile.contact_email,
        contact_phone=profile.contact_phone,
        product_categories=profile.product_categories,
        status=profile.status,
        approved_at=str(profile.approved_at) if profile.approved_at else None,
        notes=profile.notes, created_at=str(profile.created_at),
    )


# ── Supplier: view purchase orders assigned to me ──
@router.get("/purchase-orders", response_model=list[PurchaseOrderOut])
async def supplier_purchase_orders(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    # Get supplier profile
    s_result = await db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == user["id"])
    )
    supplier = s_result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(403, "Not a registered supplier")

    q = (
        select(PurchaseOrder)
        .where(PurchaseOrder.supplier_id == supplier.id)
        .order_by(PurchaseOrder.created_at.desc())
    )
    if status:
        q = q.where(PurchaseOrder.status == status)

    result = await db.execute(q)
    out = []
    for po in result.scalars().all():
        items_result = await db.execute(
            select(PurchaseOrderItem).where(PurchaseOrderItem.purchase_order_id == po.id)
        )
        items = [
            PurchaseOrderItemOut(
                id=i.id, product_id=i.product_id,
                description=i.description, quantity=i.quantity,
                unit_cost_usd=float(i.unit_cost_usd),
                subtotal_usd=float(i.subtotal_usd),
            )
            for i in items_result.scalars().all()
        ]
        out.append(PurchaseOrderOut(
            id=po.id, po_number=po.po_number,
            supplier_id=po.supplier_id, status=po.status,
            total_usd=float(po.total_usd) if po.total_usd else None,
            notes=po.notes,
            sent_at=str(po.sent_at) if po.sent_at else None,
            confirmed_at=str(po.confirmed_at) if po.confirmed_at else None,
            shipped_at=str(po.shipped_at) if po.shipped_at else None,
            created_by=po.created_by,
            created_at=str(po.created_at), updated_at=str(po.updated_at),
            items=items, supplier_name=supplier.company_name,
        ))
    return out


# ── Supplier: confirm a PO ──
@router.put("/purchase-orders/{po_id}/confirm")
async def supplier_confirm_po(
    po_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    s_result = await db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == user["id"])
    )
    supplier = s_result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(403, "Not a registered supplier")

    result = await db.execute(
        select(PurchaseOrder)
        .where(PurchaseOrder.id == po_id, PurchaseOrder.supplier_id == supplier.id)
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Purchase order not found")
    if po.status not in ("sent",):
        raise HTTPException(400, f"Cannot confirm PO in status '{po.status}'")

    po.status = "confirmed"
    po.confirmed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "confirmed", "po_number": po.po_number}


# ── Supplier: mark PO as shipped ──
@router.put("/purchase-orders/{po_id}/ship")
async def supplier_ship_po(
    po_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    s_result = await db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == user["id"])
    )
    supplier = s_result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(403, "Not a registered supplier")

    result = await db.execute(
        select(PurchaseOrder)
        .where(PurchaseOrder.id == po_id, PurchaseOrder.supplier_id == supplier.id)
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Purchase order not found")
    if po.status != "confirmed":
        raise HTTPException(400, f"Cannot ship PO in status '{po.status}'")

    po.status = "shipped"
    po.shipped_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "shipped", "po_number": po.po_number}


# ══════════════════════════════════════════════════
# Admin endpoints for managing suppliers & POs
# ══════════════════════════════════════════════════

@router.get("/admin/all", response_model=list[SupplierProfileOut])
async def admin_list_suppliers(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_admin),
):
    q = select(SupplierProfile).order_by(SupplierProfile.created_at.desc())
    if status:
        q = q.where(SupplierProfile.status == status)
    result = await db.execute(q)
    out = []
    for s in result.scalars().all():
        u_result = await db.execute(select(User).where(User.id == s.user_id))
        u = u_result.scalar_one_or_none()
        out.append(SupplierProfileOut(
            id=s.id, user_id=s.user_id,
            company_name=s.company_name, country=s.country,
            contact_name=s.contact_name, contact_email=s.contact_email,
            contact_phone=s.contact_phone,
            product_categories=s.product_categories,
            status=s.status,
            approved_at=str(s.approved_at) if s.approved_at else None,
            notes=s.notes, created_at=str(s.created_at),
            user_email=u.email if u else None,
            user_name=u.full_name if u else None,
        ))
    return out


@router.put("/admin/{profile_id}/approve")
async def admin_approve_supplier(
    profile_id: str,
    status: str,
    notes: str | None = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_admin),
):
    result = await db.execute(select(SupplierProfile).where(SupplierProfile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Supplier not found")

    from models import utcnow
    profile.status = status
    if status == "approved":
        profile.approved_at = utcnow()
    if notes:
        profile.notes = notes
    await db.commit()
    return {"status": "updated", "new_status": status}


# ── Admin: create purchase order ──
@router.post("/admin/purchase-orders", response_model=PurchaseOrderOut)
async def admin_create_po(
    data: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_admin),
):
    # Verify supplier exists
    s_result = await db.execute(
        select(SupplierProfile).where(SupplierProfile.id == data.supplier_id)
    )
    supplier = s_result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(404, "Supplier not found")

    po = PurchaseOrder(
        po_number=_gen_po_number(),
        supplier_id=data.supplier_id,
        notes=data.notes,
        created_by=user["id"],
    )

    total = 0.0
    items_out = []
    for item_data in data.items:
        subtotal = item_data["quantity"] * item_data["unit_cost_usd"]
        total += subtotal
        item = PurchaseOrderItem(
            purchase_order_id=po.id,
            product_id=item_data.get("product_id"),
            description=item_data["description"],
            quantity=item_data["quantity"],
            unit_cost_usd=item_data["unit_cost_usd"],
            subtotal_usd=subtotal,
        )
        po.items.append(item)
        items_out.append(PurchaseOrderItemOut(
            id=item.id, product_id=item.product_id,
            description=item.description, quantity=item.quantity,
            unit_cost_usd=float(item.unit_cost_usd),
            subtotal_usd=float(item.subtotal_usd),
        ))

    po.total_usd = total
    db.add(po)
    await db.commit()
    await db.refresh(po)

    return PurchaseOrderOut(
        id=po.id, po_number=po.po_number,
        supplier_id=po.supplier_id, status=po.status,
        total_usd=float(po.total_usd),
        notes=po.notes, sent_at=None, confirmed_at=None, shipped_at=None,
        created_by=po.created_by,
        created_at=str(po.created_at), updated_at=str(po.updated_at),
        items=items_out, supplier_name=supplier.company_name,
    )


# ── Admin: send PO to supplier ──
@router.put("/admin/purchase-orders/{po_id}/send")
async def admin_send_po(
    po_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_admin),
):
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(404, "PO not found")
    if po.status != "draft":
        raise HTTPException(400, f"Cannot send PO in status '{po.status}'")

    po.status = "sent"
    po.sent_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "sent", "po_number": po.po_number}


# ── Admin: list all POs ──
@router.get("/admin/purchase-orders", response_model=list[PurchaseOrderOut])
async def admin_list_pos(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_admin),
):
    q = select(PurchaseOrder).order_by(PurchaseOrder.created_at.desc())
    if status:
        q = q.where(PurchaseOrder.status == status)
    result = await db.execute(q)

    out = []
    for po in result.scalars().all():
        s_result = await db.execute(
            select(SupplierProfile).where(SupplierProfile.id == po.supplier_id)
        )
        supplier = s_result.scalar_one_or_none()

        items_result = await db.execute(
            select(PurchaseOrderItem).where(PurchaseOrderItem.purchase_order_id == po.id)
        )
        items = [
            PurchaseOrderItemOut(
                id=i.id, product_id=i.product_id,
                description=i.description, quantity=i.quantity,
                unit_cost_usd=float(i.unit_cost_usd),
                subtotal_usd=float(i.subtotal_usd),
            )
            for i in items_result.scalars().all()
        ]
        out.append(PurchaseOrderOut(
            id=po.id, po_number=po.po_number,
            supplier_id=po.supplier_id, status=po.status,
            total_usd=float(po.total_usd) if po.total_usd else None,
            notes=po.notes,
            sent_at=str(po.sent_at) if po.sent_at else None,
            confirmed_at=str(po.confirmed_at) if po.confirmed_at else None,
            shipped_at=str(po.shipped_at) if po.shipped_at else None,
            created_by=po.created_by,
            created_at=str(po.created_at), updated_at=str(po.updated_at),
            items=items,
            supplier_name=supplier.company_name if supplier else None,
        ))
    return out
