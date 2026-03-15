"""Admin order endpoints: list all orders, update status."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Order
from schemas import OrderOut, StatusUpdate
from auth import require_admin
from routers.orders import _order_to_out  # reuse the shared helper

router = APIRouter(prefix="/api/v1/orders/admin", tags=["admin-orders"])

VALID_STATUSES = [
    "pending_payment", "paid", "processing",
    "shipped", "delivered", "cancelled",
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

    order.status = req.status
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return _order_to_out(order)
