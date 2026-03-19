"""Authentication endpoints: register, login, me."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from schemas import RegisterRequest, LoginRequest, TokenOut, UserOut
from auth import hash_password, verify_password, create_token, require_auth

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    acct = req.account_type if req.account_type in ("buyer", "seller", "both") else "buyer"
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        phone=req.phone,
        account_type=acct,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id, user.role)
    return TokenOut(
        access_token=token,
        user=UserOut(id=user.id, email=user.email, role=user.role,
                     account_type=getattr(user, 'account_type', None) or "buyer",
                     full_name=user.full_name, phone=user.phone),
    )


@router.post("/login", response_model=TokenOut)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    token = create_token(user.id, user.role)
    return TokenOut(
        access_token=token,
        user=UserOut(id=user.id, email=user.email, role=user.role,
                     account_type=getattr(user, 'account_type', None) or "buyer",
                     full_name=user.full_name, phone=user.phone),
    )


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user["sub"]))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    return UserOut(id=u.id, email=u.email, role=u.role,
                   account_type=getattr(u, 'account_type', None) or "buyer",
                   full_name=u.full_name, phone=u.phone)
