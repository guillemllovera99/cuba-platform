"""Seed script: creates admin user + full product catalog. Run with: python seed.py"""
import asyncio
from sqlalchemy import select
from database import _get_session_factory, create_tables
from models import User, Product, Inventory
from auth import hash_password

ADMIN_EMAIL = "admin@cuba.com"
ADMIN_PASSWORD = "admin123"

# ════════════════════════════════════════════════════════════════════════════
#  FULL CATALOG — Asymmetrica Cuba
#  Categories:
#    1. Grains & Carbohydrates
#    2. Beans & Legumes
#    3. Cooking Essentials
#    4. Canned & Preserved Foods
#    5. Fresh Produce
#    6. Coffee & Beverages
#    7. Personal Care
#    8. Cleaning Products
#    9. Prepared Food Bundles
#   10. Appliances
#   11. Medicine & Pharmacy
#   12. Baby Products
#   13. Solar Energy
#   14. Diesel & Fuel Supply
#   15. Battery & Energy Storage
#   16. Micro-grid & Home Energy Systems
# ════════════════════════════════════════════════════════════════════════════

PRODUCTS = [
    # ═══════════════════════════════════════════════════════════════
    #  1. GRAINS & CARBOHYDRATES
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "GC-RIC-001",
        "name": "Arroz Blanco Premium 5kg",
        "description": "Long-grain white rice, 5kg bag. The cornerstone of Cuban cuisine — essential for congri, arroz con pollo, moros y cristianos, and everyday family meals.",
        "category": "Grains & Carbohydrates",
        "price_usd": 6.50,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
    },
    {
        "sku": "GC-RIC-002",
        "name": "Arroz Blanco Premium 10kg",
        "description": "Long-grain white rice, 10kg bulk bag. Best value for larger families. Cuban kitchen staple for all rice-based dishes.",
        "category": "Grains & Carbohydrates",
        "price_usd": 11.50,
        "stock_quantity": 120,
        "image_url": "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600",
    },
    {
        "sku": "GC-PAS-001",
        "name": "Pasta Espagueti 500g",
        "description": "Classic spaghetti pasta, 500g pack. Quick, versatile meal base for the whole family. Pairs with any sauce.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.00,
        "stock_quantity": 250,
        "image_url": "https://images.unsplash.com/photo-1551462147-37885acc36f1?w=600",
    },
    {
        "sku": "GC-PAS-002",
        "name": "Pasta Macarrones 500g",
        "description": "Elbow macaroni pasta, 500g. Great for soups, baked pasta dishes, and Cuban-style macaroni salad.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.00,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600",
    },
    {
        "sku": "GC-FLR-001",
        "name": "Harina de Trigo Multiuso 2kg",
        "description": "All-purpose wheat flour, 2kg bag. For croquetas, empanadas, buñuelos, frituras, and everyday baking.",
        "category": "Grains & Carbohydrates",
        "price_usd": 3.75,
        "stock_quantity": 150,
        "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600",
    },
    {
        "sku": "GC-FLR-002",
        "name": "Harina de Trigo Multiuso 5kg",
        "description": "All-purpose wheat flour, 5kg bulk bag. Economical size for families who bake frequently. Versatile for bread, pastries, and frying.",
        "category": "Grains & Carbohydrates",
        "price_usd": 7.50,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1627485937980-221c8bc3c9d7?w=600",
    },
    {
        "sku": "GC-CRM-001",
        "name": "Harina de Maiz 1kg",
        "description": "Fine cornmeal, 1kg. Essential for tamales, polenta, harina de maíz con leche, and traditional corn-based dishes.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.50,
        "stock_quantity": 180,
        "image_url": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600",
    },
    {
        "sku": "GC-CRM-002",
        "name": "Harina de Maiz 2.5kg",
        "description": "Fine cornmeal, 2.5kg bag. Larger size for households that regularly prepare tamales and corn-based recipes.",
        "category": "Grains & Carbohydrates",
        "price_usd": 5.00,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600",
    },
    {
        "sku": "GC-CSF-001",
        "name": "Harina de Yuca 1kg",
        "description": "Cassava flour (harina de yuca), 1kg. Gluten-free staple for Caribbean baking, casabe flatbread, and thickening stews.",
        "category": "Grains & Carbohydrates",
        "price_usd": 3.25,
        "stock_quantity": 130,
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600",
    },
    {
        "sku": "GC-BRF-001",
        "name": "Harina de Pan 2kg",
        "description": "Bread flour (high-gluten), 2kg bag. Ideal for Cuban bread, pan de agua, and homemade rolls with a perfect chewy crust.",
        "category": "Grains & Carbohydrates",
        "price_usd": 4.25,
        "stock_quantity": 110,
        "image_url": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  2. BEANS & LEGUMES
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "BL-BLK-001",
        "name": "Frijoles Negros Secos 1kg",
        "description": "Dried black beans, 1kg. The soul of Cuban cooking — essential for frijoles negros, congri, and moros y cristianos. High protein, long shelf life.",
        "category": "Beans & Legumes",
        "price_usd": 3.25,
        "stock_quantity": 250,
        "image_url": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600",
    },
    {
        "sku": "BL-BLK-002",
        "name": "Frijoles Negros Secos 2.5kg",
        "description": "Dried black beans, 2.5kg bulk bag. Best value for families who cook beans daily. A Cuban kitchen essential.",
        "category": "Beans & Legumes",
        "price_usd": 7.00,
        "stock_quantity": 140,
        "image_url": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600",
    },
    {
        "sku": "BL-RED-001",
        "name": "Frijoles Colorados Secos 1kg",
        "description": "Dried red kidney beans, 1kg. Popular in potaje de frijoles colorados, soups, and stews. Rich in fiber and iron.",
        "category": "Beans & Legumes",
        "price_usd": 3.50,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=600",
    },
    {
        "sku": "BL-LNT-001",
        "name": "Lentejas Secas 500g",
        "description": "Dried green/brown lentils, 500g. Fast-cooking legume rich in protein and iron. Great for soups and side dishes.",
        "category": "Beans & Legumes",
        "price_usd": 2.50,
        "stock_quantity": 180,
        "image_url": "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=600",
    },
    {
        "sku": "BL-CHK-001",
        "name": "Garbanzos Secos 500g",
        "description": "Dried chickpeas (garbanzos), 500g. Versatile legume for stews, salads, hummus, and potaje de garbanzos.",
        "category": "Beans & Legumes",
        "price_usd": 2.75,
        "stock_quantity": 160,
        "image_url": "https://images.unsplash.com/photo-1515543904323-bce72b836e1d?w=600",
    },
    {
        "sku": "BL-SPL-001",
        "name": "Chicharos Partidos 500g",
        "description": "Dried split peas, 500g. Classic for thick, hearty soups. Cooks fast, high in fiber and protein.",
        "category": "Beans & Legumes",
        "price_usd": 2.25,
        "stock_quantity": 170,
        "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  3. COOKING ESSENTIALS
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "CE-VOL-001",
        "name": "Aceite Vegetal 1L",
        "description": "Refined vegetable cooking oil, 1 liter bottle. All-purpose for frying, sautéing, and dressings.",
        "category": "Cooking Essentials",
        "price_usd": 4.00,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eadf1420113?w=600",
    },
    {
        "sku": "CE-VOL-002",
        "name": "Aceite Vegetal 5L",
        "description": "Refined vegetable cooking oil, 5 liter jug. Economical bulk size for families and frequent cooking.",
        "category": "Cooking Essentials",
        "price_usd": 16.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=600",
    },
    {
        "sku": "CE-OLV-001",
        "name": "Aceite de Oliva Extra Virgen 500ml",
        "description": "Extra virgin olive oil, 500ml bottle. Premium quality for salads, finishing dishes, and light sautéing.",
        "category": "Cooking Essentials",
        "price_usd": 7.50,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?w=600",
    },
    {
        "sku": "CE-SAL-001",
        "name": "Sal de Mesa 1kg",
        "description": "Fine table salt, 1kg. Kitchen essential for seasoning, cooking, and food preservation.",
        "category": "Cooking Essentials",
        "price_usd": 1.00,
        "stock_quantity": 300,
        "image_url": "https://images.unsplash.com/photo-1518110925495-5fe2c8b2cda1?w=600",
    },
    {
        "sku": "CE-SGR-001",
        "name": "Azucar Refina 1kg",
        "description": "Refined white sugar, 1kg bag. For coffee, baking, juices, and everyday Cuban cooking.",
        "category": "Cooking Essentials",
        "price_usd": 2.00,
        "stock_quantity": 250,
        "image_url": "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600",
    },
    {
        "sku": "CE-SGR-002",
        "name": "Azucar Refina 2.5kg",
        "description": "Refined white sugar, 2.5kg bag. Bulk size for families. Cuba's coffee culture demands plenty of sugar.",
        "category": "Cooking Essentials",
        "price_usd": 4.50,
        "stock_quantity": 160,
        "image_url": "https://images.unsplash.com/photo-1563599175592-c58dc3ea0b64?w=600",
    },
    {
        "sku": "CE-TOM-001",
        "name": "Pasta de Tomate 400g",
        "description": "Concentrated tomato paste, 400g can. Rich base for ropa vieja, picadillo, sofrito, and pasta sauces.",
        "category": "Cooking Essentials",
        "price_usd": 2.50,
        "stock_quantity": 220,
        "image_url": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600",
    },
    {
        "sku": "CE-VIN-001",
        "name": "Vinagre Blanco 500ml",
        "description": "White vinegar, 500ml bottle. For cooking, pickling, salad dressings, and household cleaning.",
        "category": "Cooking Essentials",
        "price_usd": 1.75,
        "stock_quantity": 180,
        "image_url": "https://images.unsplash.com/photo-1609939006769-7a29bfb5b2e3?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  4. CANNED & PRESERVED FOODS
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "CN-TUN-001",
        "name": "Atun en Aceite 150g (3-Pack)",
        "description": "Canned tuna in oil, 3 × 150g tins. High protein, ready to eat. Ideal for quick meals, sandwiches, and salads.",
        "category": "Canned & Preserved Foods",
        "price_usd": 5.25,
        "stock_quantity": 180,
        "image_url": "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600",
    },
    {
        "sku": "CN-TUN-002",
        "name": "Atun en Agua 150g (6-Pack)",
        "description": "Canned tuna in water, 6 × 150g tins. Lean protein bulk pack. Long shelf life, ships easily.",
        "category": "Canned & Preserved Foods",
        "price_usd": 9.00,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600",
    },
    {
        "sku": "CN-SAR-001",
        "name": "Sardinas en Aceite 125g (4-Pack)",
        "description": "Canned sardines in oil, 4 × 125g tins. Rich in omega-3 and calcium. A Cuban pantry staple that stores for years.",
        "category": "Canned & Preserved Foods",
        "price_usd": 5.50,
        "stock_quantity": 150,
        "image_url": "https://images.unsplash.com/photo-1611171711791-b34fa42e26e0?w=600",
    },
    {
        "sku": "CN-CHK-001",
        "name": "Pollo en Conserva 350g",
        "description": "Canned chicken breast in broth, 350g. Ready-to-eat protein for sandwiches, rice dishes, and quick meals.",
        "category": "Canned & Preserved Foods",
        "price_usd": 4.50,
        "stock_quantity": 130,
        "image_url": "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600",
    },
    {
        "sku": "CN-VEG-001",
        "name": "Vegetales Mixtos en Conserva 400g",
        "description": "Canned mixed vegetables (corn, peas, carrots), 400g. Convenient side dish, great addition to soups and rice.",
        "category": "Canned & Preserved Foods",
        "price_usd": 2.75,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600",
    },
    {
        "sku": "CN-SPM-001",
        "name": "Carne de Almuerzo Tipo Spam 340g",
        "description": "Luncheon meat (Spam-style), 340g can. Versatile canned protein — fry, slice for sandwiches, or add to rice dishes. Extremely popular in Cuba.",
        "category": "Canned & Preserved Foods",
        "price_usd": 4.00,
        "stock_quantity": 170,
        "image_url": "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=600",
    },
    {
        "sku": "CN-SPM-002",
        "name": "Carne de Almuerzo Tipo Spam 340g (3-Pack)",
        "description": "Luncheon meat 3-pack, 3 × 340g cans. Bulk buy savings on one of Cuba's most requested canned goods.",
        "category": "Canned & Preserved Foods",
        "price_usd": 10.50,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  5. FRESH PRODUCE
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "FP-AVO-001",
        "name": "Aguacates Frescos (3 unidades)",
        "description": "Fresh avocados, pack of 3. Locally sourced, ripe and creamy. A Caribbean diet staple served with rice and beans.",
        "category": "Fresh Produce",
        "price_usd": 4.50,
        "stock_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600",
    },
    {
        "sku": "FP-PLT-001",
        "name": "Platanos Maduros (6 unidades)",
        "description": "Ripe plantains, bundle of 6. Sweet and versatile — fry into maduros, bake, or mash. Domestic delivery only.",
        "category": "Fresh Produce",
        "price_usd": 3.50,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=600",
    },
    {
        "sku": "FP-PLT-002",
        "name": "Platanos Verdes (6 unidades)",
        "description": "Green plantains, bundle of 6. For tostones, fufu de plátano, and chips. A daily Cuban cooking staple.",
        "category": "Fresh Produce",
        "price_usd": 3.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600",
    },
    {
        "sku": "FP-BON-001",
        "name": "Boniato (Sweet Potato) 2kg",
        "description": "Cuban white sweet potato (boniato), 2kg. Milder and drier than orange varieties. Boil, fry, or bake. Locally sourced.",
        "category": "Fresh Produce",
        "price_usd": 3.25,
        "stock_quantity": 70,
        "image_url": "https://images.unsplash.com/photo-1596097635121-14b63a7a8c8e?w=600",
    },
    {
        "sku": "FP-YUC-001",
        "name": "Yuca Fresca 2kg",
        "description": "Fresh cassava (yuca), 2kg. Staple Caribbean root vegetable. Boil with garlic mojo sauce for a classic Cuban side dish.",
        "category": "Fresh Produce",
        "price_usd": 3.50,
        "stock_quantity": 65,
        "image_url": "https://images.unsplash.com/photo-1598512752271-33f913a5af13?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  6. COFFEE & BEVERAGES
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "CB-CUB-001",
        "name": "Cafe Cubita Molido 250g",
        "description": "Cubita brand ground Cuban coffee, 250g. Authentic dark roast from Havana. Bold, rich, smoky flavor for cafetera or espresso.",
        "category": "Coffee & Beverages",
        "price_usd": 6.50,
        "stock_quantity": 120,
        "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600",
    },
    {
        "sku": "CB-CUB-002",
        "name": "Cafe Cubita Molido 500g",
        "description": "Cubita brand ground Cuban coffee, 500g. Double-size pack of Cuba's most iconic export coffee brand.",
        "category": "Coffee & Beverages",
        "price_usd": 11.50,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=600",
    },
    {
        "sku": "CB-SER-001",
        "name": "Cafe Serrano Molido 250g",
        "description": "Serrano brand ground Cuban coffee, 250g. Premium mountain-grown beans from Santiago. Smooth, balanced profile.",
        "category": "Coffee & Beverages",
        "price_usd": 7.00,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1497515114889-be3b5c1ae468?w=600",
    },
    {
        "sku": "CB-SER-002",
        "name": "Cafe Serrano Grano Entero 500g",
        "description": "Serrano whole bean Cuban coffee, 500g. For grind-at-home freshness. Premium mountain-grown from Sierra Maestra.",
        "category": "Coffee & Beverages",
        "price_usd": 13.00,
        "stock_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600",
    },
    {
        "sku": "CB-INS-001",
        "name": "Cafe Instantaneo 200g",
        "description": "Instant coffee, 200g jar. Quick and convenient. Just add hot water for an immediate cup of coffee anywhere.",
        "category": "Coffee & Beverages",
        "price_usd": 5.00,
        "stock_quantity": 110,
        "image_url": "https://images.unsplash.com/photo-1521302200778-33500795e128?w=600",
    },
    {
        "sku": "CB-PWM-001",
        "name": "Leche en Polvo Entera 800g",
        "description": "Whole powdered milk, 800g tin. Makes ~6 liters. Essential for families, especially where fresh milk is scarce.",
        "category": "Coffee & Beverages",
        "price_usd": 8.50,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600",
    },
    {
        "sku": "CB-PWM-002",
        "name": "Leche en Polvo Entera 2.5kg",
        "description": "Whole powdered milk, 2.5kg bag. Bulk family size. Long shelf life, no refrigeration needed until reconstituted.",
        "category": "Coffee & Beverages",
        "price_usd": 22.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600",
    },
    {
        "sku": "CB-CON-001",
        "name": "Leche Condensada 395g",
        "description": "Sweetened condensed milk, 395g can. For desserts, Cuban-style flan, natilla, and sweetening coffee.",
        "category": "Coffee & Beverages",
        "price_usd": 3.50,
        "stock_quantity": 150,
        "image_url": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600",
    },
    {
        "sku": "CB-CON-002",
        "name": "Leche Condensada 395g (3-Pack)",
        "description": "Sweetened condensed milk, 3 × 395g cans. Bulk pack for baking and daily coffee use.",
        "category": "Coffee & Beverages",
        "price_usd": 9.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600",
    },
    {
        "sku": "CB-SOD-001",
        "name": "Refrescos Surtidos 330ml (12-Pack)",
        "description": "Assorted soft drinks, 12 × 330ml cans. Mix of cola, lemon-lime, and orange. Refreshing in Cuba's tropical heat.",
        "category": "Coffee & Beverages",
        "price_usd": 8.00,
        "stock_quantity": 70,
        "image_url": "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=600",
    },
    {
        "sku": "CB-JCE-001",
        "name": "Jugo Concentrado de Mango 1L",
        "description": "Mango juice concentrate, 1L bottle. Dilute with water for a tropical refreshment. Makes approximately 4 liters.",
        "category": "Coffee & Beverages",
        "price_usd": 4.50,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1546173159-315724a31696?w=600",
    },
    {
        "sku": "CB-JCE-002",
        "name": "Jugo Concentrado de Guayaba 1L",
        "description": "Guava juice concentrate, 1L bottle. Classic Caribbean fruit flavor. Dilute for drinks or use in batidos.",
        "category": "Coffee & Beverages",
        "price_usd": 4.50,
        "stock_quantity": 85,
        "image_url": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  7. PERSONAL CARE
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "PC-SOP-001",
        "name": "Jabon de Tocador (3-Pack)",
        "description": "Bar soap, pack of 3 (90g each). Gentle everyday body soap. High demand item due to frequent shortages in Cuba.",
        "category": "Personal Care",
        "price_usd": 3.00,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=600",
    },
    {
        "sku": "PC-SHP-001",
        "name": "Champu 400ml",
        "description": "Shampoo, 400ml bottle. All hair types. Clean, fresh formula. Basic hygiene essential frequently in short supply.",
        "category": "Personal Care",
        "price_usd": 4.00,
        "stock_quantity": 150,
        "image_url": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600",
    },
    {
        "sku": "PC-TPT-001",
        "name": "Pasta de Dientes 100ml (2-Pack)",
        "description": "Toothpaste, 2 × 100ml tubes. Fluoride protection for the whole family. Included in Cuban ration systems.",
        "category": "Personal Care",
        "price_usd": 3.50,
        "stock_quantity": 180,
        "image_url": "https://images.unsplash.com/photo-1559013330-2bbb5bfee1b4?w=600",
    },
    {
        "sku": "PC-TBR-001",
        "name": "Cepillo de Dientes (4-Pack)",
        "description": "Toothbrushes, family pack of 4. Medium bristles, ergonomic handles. Essential hygiene item.",
        "category": "Personal Care",
        "price_usd": 3.00,
        "stock_quantity": 160,
        "image_url": "https://images.unsplash.com/photo-1559650656-5d1d361ad10e?w=600",
    },
    {
        "sku": "PC-DEO-001",
        "name": "Desodorante Roll-On 50ml (2-Pack)",
        "description": "Roll-on deodorant, 2 × 50ml. 48-hour freshness. Personal care basic frequently unavailable on the island.",
        "category": "Personal Care",
        "price_usd": 4.50,
        "stock_quantity": 140,
        "image_url": "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=600",
    },
    {
        "sku": "PC-RAZ-001",
        "name": "Cuchillas de Afeitar (10-Pack)",
        "description": "Disposable razors, pack of 10. Dual-blade with lubricating strip. High-demand personal grooming item.",
        "category": "Personal Care",
        "price_usd": 4.00,
        "stock_quantity": 130,
        "image_url": "https://images.unsplash.com/photo-1585399000684-d2f72660f092?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  8. CLEANING PRODUCTS
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "CL-DET-001",
        "name": "Detergente en Polvo 1kg",
        "description": "Laundry detergent powder, 1kg. Concentrated formula, hand-wash and machine compatible. Cleans 20+ loads.",
        "category": "Cleaning Products",
        "price_usd": 4.00,
        "stock_quantity": 170,
        "image_url": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600",
    },
    {
        "sku": "CL-DET-002",
        "name": "Detergente en Polvo 3kg",
        "description": "Laundry detergent powder, 3kg bulk bag. Economical family size for weekly laundry needs.",
        "category": "Cleaning Products",
        "price_usd": 10.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600",
    },
    {
        "sku": "CL-DSH-001",
        "name": "Jabon Lavavajillas Liquido 500ml",
        "description": "Liquid dish soap, 500ml bottle. Cuts grease effectively. Essential kitchen cleaning product.",
        "category": "Cleaning Products",
        "price_usd": 2.50,
        "stock_quantity": 190,
        "image_url": "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=600",
    },
    {
        "sku": "CL-SPR-001",
        "name": "Limpiador Multiuso en Spray 750ml",
        "description": "All-purpose cleaning spray, 750ml. For kitchen surfaces, bathrooms, and general household cleaning.",
        "category": "Cleaning Products",
        "price_usd": 3.50,
        "stock_quantity": 140,
        "image_url": "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600",
    },
    {
        "sku": "CL-BLC-001",
        "name": "Cloro / Lejia 1L",
        "description": "Household bleach (sodium hypochlorite), 1 liter. For disinfecting, sanitizing, and water purification.",
        "category": "Cleaning Products",
        "price_usd": 2.00,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  9. PREPARED FOOD BUNDLES
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "BD-FAM-001",
        "name": "Paquete Familiar de Raciones",
        "description": "Family ration bundle: 5kg white rice, 2kg black beans, 1L vegetable oil, 1kg sugar, 500g pasta, and 3 cans of tuna. Feeds a family of 4 for a week.",
        "category": "Prepared Food Bundles",
        "price_usd": 28.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600",
    },
    {
        "sku": "BD-FAM-002",
        "name": "Paquete Familiar Grande",
        "description": "Large family bundle: 10kg rice, 5kg beans, 5L oil, 2.5kg sugar, 1kg pasta, 6 cans tuna, 2 cans chicken, tomato paste, and salt. Two-week supply.",
        "category": "Prepared Food Bundles",
        "price_usd": 52.00,
        "stock_quantity": 30,
        "image_url": "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600",
    },
    {
        "sku": "BD-PRO-001",
        "name": "Paquete de Proteinas",
        "description": "Protein bundle: 3 cans chicken, 6 cans tuna, 4 cans sardines, 800g powdered milk, and 2 cans luncheon meat. High-protein essentials.",
        "category": "Prepared Food Bundles",
        "price_usd": 32.00,
        "stock_quantity": 45,
        "image_url": "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=600",
    },
    {
        "sku": "BD-BRK-001",
        "name": "Paquete de Desayuno",
        "description": "Breakfast bundle: 250g Cuban coffee, 1kg sugar, 800g powdered milk, condensed milk, and 6-pack crackers. Morning essentials for the family.",
        "category": "Prepared Food Bundles",
        "price_usd": 22.00,
        "stock_quantity": 55,
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  10. APPLIANCES
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "AP-RCK-001",
        "name": "Olla Arrocera Electrica 1.8L",
        "description": "Electric rice cooker, 1.8L capacity (cooks 10 cups). Non-stick inner pot with keep-warm function. Perfect for daily Cuban rice.",
        "category": "Appliances",
        "price_usd": 25.00,
        "stock_quantity": 35,
        "image_url": "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600",
    },
    {
        "sku": "AP-RCK-002",
        "name": "Olla Arrocera Electrica 2.8L",
        "description": "Electric rice cooker, 2.8L capacity (cooks 15 cups). Large family size with steamer basket included.",
        "category": "Appliances",
        "price_usd": 35.00,
        "stock_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
    },
    {
        "sku": "AP-FAN-001",
        "name": "Ventilador de Pedestal 16\"",
        "description": "16-inch pedestal fan, 3-speed oscillating. Essential for Cuba's tropical heat. Adjustable height, quiet operation.",
        "category": "Appliances",
        "price_usd": 30.00,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=600",
    },
    {
        "sku": "AP-FAN-002",
        "name": "Ventilador de Mesa 12\"",
        "description": "12-inch desk/table fan, 3-speed. Compact and portable. Low energy consumption, ideal for bedrooms and offices.",
        "category": "Appliances",
        "price_usd": 18.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
    },
    {
        "sku": "AP-REF-001",
        "name": "Mini Refrigerador 90L",
        "description": "Compact refrigerator, 90 liter capacity. Energy efficient, small freezer compartment. Ideal for small homes and apartments.",
        "category": "Appliances",
        "price_usd": 180.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  11. MEDICINE & PHARMACY
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "MD-MUL-001",
        "name": "Multivitaminico Adulto (60 tabletas)",
        "description": "Adult daily multivitamin, 60 tablets (2-month supply). Complete A-Z formula with essential vitamins and minerals.",
        "category": "Medicine & Pharmacy",
        "price_usd": 8.00,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600",
    },
    {
        "sku": "MD-MUL-002",
        "name": "Multivitaminico Infantil Masticable (60 tab)",
        "description": "Children's chewable multivitamin, 60 tablets. Fruity flavors. Complete daily nutrition support for growing kids.",
        "category": "Medicine & Pharmacy",
        "price_usd": 7.00,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600",
    },
    {
        "sku": "MD-VTC-001",
        "name": "Vitamina C 500mg (100 tabletas)",
        "description": "Vitamin C 500mg, 100 tablets. Immune system support and antioxidant protection. Especially important during seasonal changes.",
        "category": "Medicine & Pharmacy",
        "price_usd": 5.50,
        "stock_quantity": 120,
        "image_url": "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600",
    },
    {
        "sku": "MD-VTD-001",
        "name": "Vitamina D3 1000IU (90 capsulas)",
        "description": "Vitamin D3 1000 IU, 90 softgel capsules. Supports bone health, immune function, and calcium absorption.",
        "category": "Medicine & Pharmacy",
        "price_usd": 6.00,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600",
    },
    {
        "sku": "MD-VTB-001",
        "name": "Complejo Vitaminico B (60 tabletas)",
        "description": "Vitamin B Complex, 60 tablets. B1, B2, B3, B5, B6, B7, B9, B12. Supports energy metabolism and nervous system health.",
        "category": "Medicine & Pharmacy",
        "price_usd": 6.50,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600",
    },
    {
        "sku": "MD-IRN-001",
        "name": "Suplemento de Hierro 65mg (90 tabletas)",
        "description": "Iron supplement (ferrous sulfate) 65mg, 90 tablets. Helps prevent iron-deficiency anemia. Important for women and children.",
        "category": "Medicine & Pharmacy",
        "price_usd": 5.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1585435557343-3b348031bcc6?w=600",
    },
    {
        "sku": "MD-OMG-001",
        "name": "Omega-3 Aceite de Pescado (90 capsulas)",
        "description": "Omega-3 fish oil, 90 softgel capsules (1000mg each). Supports heart health, brain function, and joint mobility.",
        "category": "Medicine & Pharmacy",
        "price_usd": 9.00,
        "stock_quantity": 75,
        "image_url": "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=600",
    },
    {
        "sku": "MD-IBU-001",
        "name": "Ibuprofeno 400mg (30 tabletas)",
        "description": "Ibuprofen 400mg, 30 tablets. Anti-inflammatory pain relief for headaches, muscle pain, fever, and menstrual cramps.",
        "category": "Medicine & Pharmacy",
        "price_usd": 3.50,
        "stock_quantity": 150,
        "image_url": "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=600",
    },
    {
        "sku": "MD-PAR-001",
        "name": "Paracetamol 500mg (30 tabletas)",
        "description": "Paracetamol (acetaminophen) 500mg, 30 tablets. Fever reducer and mild pain reliever. Safe for most adults and children.",
        "category": "Medicine & Pharmacy",
        "price_usd": 2.50,
        "stock_quantity": 180,
        "image_url": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  12. BABY PRODUCTS
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "BB-DIA-001",
        "name": "Panales Desechables Talla S (40 unidades)",
        "description": "Disposable diapers, size Small (3-6kg), pack of 40. Soft, absorbent, leak-proof. For newborns and infants.",
        "category": "Baby Products",
        "price_usd": 10.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600",
    },
    {
        "sku": "BB-DIA-002",
        "name": "Panales Desechables Talla M (36 unidades)",
        "description": "Disposable diapers, size Medium (6-11kg), pack of 36. Comfortable fit with wetness indicator.",
        "category": "Baby Products",
        "price_usd": 10.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1584839404042-8bc21d240e63?w=600",
    },
    {
        "sku": "BB-DIA-003",
        "name": "Panales Desechables Talla L (30 unidades)",
        "description": "Disposable diapers, size Large (9-14kg), pack of 30. For active toddlers, flexible fit with extra absorbency.",
        "category": "Baby Products",
        "price_usd": 10.00,
        "stock_quantity": 70,
        "image_url": "https://images.unsplash.com/photo-1590005354167-6da97870c757?w=600",
    },
    {
        "sku": "BB-FOR-001",
        "name": "Formula Infantil Etapa 1 (400g)",
        "description": "Infant formula Stage 1 (0-6 months), 400g can. Iron-fortified, DHA enriched. Complete nutrition when breastfeeding is not possible.",
        "category": "Baby Products",
        "price_usd": 14.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1584839404042-8bc21d240e63?w=600",
    },
    {
        "sku": "BB-FOR-002",
        "name": "Formula Infantil Etapa 2 (400g)",
        "description": "Follow-on formula Stage 2 (6-12 months), 400g can. Supports continued growth with added iron and calcium.",
        "category": "Baby Products",
        "price_usd": 13.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600",
    },
    {
        "sku": "BB-FOR-003",
        "name": "Formula Infantil Etapa 3 (800g)",
        "description": "Growing-up formula Stage 3 (1-3 years), 800g can. Nutritional supplement with vitamins and minerals for toddlers.",
        "category": "Baby Products",
        "price_usd": 16.00,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  13. SOLAR ENERGY
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "SE-PNL-001",
        "name": "Panel Solar Portatil 100W",
        "description": "Portable monocrystalline solar panel, 100W. Foldable design with built-in stand. Charges phones, lights, and small devices.",
        "category": "Solar Energy",
        "price_usd": 85.00,
        "stock_quantity": 30,
        "image_url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600",
    },
    {
        "sku": "SE-PNL-002",
        "name": "Panel Solar Portatil 200W",
        "description": "Portable monocrystalline solar panel, 200W. Higher output for fans, laptops, and small refrigerators. Weather-resistant frame.",
        "category": "Solar Energy",
        "price_usd": 160.00,
        "stock_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600",
    },
    {
        "sku": "SE-PNL-003",
        "name": "Panel Solar Portatil 400W",
        "description": "High-output portable solar panel, 400W. Powers multiple devices simultaneously. Ideal for off-grid homes and small businesses.",
        "category": "Solar Energy",
        "price_usd": 290.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600",
    },
    {
        "sku": "SE-RPM-001",
        "name": "Modulo Solar para Techo 300W",
        "description": "Rooftop solar panel module, 300W monocrystalline. Fixed-mount for permanent installation. 25-year performance warranty.",
        "category": "Solar Energy",
        "price_usd": 220.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1611365892117-00d741f29cd9?w=600",
    },
    {
        "sku": "SE-RPM-002",
        "name": "Modulo Solar para Techo 550W",
        "description": "High-efficiency rooftop solar panel, 550W. Bifacial design captures reflected light. Commercial-grade for maximum output.",
        "category": "Solar Energy",
        "price_usd": 380.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=600",
    },
    {
        "sku": "SE-BAT-001",
        "name": "Sistema de Bateria Solar 5kWh",
        "description": "Solar battery storage system, 5kWh lithium-ion. Wall-mounted. Stores daytime solar energy for nighttime use.",
        "category": "Solar Energy",
        "price_usd": 650.00,
        "stock_quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=600",
    },
    {
        "sku": "SE-BAT-002",
        "name": "Sistema de Bateria Solar 10kWh",
        "description": "Solar battery storage system, 10kWh lithium-ion. Powers an entire household overnight. Expandable and smart-controller compatible.",
        "category": "Solar Energy",
        "price_usd": 1200.00,
        "stock_quantity": 8,
        "image_url": "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=600",
    },
    {
        "sku": "SE-INV-001",
        "name": "Inversor Solar 3kW",
        "description": "Solar inverter, 3kW pure sine wave. Converts DC solar power to AC household electricity. LCD display with monitoring.",
        "category": "Solar Energy",
        "price_usd": 320.00,
        "stock_quantity": 18,
        "image_url": "https://images.unsplash.com/photo-1592833159117-ac62bc51cba8?w=600",
    },
    {
        "sku": "SE-INV-002",
        "name": "Inversor Solar 5kW",
        "description": "Solar inverter, 5kW pure sine wave. For larger installations. Supports battery charging and grid-tie capability.",
        "category": "Solar Energy",
        "price_usd": 480.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1581092160607-ee67df30db30?w=600",
    },
    {
        "sku": "SE-PWB-001",
        "name": "Power Bank Solar 20,000mAh",
        "description": "Solar power bank, 20,000mAh. Dual USB output, built-in solar panel for emergency recharging. Waterproof and shockproof.",
        "category": "Solar Energy",
        "price_usd": 25.00,
        "stock_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600",
    },
    {
        "sku": "SE-PWB-002",
        "name": "Power Bank Solar 50,000mAh",
        "description": "High-capacity solar power bank, 50,000mAh. Charges laptops, tablets, and phones. Built-in LED flashlight.",
        "category": "Solar Energy",
        "price_usd": 45.00,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600",
    },
    {
        "sku": "SE-FLD-001",
        "name": "Kit Solar Plegable 60W",
        "description": "Foldable solar charging kit, 60W. Lightweight, portable, with USB-A/C outputs. Perfect for travel and emergency power.",
        "category": "Solar Energy",
        "price_usd": 55.00,
        "stock_quantity": 35,
        "image_url": "https://images.unsplash.com/photo-1595437193398-f24279553f4f?w=600",
    },
    {
        "sku": "SE-FLD-002",
        "name": "Kit Solar Plegable 120W",
        "description": "Foldable solar charging kit, 120W. Higher output version with MC4 connector. Charges battery stations and 12V systems.",
        "category": "Solar Energy",
        "price_usd": 95.00,
        "stock_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1545209463-e2827c2c4e60?w=600",
    },
    # Solar Bundles
    {
        "sku": "SE-BDL-001",
        "name": "Kit Solar Basico para Hogar",
        "description": "Basic solar home kit: 2 × 200W panels, 3kW inverter, 5kWh battery. Powers lights, phone charging, fans, and a small refrigerator.",
        "category": "Solar Energy",
        "price_usd": 950.00,
        "stock_quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600",
    },
    {
        "sku": "SE-BDL-002",
        "name": "Kit de Iluminacion Solar",
        "description": "Solar lighting kit: 1 × 100W panel, compact battery, and 4 LED light bulbs with wiring. Provides clean light for an entire household.",
        "category": "Solar Energy",
        "price_usd": 180.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  14. DIESEL & FUEL SUPPLY
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "DF-DSL-001",
        "name": "Diesel 5L Contenedor",
        "description": "Diesel fuel, 5-liter sealed container. For generators, vehicles, and farm equipment. UN-rated safety container.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 12.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1615092296061-e2ccfeb2f3d6?w=600",
    },
    {
        "sku": "DF-DSL-002",
        "name": "Diesel 20L Contenedor",
        "description": "Diesel fuel, 20-liter jerry can. Standard size for generators and backup fuel storage. Heavy-duty HDPE container.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 42.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600",
    },
    {
        "sku": "DF-DSL-003",
        "name": "Diesel 50L Barril",
        "description": "Diesel fuel, 50-liter drum. For extended generator operation and commercial use. Steel drum with pour spout.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 95.00,
        "stock_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1517925035435-7976539b920d?w=600",
    },
    {
        "sku": "DF-STR-001",
        "name": "Barril de Almacenamiento de Combustible 200L",
        "description": "Fuel storage barrel, 200L steel drum. For long-term diesel storage. Includes bung fittings and fuel-rated seals.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 65.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1527576539890-dfa815648363?w=600",
    },
    {
        "sku": "DF-GEN-001",
        "name": "Generador Diesel 3.5kW",
        "description": "Diesel generator, 3.5kW output. Compact and quiet. Powers lights, fans, refrigerator, and phone charging. Electric start.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 450.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1617953141700-bb7d95e7fd0a?w=600",
    },
    {
        "sku": "DF-GEN-002",
        "name": "Generador Diesel 7kW",
        "description": "Diesel generator, 7kW output. Powers an entire household including air conditioning. Low fuel consumption, long runtime.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 850.00,
        "stock_quantity": 8,
        "image_url": "https://images.unsplash.com/photo-1592833159117-ac62bc51cba8?w=600",
    },
    {
        "sku": "DF-GEN-003",
        "name": "Generador Portatil Gasolina 2kW",
        "description": "Portable gasoline generator, 2kW. Lightweight and easy to transport. Ideal for emergency backup and outdoor use.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 280.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600",
    },
    {
        "sku": "DF-PMP-001",
        "name": "Bomba de Combustible Manual",
        "description": "Manual fuel transfer pump with hose. For safely transferring diesel from storage drums to generators and vehicles.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 18.00,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600",
    },
    # Diesel Bundles
    {
        "sku": "DF-BDL-001",
        "name": "Kit Generador + Combustible Inicial",
        "description": "Starter bundle: 3.5kW diesel generator + 20L diesel container + manual fuel pump. Everything needed to start generating power.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 490.00,
        "stock_quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1617953141700-bb7d95e7fd0a?w=600",
    },
    {
        "sku": "DF-BDL-002",
        "name": "Kit Energia para Finca",
        "description": "Farm power bundle: 7kW diesel generator + 200L fuel storage barrel + fuel pump. Reliable power for agricultural operations.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 950.00,
        "stock_quantity": 5,
        "image_url": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  15. BATTERY & ENERGY STORAGE
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "BS-LIT-001",
        "name": "Bateria de Litio 100Ah 12V",
        "description": "Lithium iron phosphate (LiFePO4) battery, 100Ah 12V. 3000+ cycle life. Lightweight, maintenance-free. For solar storage and backup.",
        "category": "Battery & Energy Storage",
        "price_usd": 320.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
    },
    {
        "sku": "BS-LIT-002",
        "name": "Bateria de Litio 200Ah 12V",
        "description": "Lithium iron phosphate battery, 200Ah 12V. Double capacity for extended off-grid use. Built-in BMS protection.",
        "category": "Battery & Energy Storage",
        "price_usd": 580.00,
        "stock_quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=600",
    },
    {
        "sku": "BS-LED-001",
        "name": "Bateria de Ciclo Profundo (Plomo) 100Ah 12V",
        "description": "Deep-cycle lead-acid battery, 100Ah 12V. Reliable and affordable energy storage for solar systems and generators.",
        "category": "Battery & Energy Storage",
        "price_usd": 120.00,
        "stock_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=600",
    },
    {
        "sku": "BS-LED-002",
        "name": "Bateria de Ciclo Profundo (Plomo) 200Ah 12V",
        "description": "Deep-cycle lead-acid battery, 200Ah 12V. Heavy-duty storage for larger solar installations and commercial use.",
        "category": "Battery & Energy Storage",
        "price_usd": 210.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=600",
    },
    {
        "sku": "BS-PPS-001",
        "name": "Estacion de Energia Portatil 500Wh",
        "description": "Portable power station, 500Wh. AC/DC/USB outputs. Rechargeable via solar panel, wall outlet, or car charger. Silent alternative to generators.",
        "category": "Battery & Energy Storage",
        "price_usd": 350.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600",
    },
    {
        "sku": "BS-PPS-002",
        "name": "Estacion de Energia Portatil 1500Wh",
        "description": "High-capacity portable power station, 1500Wh. Powers refrigerators, power tools, and medical equipment. Multiple charging inputs.",
        "category": "Battery & Energy Storage",
        "price_usd": 750.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600",
    },
    {
        "sku": "BS-SBK-001",
        "name": "Banco de Baterias Solar 2.4kWh",
        "description": "Solar battery bank, 2.4kWh (2 × 100Ah 12V lithium). Pre-wired with charge controller. Plug-and-play with any 12V solar panel.",
        "category": "Battery & Energy Storage",
        "price_usd": 550.00,
        "stock_quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=600",
    },

    # ═══════════════════════════════════════════════════════════════
    #  16. MICRO-GRID & HOME ENERGY SYSTEMS
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "MG-OGK-001",
        "name": "Kit Solar Off-Grid Completo 3kW",
        "description": "Full off-grid solar kit: 6 × 550W panels, 5kW inverter, 10kWh battery bank, mounting hardware, and wiring. Powers an entire home independently.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 3500.00,
        "stock_quantity": 5,
        "image_url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600",
    },
    {
        "sku": "MG-OGK-002",
        "name": "Kit Solar Off-Grid Completo 5kW",
        "description": "Premium off-grid solar kit: 10 × 550W panels, 8kW inverter, 20kWh battery storage, full mounting and wiring. For larger homes and small businesses.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 5800.00,
        "stock_quantity": 3,
        "image_url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=600",
    },
    {
        "sku": "MG-HYB-001",
        "name": "Sistema Hibrido Solar + Generador",
        "description": "Hybrid power system: 2kW solar array, 5kWh battery, and 3.5kW diesel generator with automatic transfer switch. Solar primary, generator backup.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 2800.00,
        "stock_quantity": 5,
        "image_url": "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600",
    },
    {
        "sku": "MG-HYB-002",
        "name": "Sistema Hibrido Solar + Generador Premium",
        "description": "Premium hybrid system: 5kW solar array, 15kWh battery bank, 7kW diesel generator, smart controller. Full energy independence with automatic failover.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 5200.00,
        "stock_quantity": 3,
        "image_url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600",
    },
    {
        "sku": "MG-CTR-001",
        "name": "Controlador Inteligente de Energia",
        "description": "Smart energy controller with LCD display. Manages solar input, battery charging, generator auto-start, and load distribution. WiFi monitoring app.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 280.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1581092160607-ee67df30db30?w=600",
    },
    {
        "sku": "MG-PDB-001",
        "name": "Caja de Distribucion Electrica",
        "description": "Power distribution box with circuit breakers, surge protection, and metering. Safely distributes generated power to household circuits.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 120.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=600",
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
