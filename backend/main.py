"""
Cuba E-Commerce MVP — Single FastAPI Monolith
All endpoints in one file for the 24-hour prototype.
"""
import random
import string
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db, create_tables
from models import User, Product, Order, OrderItem
from schemas import (
    RegisterRequest, LoginRequest, TokenOut, UserOut,
    ProductCreate, ProductUpdate, ProductOut,
    CheckoutRequest, OrderOut, OrderItemOut, StatusUpdate,
)
from auth import (
    hash_password, verify_password, create_token,
    require_auth, require_admin, get_current_user,
)
from seed import seed


def generate_order_code() -> str:
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=6))
    return f"CUB-{suffix}"


VALID_STATUSES = [
    "pending_payment", "paid", "processing",
    "shipped", "delivered", "cancelled",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    await seed()
    yield


app = FastAPI(title="Cuba E-Commerce MVP", lifespan=lifespan)

from config import CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# ════════════════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════════════════

@app.post("/auth/register", response_model=TokenOut)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        phone=req.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id, user.role)
    return TokenOut(
        access_token=token,
        user=UserOut(id=user.id, email=user.email, role=user.role,
                     full_name=user.full_name, phone=user.phone),
    )


@app.post("/auth/login", response_model=TokenOut)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    token = create_token(user.id, user.role)
    return TokenOut(
        access_token=token,
        user=UserOut(id=user.id, email=user.email, role=user.role,
                     full_name=user.full_name, phone=user.phone),
    )


@app.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user["sub"]))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    return UserOut(id=u.id, email=u.email, role=u.role,
                   full_name=u.full_name, phone=u.phone)


# ════════════════════════════════════════════════════════════════
# CATALOG — PUBLIC
# ════════════════════════════════════════════════════════════════

@app.get("/api/v1/catalog/products", response_model=list[ProductOut])
async def list_products(
    category: str | None = None,
    search: str | None = None,
    in_stock: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Product).where(Product.is_active == True)
    if category:
        q = q.where(Product.category == category)
    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))
    if in_stock:
        q = q.where(Product.stock_quantity > 0)
    q = q.order_by(Product.created_at.desc())
    result = await db.execute(q)
    return [ProductOut.model_validate(p, from_attributes=True) for p in result.scalars().all()]


@app.get("/api/v1/catalog/products/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Product not found")
    return ProductOut.model_validate(p, from_attributes=True)


@app.get("/api/v1/catalog/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product.category).where(Product.is_active == True).distinct()
    )
    return sorted([row[0] for row in result.all()])


# ════════════════════════════════════════════════════════════════
# CATALOG — ADMIN
# ════════════════════════════════════════════════════════════════

@app.post("/api/v1/catalog/admin/products", response_model=ProductOut)
async def create_product(
    req: ProductCreate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    product = Product(**req.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return ProductOut.model_validate(product, from_attributes=True)


@app.put("/api/v1/catalog/admin/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    req: ProductUpdate,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")

    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(product, key, val)
    await db.commit()
    await db.refresh(product)
    return ProductOut.model_validate(product, from_attributes=True)


@app.delete("/api/v1/catalog/admin/products/{product_id}")
async def deactivate_product(
    product_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")
    product.is_active = False
    await db.commit()
    return {"ok": True}


# ════════════════════════════════════════════════════════════════
# ORDERS — CHECKOUT (mock payment: auto-confirm)
# ════════════════════════════════════════════════════════════════

@app.post("/api/v1/orders/checkout", response_model=OrderOut)
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

    for item in req.items:
        product = products.get(item.product_id)
        if not product:
            raise HTTPException(400, f"Product {item.product_id} not found")
        if product.stock_quantity < item.quantity:
            raise HTTPException(400, f"Insufficient stock for {product.name}")

        line_total = float(product.price_usd) * item.quantity
        subtotal += line_total
        order_items.append(OrderItem(
            product_id=product.id,
            product_name=product.name,
            quantity=item.quantity,
            unit_price_usd=float(product.price_usd),
            subtotal_usd=line_total,
        ))
        # Decrement stock
        product.stock_quantity -= item.quantity

    # Create order — MOCK PAYMENT: auto-set to "paid"
    order = Order(
        order_code=generate_order_code(),
        client_user_id=user["sub"],
        status="paid",
        recipient_name=req.recipient_name,
        recipient_phone=req.recipient_phone,
        recipient_city=req.recipient_city,
        recipient_address=req.recipient_address,
        subtotal_usd=subtotal,
        total_usd=subtotal,  # no shipping fee in MVP
        notes=req.notes,
        paid_at=datetime.now(timezone.utc),
    )
    order.items = order_items
    db.add(order)
    await db.commit()
    await db.refresh(order, attribute_names=["items"])

    print(f"EMAIL: Order {order.order_code} confirmed for user {user['sub']}")

    return _order_to_out(order)


# ════════════════════════════════════════════════════════════════
# ORDERS — CUSTOMER
# ════════════════════════════════════════════════════════════════

@app.get("/api/v1/orders/mine", response_model=list[OrderOut])
async def my_orders(user: dict = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order)
        .where(Order.client_user_id == user["sub"])
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    return [_order_to_out(o) for o in result.scalars().all()]


@app.get("/api/v1/orders/track/{order_code}", response_model=OrderOut)
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


@app.get("/api/v1/orders/{order_id}", response_model=OrderOut)
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


# ════════════════════════════════════════════════════════════════
# ORDERS — ADMIN
# ════════════════════════════════════════════════════════════════

@app.get("/api/v1/orders/admin/all", response_model=list[OrderOut])
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


@app.put("/api/v1/orders/admin/{order_id}/status", response_model=OrderOut)
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


# ════════════════════════════════════════════════════════════════
# ADMIN STATS
# ════════════════════════════════════════════════════════════════

@app.get("/api/v1/admin/stats")
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


# ════════════════════════════════════════════════════════════════
# HELPERS
# ════════════════════════════════════════════════════════════════

def _order_to_out(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        order_code=order.order_code,
        status=order.status,
        recipient_name=order.recipient_name,
        recipient_phone=order.recipient_phone,
        recipient_city=order.recipient_city,
        recipient_address=order.recipient_address,
        subtotal_usd=float(order.subtotal_usd) if order.subtotal_usd else None,
        total_usd=float(order.total_usd) if order.total_usd else None,
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
