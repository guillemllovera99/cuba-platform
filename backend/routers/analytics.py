"""Platform analytics endpoints (US-13)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Order, OrderItem, Product, User
from auth import require_admin

router = APIRouter(prefix="/api/v1/admin/analytics", tags=["analytics"])


@router.get("/overview")
async def analytics_overview(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """High-level KPIs: revenue, orders, customers, avg order value."""
    total_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.status != "cancelled")
    )).scalar() or 0

    total_revenue = float((await db.execute(
        select(func.sum(Order.total_usd)).where(Order.status != "cancelled")
    )).scalar() or 0)

    total_customers = (await db.execute(
        select(func.count(func.distinct(Order.client_user_id)))
    )).scalar() or 0

    avg_order_value = round(total_revenue / total_orders, 2) if total_orders else 0

    # Orders by status
    status_rows = (await db.execute(
        select(Order.status, func.count(Order.id))
        .group_by(Order.status)
    )).all()
    orders_by_status = {row[0]: row[1] for row in status_rows}

    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "total_customers": total_customers,
        "avg_order_value": avg_order_value,
        "orders_by_status": orders_by_status,
    }


@router.get("/top-products")
async def top_products(
    limit: int = 10,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Top products by total units sold."""
    rows = (await db.execute(
        select(
            OrderItem.product_id,
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.subtotal_usd).label("total_revenue"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.status != "cancelled")
        .group_by(OrderItem.product_id, OrderItem.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )).all()

    return [
        {
            "product_id": r[0],
            "product_name": r[1],
            "total_sold": int(r[2]),
            "total_revenue": float(r[3]),
        }
        for r in rows
    ]


@router.get("/revenue-over-time")
async def revenue_over_time(
    days: int = 30,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Daily revenue and order count for the last N days."""
    rows = (await db.execute(
        select(
            cast(Order.created_at, Date).label("day"),
            func.count(Order.id).label("orders"),
            func.sum(Order.total_usd).label("revenue"),
        )
        .where(Order.status != "cancelled")
        .group_by(cast(Order.created_at, Date))
        .order_by(cast(Order.created_at, Date).desc())
        .limit(days)
    )).all()

    return [
        {
            "date": str(r[0]),
            "orders": r[1],
            "revenue": float(r[2] or 0),
        }
        for r in reversed(rows)
    ]


@router.get("/account-types")
async def account_types_breakdown(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Breakdown of users by account_type."""
    rows = (await db.execute(
        select(User.account_type, func.count(User.id))
        .where(User.role != "admin")
        .group_by(User.account_type)
    )).all()

    return {row[0] or "buyer": row[1] for row in rows}
