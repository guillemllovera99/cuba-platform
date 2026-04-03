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
from routers.shipments import ensure_shipment_for_order

router = APIRouter(prefix="/api/v1/orders/admin", tags=["admin-orders"])

VALID_STATUSES = [
    "pending_deposit", "deposit_paid", "balance_due", "paid",
    "pending_payment",  # legacy compat
    "processing", "shipped", "delivered", "cancelled",
]


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
        # Only release if stock was reserved but sale not yet confirmed
        if old_status in ("pending_payment", "pending_deposit", "deposit_paid", "balance_due"):
            for item in order.items:
                await release_stock(db, item.product_id, item.quantity, order.id)

    # Transition to "paid" → confirm the sale (inventory moves from reserved to sold)
    if new_status == "paid" and old_status in ("pending_payment", "deposit_paid", "balance_due"):
        order.paid_at = datetime.now(timezone.utc)
        if old_status == "balance_due":
            order.balance_paid_at = datetime.now(timezone.utc)
        for item in order.items:
            await confirm_sale(db, item.product_id, item.quantity, order.id)

    # Admin requests balance payment (deposit_paid → balance_due)
    if new_status == "balance_due" and old_status == "deposit_paid":
        pass  # Just a status change, no inventory action needed

    # Auto-create shipment when order moves to processing
    if new_status == "processing":
        await ensure_shipment_for_order(db, order)

    order.status = new_status
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return _order_to_out(order)


# ── Admin: Request balance payment ─────────────────────────────
# Convenience endpoint that moves deposit_paid → balance_due
@router.put("/{order_id}/request-balance", response_model=OrderOut)
async def admin_request_balance(
    order_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != "deposit_paid":
        raise HTTPException(400, f"Can only request balance from deposit_paid orders (current: {order.status})")

    order.status = "balance_due"
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return _order_to_out(order)


# ── Admin: Confirm balance payment (manual) ────────────────────
# For when admin verifies payment outside the app
@router.put("/{order_id}/confirm-balance", response_model=OrderOut)
async def admin_confirm_balance(
    order_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != "balance_due":
        raise HTTPException(400, f"Can only confirm balance for balance_due orders (current: {order.status})")

    now = datetime.now(timezone.utc)
    order.status = "paid"
    order.balance_paid_at = now
    order.paid_at = now

    # Confirm inventory sale
    for item in order.items:
        await confirm_sale(db, item.product_id, item.quantity, order.id)

    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return _order_to_out(order)
