"""Admin order endpoints: list all orders, update status with inventory signals."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Order
from schemas import OrderOut, StatusUpdate
from auth import require_admin
from routers.orders import _order_to_out  # reuse the shared helper
from services.inventory_service import release_stock, confirm_sale

router = APIRouter(prefix="/api/v1/orders/admin", tags=["admin-orders"])

VALID_STATUSES = [
    "pending_payment", "paid", "processing",
    "shipped", "delivered", "cancelled",
]

# Status transitions that are NOT allowed
INVALID_TRANSITIONS = {
    "delivered": {"pending_payment", "paid"},  # can't go backwards to unpaid
    "cancelled": set(),                         # anything can be cancelled
    "shipped": {"pending_payment"},             # can't ship without payment
}


@router.get("/all", response_model=list[OrderOut])
async def admin_list_orders(
    status: str | None = None,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    q = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
    if status:
        q = q.where(Order.status == status)
    result = await db.execute(q)
    return [_order_to_out(o) for o in result.scalars().all()]


@router.put("/{order_id}/status", response_model=OrderOut)
async def admin_update_status(
    order_id: str,
    req: StatusUpdate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if req.status not in VALID_STATUSES:
        raise HTTPException(400, f"Invalid status. Must be one of: {VALID_STATUSES}")

    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    old_status = order.status
    new_status = req.status

    if old_status == new_status:
        return _order_to_out(order)

    # Prevent re-cancelling or re-delivering
    if old_status == "cancelled":
        raise HTTPException(400, "Cannot change status of a cancelled order")

    # ── Inventory signals based on status transition ──────────────
    #
    # Cancel from any non-cancelled state → release reserved stock
    if new_status == "cancelled":
        # Only release if stock was reserved (i.e. order went through checkout)
        # For pending_payment or paid orders, stock is reserved but not yet confirmed
        # For processing/shipped, confirm_sale already happened so we skip release
        if old_status in ("pending_payment", "paid"):
            for item in order.items:
                await release_stock(db, item.product_id, item.quantity, order.id)

    # Transition to "paid" from "pending_payment" → confirm the sale
    # (This handles manual admin confirmation when payment is verified outside the app)
    if new_status == "paid" and old_status == "pending_payment":
        order.paid_at = datetime.now(timezone.utc)
        for item in order.items:
            await confirm_sale(db, item.product_id, item.quantity, order.id)

    order.status = new_status
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return _order_to_out(order)
