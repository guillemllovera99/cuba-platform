"""Seed script: creates admin user + demo products. Run with: python seed.py"""
import asyncio
from sqlalchemy import select
from database import async_session, create_tables
from models import User, Product
from auth import hash_password

ADMIN_EMAIL = "admin@cuba.com"
ADMIN_PASSWORD = "admin123"

PRODUCTS = [
    {
        "sku": "EB-HAV-001",
        "name": "Havana Classic E-Bike",
        "description": "Reliable electric bicycle for urban commuting. 48V 13Ah battery, 50km range, 25km/h max speed. Includes front basket and rear rack.",
        "category": "E-bikes",
        "price_usd": 899.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600",
    },
    {
        "sku": "EB-TRN-002",
        "name": "Trinidad Cargo E-Bike",
        "description": "Heavy-duty electric cargo bike. 60V 20Ah battery, 70km range, front cargo platform rated for 50kg. Perfect for small business deliveries.",
        "category": "E-bikes",
        "price_usd": 1299.00,
        "stock_quantity": 8,
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600",
    },
    {
        "sku": "ES-CIT-001",
        "name": "Havana Scooter Model 2025",
        "description": "Compact electric scooter for city use. 36V 10Ah, 35km range, foldable design, weighs only 14kg. LED headlight included.",
        "category": "E-scooters",
        "price_usd": 459.00,
        "stock_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1622185135505-2d795003994a?w=600",
    },
    {
        "sku": "ES-PRO-002",
        "name": "Varadero Pro E-Scooter",
        "description": "High-performance electric scooter. 48V 15Ah dual battery, 60km range, dual suspension, disc brakes, max speed 35km/h.",
        "category": "E-scooters",
        "price_usd": 759.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1604868432396-25d63e48e0de?w=600",
    },
    {
        "sku": "SL-PNL-001",
        "name": "100W Portable Solar Panel",
        "description": "Monocrystalline foldable solar panel, 100W output. USB-A and USB-C ports for direct device charging. Water-resistant IP65.",
        "category": "Solar / Energy",
        "price_usd": 189.00,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600",
    },
    {
        "sku": "SL-KIT-002",
        "name": "Home Solar Kit 300W",
        "description": "Complete off-grid solar kit: 3x100W panels, 30A charge controller, 1000Wh LiFePO4 battery, 1500W inverter. Powers lights, fans, phone charging.",
        "category": "Solar / Energy",
        "price_usd": 1149.00,
        "stock_quantity": 6,
        "image_url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600",
    },
    {
        "sku": "SP-BAT-001",
        "name": "48V 13Ah E-Bike Battery",
        "description": "Replacement lithium-ion battery pack for most 48V e-bikes. Samsung cells, BMS included, 1000 cycle life.",
        "category": "Spare Parts",
        "price_usd": 299.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
    },
    {
        "sku": "SP-TIR-002",
        "name": "E-Scooter Tire Set (2 pcs)",
        "description": "Solid rubber tires for electric scooters. 8.5 inch, puncture-proof, fits most standard scooter models.",
        "category": "Spare Parts",
        "price_usd": 39.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600",
    },
    {
        "sku": "AC-HLM-001",
        "name": "Urban E-Bike Helmet",
        "description": "Lightweight ventilated helmet with integrated LED rear light and visor. One-size adjustable fit.",
        "category": "Accessories",
        "price_usd": 49.00,
        "stock_quantity": 35,
        "image_url": "https://images.unsplash.com/photo-1557803175-2f0acf9a3731?w=600",
    },
    {
        "sku": "AC-LCK-002",
        "name": "Heavy-Duty Chain Lock",
        "description": "10mm hardened steel chain lock with pick-resistant padlock. 120cm length. Includes mounting bracket.",
        "category": "Accessories",
        "price_usd": 29.00,
        "stock_quantity": 45,
        "image_url": "https://images.unsplash.com/photo-1582639510509-1e5307f2a5b5?w=600",
    },
]


async def seed():
    # Note: create_tables() is called in lifespan before seed(), no need to duplicate
    async with async_session() as session:
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
            for p in PRODUCTS:
                session.add(Product(**p))
            print(f"Created {len(PRODUCTS)} demo products")
        else:
            print("Products already exist")

        await session.commit()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
