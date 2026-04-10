"""Catalog endpoints: public product listing + admin product CRUD."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Product
from schemas import ProductCreate, ProductUpdate, ProductOut
from auth import require_admin

router = APIRouter(prefix="/api/v1/catalog", tags=["catalog"])


# ── Public ──────────────────────────────────────────────────────

@router.get("/products", response_model=list[ProductOut])
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


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Product not found")
    return ProductOut.model_validate(p, from_attributes=True)


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product.category).where(Product.is_active == True).distinct()
    )
    return sorted([row[0] for row in result.all()])


@router.get("/featured", response_model=list[ProductOut])
async def list_featured_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
        .where(Product.is_featured == True)
        .where(Product.is_active == True)
        .order_by(Product.name)
    )
    return [ProductOut.model_validate(p, from_attributes=True) for p in result.scalars().all()]


# ── Admin ───────────────────────────────────────────────────────

@router.post("/admin/products", response_model=ProductOut)
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


@router.put("/admin/products/{product_id}", response_model=ProductOut)
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
    # Convert ISO string dates to datetime for preorder fields
    for dt_field in ("preorder_deadline", "estimated_ship_date"):
        if dt_field in update_data and update_data[dt_field]:
            update_data[dt_field] = datetime.fromisoformat(update_data[dt_field])
        elif dt_field in update_data and not update_data[dt_field]:
            update_data[dt_field] = None
    for key, val in update_data.items():
        setattr(product, key, val)
    await db.commit()
    await db.refresh(product)
    return ProductOut.model_validate(product, from_attributes=True)


@router.delete("/admin/products/{product_id}")
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


@router.put("/admin/products/{product_id}/featured", response_model=ProductOut)
async def toggle_featured_product(
    product_id: str,
    req: dict,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")
    product.is_featured = req.get("featured", False)
    await db.commit()
    await db.refresh(product)
    return ProductOut.model_validate(product, from_attributes=True)
