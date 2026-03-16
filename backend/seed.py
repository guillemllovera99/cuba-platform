"""Seed script: creates admin user + demo products. Run with: python seed.py"""
import asyncio
from sqlalchemy import select
from database import _get_session_factory, create_tables
from models import User, Product, Inventory
from auth import hash_password

ADMIN_EMAIL = "admin@cuba.com"
ADMIN_PASSWORD = "admin123"

PRODUCTS = [
    # ── Food Staples ──
    {
        "sku": "FS-RIC-001",
        "name": "Arroz Premium 5kg",
        "description": "Long-grain white rice, 5kg bag. Cuban kitchen staple, ideal for congri, arroz con pollo, and everyday meals.",
        "category": "Food Staples",
        "price_usd": 6.50,
        "stock_quantity": 120,
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
    },
    {
        "sku": "FS-BEA-002",
        "name": "Frijoles Negros Secos 1kg",
        "description": "Dried black beans, 1kg. Essential for frijoles negros and congri. High protein, long shelf life.",
        "category": "Food Staples",
        "price_usd": 3.25,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600",
    },
    {
        "sku": "FS-OIL-003",
        "name": "Aceite de Cocina 1L",
        "description": "Refined vegetable cooking oil, 1 liter bottle. All-purpose for frying, sauteing, and dressings.",
        "category": "Food Staples",
        "price_usd": 4.00,
        "stock_quantity": 150,
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eadf1420113?w=600",
    },
    {
        "sku": "FS-FLR-004",
        "name": "Harina de Trigo 2kg",
        "description": "All-purpose wheat flour, 2kg. For bread, croquetas, empanadas, and baking.",
        "category": "Food Staples",
        "price_usd": 3.75,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600",
    },
    # ── Pantry & Canned Goods ──
    {
        "sku": "PT-TOM-001",
        "name": "Salsa de Tomate 400g",
        "description": "Canned tomato sauce, 400g. Ready base for ropa vieja, picadillo, and pasta sauces.",
        "category": "Pantry",
        "price_usd": 2.50,
        "stock_quantity": 180,
        "image_url": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600",
    },
    {
        "sku": "PT-MLK-002",
        "name": "Leche en Polvo 800g",
        "description": "Powdered whole milk, 800g tin. Long shelf life, essential for families. Makes approximately 6 liters.",
        "category": "Pantry",
        "price_usd": 8.50,
        "stock_quantity": 75,
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600",
    },
    # ── Beverages ──
    {
        "sku": "BV-COF-001",
        "name": "Cafe Cubano Molido 250g",
        "description": "Ground Cuban-style dark roast coffee, 250g. Rich, bold flavor for espresso and cafetera preparation.",
        "category": "Beverages",
        "price_usd": 5.75,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600",
    },
    {
        "sku": "BV-WAT-002",
        "name": "Agua Purificada 6-Pack (1.5L)",
        "description": "Purified drinking water, 6 bottles x 1.5L. Clean, safe hydration for the whole family.",
        "category": "Beverages",
        "price_usd": 4.50,
        "stock_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600",
    },
    # ── Household Essentials ──
    {
        "sku": "HH-SOP-001",
        "name": "Jabon Multiuso 3-Pack",
        "description": "Multi-purpose soap bars, pack of 3. For hand washing, laundry, and general household cleaning.",
        "category": "Household",
        "price_usd": 3.00,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=600",
    },
    {
        "sku": "HH-DET-002",
        "name": "Detergente en Polvo 1kg",
        "description": "Laundry detergent powder, 1kg. Effective cleaning for hand wash and machine wash.",
        "category": "Household",
        "price_usd": 4.25,
        "stock_quantity": 130,
        "image_url": "https://images.unsplash.com/photo-1585441695325-21557ef77f68?w=600",
    },
    # ── Personal Care ──
    {
        "sku": "PC-TPT-001",
        "name": "Pasta de Dientes 100ml",
        "description": "Fluoride toothpaste, 100ml tube. Minty fresh, cavity protection for the whole family.",
        "category": "Personal Care",
        "price_usd": 2.75,
        "stock_quantity": 160,
        "image_url": "https://images.unsplash.com/photo-1559304822-9eb2813c9844?w=600",
    },
    {
        "sku": "PC-SHP-002",
        "name": "Champu Familiar 500ml",
        "description": "All-hair-types shampoo, 500ml. Gentle daily formula suitable for adults and children.",
        "category": "Personal Care",
        "price_usd": 5.00,
        "stock_quantity": 110,
        "image_url": "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600",
    },
]


async def seed():
    # Note: create_tables() is called in lifespan before seed(), no need to duplicate
    async with _get_session_factory()() as session:
        # Check if admin exists
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        if result.scalar_one_or_none() is None:
            admin = User(
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                role="admin",
                full_name="Platform Admin",
            )
            session.add(admin)
            print(f"Created admin user: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        else:
            print("Admin user already exists")

        # Check if products exist
        result = await session.execute(select(Product).limit(1))
        if result.scalar_one_or_none() is None:
            products = []
            for p_data in PRODUCTS:
                product = Product(**p_data)
                session.add(product)
                products.append((product, p_data["stock_quantity"]))
            # Flush so Product.id defaults are generated before we reference them
            await session.flush()
            for product, qty in products:
                session.add(Inventory(
                    product_id=product.id,
                    available_qty=qty,
                ))
            print(f"Created {len(PRODUCTS)} demo products + inventory records")
        else:
            print("Products already exist")

        await session.commit()
    print("Seed complete.")


if __name__ == "__main__":
    async def _run():
        await create_tables()
        await seed()
    asyncio.run(_run())
