"""Seed script: creates admin user + demo products. Run with: python seed.py"""
import asyncio
from sqlalchemy import select
from database import _get_session_factory, create_tables
from models import User, Product, Inventory
from auth import hash_password

ADMIN_EMAIL = "admin@cuba.com"
ADMIN_PASSWORD = "admin123"

PRODUCTS = [
    # ── Grains & Staples ──
    {
        "sku": "GR-RIC-001",
        "name": "Arroz Premium 5kg",
        "description": "Long-grain white rice, 5kg bag. Cuban kitchen staple for congri, arroz con pollo, and everyday meals.",
        "category": "Grains & Staples",
        "price_usd": 6.50,
        "stock_quantity": 120,
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
    },
    {
        "sku": "GR-BEA-002",
        "name": "Frijoles Negros Secos 1kg",
        "description": "Dried black beans, 1kg. Essential for frijoles negros and congri. High protein, long shelf life.",
        "category": "Grains & Staples",
        "price_usd": 3.25,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600",
    },
    {
        "sku": "GR-FLR-003",
        "name": "Harina de Trigo 2kg",
        "description": "All-purpose wheat flour, 2kg. For bread, croquetas, empanadas, and baking.",
        "category": "Grains & Staples",
        "price_usd": 3.75,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600",
    },
    {
        "sku": "GR-PAS-004",
        "name": "Pasta Espagueti 500g",
        "description": "Spaghetti pasta, 500g pack. Quick, versatile meal base for the whole family.",
        "category": "Grains & Staples",
        "price_usd": 2.00,
        "stock_quantity": 175,
        "image_url": "https://images.unsplash.com/photo-1551462147-37885acc36f1?w=600",
    },
    # ── Cooking Essentials ──
    {
        "sku": "CK-OIL-001",
        "name": "Aceite de Cocina 1L",
        "description": "Refined vegetable cooking oil, 1 liter bottle. All-purpose for frying, sauteing, and dressings.",
        "category": "Cooking Essentials",
        "price_usd": 4.00,
        "stock_quantity": 150,
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eadf1420113?w=600",
    },
    {
        "sku": "CK-TOM-002",
        "name": "Salsa de Tomate 400g",
        "description": "Canned tomato sauce, 400g. Ready base for ropa vieja, picadillo, and pasta sauces.",
        "category": "Cooking Essentials",
        "price_usd": 2.50,
        "stock_quantity": 180,
        "image_url": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600",
    },
    {
        "sku": "CK-SGR-003",
        "name": "Azucar Refina 2kg",
        "description": "Refined white sugar, 2kg bag. For coffee, baking, juices, and everyday cooking.",
        "category": "Cooking Essentials",
        "price_usd": 3.50,
        "stock_quantity": 140,
        "image_url": "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600",
    },
    # ── Dairy & Proteins ──
    {
        "sku": "DP-MLK-001",
        "name": "Leche en Polvo 800g",
        "description": "Powdered whole milk, 800g tin. Long shelf life, essential for families. Makes approximately 6 liters.",
        "category": "Dairy & Proteins",
        "price_usd": 8.50,
        "stock_quantity": 75,
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600",
    },
    {
        "sku": "DP-TUN-002",
        "name": "Atun en Conserva 3-Pack",
        "description": "Canned tuna in oil, 3 x 150g tins. High protein, ready to eat. Ideal for quick meals and salads.",
        "category": "Dairy & Proteins",
        "price_usd": 5.25,
        "stock_quantity": 95,
        "image_url": "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600",
    },
    {
        "sku": "DP-CHK-003",
        "name": "Pollo Entero Congelado 1.5kg",
        "description": "Whole frozen chicken, approximately 1.5kg. Clean, ready to cook. A weekly family essential.",
        "category": "Dairy & Proteins",
        "price_usd": 7.00,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600",
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
        "sku": "BV-JCE-002",
        "name": "Jugo de Mango 1L (3-Pack)",
        "description": "Tropical mango juice, 3 x 1L cartons. No added sugar. Refreshing Cuban favorite.",
        "category": "Beverages",
        "price_usd": 6.00,
        "stock_quantity": 65,
        "image_url": "https://images.unsplash.com/photo-1546173159-315724a31696?w=600",
    },
    # ── Snacks & Extras ──
    {
        "sku": "SN-GAL-001",
        "name": "Galletas de Sal 6-Pack",
        "description": "Salted crackers, 6-pack. Light snack, pairs well with cheese or spreads. Pantry essential.",
        "category": "Snacks & Extras",
        "price_usd": 2.25,
        "stock_quantity": 160,
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600",
    },
    {
        "sku": "SN-CHC-002",
        "name": "Chocolate de Mesa 200g",
        "description": "Traditional hot chocolate tablet, 200g. Dissolve in hot milk for a rich Cuban-style chocolate drink.",
        "category": "Snacks & Extras",
        "price_usd": 3.50,
        "stock_quantity": 85,
        "image_url": "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=600",
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
