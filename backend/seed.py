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
#    3. Canned & Preserved Foods
#    4. Fresh Produce
#    5. Coffee & Beverages
#    6. Dairy & Milk
#    7. Juice Packs
#    8. Appliances & Energy
#    9. Solar Energy
#   10. Diesel & Fuel Supply
#   11. Battery & Energy Storage
#   12. Micro-grid & Home Energy
#
#  Images: placeholder URLs — replace with real product photos
# ════════════════════════════════════════════════════════════════════════════

# Helper: generates a placeholder image URL with the product name
def _img(label: str) -> str:
    """Generate a placeholder image URL. Replace these with real product photos."""
    encoded = label.replace(" ", "+")
    return f"https://placehold.co/600x400/1B5E20/FFFFFF?text={encoded}"

PRODUCTS = [
    # ═══════════════════════════════════════════════════════════════
    #  1. GRAINS & CARBOHYDRATES  (13 products)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "GC-RIC-001",
        "name": "Arroz Blanco Premium 5kg",
        "description": "Long-grain white rice, 5kg bag. The cornerstone of Cuban cuisine — essential for congri, arroz con pollo, moros y cristianos, and everyday family meals.",
        "category": "Grains & Carbohydrates",
        "price_usd": 6.50,
        "stock_quantity": 200,
        "image_url": _img("Arroz+5kg"),
    },
    {
        "sku": "GC-RIC-002",
        "name": "Arroz Blanco Premium 10kg",
        "description": "Long-grain white rice, 10kg bulk bag. Best value for larger families. Cuban kitchen staple for all rice-based dishes.",
        "category": "Grains & Carbohydrates",
        "price_usd": 11.50,
        "stock_quantity": 120,
        "image_url": _img("Arroz+10kg"),
    },
    {
        "sku": "GC-PAS-001",
        "name": "Pasta Espagueti 500g",
        "description": "Classic spaghetti pasta, 500g pack. Quick, versatile meal base for the whole family.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.00,
        "stock_quantity": 250,
        "image_url": _img("Espagueti+500g"),
    },
    {
        "sku": "GC-PAS-002",
        "name": "Pasta Macarrones 500g",
        "description": "Elbow macaroni pasta, 500g. Great for soups, baked pasta dishes, and Cuban-style macaroni salad.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.00,
        "stock_quantity": 200,
        "image_url": _img("Macarrones+500g"),
    },
    {
        "sku": "GC-FLR-001",
        "name": "Harina de Trigo Multiuso 2kg",
        "description": "All-purpose wheat flour, 2kg bag. For croquetas, empanadas, buñuelos, frituras, and everyday baking.",
        "category": "Grains & Carbohydrates",
        "price_usd": 3.75,
        "stock_quantity": 150,
        "image_url": _img("Harina+Trigo+2kg"),
    },
    {
        "sku": "GC-FLR-002",
        "name": "Harina de Trigo Multiuso 5kg",
        "description": "All-purpose wheat flour, 5kg bulk bag. Economical size for families who bake frequently.",
        "category": "Grains & Carbohydrates",
        "price_usd": 7.50,
        "stock_quantity": 80,
        "image_url": _img("Harina+Trigo+5kg"),
    },
    {
        "sku": "GC-CRM-001",
        "name": "Harina de Maiz 1kg",
        "description": "Fine cornmeal, 1kg. Essential for tamales, polenta, harina de maíz con leche, and traditional corn-based dishes.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.50,
        "stock_quantity": 180,
        "image_url": _img("Harina+Maiz+1kg"),
    },
    {
        "sku": "GC-CRM-002",
        "name": "Harina de Maiz 2.5kg",
        "description": "Fine cornmeal, 2.5kg bag. Larger size for households that regularly prepare tamales and corn recipes.",
        "category": "Grains & Carbohydrates",
        "price_usd": 5.00,
        "stock_quantity": 100,
        "image_url": _img("Harina+Maiz+2.5kg"),
    },
    {
        "sku": "GC-CSF-001",
        "name": "Harina de Yuca 1kg",
        "description": "Cassava flour (harina de yuca), 1kg. Gluten-free staple for Caribbean baking, casabe flatbread, and thickening stews.",
        "category": "Grains & Carbohydrates",
        "price_usd": 3.25,
        "stock_quantity": 130,
        "image_url": _img("Harina+Yuca+1kg"),
    },
    {
        "sku": "GC-BRF-001",
        "name": "Harina de Pan 2kg",
        "description": "Bread flour (high-gluten), 2kg bag. Ideal for Cuban bread, pan de agua, and homemade rolls with a perfect chewy crust.",
        "category": "Grains & Carbohydrates",
        "price_usd": 4.25,
        "stock_quantity": 110,
        "image_url": _img("Harina+Pan+2kg"),
    },
    # +3 new grains
    {
        "sku": "GC-AVN-001",
        "name": "Avena en Hojuelas 500g",
        "description": "Rolled oats, 500g. Nutritious breakfast cereal, also great for baking, smoothies, and homemade granola bars.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.75,
        "stock_quantity": 160,
        "image_url": _img("Avena+500g"),
    },
    {
        "sku": "GC-PLN-001",
        "name": "Harina de Platano 500g",
        "description": "Plantain flour, 500g. Traditional Caribbean cooking flour made from dried green plantains. For fufu, porridge, and baking.",
        "category": "Grains & Carbohydrates",
        "price_usd": 3.50,
        "stock_quantity": 120,
        "image_url": _img("Harina+Platano"),
    },
    {
        "sku": "GC-SEM-001",
        "name": "Semolina de Trigo 1kg",
        "description": "Wheat semolina, 1kg. For fresh pasta, couscous, puddings, and traditional Caribbean desserts.",
        "category": "Grains & Carbohydrates",
        "price_usd": 3.00,
        "stock_quantity": 100,
        "image_url": _img("Semolina+1kg"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  2. BEANS & LEGUMES  (6 products)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "BL-BLK-001",
        "name": "Frijoles Negros Secos 1kg",
        "description": "Dried black beans, 1kg. The soul of Cuban cooking — essential for frijoles negros, congri, and moros y cristianos.",
        "category": "Beans & Legumes",
        "price_usd": 3.25,
        "stock_quantity": 250,
        "image_url": _img("Frijoles+Negros+1kg"),
    },
    {
        "sku": "BL-BLK-002",
        "name": "Frijoles Negros Secos 2.5kg",
        "description": "Dried black beans, 2.5kg bulk bag. Best value for families who cook beans daily.",
        "category": "Beans & Legumes",
        "price_usd": 7.00,
        "stock_quantity": 140,
        "image_url": _img("Frijoles+Negros+2.5kg"),
    },
    {
        "sku": "BL-RED-001",
        "name": "Frijoles Colorados Secos 1kg",
        "description": "Dried red kidney beans, 1kg. Popular in potaje de frijoles colorados, soups, and stews. Rich in fiber and iron.",
        "category": "Beans & Legumes",
        "price_usd": 3.50,
        "stock_quantity": 200,
        "image_url": _img("Frijoles+Rojos+1kg"),
    },
    {
        "sku": "BL-LNT-001",
        "name": "Lentejas Secas 500g",
        "description": "Dried green/brown lentils, 500g. Fast-cooking legume rich in protein and iron. Great for soups and side dishes.",
        "category": "Beans & Legumes",
        "price_usd": 2.50,
        "stock_quantity": 180,
        "image_url": _img("Lentejas+500g"),
    },
    {
        "sku": "BL-CHK-001",
        "name": "Garbanzos Secos 500g",
        "description": "Dried chickpeas (garbanzos), 500g. Versatile legume for stews, salads, hummus, and potaje de garbanzos.",
        "category": "Beans & Legumes",
        "price_usd": 2.75,
        "stock_quantity": 160,
        "image_url": _img("Garbanzos+500g"),
    },
    {
        "sku": "BL-SPL-001",
        "name": "Chicharos Partidos 500g",
        "description": "Dried split peas, 500g. Classic for thick, hearty soups. Cooks fast, high in fiber and protein.",
        "category": "Beans & Legumes",
        "price_usd": 2.25,
        "stock_quantity": 170,
        "image_url": _img("Chicharos+500g"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  3. CANNED & PRESERVED FOODS  (7 products)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "CN-TUN-001",
        "name": "Atun en Aceite 150g (3-Pack)",
        "description": "Canned tuna in oil, 3 × 150g tins. High protein, ready to eat. Ideal for quick meals, sandwiches, and salads.",
        "category": "Canned & Preserved Foods",
        "price_usd": 5.25,
        "stock_quantity": 180,
        "image_url": _img("Atun+3-Pack"),
    },
    {
        "sku": "CN-TUN-002",
        "name": "Atun en Agua 150g (6-Pack)",
        "description": "Canned tuna in water, 6 × 150g tins. Lean protein bulk pack. Long shelf life, ships easily.",
        "category": "Canned & Preserved Foods",
        "price_usd": 9.00,
        "stock_quantity": 100,
        "image_url": _img("Atun+6-Pack"),
    },
    {
        "sku": "CN-SAR-001",
        "name": "Sardinas en Aceite 125g (4-Pack)",
        "description": "Canned sardines in oil, 4 × 125g tins. Rich in omega-3 and calcium. A Cuban pantry staple that stores for years.",
        "category": "Canned & Preserved Foods",
        "price_usd": 5.50,
        "stock_quantity": 150,
        "image_url": _img("Sardinas+4-Pack"),
    },
    {
        "sku": "CN-CHK-001",
        "name": "Pollo en Conserva 350g",
        "description": "Canned chicken breast in broth, 350g. Ready-to-eat protein for sandwiches, rice dishes, and quick meals.",
        "category": "Canned & Preserved Foods",
        "price_usd": 4.50,
        "stock_quantity": 130,
        "image_url": _img("Pollo+Conserva+350g"),
    },
    {
        "sku": "CN-VEG-001",
        "name": "Vegetales Mixtos en Conserva 400g",
        "description": "Canned mixed vegetables (corn, peas, carrots), 400g. Convenient side dish, great addition to soups and rice.",
        "category": "Canned & Preserved Foods",
        "price_usd": 2.75,
        "stock_quantity": 200,
        "image_url": _img("Vegetales+Mixtos"),
    },
    {
        "sku": "CN-SPM-001",
        "name": "Carne de Almuerzo Tipo Spam 340g",
        "description": "Luncheon meat (Spam-style), 340g can. Versatile canned protein — fry, slice for sandwiches, or add to rice dishes. Extremely popular in Cuba.",
        "category": "Canned & Preserved Foods",
        "price_usd": 4.00,
        "stock_quantity": 170,
        "image_url": _img("Spam+340g"),
    },
    {
        "sku": "CN-SPM-002",
        "name": "Carne de Almuerzo Tipo Spam 340g (3-Pack)",
        "description": "Luncheon meat 3-pack, 3 × 340g cans. Bulk buy savings on one of Cuba's most requested canned goods.",
        "category": "Canned & Preserved Foods",
        "price_usd": 10.50,
        "stock_quantity": 90,
        "image_url": _img("Spam+3-Pack"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  4. FRESH PRODUCE  (9 products — avocado is signature)
    # ═══════════════════════════════════════════════════════════════
    # Avocados — SIGNATURE PRODUCT
    {
        "sku": "FP-AVO-001",
        "name": "Aguacate Cubano Fresco (3 unidades)",
        "description": "Fresh Cuban avocados, pack of 3. Our signature product — large, creamy, tropical avocados locally sourced from Cuban farms. The heart of Asymmetrica Cuba.",
        "category": "Fresh Produce",
        "price_usd": 4.50,
        "stock_quantity": 80,
        "image_url": _img("Aguacate+x3+SIGNATURE"),
    },
    {
        "sku": "FP-AVO-002",
        "name": "Aguacate Cubano Fresco (6 unidades)",
        "description": "Fresh Cuban avocados, box of 6. Double pack of our signature avocados — perfect for families. Farm-to-door freshness.",
        "category": "Fresh Produce",
        "price_usd": 8.00,
        "stock_quantity": 50,
        "image_url": _img("Aguacate+x6+SIGNATURE"),
    },
    {
        "sku": "FP-AVO-003",
        "name": "Aguacate Mamey (3 unidades)",
        "description": "Mamey avocados, pack of 3. Larger Caribbean variety with buttery, nutty flavor. Excellent for guacamole and salads.",
        "category": "Fresh Produce",
        "price_usd": 5.50,
        "stock_quantity": 40,
        "image_url": _img("Aguacate+Mamey+x3"),
    },
    # Plantains
    {
        "sku": "FP-PLT-001",
        "name": "Platanos Maduros (6 unidades)",
        "description": "Ripe plantains, bundle of 6. Sweet and versatile — fry into maduros, bake, or mash. Domestic delivery only.",
        "category": "Fresh Produce",
        "price_usd": 3.50,
        "stock_quantity": 80,
        "image_url": _img("Platano+Maduro+x6"),
    },
    {
        "sku": "FP-PLT-002",
        "name": "Platanos Verdes (6 unidades)",
        "description": "Green plantains, bundle of 6. For tostones, fufu de plátano, and chips. A daily Cuban cooking staple.",
        "category": "Fresh Produce",
        "price_usd": 3.00,
        "stock_quantity": 80,
        "image_url": _img("Platano+Verde+x6"),
    },
    # Root vegetables
    {
        "sku": "FP-BON-001",
        "name": "Boniato (Sweet Potato) 2kg",
        "description": "Cuban white sweet potato (boniato), 2kg. Milder and drier than orange varieties. Boil, fry, or bake. Locally sourced.",
        "category": "Fresh Produce",
        "price_usd": 3.25,
        "stock_quantity": 70,
        "image_url": _img("Boniato+2kg"),
    },
    {
        "sku": "FP-YUC-001",
        "name": "Yuca Fresca 2kg",
        "description": "Fresh cassava (yuca), 2kg. Staple Caribbean root vegetable. Boil with garlic mojo sauce for a classic Cuban side dish.",
        "category": "Fresh Produce",
        "price_usd": 3.50,
        "stock_quantity": 65,
        "image_url": _img("Yuca+2kg"),
    },
    # +4 new tropical fruits
    {
        "sku": "FP-MNG-001",
        "name": "Mangos Frescos (4 unidades)",
        "description": "Fresh tropical mangos, pack of 4. Sweet, juicy, and fragrant. Eaten fresh, in batidos, or as dessert.",
        "category": "Fresh Produce",
        "price_usd": 4.00,
        "stock_quantity": 60,
        "image_url": _img("Mango+x4"),
    },
    {
        "sku": "FP-PAP-001",
        "name": "Papaya Fresca (1 unidad grande)",
        "description": "Fresh papaya, 1 large fruit (~1.5kg). Tropical sweetness rich in vitamins A and C. Eat fresh or blend into smoothies.",
        "category": "Fresh Produce",
        "price_usd": 3.50,
        "stock_quantity": 50,
        "image_url": _img("Papaya+Grande"),
    },
    {
        "sku": "FP-GUA-001",
        "name": "Guayabas Frescas (6 unidades)",
        "description": "Fresh guavas, pack of 6. Intensely aromatic and sweet. For eating fresh, guava paste, or juicing.",
        "category": "Fresh Produce",
        "price_usd": 3.75,
        "stock_quantity": 55,
        "image_url": _img("Guayaba+x6"),
    },
    {
        "sku": "FP-COC-001",
        "name": "Coco Fresco (2 unidades)",
        "description": "Fresh coconuts, pack of 2. Crack open for coconut water, scrape the meat for cooking, or grate for desserts.",
        "category": "Fresh Produce",
        "price_usd": 4.00,
        "stock_quantity": 45,
        "image_url": _img("Coco+x2"),
    },
    {
        "sku": "FP-GBN-001",
        "name": "Guanabana Fresca (1 unidad)",
        "description": "Fresh soursop (guanábana), 1 large fruit. Creamy white flesh with tropical sweet-tart flavor. Popular for juices and batidos.",
        "category": "Fresh Produce",
        "price_usd": 5.00,
        "stock_quantity": 35,
        "image_url": _img("Guanabana"),
    },
    {
        "sku": "FP-CIR-001",
        "name": "Ciruelas Tropicales (500g)",
        "description": "Tropical plums (ciruelas), 500g bag. Small, tangy-sweet fruits. A popular snack across Cuba and the Caribbean.",
        "category": "Fresh Produce",
        "price_usd": 3.00,
        "stock_quantity": 50,
        "image_url": _img("Ciruelas+500g"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  5. COFFEE & BEVERAGES  (expanded with types, roasts, blends)
    # ═══════════════════════════════════════════════════════════════
    # Cubita brand
    {
        "sku": "CB-CUB-001",
        "name": "Cafe Cubita Molido Oscuro 250g",
        "description": "Cubita brand dark roast ground coffee, 250g. Cuba's most iconic coffee — bold, smoky, intense. For espresso and cafetera.",
        "category": "Coffee & Beverages",
        "price_usd": 6.50,
        "stock_quantity": 120,
        "image_url": _img("Cubita+Dark+250g"),
    },
    {
        "sku": "CB-CUB-002",
        "name": "Cafe Cubita Molido Oscuro 500g",
        "description": "Cubita brand dark roast ground coffee, 500g. Double-size pack of Cuba's most iconic export coffee.",
        "category": "Coffee & Beverages",
        "price_usd": 11.50,
        "stock_quantity": 80,
        "image_url": _img("Cubita+Dark+500g"),
    },
    {
        "sku": "CB-CUB-003",
        "name": "Cafe Cubita Molido Medio 250g",
        "description": "Cubita brand medium roast ground coffee, 250g. Smoother, balanced profile with chocolate and caramel notes. Less bitter than dark roast.",
        "category": "Coffee & Beverages",
        "price_usd": 6.50,
        "stock_quantity": 90,
        "image_url": _img("Cubita+Medium+250g"),
    },
    # Serrano brand
    {
        "sku": "CB-SER-001",
        "name": "Cafe Serrano Molido Oscuro 250g",
        "description": "Serrano dark roast ground coffee, 250g. Premium mountain-grown beans from Santiago de Cuba. Rich, full-bodied flavor.",
        "category": "Coffee & Beverages",
        "price_usd": 7.00,
        "stock_quantity": 90,
        "image_url": _img("Serrano+Dark+250g"),
    },
    {
        "sku": "CB-SER-002",
        "name": "Cafe Serrano Grano Entero 500g",
        "description": "Serrano whole bean coffee, 500g. Grind at home for maximum freshness. Premium Sierra Maestra mountain-grown.",
        "category": "Coffee & Beverages",
        "price_usd": 13.00,
        "stock_quantity": 60,
        "image_url": _img("Serrano+WholeBean+500g"),
    },
    {
        "sku": "CB-SER-003",
        "name": "Cafe Serrano Molido Suave 250g",
        "description": "Serrano light roast ground coffee, 250g. Delicate, bright acidity with floral notes. For pour-over and drip brewing.",
        "category": "Coffee & Beverages",
        "price_usd": 7.00,
        "stock_quantity": 70,
        "image_url": _img("Serrano+Light+250g"),
    },
    # Turquino brand
    {
        "sku": "CB-TUR-001",
        "name": "Cafe Turquino Montanes 250g",
        "description": "Turquino mountain coffee, 250g ground. Single-origin from Cuba's highest peak region. Smooth, earthy, with hints of tobacco and dark chocolate.",
        "category": "Coffee & Beverages",
        "price_usd": 8.00,
        "stock_quantity": 50,
        "image_url": _img("Turquino+250g"),
    },
    # Blends & specialty
    {
        "sku": "CB-BLD-001",
        "name": "Cafe Mezcla Cubana (Espresso Blend) 250g",
        "description": "Cuban espresso blend, 250g ground. Traditional blend optimized for moka pot and espresso. Produces the perfect crema for cafecito cubano.",
        "category": "Coffee & Beverages",
        "price_usd": 6.00,
        "stock_quantity": 100,
        "image_url": _img("Espresso+Blend+250g"),
    },
    {
        "sku": "CB-BLD-002",
        "name": "Cafe Descafeinado Molido 250g",
        "description": "Decaffeinated ground coffee, 250g. Full Cuban coffee flavor without the caffeine. Swiss water processed for purity.",
        "category": "Coffee & Beverages",
        "price_usd": 7.50,
        "stock_quantity": 60,
        "image_url": _img("Cafe+Decaf+250g"),
    },
    {
        "sku": "CB-INS-001",
        "name": "Cafe Instantaneo 200g",
        "description": "Instant coffee, 200g jar. Quick and convenient. Just add hot water for an immediate cup of coffee anywhere.",
        "category": "Coffee & Beverages",
        "price_usd": 5.00,
        "stock_quantity": 110,
        "image_url": _img("Cafe+Instantaneo"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  6. DAIRY & MILK  (agricultural, farmer-friendly)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "DM-PWM-001",
        "name": "Leche en Polvo Entera 800g",
        "description": "Whole powdered milk, 800g tin. Makes ~6 liters. Essential for families, especially where fresh milk is scarce.",
        "category": "Dairy & Milk",
        "price_usd": 8.50,
        "stock_quantity": 100,
        "image_url": _img("Leche+Polvo+Entera+800g"),
    },
    {
        "sku": "DM-PWM-002",
        "name": "Leche en Polvo Entera 2.5kg",
        "description": "Whole powdered milk, 2.5kg bag. Bulk family size. Long shelf life, no refrigeration needed until reconstituted.",
        "category": "Dairy & Milk",
        "price_usd": 22.00,
        "stock_quantity": 50,
        "image_url": _img("Leche+Polvo+2.5kg"),
    },
    {
        "sku": "DM-SKM-001",
        "name": "Leche en Polvo Descremada 800g",
        "description": "Skim powdered milk, 800g tin. Low-fat option. Makes ~6 liters. Great for baking and cooking when whole milk isn't needed.",
        "category": "Dairy & Milk",
        "price_usd": 7.50,
        "stock_quantity": 80,
        "image_url": _img("Leche+Descremada+800g"),
    },
    {
        "sku": "DM-CON-001",
        "name": "Leche Condensada 395g",
        "description": "Sweetened condensed milk, 395g can. For desserts, Cuban flan, natilla, and sweetening coffee.",
        "category": "Dairy & Milk",
        "price_usd": 3.50,
        "stock_quantity": 150,
        "image_url": _img("Leche+Condensada+395g"),
    },
    {
        "sku": "DM-CON-002",
        "name": "Leche Condensada 395g (3-Pack)",
        "description": "Sweetened condensed milk, 3 × 395g cans. Bulk pack for baking and daily coffee use.",
        "category": "Dairy & Milk",
        "price_usd": 9.00,
        "stock_quantity": 80,
        "image_url": _img("Leche+Condensada+3-Pack"),
    },
    {
        "sku": "DM-EVP-001",
        "name": "Leche Evaporada 370g",
        "description": "Evaporated milk, 370g can. Unsweetened, creamy. Use in coffee, sauces, soups, and tres leches cake.",
        "category": "Dairy & Milk",
        "price_usd": 2.50,
        "stock_quantity": 130,
        "image_url": _img("Leche+Evaporada+370g"),
    },
    {
        "sku": "DM-CRM-001",
        "name": "Crema de Leche UHT 200ml (3-Pack)",
        "description": "UHT cream, 3 × 200ml. Shelf-stable heavy cream for cooking, sauces, and desserts. No refrigeration until opened.",
        "category": "Dairy & Milk",
        "price_usd": 5.00,
        "stock_quantity": 90,
        "image_url": _img("Crema+Leche+3-Pack"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  7. JUICE PACKS  (tropical & Caribbean fruits)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "JP-MNG-001",
        "name": "Jugo de Mango 1L (3-Pack)",
        "description": "Mango juice, 3 × 1L cartons. 100% tropical mango flavor. No added sugar. Cuba's favorite refreshment.",
        "category": "Juice Packs",
        "price_usd": 6.00,
        "stock_quantity": 90,
        "image_url": _img("Jugo+Mango+3-Pack"),
    },
    {
        "sku": "JP-PAP-001",
        "name": "Jugo de Papaya 1L (3-Pack)",
        "description": "Papaya juice, 3 × 1L cartons. Smooth, tropical sweetness packed with digestive enzymes and vitamins.",
        "category": "Juice Packs",
        "price_usd": 6.00,
        "stock_quantity": 80,
        "image_url": _img("Jugo+Papaya+3-Pack"),
    },
    {
        "sku": "JP-GUA-001",
        "name": "Jugo de Guayaba 1L (3-Pack)",
        "description": "Guava juice, 3 × 1L cartons. Intensely aromatic, pink-hued Caribbean classic. Rich in vitamin C.",
        "category": "Juice Packs",
        "price_usd": 6.00,
        "stock_quantity": 85,
        "image_url": _img("Jugo+Guayaba+3-Pack"),
    },
    {
        "sku": "JP-COC-001",
        "name": "Agua de Coco 330ml (6-Pack)",
        "description": "Pure coconut water, 6 × 330ml cans. Natural electrolyte hydration straight from Caribbean coconuts. Refreshing and healthy.",
        "category": "Juice Packs",
        "price_usd": 7.00,
        "stock_quantity": 75,
        "image_url": _img("Agua+Coco+6-Pack"),
    },
    {
        "sku": "JP-COC-002",
        "name": "Leche de Coco 400ml (3-Pack)",
        "description": "Coconut milk, 3 × 400ml cans. Rich, creamy. Essential for Caribbean cooking, curries, rice, and smoothies.",
        "category": "Juice Packs",
        "price_usd": 5.50,
        "stock_quantity": 90,
        "image_url": _img("Leche+Coco+3-Pack"),
    },
    {
        "sku": "JP-GBN-001",
        "name": "Jugo de Guanabana 1L (3-Pack)",
        "description": "Soursop (guanábana) juice, 3 × 1L cartons. Unique creamy-tart tropical flavor. Rich in antioxidants.",
        "category": "Juice Packs",
        "price_usd": 7.00,
        "stock_quantity": 60,
        "image_url": _img("Jugo+Guanabana+3-Pack"),
    },
    {
        "sku": "JP-MIX-001",
        "name": "Pack Tropical Surtido (6 unidades)",
        "description": "Mixed tropical juice pack: 1L each of mango, guava, papaya, guanábana, coconut water, and passion fruit. Taste the Caribbean.",
        "category": "Juice Packs",
        "price_usd": 12.00,
        "stock_quantity": 45,
        "image_url": _img("Jugo+Tropical+Mix+6"),
    },
    {
        "sku": "JP-CIR-001",
        "name": "Jugo de Ciruela 1L (3-Pack)",
        "description": "Tropical plum juice, 3 × 1L cartons. Sweet-tart and refreshing. Made from Caribbean ciruelas.",
        "category": "Juice Packs",
        "price_usd": 5.50,
        "stock_quantity": 65,
        "image_url": _img("Jugo+Ciruela+3-Pack"),
    },
    {
        "sku": "JP-PSN-001",
        "name": "Jugo de Maracuya 1L (3-Pack)",
        "description": "Passion fruit (maracuyá) juice, 3 × 1L cartons. Tangy, aromatic, and intensely tropical. A Cuban favorite.",
        "category": "Juice Packs",
        "price_usd": 6.50,
        "stock_quantity": 70,
        "image_url": _img("Jugo+Maracuya+3-Pack"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  8. APPLIANCES & ENERGY  (energy-focused, targeted)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "AE-RCK-001",
        "name": "Olla Arrocera Electrica 1.8L (Bajo Consumo)",
        "description": "Low-energy electric rice cooker, 1.8L. Energy-efficient design ideal for solar/generator-powered homes. Non-stick pot, keep-warm function.",
        "category": "Appliances & Energy",
        "price_usd": 25.00,
        "stock_quantity": 35,
        "image_url": _img("Arrocera+1.8L"),
    },
    {
        "sku": "AE-FAN-001",
        "name": "Ventilador Solar DC 16\"",
        "description": "16-inch DC solar-compatible fan. Runs directly from 12V solar systems or batteries. Ultra-low power consumption, silent operation.",
        "category": "Appliances & Energy",
        "price_usd": 45.00,
        "stock_quantity": 30,
        "image_url": _img("Ventilador+Solar+16"),
    },
    {
        "sku": "AE-FAN-002",
        "name": "Ventilador de Techo Solar DC 52\"",
        "description": "52-inch DC ceiling fan with remote. Designed for off-grid homes. Runs on 12V/24V solar systems. Cools large rooms efficiently.",
        "category": "Appliances & Energy",
        "price_usd": 85.00,
        "stock_quantity": 15,
        "image_url": _img("Ventilador+Techo+Solar"),
    },
    {
        "sku": "AE-REF-001",
        "name": "Mini Refrigerador 12V/DC 50L",
        "description": "DC-powered mini fridge, 50L. Designed for solar and battery systems. Low energy consumption (45W). Keeps food fresh off-grid.",
        "category": "Appliances & Energy",
        "price_usd": 160.00,
        "stock_quantity": 12,
        "image_url": _img("Mini+Fridge+DC+50L"),
    },
    {
        "sku": "AE-REF-002",
        "name": "Refrigerador Solar DC 100L",
        "description": "Solar DC refrigerator, 100L with small freezer. Runs on 12V/24V systems. Designed for tropical climates and off-grid living.",
        "category": "Appliances & Energy",
        "price_usd": 320.00,
        "stock_quantity": 8,
        "image_url": _img("Fridge+Solar+DC+100L"),
    },
    {
        "sku": "AE-LED-001",
        "name": "Kit Iluminacion LED Solar (6 bombillas)",
        "description": "Solar LED lighting kit: 6 × 5W LED bulbs with 12V wiring harness. Plug-and-play with any solar system. Lights an entire home.",
        "category": "Appliances & Energy",
        "price_usd": 28.00,
        "stock_quantity": 40,
        "image_url": _img("LED+Solar+Kit+6"),
    },
    {
        "sku": "AE-CHG-001",
        "name": "Cargador Solar USB Multi-Puerto",
        "description": "Solar-compatible USB charging station. 4 USB ports + 2 USB-C. Runs on 12V DC. Charge phones, tablets, and devices off-grid.",
        "category": "Appliances & Energy",
        "price_usd": 15.00,
        "stock_quantity": 50,
        "image_url": _img("Cargador+Solar+USB"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  9. SOLAR ENERGY  (15 products)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "SE-PNL-001",
        "name": "Panel Solar Portatil 100W",
        "description": "Portable monocrystalline solar panel, 100W. Foldable design with built-in stand. Charges phones, lights, and small devices.",
        "category": "Solar Energy",
        "price_usd": 85.00,
        "stock_quantity": 30,
        "image_url": _img("Panel+Solar+100W"),
    },
    {
        "sku": "SE-PNL-002",
        "name": "Panel Solar Portatil 200W",
        "description": "Portable monocrystalline solar panel, 200W. Higher output for fans, laptops, and small refrigerators.",
        "category": "Solar Energy",
        "price_usd": 160.00,
        "stock_quantity": 25,
        "image_url": _img("Panel+Solar+200W"),
    },
    {
        "sku": "SE-PNL-003",
        "name": "Panel Solar Portatil 400W",
        "description": "High-output portable solar panel, 400W. Powers multiple devices simultaneously. Ideal for off-grid homes.",
        "category": "Solar Energy",
        "price_usd": 290.00,
        "stock_quantity": 15,
        "image_url": _img("Panel+Solar+400W"),
    },
    {
        "sku": "SE-RPM-001",
        "name": "Modulo Solar para Techo 300W",
        "description": "Rooftop solar panel module, 300W monocrystalline. Fixed-mount for permanent installation. 25-year performance warranty.",
        "category": "Solar Energy",
        "price_usd": 220.00,
        "stock_quantity": 20,
        "image_url": _img("Panel+Techo+300W"),
    },
    {
        "sku": "SE-RPM-002",
        "name": "Modulo Solar para Techo 550W",
        "description": "High-efficiency rooftop solar panel, 550W bifacial. Captures reflected light. Commercial-grade for maximum output.",
        "category": "Solar Energy",
        "price_usd": 380.00,
        "stock_quantity": 12,
        "image_url": _img("Panel+Techo+550W"),
    },
    {
        "sku": "SE-BAT-001",
        "name": "Sistema de Bateria Solar 5kWh",
        "description": "Solar battery storage system, 5kWh lithium-ion. Wall-mounted. Stores daytime solar energy for nighttime use.",
        "category": "Solar Energy",
        "price_usd": 650.00,
        "stock_quantity": 10,
        "image_url": _img("Bateria+Solar+5kWh"),
    },
    {
        "sku": "SE-BAT-002",
        "name": "Sistema de Bateria Solar 10kWh",
        "description": "Solar battery storage system, 10kWh lithium-ion. Powers an entire household overnight. Expandable.",
        "category": "Solar Energy",
        "price_usd": 1200.00,
        "stock_quantity": 8,
        "image_url": _img("Bateria+Solar+10kWh"),
    },
    {
        "sku": "SE-INV-001",
        "name": "Inversor Solar 3kW",
        "description": "Solar inverter, 3kW pure sine wave. Converts DC solar power to AC household electricity. LCD display with monitoring.",
        "category": "Solar Energy",
        "price_usd": 320.00,
        "stock_quantity": 18,
        "image_url": _img("Inversor+Solar+3kW"),
    },
    {
        "sku": "SE-INV-002",
        "name": "Inversor Solar 5kW",
        "description": "Solar inverter, 5kW pure sine wave. For larger installations. Supports battery charging and grid-tie capability.",
        "category": "Solar Energy",
        "price_usd": 480.00,
        "stock_quantity": 12,
        "image_url": _img("Inversor+Solar+5kW"),
    },
    {
        "sku": "SE-PWB-001",
        "name": "Power Bank Solar 20,000mAh",
        "description": "Solar power bank, 20,000mAh. Dual USB output, built-in solar panel for emergency recharging. Waterproof.",
        "category": "Solar Energy",
        "price_usd": 25.00,
        "stock_quantity": 60,
        "image_url": _img("PowerBank+Solar+20K"),
    },
    {
        "sku": "SE-PWB-002",
        "name": "Power Bank Solar 50,000mAh",
        "description": "High-capacity solar power bank, 50,000mAh. Charges laptops, tablets, and phones. Built-in LED flashlight.",
        "category": "Solar Energy",
        "price_usd": 45.00,
        "stock_quantity": 40,
        "image_url": _img("PowerBank+Solar+50K"),
    },
    {
        "sku": "SE-FLD-001",
        "name": "Kit Solar Plegable 60W",
        "description": "Foldable solar charging kit, 60W. Lightweight, portable, with USB-A/C outputs. Perfect for travel and emergency power.",
        "category": "Solar Energy",
        "price_usd": 55.00,
        "stock_quantity": 35,
        "image_url": _img("Solar+Plegable+60W"),
    },
    {
        "sku": "SE-FLD-002",
        "name": "Kit Solar Plegable 120W",
        "description": "Foldable solar charging kit, 120W. Higher output with MC4 connector. Charges battery stations and 12V systems.",
        "category": "Solar Energy",
        "price_usd": 95.00,
        "stock_quantity": 25,
        "image_url": _img("Solar+Plegable+120W"),
    },
    {
        "sku": "SE-BDL-001",
        "name": "Kit Solar Basico para Hogar",
        "description": "Basic solar home kit: 2 × 200W panels, 3kW inverter, 5kWh battery. Powers lights, phone charging, fans, and a small fridge.",
        "category": "Solar Energy",
        "price_usd": 950.00,
        "stock_quantity": 10,
        "image_url": _img("Kit+Solar+Hogar"),
    },
    {
        "sku": "SE-BDL-002",
        "name": "Kit de Iluminacion Solar",
        "description": "Solar lighting kit: 1 × 100W panel, compact battery, and 4 LED light bulbs with wiring. Lights an entire household.",
        "category": "Solar Energy",
        "price_usd": 180.00,
        "stock_quantity": 20,
        "image_url": _img("Kit+Iluminacion+Solar"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  10. DIESEL & FUEL SUPPLY  (10 products)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "DF-DSL-001",
        "name": "Diesel 5L Contenedor",
        "description": "Diesel fuel, 5-liter sealed container. For generators, vehicles, and farm equipment.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 12.00,
        "stock_quantity": 80,
        "image_url": _img("Diesel+5L"),
    },
    {
        "sku": "DF-DSL-002",
        "name": "Diesel 20L Contenedor",
        "description": "Diesel fuel, 20-liter jerry can. Standard size for generators and backup fuel storage.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 42.00,
        "stock_quantity": 50,
        "image_url": _img("Diesel+20L"),
    },
    {
        "sku": "DF-DSL-003",
        "name": "Diesel 50L Barril",
        "description": "Diesel fuel, 50-liter drum. For extended generator operation and commercial use.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 95.00,
        "stock_quantity": 25,
        "image_url": _img("Diesel+50L"),
    },
    {
        "sku": "DF-STR-001",
        "name": "Barril de Almacenamiento 200L",
        "description": "Fuel storage barrel, 200L steel drum. For long-term diesel storage. Includes bung fittings.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 65.00,
        "stock_quantity": 15,
        "image_url": _img("Barril+200L"),
    },
    {
        "sku": "DF-GEN-001",
        "name": "Generador Diesel 3.5kW",
        "description": "Diesel generator, 3.5kW output. Compact and quiet. Powers lights, fans, fridge, and phone charging.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 450.00,
        "stock_quantity": 12,
        "image_url": _img("Generador+3.5kW"),
    },
    {
        "sku": "DF-GEN-002",
        "name": "Generador Diesel 7kW",
        "description": "Diesel generator, 7kW output. Powers an entire household including air conditioning. Low fuel consumption.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 850.00,
        "stock_quantity": 8,
        "image_url": _img("Generador+7kW"),
    },
    {
        "sku": "DF-GEN-003",
        "name": "Generador Portatil Gasolina 2kW",
        "description": "Portable gasoline generator, 2kW. Lightweight and easy to transport. For emergency backup and outdoor use.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 280.00,
        "stock_quantity": 20,
        "image_url": _img("Generador+Portatil+2kW"),
    },
    {
        "sku": "DF-PMP-001",
        "name": "Bomba de Combustible Manual",
        "description": "Manual fuel transfer pump with hose. For safely transferring diesel from storage drums to generators.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 18.00,
        "stock_quantity": 40,
        "image_url": _img("Bomba+Combustible"),
    },
    {
        "sku": "DF-BDL-001",
        "name": "Kit Generador + Combustible Inicial",
        "description": "Starter bundle: 3.5kW diesel generator + 20L diesel + manual fuel pump. Everything to start generating power.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 490.00,
        "stock_quantity": 10,
        "image_url": _img("Kit+Generador+Inicio"),
    },
    {
        "sku": "DF-BDL-002",
        "name": "Kit Energia para Finca",
        "description": "Farm power bundle: 7kW diesel generator + 200L fuel storage barrel + fuel pump. Reliable power for agriculture.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 950.00,
        "stock_quantity": 5,
        "image_url": _img("Kit+Finca+Energia"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  11. BATTERY & ENERGY STORAGE  (7 products)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "BS-LIT-001",
        "name": "Bateria de Litio 100Ah 12V",
        "description": "Lithium iron phosphate (LiFePO4) battery, 100Ah 12V. 3000+ cycle life. Lightweight, maintenance-free.",
        "category": "Battery & Energy Storage",
        "price_usd": 320.00,
        "stock_quantity": 15,
        "image_url": _img("Bateria+Litio+100Ah"),
    },
    {
        "sku": "BS-LIT-002",
        "name": "Bateria de Litio 200Ah 12V",
        "description": "Lithium iron phosphate battery, 200Ah 12V. Double capacity for extended off-grid use. Built-in BMS protection.",
        "category": "Battery & Energy Storage",
        "price_usd": 580.00,
        "stock_quantity": 10,
        "image_url": _img("Bateria+Litio+200Ah"),
    },
    {
        "sku": "BS-LED-001",
        "name": "Bateria Ciclo Profundo (Plomo) 100Ah 12V",
        "description": "Deep-cycle lead-acid battery, 100Ah 12V. Reliable and affordable energy storage for solar systems.",
        "category": "Battery & Energy Storage",
        "price_usd": 120.00,
        "stock_quantity": 25,
        "image_url": _img("Bateria+Plomo+100Ah"),
    },
    {
        "sku": "BS-LED-002",
        "name": "Bateria Ciclo Profundo (Plomo) 200Ah 12V",
        "description": "Deep-cycle lead-acid battery, 200Ah 12V. Heavy-duty storage for larger solar installations.",
        "category": "Battery & Energy Storage",
        "price_usd": 210.00,
        "stock_quantity": 15,
        "image_url": _img("Bateria+Plomo+200Ah"),
    },
    {
        "sku": "BS-PPS-001",
        "name": "Estacion de Energia Portatil 500Wh",
        "description": "Portable power station, 500Wh. AC/DC/USB outputs. Rechargeable via solar, wall, or car charger. Silent alternative to generators.",
        "category": "Battery & Energy Storage",
        "price_usd": 350.00,
        "stock_quantity": 20,
        "image_url": _img("Estacion+500Wh"),
    },
    {
        "sku": "BS-PPS-002",
        "name": "Estacion de Energia Portatil 1500Wh",
        "description": "High-capacity portable power station, 1500Wh. Powers fridges, tools, and medical equipment. Multiple charging inputs.",
        "category": "Battery & Energy Storage",
        "price_usd": 750.00,
        "stock_quantity": 12,
        "image_url": _img("Estacion+1500Wh"),
    },
    {
        "sku": "BS-SBK-001",
        "name": "Banco de Baterias Solar 2.4kWh",
        "description": "Solar battery bank, 2.4kWh (2 × 100Ah 12V lithium). Pre-wired with charge controller. Plug-and-play.",
        "category": "Battery & Energy Storage",
        "price_usd": 550.00,
        "stock_quantity": 10,
        "image_url": _img("Banco+Baterias+2.4kWh"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  12. MICRO-GRID & HOME ENERGY  (6 products)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "MG-OGK-001",
        "name": "Kit Solar Off-Grid Completo 3kW",
        "description": "Full off-grid solar kit: 6 × 550W panels, 5kW inverter, 10kWh battery bank, mounting hardware. Powers an entire home.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 3500.00,
        "stock_quantity": 5,
        "image_url": _img("Kit+OffGrid+3kW"),
    },
    {
        "sku": "MG-OGK-002",
        "name": "Kit Solar Off-Grid Completo 5kW",
        "description": "Premium off-grid solar kit: 10 × 550W panels, 8kW inverter, 20kWh battery. For larger homes and small businesses.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 5800.00,
        "stock_quantity": 3,
        "image_url": _img("Kit+OffGrid+5kW"),
    },
    {
        "sku": "MG-HYB-001",
        "name": "Sistema Hibrido Solar + Generador",
        "description": "Hybrid power system: 2kW solar array, 5kWh battery, 3.5kW diesel generator with automatic transfer switch.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 2800.00,
        "stock_quantity": 5,
        "image_url": _img("Hibrido+Solar+Gen"),
    },
    {
        "sku": "MG-HYB-002",
        "name": "Sistema Hibrido Solar + Generador Premium",
        "description": "Premium hybrid: 5kW solar, 15kWh battery, 7kW diesel generator, smart controller. Full energy independence.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 5200.00,
        "stock_quantity": 3,
        "image_url": _img("Hibrido+Premium"),
    },
    {
        "sku": "MG-CTR-001",
        "name": "Controlador Inteligente de Energia",
        "description": "Smart energy controller with LCD. Manages solar input, battery charging, generator auto-start, and load distribution. WiFi app.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 280.00,
        "stock_quantity": 15,
        "image_url": _img("Controlador+Smart"),
    },
    {
        "sku": "MG-PDB-001",
        "name": "Caja de Distribucion Electrica",
        "description": "Power distribution box with circuit breakers, surge protection, and metering. Distributes generated power to household circuits.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 120.00,
        "stock_quantity": 20,
        "image_url": _img("Caja+Distribucion"),
    },

    # ═══════════════════════════════════════════════════════════════
    #  13. ESSENTIAL BUNDLES  (8 products)
    # ═══════════════════════════════════════════════════════════════
    {
        "sku": "BX-FAM-001",
        "name": "Paquete Familiar Esencial",
        "description": "Essential Family Bundle: Rice 10kg, Black Beans 2.5kg, Spaghetti 500g, Flour 2kg, Cooking Oil 1L, Canned Tuna 3-Pack, Luncheon Meat 340g, Powdered Milk 800g. Feeds a family of 4 for two weeks.",
        "category": "Essential Bundles",
        "price_usd": 45.00,
        "stock_quantity": 100,
        "image_url": _img("Pack+Familiar"),
    },
    {
        "sku": "BX-PRO-001",
        "name": "Paquete de Proteinas",
        "description": "Protein Power Bundle: Canned Tuna 6-Pack, Canned Chicken 350g, Sardines 4-Pack, Luncheon Meat 3-Pack, Black Beans 2.5kg, Lentils 500g, Chickpeas 500g. High-protein essentials for active families.",
        "category": "Essential Bundles",
        "price_usd": 38.00,
        "stock_quantity": 80,
        "image_url": _img("Pack+Proteinas"),
    },
    {
        "sku": "BX-BEB-001",
        "name": "Paquete de Bebidas Tropicales",
        "description": "Tropical Drinks Bundle: Mango Juice 3-Pack, Guava Juice 3-Pack, Coconut Water 6-Pack, Passion Fruit Juice 3-Pack, Soursop Juice 3-Pack. A refreshing Caribbean experience.",
        "category": "Essential Bundles",
        "price_usd": 32.00,
        "stock_quantity": 60,
        "image_url": _img("Pack+Bebidas"),
    },
    {
        "sku": "BX-CAF-001",
        "name": "Paquete Cafetalero Cubano",
        "description": "Cuban Coffee Lovers Bundle: Cubita Dark 500g, Serrano Whole Bean 500g, Turquino Mountain 250g, Espresso Blend 250g. Four legendary Cuban coffees in one pack.",
        "category": "Essential Bundles",
        "price_usd": 35.00,
        "stock_quantity": 70,
        "image_url": _img("Pack+Cafe"),
    },
    {
        "sku": "BX-FRU-001",
        "name": "Paquete de Frutas Frescas",
        "description": "Fresh Tropical Fruits Bundle: Avocados (3), Mangoes (4), Plantains (6), Papaya (1), Guavas (6), Coconuts (2). Farm-fresh Caribbean tropical selection.",
        "category": "Essential Bundles",
        "price_usd": 28.00,
        "stock_quantity": 40,
        "image_url": _img("Pack+Frutas"),
    },
    {
        "sku": "BX-SOL-001",
        "name": "Paquete Solar Basico",
        "description": "Basic Solar Starter Bundle: 100W Portable Solar Panel, Solar Power Bank 20,000mAh, LED Lighting Kit (6 bulbs), Multi-Port USB Charger. Get started with solar energy.",
        "category": "Essential Bundles",
        "price_usd": 220.00,
        "stock_quantity": 15,
        "image_url": _img("Pack+Solar"),
    },
    {
        "sku": "BX-DES-001",
        "name": "Paquete Despensa Completa",
        "description": "Complete Pantry Bundle: Rice 10kg, Black Beans 2.5kg, Red Beans 1kg, Pasta 500g, Flour 5kg, Cornmeal 2.5kg, Oats 500g, Powdered Milk 2.5kg, Condensed Milk 3-Pack, Cooking Oil 2L. Stocks a full pantry.",
        "category": "Essential Bundles",
        "price_usd": 65.00,
        "stock_quantity": 50,
        "image_url": _img("Pack+Despensa"),
    },
    {
        "sku": "BX-BLK-001",
        "name": "Mega Paquete Todo Incluido",
        "description": "All-In-One Mega Bundle: Rice, Beans, Pasta, Flour, Canned Meats, Fresh Fruits, Coffee, Powdered Milk, Juices, and LED Lights. The ultimate care package — everything a household needs.",
        "category": "Essential Bundles",
        "price_usd": 120.00,
        "stock_quantity": 30,
        "image_url": _img("Mega+Pack"),
    },
]


async def seed():
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

        # Upsert products — add any missing ones by SKU
        result = await session.execute(select(Product.sku))
        existing_skus = {row[0] for row in result.all() if row[0]}

        new_products = []
        for p_data in PRODUCTS:
            if p_data["sku"] not in existing_skus:
                product = Product(**p_data)
                session.add(product)
                new_products.append((product, p_data["stock_quantity"]))

        if new_products:
            await session.flush()
            for product, qty in new_products:
                session.add(Inventory(
                    product_id=product.id,
                    available_qty=qty,
                ))
            print(f"Added {len(new_products)} new products + inventory records")
        else:
            print(f"All {len(PRODUCTS)} products already exist")

        await session.commit()
    print("Seed complete.")


if __name__ == "__main__":
    async def _run():
        await create_tables()
        await seed()
    asyncio.run(_run())
