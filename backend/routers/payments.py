"""
Payment endpoints: Stripe Checkout sessions, PayPal orders, and webhooks.

Both Stripe and PayPal are free to set up — you only pay per transaction.
When neither is configured (no env keys), the system falls back to mock
mode where checkout auto-confirms orders.
"""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Order
from config import (
    STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_ENABLED,
    PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE, PAYPAL_ENABLED,
    PAYMENTS_ENABLED, FRONTEND_URL,
)
from services.inventory_service import confirm_sale, release_stock

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


# ── Config endpoint (tells frontend which providers are available) ─────
@router.get("/config")
async def payment_config():
    """Return which payment methods are available (no secrets exposed)."""
    return {
        "stripe_enabled": STRIPE_ENABLED,
        "paypal_enabled": PAYPAL_ENABLED,
        "payments_enabled": PAYMENTS_ENABLED,
        "paypal_client_id": PAYPAL_CLIENT_ID if PAYPAL_ENABLED else None,
    }


# ════════════════════════════════════════════════════════════════════════
# STRIPE
# ════════════════════════════════════════════════════════════════════════

@router.post("/stripe/create-session")
async def stripe_create_session(
    order_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout Session for a pending_payment order."""
    if not STRIPE_ENABLED:
        raise HTTPException(400, "Stripe is not configured")

    import stripe
    stripe.api_key = STRIPE_SECRET_KEY

    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != "pending_payment":
        raise HTTPException(400, f"Order is already {order.status}")

    # Build Stripe line items from order items
    line_items = []
    for item in order.items:
        line_items.append({
            "price_data": {
                "currency": "usd",
                "unit_amount": int(float(item.unit_price_usd) * 100),  # cents
                "product_data": {
                    "name": item.product_name or f"Product {item.product_id}",
                },
            },
            "quantity": item.quantity,
        })

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=line_items,
        mode="payment",
        success_url=f"{FRONTEND_URL}/order/{order.id}/confirmed?payment=success",
        cancel_url=f"{FRONTEND_URL}/order/{order.id}/confirmed?payment=cancelled",
        metadata={
            "order_id": order.id,
            "order_code": order.order_code,
        },
    )

    return {"session_id": session.id, "url": session.url}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle Stripe webhook events.
    Stripe sends checkout.session.completed when payment succeeds.
    """
    if not STRIPE_ENABLED:
        return Response(status_code=400)

    import stripe
    stripe.api_key = STRIPE_SECRET_KEY

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        else:
            # No webhook secret configured — parse directly (dev only)
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        print(f"Stripe webhook error: {e}")
        return Response(status_code=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")

        if order_id:
            await _confirm_order_payment(db, order_id, f"stripe:{session.get('id', '')}")

    return Response(status_code=200)


# ════════════════════════════════════════════════════════════════════════
# PAYPAL
# ════════════════════════════════════════════════════════════════════════

async def _get_paypal_access_token() -> str:
    """Get PayPal OAuth2 access token."""
    import httpx

    base_url = (
        "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox"
        else "https://api-m.paypal.com"
    )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base_url}/v1/oauth2/token",
            auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
            data={"grant_type": "client_credentials"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


@router.post("/paypal/create-order")
async def paypal_create_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Create a PayPal order for a pending_payment order."""
    if not PAYPAL_ENABLED:
        raise HTTPException(400, "PayPal is not configured")

    import httpx

    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != "pending_payment":
        raise HTTPException(400, f"Order is already {order.status}")

    access_token = await _get_paypal_access_token()
    base_url = (
        "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox"
        else "https://api-m.paypal.com"
    )

    # Build PayPal order items
    items = []
    for item in order.items:
        items.append({
            "name": (item.product_name or "Product")[:127],
            "quantity": str(item.quantity),
            "unit_amount": {
                "currency_code": "USD",
                "value": f"{float(item.unit_price_usd):.2f}",
            },
        })

    paypal_order_data = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": order.id,
            "description": f"Order {order.order_code}",
            "amount": {
                "currency_code": "USD",
                "value": f"{float(order.total_usd):.2f}",
                "breakdown": {
                    "item_total": {
                        "currency_code": "USD",
                        "value": f"{float(order.subtotal_usd):.2f}",
                    }
                },
            },
            "items": items,
        }],
        "application_context": {
            "return_url": f"{FRONTEND_URL}/order/{order.id}/confirmed?payment=success&provider=paypal",
            "cancel_url": f"{FRONTEND_URL}/order/{order.id}/confirmed?payment=cancelled",
            "brand_name": "Asymmetrica Cuba",
            "user_action": "PAY_NOW",
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base_url}/v2/checkout/orders",
            json=paypal_order_data,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
        )
        resp.raise_for_status()
        paypal_order = resp.json()

    # Find the approval URL
    approve_url = next(
        (link["href"] for link in paypal_order.get("links", []) if link["rel"] == "approve"),
        None,
    )

    return {
        "paypal_order_id": paypal_order["id"],
        "approve_url": approve_url,
    }


@router.post("/paypal/capture")
async def paypal_capture_order(
    paypal_order_id: str,
    order_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Capture a PayPal order after user approval."""
    if not PAYPAL_ENABLED:
        raise HTTPException(400, "PayPal is not configured")

    import httpx

    access_token = await _get_paypal_access_token()
    base_url = (
        "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox"
        else "https://api-m.paypal.com"
    )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base_url}/v2/checkout/orders/{paypal_order_id}/capture",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
        )

    if resp.status_code in (200, 201):
        capture_data = resp.json()
        if capture_data.get("status") == "COMPLETED":
            await _confirm_order_payment(db, order_id, f"paypal:{paypal_order_id}")
            return {"status": "captured", "order_id": order_id}

    raise HTTPException(400, "PayPal capture failed")


# ════════════════════════════════════════════════════════════════════════
# SHARED: confirm payment on an order
# ════════════════════════════════════════════════════════════════════════

async def _confirm_order_payment(db: AsyncSession, order_id: str, payment_ref: str):
    """
    Mark an order as paid and confirm the inventory sale.
    Called by both Stripe webhook and PayPal capture.
    """
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        print(f"Payment confirm: order {order_id} not found")
        return
    if order.status != "pending_payment":
        print(f"Payment confirm: order {order_id} already {order.status}")
        return

    order.status = "paid"
    order.paid_at = datetime.now(timezone.utc)
    order.notes = (order.notes or "") + f"\nPayment ref: {payment_ref}"

    # Confirm inventory sale for each item
    for item in order.items:
        await confirm_sale(db, item.product_id, item.quantity, order.id)

    await db.commit()
    print(f"ORDER PAID: {order.order_code} via {payment_ref}")
