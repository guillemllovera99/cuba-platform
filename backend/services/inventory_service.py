"""
Inventory service — atomic stock operations.

These functions are NOT yet wired into checkout. They exist so that:
1. The inventory table can be tested independently.
2. The next task (rewriting checkout) has building blocks ready.
3. Each function is a single atomic DB operation — no race conditions.

Usage (future):
    from services.inventory_service import reserve_stock, release_stock, confirm_sale
"""
from sqlalchemy import update, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Inventory, StockMovement


async def reserve_stock(
    db: AsyncSession,
    product_id: str,
    quantity: int,
    order_id: str,
) -> bool:
    """
    Atomically reserve stock for an order.

    Uses a single UPDATE with a WHERE clause that checks available_qty >= quantity.
    If two requests race for the last unit, only one UPDATE will match — the other
    gets zero rows affected and returns False. No SELECT-then-UPDATE race condition.

    Returns True if reservation succeeded, False if insufficient stock.
    Does NOT commit — caller must commit or rollback the transaction.
    """
    result = await db.execute(
        update(Inventory)
        .where(
            Inventory.product_id == product_id,
            Inventory.available_qty >= quantity,
        )
        .values(
            available_qty=Inventory.available_qty - quantity,
            reserved_qty=Inventory.reserved_qty + quantity,
            version=Inventory.version + 1,
        )
        .returning(Inventory.id)
    )
    success = result.scalar_one_or_none() is not None

    if success:
        db.add(StockMovement(
            product_id=product_id,
            movement_type="reservation",
            quantity=-quantity,
            reference_type="order",
            reference_id=order_id,
        ))

    return success


async def release_stock(
    db: AsyncSession,
    product_id: str,
    quantity: int,
    order_id: str,
) -> None:
    """
    Release previously reserved stock back to available.

    Called when an order is cancelled or a reservation expires.
    Does NOT commit — caller must commit or rollback the transaction.
    """
    await db.execute(
        update(Inventory)
        .where(Inventory.product_id == product_id)
        .values(
            available_qty=Inventory.available_qty + quantity,
            reserved_qty=Inventory.reserved_qty - quantity,
            version=Inventory.version + 1,
        )
    )
    db.add(StockMovement(
        product_id=product_id,
        movement_type="release",
        quantity=quantity,
        reference_type="order",
        reference_id=order_id,
    ))


async def confirm_sale(
    db: AsyncSession,
    product_id: str,
    quantity: int,
    order_id: str,
) -> None:
    """
    Convert reserved stock into a confirmed sale.

    Called when payment is confirmed. Decrements reserved_qty (the stock
    is no longer reserved — it's sold and gone).
    Does NOT commit — caller must commit or rollback the transaction.
    """
    await db.execute(
        update(Inventory)
        .where(Inventory.product_id == product_id)
        .values(
            reserved_qty=Inventory.reserved_qty - quantity,
            version=Inventory.version + 1,
        )
    )
    db.add(StockMovement(
        product_id=product_id,
        movement_type="sale_confirmed",
        quantity=-quantity,
        reference_type="order",
        reference_id=order_id,
    ))


async def restock(
    db: AsyncSession,
    product_id: str,
    quantity: int,
    actor_id: str | None = None,
    notes: str | None = None,
) -> None:
    """
    Add stock (e.g. supplier delivery or return).

    Does NOT commit — caller must commit or rollback the transaction.
    """
    await db.execute(
        update(Inventory)
        .where(Inventory.product_id == product_id)
        .values(
            available_qty=Inventory.available_qty + quantity,
            version=Inventory.version + 1,
        )
    )
    db.add(StockMovement(
        product_id=product_id,
        movement_type="restock",
        quantity=quantity,
        reference_type="manual",
        notes=notes,
        created_by=actor_id,
    ))


async def get_stock_level(
    db: AsyncSession,
    product_id: str,
) -> dict | None:
    """
    Read current inventory levels for a product.
    Returns dict with available_qty, reserved_qty, version — or None if
    no inventory record exists.
    """
    result = await db.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    inv = result.scalar_one_or_none()
    if inv is None:
        return None
    return {
        "product_id": inv.product_id,
        "available_qty": inv.available_qty,
        "reserved_qty": inv.reserved_qty,
        "total_qty": inv.available_qty + inv.reserved_qty,
        "low_stock_threshold": inv.low_stock_threshold,
        "is_low_stock": inv.available_qty <= inv.low_stock_threshold,
        "version": inv.version,
    }
