"""
Payment endpoints: Stripe Checkout sessions, PayPal orders, and webhooks.

Supports both full-payment (legacy) and split-payment (20% deposit / 80% balance) flows.
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
    PAYMENTS_ENABLED, FRONTEND_URL, BANK_TRANSFER_ENABLED,
)
from services.inventory_service import confirm_sale, release_stock
from services.payment_service import get_available_providers, get_bank_transfer_instructions
from auth import require_admin

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

# Statuses that can trigger a payment session
PAYABLE_STATUSES = {"pending_payment", "pending_deposit", "balance_due"}


# ── Config endpoint (tells frontend which providers are available) ─────
@router.get("/config")
async def payment_config():
    """Return which payment methods are available (no secrets exposed)."""
    providers = get_available_providers()
    bank_transfer_info = get_bank_transfer_instructions() if BANK_TRANSFER_ENABLED else None

    return {
        "stripe_enabled": STRIPE_ENABLED,
        "paypal_enabled": PAYPAL_ENABLED,
        "bank_transfer_enabled": BANK_TRANSFER_ENABLED,
        "payments_enabled": PAYMENTS_ENABLED,
        "paypal_client_id": PAYPAL_CLIENT_ID if PAYPAL_ENABLED else None,
        "providers": [
            {
                "provider": p.provider.value,
                "enabled": p.enabled,
                "label": p.label,
                "description": p.description,
                "cuba_compliant": p.cuba_compliant,
            }
            for p in providers
        ],
        "bank_transfer_info": bank_transfer_info,
    }


def _get_charge_amount(order: Order) -> tuple[float, str]:
    """
    Determine how much to charge and what the payment is for.
    Returns (amount_usd, description).
    """
    if order.status == "pending_deposit":
        amount = float(order.deposit_amount) if order.deposit_amount else float(order.total_usd) * 0.20
        return (amount, f"20% Deposit for Order {order.order_code}")
    elif order.status == "balance_due":
        amount = float(order.balance_amount) if order.balance_amount else float(order.total_usd) * 0.80
        return (amount, f"80% Balance for Order {order.order_code}")
    else:
        # Legacy full payment
        return (float(order.total_usd), f"Order {order.order_code}")


# ════════════════════════════════════════════════════════════════════════
# STRIPE
# ════════════════════════════════════════════════════════════════════════

@router.post("/stripe/create-session")
async def stripe_create_session(
    order_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout Session for a payable order."""
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
    if order.status not in PAYABLE_STATUSES:
        raise HTTPException(400, f"Order is already {order.status}")

    charge_amount, charge_desc = _get_charge_amount(order)

    line_items = [{
        "price_data": {
            "currency": "usd",
            "unit_amount": int(charge_amount * 100),  # cents
            "product_data": {
                "name": charge_desc,
            },
        },
        "quantity": 1,
    }]

    payment_type = "deposit" if order.status == "pending_deposit" else "balance" if order.status == "balance_due" else "full"

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=line_items,
        mode="payment",
        success_url=f"{FRONTEND_URL}/order/{order.id}/confirmed?payment=success&type={payment_type}",
        cancel_url=f"{FRONTEND_URL}/order/{order.id}/confirmed?payment=cancelled",
        metadata={
            "order_id": order.id,
            "order_code": order.order_code,
            "payment_type": payment_type,
        },
    )

    return {"session_id": session.id, "url": session.url}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events."""
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
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        print(f"Stripe webhook error: {e}")
        return Response(status_code=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")
        payment_type = session.get("metadata", {}).get("payment_type", "full")

        if order_id:
            payment_ref = f"stripe:{session.get('id', '')}"
            await _confirm_order_payment(db, order_id, payment_ref, payment_type)

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
    """Create a PayPal order for a payable order."""
    if not PAYPAL_ENABLED:
        raise HTTPException(400, "PayPal is not configured")

    import httpx

    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status not in PAYABLE_STATUSES:
        raise HTTPException(400, f"Order is already {order.status}")

    charge_amount, charge_desc = _get_charge_amount(order)
    payment_type = "deposit" if order.status == "pending_deposit" else "balance" if order.status == "balance_due" else "full"

    access_token = await _get_paypal_access_token()
    base_url = (
        "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox"
        else "https://api-m.paypal.com"
    )

    paypal_order_data = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": order.id,
            "description": charge_desc,
            "amount": {
                "currency_code": "USD",
                "value": f"{charge_amount:.2f}",
            },
        }],
        "application_context": {
            "return_url": f"{FRONTEND_URL}/order/{order.id}/confirmed?payment=success&provider=paypal&type={payment_type}",
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

    # Determine payment type before capture
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    payment_type = "full"
    if order:
        if order.status == "pending_deposit":
            payment_type = "deposit"
        elif order.status == "balance_due":
            payment_type = "balance"

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
            await _confirm_order_payment(db, order_id, f"paypal:{paypal_order_id}", payment_type)
            return {"status": "captured", "order_id": order_id}

    raise HTTPException(400, "PayPal capture failed")


# ════════════════════════════════════════════════════════════════════════
# BANK TRANSFER
# ════════════════════════════════════════════════════════════════════════

@router.post("/bank-transfer/initiate")
async def bank_transfer_initiate(
    order_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Initiate a bank transfer payment.
    Returns bank transfer instructions + order reference for payment.
    Does NOT change order status (stays pending_deposit or balance_due).
    """
    if not BANK_TRANSFER_ENABLED:
        raise HTTPException(400, "Bank transfer is not available")

    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status not in PAYABLE_STATUSES:
        raise HTTPException(400, f"Order is already {order.status}")

    charge_amount, charge_desc = _get_charge_amount(order)
    bank_info = get_bank_transfer_instructions()

    # Create a payment reference from order code
    payment_reference = f"{bank_info['reference_prefix']}{order.order_code}"

    return {
        "order_id": order.id,
        "order_code": order.order_code,
        "amount_usd": float(charge_amount),
        "description": charge_desc,
        "payment_reference": payment_reference,
        "bank_name": bank_info["bank_name"],
        "account_holder": bank_info["account_holder"],
        "iban": bank_info["iban"],
        "swift_bic": bank_info["swift_bic"],
        "note": bank_info["note"],
        "status": "awaiting_deposit",
    }


@router.post("/admin/bank-transfer/confirm")
async def admin_bank_transfer_confirm(
    order_id: str,
    reference: str = None,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin endpoint to confirm a bank transfer payment.
    Accepts order_id and optional reference code for audit trail.
    Confirms payment same as _confirm_order_payment.
    """
    if not BANK_TRANSFER_ENABLED:
        raise HTTPException(400, "Bank transfer is not available")

    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status not in PAYABLE_STATUSES:
        raise HTTPException(400, f"Order cannot be confirmed: already {order.status}")

    # Determine payment type (deposit or balance or full)
    payment_type = "full"
    if order.status == "pending_deposit":
        payment_type = "deposit"
    elif order.status == "balance_due":
        payment_type = "balance"

    # Create reference for audit trail
    payment_ref = f"bank_transfer:{reference or 'manual_confirm'}"

    # Confirm the payment
    await _confirm_order_payment(db, order_id, payment_ref, payment_type)

    return {
        "status": "confirmed",
        "order_id": order_id,
        "order_code": order.order_code,
        "payment_type": payment_type,
        "message": f"Bank transfer payment confirmed for order {order.order_code}",
    }


# ════════════════════════════════════════════════════════════════════════
# SHARED: confirm payment on an order
# ════════════════════════════════════════════════════════════════════════

async def _confirm_order_payment(
    db: AsyncSession, order_id: str, payment_ref: str, payment_type: str = "full"
):
    """
    Mark an order's deposit or balance (or full amount) as paid.
    Called by both Stripe webhook and PayPal capture.
    """
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        print(f"Payment confirm: order {order_id} not found")
        return

    now = datetime.now(timezone.utc)

    if payment_type == "deposit":
        if order.status != "pending_deposit":
            print(f"Payment confirm: order {order_id} not pending_deposit (is {order.status})")
            return
        order.status = "deposit_paid"
        order.deposit_paid_at = now
        order.notes = (order.notes or "") + f"\nDeposit paid ref: {payment_ref}"
        print(f"ORDER DEPOSIT PAID: {order.order_code} via {payment_ref}")

    elif payment_type == "balance":
        if order.status != "balance_due":
            print(f"Payment confirm: order {order_id} not balance_due (is {order.status})")
            return
        order.status = "paid"
        order.balance_paid_at = now
        order.paid_at = now
        order.notes = (order.notes or "") + f"\nBalance paid ref: {payment_ref}"
        # Confirm inventory sale for each item (stock was reserved at checkout)
        for item in order.items:
            await confirm_sale(db, item.product_id, item.quantity, order.id)
        print(f"ORDER FULLY PAID: {order.order_code} via {payment_ref}")

    else:
        # Legacy full payment flow
        if order.status != "pending_payment":
            print(f"Payment confirm: order {order_id} already {order.status}")
            return
        order.status = "paid"
        order.paid_at = now
        order.notes = (order.notes or "") + f"\nPayment ref: {payment_ref}"
        for item in order.items:
            await confirm_sale(db, item.product_id, item.quantity, order.id)
        print(f"ORDER PAID: {order.order_code} via {payment_ref}")

    await db.commit()
