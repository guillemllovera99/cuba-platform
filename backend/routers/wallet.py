"""
Phase 8 — Wallet / Token / Credit System
User wallets with token states: Available → Reserved → Released → Refunded
Card payments convert to platform credits; refunds credit back to wallet.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Wallet, WalletTransaction, User
from schemas import (
    WalletOut, WalletTransactionOut, WalletTopup,
    WalletSpend, AdminWalletAdjust,
)
from auth import require_auth, require_admin

router = APIRouter(prefix="/api/v1/wallet", tags=["wallet"])


# ── Helpers ────────────────────────────────────────────────────

def _wallet_to_out(w: Wallet) -> WalletOut:
    return WalletOut(
        id=w.id,
        user_id=w.user_id,
        balance=float(w.balance) if w.balance else 0,
        reserved=float(w.reserved) if w.reserved else 0,
        currency=w.currency or "USD",
        created_at=w.created_at.isoformat() if w.created_at else "",
        updated_at=w.updated_at.isoformat() if w.updated_at else "",
    )


def _tx_to_out(tx: WalletTransaction) -> WalletTransactionOut:
    return WalletTransactionOut(
        id=tx.id,
        wallet_id=tx.wallet_id,
        tx_type=tx.tx_type,
        amount=float(tx.amount),
        balance_after=float(tx.balance_after),
        reference_type=tx.reference_type,
        reference_id=tx.reference_id,
        description=tx.description,
        created_by=tx.created_by,
        created_at=tx.created_at.isoformat() if tx.created_at else "",
    )


async def _get_or_create_wallet(db: AsyncSession, user_id: str) -> Wallet:
    """Get wallet for user, or create one if it doesn't exist."""
    result = await db.execute(
        select(Wallet).where(Wallet.user_id == user_id)
    )
    wallet = result.scalar_one_or_none()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0, reserved=0, currency="USD")
        db.add(wallet)
        await db.flush()
    return wallet


# ── User: My Wallet ───────────────────────────────────────────

@router.get("/me", response_model=WalletOut)
async def get_my_wallet(
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's wallet balance."""
    wallet = await _get_or_create_wallet(db, user["sub"])
    await db.commit()
    return _wallet_to_out(wallet)


@router.get("/me/transactions", response_model=list[WalletTransactionOut])
async def get_my_transactions(
    limit: int = 50,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get transaction history for the current user's wallet."""
    wallet = await _get_or_create_wallet(db, user["sub"])
    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.wallet_id == wallet.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(limit)
    )
    await db.commit()
    return [_tx_to_out(tx) for tx in result.scalars().all()]


# ── User: Topup (card payment → credits) ──────────────────────

@router.post("/topup", response_model=WalletOut)
async def topup_wallet(
    req: WalletTopup,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Add credits to wallet. In production this would be called after
    a successful Stripe/PayPal payment. For now, this creates the
    credit directly (admin or webhook would trigger this).
    """
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    wallet = await _get_or_create_wallet(db, user["sub"])
    wallet.balance = float(wallet.balance) + req.amount

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tx_type="topup",
        amount=req.amount,
        balance_after=float(wallet.balance),
        reference_type="card_topup",
        description=f"Wallet top-up: ${req.amount:.2f}",
        created_by=user["sub"],
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return _wallet_to_out(wallet)


# ── User: Reserve credits for an order ────────────────────────

@router.post("/reserve", response_model=WalletOut)
async def reserve_credits(
    req: WalletSpend,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Reserve credits for a pending order. Moves funds from available → reserved.
    Token state: Available → Reserved
    """
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    wallet = await _get_or_create_wallet(db, user["sub"])
    available = float(wallet.balance) - float(wallet.reserved)

    if req.amount > available:
        raise HTTPException(400, f"Insufficient credits. Available: ${available:.2f}")

    wallet.reserved = float(wallet.reserved) + req.amount

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tx_type="reserve",
        amount=-req.amount,
        balance_after=float(wallet.balance) - float(wallet.reserved),
        reference_type="order",
        reference_id=req.order_id,
        description=req.description or f"Reserved ${req.amount:.2f} for order",
        created_by=user["sub"],
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return _wallet_to_out(wallet)


# ── User: Spend (confirm reserved credits) ────────────────────

@router.post("/spend", response_model=WalletOut)
async def spend_credits(
    req: WalletSpend,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Confirm spending of reserved credits when order is finalized.
    Token state: Reserved → Released (spent)
    """
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    wallet = await _get_or_create_wallet(db, user["sub"])

    if req.amount > float(wallet.reserved):
        raise HTTPException(400, "Amount exceeds reserved credits")

    wallet.balance = float(wallet.balance) - req.amount
    wallet.reserved = float(wallet.reserved) - req.amount

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tx_type="spend",
        amount=-req.amount,
        balance_after=float(wallet.balance),
        reference_type="order",
        reference_id=req.order_id,
        description=req.description or f"Spent ${req.amount:.2f} on order",
        created_by=user["sub"],
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return _wallet_to_out(wallet)


# ── User: Release (cancel reserved credits) ───────────────────

@router.post("/release", response_model=WalletOut)
async def release_credits(
    req: WalletSpend,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Release previously reserved credits back to available balance.
    Token state: Reserved → Available (released)
    """
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    wallet = await _get_or_create_wallet(db, user["sub"])

    if req.amount > float(wallet.reserved):
        raise HTTPException(400, "Amount exceeds reserved credits")

    wallet.reserved = float(wallet.reserved) - req.amount

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tx_type="release",
        amount=req.amount,
        balance_after=float(wallet.balance) - float(wallet.reserved),
        reference_type="order",
        reference_id=req.order_id,
        description=req.description or f"Released ${req.amount:.2f} back to wallet",
        created_by=user["sub"],
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return _wallet_to_out(wallet)


# ── Refund credits ─────────────────────────────────────────────

@router.post("/refund", response_model=WalletOut)
async def refund_to_wallet(
    req: WalletSpend,
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Refund to wallet (default refund path — credits back to wallet, not card).
    Token state: → Refunded (balance increases)
    """
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    wallet = await _get_or_create_wallet(db, user["sub"])
    wallet.balance = float(wallet.balance) + req.amount

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tx_type="refund",
        amount=req.amount,
        balance_after=float(wallet.balance),
        reference_type="order",
        reference_id=req.order_id,
        description=req.description or f"Refund of ${req.amount:.2f} to wallet",
        created_by=user["sub"],
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return _wallet_to_out(wallet)


# ── Admin: Wallet Management ──────────────────────────────────

@router.get("/admin/all")
async def admin_list_wallets(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all wallets with user info."""
    result = await db.execute(
        select(Wallet).options(selectinload(Wallet.user)).order_by(Wallet.updated_at.desc())
    )
    wallets = result.scalars().all()
    return [
        {
            **_wallet_to_out(w).model_dump(),
            "user_email": w.user.email if w.user else None,
            "user_name": w.user.full_name if w.user else None,
        }
        for w in wallets
    ]


@router.post("/admin/adjust", response_model=WalletOut)
async def admin_adjust_wallet(
    req: AdminWalletAdjust,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin manually adjust a user's wallet balance (credit or debit)."""
    wallet = await _get_or_create_wallet(db, req.user_id)
    new_balance = float(wallet.balance) + req.amount

    if new_balance < 0:
        raise HTTPException(400, "Adjustment would result in negative balance")

    wallet.balance = new_balance

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tx_type="admin_adjust",
        amount=req.amount,
        balance_after=new_balance,
        reference_type="admin",
        description=req.description or f"Admin adjustment: ${req.amount:+.2f}",
        created_by=admin["sub"],
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return _wallet_to_out(wallet)


@router.get("/admin/{user_id}", response_model=WalletOut)
async def admin_get_user_wallet(
    user_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user's wallet."""
    wallet = await _get_or_create_wallet(db, user_id)
    await db.commit()
    return _wallet_to_out(wallet)


@router.get("/admin/{user_id}/transactions", response_model=list[WalletTransactionOut])
async def admin_get_user_transactions(
    user_id: str,
    limit: int = 100,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get transaction history for a specific user's wallet."""
    wallet = await _get_or_create_wallet(db, user_id)
    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.wallet_id == wallet.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(limit)
    )
    await db.commit()
    return [_tx_to_out(tx) for tx in result.scalars().all()]
