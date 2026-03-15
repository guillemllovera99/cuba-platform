"""Admin dashboard statistics endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Order, Product
from auth import require_admin

router = APIRouter(prefix="/api/v1/admin", tags=["admin-stats"])


@router.get("/stats")
async def admin_stats(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total_orders = await db.execute(select(func.count(Order.id)))
    total_revenue = await db.execute(
        select(func.sum(Order.total_usd)).where(Order.status != "cancelled")
    )
    paid_orders = await db.execute(
        select(func.count(Order.id)).where(Order.status == "paid")
    )
    processing_orders = await db.execute(
        select(func.count(Order.id)).where(Order.status == "processing")
    )
    shipped_orders = await db.execute(
        select(func.count(Order.id)).where(Order.status == "shipped")
    )
    delivered_orders = await db.execute(
        select(func.count(Order.id)).where(Order.status == "delivered")
    )
    total_products = await db.execute(
        select(func.count(Product.id)).where(Product.is_active == True)
    )

    return {
        "total_orders": total_orders.scalar() or 0,
        "total_revenue": float(total_revenue.scalar() or 0),
        "paid_orders": paid_orders.scalar() or 0,
        "processing_orders": processing_orders.scalar() or 0,
        "shipped_orders": shipped_orders.scalar() or 0,
        "delivered_orders": delivered_orders.scalar() or 0,
        "total_products": total_products.scalar() or 0,
    }
