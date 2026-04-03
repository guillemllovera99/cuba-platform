"""Order endpoints: checkout, my orders, tracking, order detail."""
import random
import string
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Product, Order, OrderItem
from schemas import CheckoutRequest, OrderOut, OrderItemOut
from auth import require_auth
from services.inventory_service import reserve_stock, confirm_sale
from config import PAYMENTS_ENABLED

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


def generate_order_code() -> str:
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=6))
    return f"CUB-{suffix}"


def _order_to_out(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        order_code=order.order_code,
        status=order.status,
        recipient_name=order.recipient_name,
        recipient_phone=order.recipient_phone,
        recipient_city=order.recipient_city,
        recipient_address=order.recipient_address,
        pickup_point_id=order.pickup_point_id,
        subtotal_usd=float(order.subtotal_usd) if order.subtotal_usd else None,
        total_usd=float(order.total_usd) if order.total_usd else None,
        deposit_amount=float(order.deposit_amount) if order.deposit_amount else None,
        balance_amount=float(order.balance_amount) if order.balance_amount else None,
        deposit_paid_at=order.deposit_paid_at.isoformat() if order.deposit_paid_at else None,
        balance_paid_at=order.balance_paid_at.isoformat() if order.balance_paid_at else None,
        notes=order.notes,
        paid_at=order.paid_at.isoformat() if order.paid_at else None,
        created_at=order.created_at.isoformat() if order.created_at else "",
        items=[
            OrderItemOut(
                id=i.id,
                product_id=i.product_id,
                product_name=i.product_name,
                quantity=i.quantity,
                unit_price_usd=float(i.unit_price_usd),
                subtotal_usd=float(i.subtotal_usd),
            )
            for i in (order.items or [])
        ],
    )


# ── Checkout ─────────────────────────────────────────────────────
# When PAYMENTS_ENABLED (Stripe/PayPal keys configured):
#   → Order created as "pending_payment", frontend redirects to payment
# When PAYMENTS_ENABLED is False (no keys = mock mode):
#   → Order auto-confirmed as "paid" (existing demo behavior)

@router.post("/checkout", response_model=OrderOut)
async def checkout(
    req: CheckoutRequest,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    if not req.items:
        raise HTTPException(400, "Cart is empty")

    # Fetch products and validate
    product_ids = [item.product_id for item in req.items]
    result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in result.scalars().all()}

    order_items = []
    subtotal = 0.0
    reserved = []

    order_code = generate_order_code()
    temp_order_id = f"pending-{order_code}"

    for item in req.items:
        product = products.get(item.product_id)
        if not product:
            raise HTTPException(400, f"Product {item.product_id} not found")

        success = await reserve_stock(db, product.id, item.quantity, temp_order_id)
        if not success:
            await db.rollback()
            raise HTTPException(
                400,
                f"Insufficient stock for '{product.name}'. "
                f"Please reduce quantity or remove from cart."
            )
        reserved.append((product.id, item.quantity))

        line_total = float(product.price_usd) * item.quantity
        subtotal += line_total
        order_items.append(OrderItem(
            product_id=product.id,
            product_name=product.name,
            quantity=item.quantity,
            unit_price_usd=float(product.price_usd),
            subtotal_usd=line_total,
        ))
        product.stock_quantity -= item.quantity

    # Calculate 20% deposit and 80% balance
    deposit = round(subtotal * 0.20, 2)
    balance = round(subtotal - deposit, 2)

    if PAYMENTS_ENABLED:
        # Real payment mode: order stays pending_deposit until Stripe/PayPal confirms 20%
        order = Order(
            order_code=order_code,
            client_user_id=user["sub"],
            status="pending_deposit",
            recipient_name=req.recipient_name,
            recipient_phone=req.recipient_phone,
            recipient_city=req.recipient_city,
            recipient_address=req.recipient_address,
            pickup_point_id=req.pickup_point_id,
            subtotal_usd=subtotal,
            total_usd=subtotal,
            deposit_amount=deposit,
            balance_amount=balance,
            notes=req.notes,
        )
    else:
        # Mock mode: auto-confirm deposit payment (demo/dev behavior)
        order = Order(
            order_code=order_code,
            client_user_id=user["sub"],
            status="deposit_paid",
            recipient_name=req.recipient_name,
            recipient_phone=req.recipient_phone,
            recipient_city=req.recipient_city,
            recipient_address=req.recipient_address,
            pickup_point_id=req.pickup_point_id,
            subtotal_usd=subtotal,
            total_usd=subtotal,
            deposit_amount=deposit,
            balance_amount=balance,
            notes=req.notes,
            deposit_paid_at=datetime.now(timezone.utc),
        )

    order.items = order_items
    db.add(order)
    await db.flush()

    if not PAYMENTS_ENABLED:
        # Mock mode: confirm sale immediately
        for product_id, qty in reserved:
            await confirm_sale(db, product_id, qty, order.id)

    await db.commit()
    await db.refresh(order, attribute_names=["items"])

    mode = "MOCK" if not PAYMENTS_ENABLED else "PENDING"
    print(f"ORDER [{mode}]: {order.order_code} — {len(reserved)} items, ${subtotal:.2f} (deposit: ${deposit:.2f})")

    return _order_to_out(order)


# ── Customer order views ────────────────────────────────────────

@router.get("/mine", response_model=list[OrderOut])
async def my_orders(user: dict = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order)
        .where(Order.client_user_id == user["sub"])
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    return [_order_to_out(o) for o in result.scalars().all()]


@router.get("/track/{order_code}", response_model=OrderOut)
async def track_order(order_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order)
        .where(Order.order_code == order_code)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    return _order_to_out(order)


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    # Clients can only see their own orders; admins can see all
    if user["role"] != "admin" and order.client_user_id != user["sub"]:
        raise HTTPException(403, "Not authorized")
    return _order_to_out(order)
