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
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=400&fit=crop&auto=format&q=80",
        "is_featured": True,
    },
    {
        "sku": "GC-RIC-002",
        "name": "Arroz Blanco Premium 10kg",
        "description": "Long-grain white rice, 10kg bulk bag. Best value for larger families. Cuban kitchen staple for all rice-based dishes.",
        "category": "Grains & Carbohydrates",
        "price_usd": 11.50,
        "stock_quantity": 120,
        "image_url": "https://images.unsplash.com/photo-1704916029542-da6fa7bc34e7?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "GC-PAS-001",
        "name": "Pasta Espagueti 500g",
        "description": "Classic spaghetti pasta, 500g pack. Quick, versatile meal base for the whole family.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.00,
        "stock_quantity": 250,
        "image_url": "https://images.unsplash.com/photo-1551462147-37885acc36f1?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "GC-PAS-002",
        "name": "Pasta Macarrones 500g",
        "description": "Elbow macaroni pasta, 500g. Great for soups, baked pasta dishes, and Cuban-style macaroni salad.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.00,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "GC-FLR-001",
        "name": "Harina de Trigo Multiuso 2kg",
        "description": "All-purpose wheat flour, 2kg bag. For croquetas, empanadas, buñuelos, frituras, and everyday baking.",
        "category": "Grains & Carbohydrates",
        "price_usd": 3.75,
        "stock_quantity": 150,
        "image_url": "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "GC-FLR-002",
        "name": "Harina de Trigo Multiuso 5kg",
        "description": "All-purpose wheat flour, 5kg bulk bag. Economical size for families who bake frequently.",
        "category": "Grains & Carbohydrates",
        "price_usd": 7.50,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1627735483792-233bf632619b?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "GC-CRM-001",
        "name": "Harina de Maiz 1kg",
        "description": "Fine cornmeal, 1kg. Essential for tamales, polenta, harina de maíz con leche, and traditional corn-based dishes.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.50,
        "stock_quantity": 180,
        "image_url": "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "GC-CRM-002",
        "name": "Harina de Maiz 2.5kg",
        "description": "Fine cornmeal, 2.5kg bag. Larger size for households that regularly prepare tamales and corn recipes.",
        "category": "Grains & Carbohydrates",
        "price_usd": 5.00,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1685884626675-19a87a3897d0?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "GC-CSF-001",
        "name": "Harina de Yuca 1kg",
        "description": "Cassava flour (harina de yuca), 1kg. Gluten-free staple for Caribbean baking, casabe flatbread, and thickening stews.",
        "category": "Grains & Carbohydrates",
        "price_usd": 3.25,
        "stock_quantity": 130,
        "image_url": "https://images.unsplash.com/photo-1760727466909-a73872aeecda?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "GC-BRF-001",
        "name": "Harina de Pan 2kg",
        "description": "Bread flour (high-gluten), 2kg bag. Ideal for Cuban bread, pan de agua, and homemade rolls with a perfect chewy crust.",
        "category": "Grains & Carbohydrates",
        "price_usd": 4.25,
        "stock_quantity": 110,
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop&auto=format&q=80",
    },
    # +3 new grains
    {
        "sku": "GC-AVN-001",
        "name": "Avena en Hojuelas 500g",
        "description": "Rolled oats, 500g. Nutritious breakfast cereal, also great for baking, smoothies, and homemade granola bars.",
        "category": "Grains & Carbohydrates",
        "price_usd": 2.75,
        "stock_quantity": 160,
        "image_url": "https://images.unsplash.com/photo-1614961233913-a5113e3d6b48?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "GC-PLN-001",
        "name": "Harina de Platano 500g",
        "description": "Plantain flour, 500g. Traditional Caribbean cooking flour made from dried green plantains. For fufu, porridge, and baking.",
        "category": "Grains & Carbohydrates",
        "price_usd": 3.50,
        "stock_quantity": 120,
        "image_url": "https://images.unsplash.com/photo-1577116730797-5d99b71d3946?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "GC-SEM-001",
        "name": "Semolina de Trigo 1kg",
        "description": "Wheat semolina, 1kg. For fresh pasta, couscous, puddings, and traditional Caribbean desserts.",
        "category": "Grains & Carbohydrates",
        "price_usd": 3.00,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1570388873891-8fad79ab5b3d?w=600&h=400&fit=crop&auto=format&q=80",
        "is_featured": True,
    },
    {
        "sku": "BL-BLK-002",
        "name": "Frijoles Negros Secos 2.5kg",
        "description": "Dried black beans, 2.5kg bulk bag. Best value for families who cook beans daily.",
        "category": "Beans & Legumes",
        "price_usd": 7.00,
        "stock_quantity": 140,
        "image_url": "https://images.unsplash.com/photo-1647545401750-6dd5539879ac?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BL-RED-001",
        "name": "Frijoles Colorados Secos 1kg",
        "description": "Dried red kidney beans, 1kg. Popular in potaje de frijoles colorados, soups, and stews. Rich in fiber and iron.",
        "category": "Beans & Legumes",
        "price_usd": 3.50,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1584542285514-14e6663f41d9?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BL-LNT-001",
        "name": "Lentejas Secas 500g",
        "description": "Dried green/brown lentils, 500g. Fast-cooking legume rich in protein and iron. Great for soups and side dishes.",
        "category": "Beans & Legumes",
        "price_usd": 2.50,
        "stock_quantity": 180,
        "image_url": "https://images.unsplash.com/photo-1662558743513-073896b802ef?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BL-CHK-001",
        "name": "Garbanzos Secos 500g",
        "description": "Dried chickpeas (garbanzos), 500g. Versatile legume for stews, salads, hummus, and potaje de garbanzos.",
        "category": "Beans & Legumes",
        "price_usd": 2.75,
        "stock_quantity": 160,
        "image_url": "https://images.unsplash.com/photo-1709229851054-a09c8f7bd7e3?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BL-SPL-001",
        "name": "Chicharos Partidos 500g",
        "description": "Dried split peas, 500g. Classic for thick, hearty soups. Cooks fast, high in fiber and protein.",
        "category": "Beans & Legumes",
        "price_usd": 2.25,
        "stock_quantity": 170,
        "image_url": "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1683295549596-00f7547bf6a8?w=600&h=400&fit=crop&auto=format&q=80",
        "is_featured": True,
    },
    {
        "sku": "CN-TUN-002",
        "name": "Atun en Agua 150g (6-Pack)",
        "description": "Canned tuna in water, 6 × 150g tins. Lean protein bulk pack. Long shelf life, ships easily.",
        "category": "Canned & Preserved Foods",
        "price_usd": 9.00,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1672529276739-c462c62d2113?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "CN-SAR-001",
        "name": "Sardinas en Aceite 125g (4-Pack)",
        "description": "Canned sardines in oil, 4 × 125g tins. Rich in omega-3 and calcium. A Cuban pantry staple that stores for years.",
        "category": "Canned & Preserved Foods",
        "price_usd": 5.50,
        "stock_quantity": 150,
        "image_url": "https://images.unsplash.com/photo-1653174577821-9ab410d92d44?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "CN-CHK-001",
        "name": "Pollo en Conserva 350g",
        "description": "Canned chicken breast in broth, 350g. Ready-to-eat protein for sandwiches, rice dishes, and quick meals.",
        "category": "Canned & Preserved Foods",
        "price_usd": 4.50,
        "stock_quantity": 130,
        "image_url": "https://images.unsplash.com/photo-1623552600370-69433ec7ce45?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "CN-VEG-001",
        "name": "Vegetales Mixtos en Conserva 400g",
        "description": "Canned mixed vegetables (corn, peas, carrots), 400g. Convenient side dish, great addition to soups and rice.",
        "category": "Canned & Preserved Foods",
        "price_usd": 2.75,
        "stock_quantity": 200,
        "image_url": "https://images.unsplash.com/photo-1690052694621-3a947e346a2b?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "CN-SPM-001",
        "name": "Carne de Almuerzo Tipo Spam 340g",
        "description": "Luncheon meat (Spam-style), 340g can. Versatile canned protein — fry, slice for sandwiches, or add to rice dishes. Extremely popular in Cuba.",
        "category": "Canned & Preserved Foods",
        "price_usd": 4.00,
        "stock_quantity": 170,
        "image_url": "https://images.unsplash.com/photo-1760926548218-086f0f60e778?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "CN-SPM-002",
        "name": "Carne de Almuerzo Tipo Spam 340g (3-Pack)",
        "description": "Luncheon meat 3-pack, 3 × 340g cans. Bulk buy savings on one of Cuba's most requested canned goods.",
        "category": "Canned & Preserved Foods",
        "price_usd": 10.50,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1741651402309-b9ae6225a24f?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "FP-AVO-002",
        "name": "Aguacate Cubano Fresco (6 unidades)",
        "description": "Fresh Cuban avocados, box of 6. Double pack of our signature avocados — perfect for families. Farm-to-door freshness.",
        "category": "Fresh Produce",
        "price_usd": 8.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1590477331710-b60b921c0c7f?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "FP-AVO-003",
        "name": "Aguacate Mamey (3 unidades)",
        "description": "Mamey avocados, pack of 3. Larger Caribbean variety with buttery, nutty flavor. Excellent for guacamole and salads.",
        "category": "Fresh Produce",
        "price_usd": 5.50,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1632671074687-846c61c4eb22?w=600&h=400&fit=crop&auto=format&q=80",
    },
    # Plantains
    {
        "sku": "FP-PLT-001",
        "name": "Platanos Maduros (6 unidades)",
        "description": "Ripe plantains, bundle of 6. Sweet and versatile — fry into maduros, bake, or mash. Domestic delivery only.",
        "category": "Fresh Produce",
        "price_usd": 3.50,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "FP-PLT-002",
        "name": "Platanos Verdes (6 unidades)",
        "description": "Green plantains, bundle of 6. For tostones, fufu de plátano, and chips. A daily Cuban cooking staple.",
        "category": "Fresh Produce",
        "price_usd": 3.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1590351029408-2cad4e18bab7?w=600&h=400&fit=crop&auto=format&q=80",
    },
    # Root vegetables
    {
        "sku": "FP-BON-001",
        "name": "Boniato (Sweet Potato) 2kg",
        "description": "Cuban white sweet potato (boniato), 2kg. Milder and drier than orange varieties. Boil, fry, or bake. Locally sourced.",
        "category": "Fresh Produce",
        "price_usd": 3.25,
        "stock_quantity": 70,
        "image_url": "https://images.unsplash.com/photo-1596097635092-6e413e1c8908?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "FP-YUC-001",
        "name": "Yuca Fresca 2kg",
        "description": "Fresh cassava (yuca), 2kg. Staple Caribbean root vegetable. Boil with garlic mojo sauce for a classic Cuban side dish.",
        "category": "Fresh Produce",
        "price_usd": 3.50,
        "stock_quantity": 65,
        "image_url": "https://images.unsplash.com/photo-1598512752271-33f913a5af13?w=600&h=400&fit=crop&auto=format&q=80",
    },
    # +4 new tropical fruits
    {
        "sku": "FP-MNG-001",
        "name": "Mangos Frescos (4 unidades)",
        "description": "Fresh tropical mangos, pack of 4. Sweet, juicy, and fragrant. Eaten fresh, in batidos, or as dessert.",
        "category": "Fresh Produce",
        "price_usd": 4.00,
        "stock_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "FP-PAP-001",
        "name": "Papaya Fresca (1 unidad grande)",
        "description": "Fresh papaya, 1 large fruit (~1.5kg). Tropical sweetness rich in vitamins A and C. Eat fresh or blend into smoothies.",
        "category": "Fresh Produce",
        "price_usd": 3.50,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "FP-GUA-001",
        "name": "Guayabas Frescas (6 unidades)",
        "description": "Fresh guavas, pack of 6. Intensely aromatic and sweet. For eating fresh, guava paste, or juicing.",
        "category": "Fresh Produce",
        "price_usd": 3.75,
        "stock_quantity": 55,
        "image_url": "https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "FP-COC-001",
        "name": "Coco Fresco (2 unidades)",
        "description": "Fresh coconuts, pack of 2. Crack open for coconut water, scrape the meat for cooking, or grate for desserts.",
        "category": "Fresh Produce",
        "price_usd": 4.00,
        "stock_quantity": 45,
        "image_url": "https://images.unsplash.com/photo-1532062368888-6df40e6ccc88?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "FP-GBN-001",
        "name": "Guanabana Fresca (1 unidad)",
        "description": "Fresh soursop (guanábana), 1 large fruit. Creamy white flesh with tropical sweet-tart flavor. Popular for juices and batidos.",
        "category": "Fresh Produce",
        "price_usd": 5.00,
        "stock_quantity": 35,
        "image_url": "https://images.unsplash.com/photo-1631815333087-9ccf8fa82166?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "FP-CIR-001",
        "name": "Ciruelas Tropicales (500g)",
        "description": "Tropical plums (ciruelas), 500g bag. Small, tangy-sweet fruits. A popular snack across Cuba and the Caribbean.",
        "category": "Fresh Produce",
        "price_usd": 3.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1695131864926-f905bef01977?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1565273975703-c096791fd3ad?w=600&h=400&fit=crop&auto=format&q=80",
        "is_featured": True,
    },
    {
        "sku": "CB-CUB-002",
        "name": "Cafe Cubita Molido Oscuro 500g",
        "description": "Cubita brand dark roast ground coffee, 500g. Double-size pack of Cuba's most iconic export coffee.",
        "category": "Coffee & Beverages",
        "price_usd": 11.50,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1626523573013-fab070962a90?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "CB-CUB-003",
        "name": "Cafe Cubita Molido Medio 250g",
        "description": "Cubita brand medium roast ground coffee, 250g. Smoother, balanced profile with chocolate and caramel notes. Less bitter than dark roast.",
        "category": "Coffee & Beverages",
        "price_usd": 6.50,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1649780563985-ff945be65785?w=600&h=400&fit=crop&auto=format&q=80",
    },
    # Serrano brand
    {
        "sku": "CB-SER-001",
        "name": "Cafe Serrano Molido Oscuro 250g",
        "description": "Serrano dark roast ground coffee, 250g. Premium mountain-grown beans from Santiago de Cuba. Rich, full-bodied flavor.",
        "category": "Coffee & Beverages",
        "price_usd": 7.00,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1587734195342-39d4b9b2ff05?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "CB-SER-002",
        "name": "Cafe Serrano Grano Entero 500g",
        "description": "Serrano whole bean coffee, 500g. Grind at home for maximum freshness. Premium Sierra Maestra mountain-grown.",
        "category": "Coffee & Beverages",
        "price_usd": 13.00,
        "stock_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1627436381099-72af9692894f?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "CB-SER-003",
        "name": "Cafe Serrano Molido Suave 250g",
        "description": "Serrano light roast ground coffee, 250g. Delicate, bright acidity with floral notes. For pour-over and drip brewing.",
        "category": "Coffee & Beverages",
        "price_usd": 7.00,
        "stock_quantity": 70,
        "image_url": "https://images.unsplash.com/photo-1652568699339-a03bff9f630f?w=600&h=400&fit=crop&auto=format&q=80",
    },
    # Turquino brand
    {
        "sku": "CB-TUR-001",
        "name": "Cafe Turquino Montanes 250g",
        "description": "Turquino mountain coffee, 250g ground. Single-origin from Cuba's highest peak region. Smooth, earthy, with hints of tobacco and dark chocolate.",
        "category": "Coffee & Beverages",
        "price_usd": 8.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1649777888193-e47833d91521?w=600&h=400&fit=crop&auto=format&q=80",
    },
    # Blends & specialty
    {
        "sku": "CB-BLD-001",
        "name": "Cafe Mezcla Cubana (Espresso Blend) 250g",
        "description": "Cuban espresso blend, 250g ground. Traditional blend optimized for moka pot and espresso. Produces the perfect crema for cafecito cubano.",
        "category": "Coffee & Beverages",
        "price_usd": 6.00,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1606102906144-96b3c8d73719?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "CB-BLD-002",
        "name": "Cafe Descafeinado Molido 250g",
        "description": "Decaffeinated ground coffee, 250g. Full Cuban coffee flavor without the caffeine. Swiss water processed for purity.",
        "category": "Coffee & Beverages",
        "price_usd": 7.50,
        "stock_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1559629720-61aac91b0b77?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "CB-INS-001",
        "name": "Cafe Instantaneo 200g",
        "description": "Instant coffee, 200g jar. Quick and convenient. Just add hot water for an immediate cup of coffee anywhere.",
        "category": "Coffee & Beverages",
        "price_usd": 5.00,
        "stock_quantity": 110,
        "image_url": "https://images.unsplash.com/photo-1661877044098-eb9b894e4506?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&h=400&fit=crop&auto=format&q=80",
        "is_featured": True,
    },
    {
        "sku": "DM-PWM-002",
        "name": "Leche en Polvo Entera 2.5kg",
        "description": "Whole powdered milk, 2.5kg bag. Bulk family size. Long shelf life, no refrigeration needed until reconstituted.",
        "category": "Dairy & Milk",
        "price_usd": 22.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1704650311140-aba27da8623d?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DM-SKM-001",
        "name": "Leche en Polvo Descremada 800g",
        "description": "Skim powdered milk, 800g tin. Low-fat option. Makes ~6 liters. Great for baking and cooking when whole milk isn't needed.",
        "category": "Dairy & Milk",
        "price_usd": 7.50,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1662106324078-50ae25130065?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DM-CON-001",
        "name": "Leche Condensada 395g",
        "description": "Sweetened condensed milk, 395g can. For desserts, Cuban flan, natilla, and sweetening coffee.",
        "category": "Dairy & Milk",
        "price_usd": 3.50,
        "stock_quantity": 150,
        "image_url": "https://images.unsplash.com/photo-1618426703715-2815f841b680?w=600&h=400&fit=crop&auto=format&q=80",
        "is_featured": True,
    },
    {
        "sku": "DM-CON-002",
        "name": "Leche Condensada 395g (3-Pack)",
        "description": "Sweetened condensed milk, 3 × 395g cans. Bulk pack for baking and daily coffee use.",
        "category": "Dairy & Milk",
        "price_usd": 9.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1739886446818-93bc4ace12a5?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DM-EVP-001",
        "name": "Leche Evaporada 370g",
        "description": "Evaporated milk, 370g can. Unsweetened, creamy. Use in coffee, sauces, soups, and tres leches cake.",
        "category": "Dairy & Milk",
        "price_usd": 2.50,
        "stock_quantity": 130,
        "image_url": "https://images.unsplash.com/photo-1716483758486-47c7ec801677?w=600&h=400&fit=crop&auto=format&q=80",
        "is_featured": True,
    },
    {
        "sku": "DM-CRM-001",
        "name": "Crema de Leche UHT 200ml (3-Pack)",
        "description": "UHT cream, 3 × 200ml. Shelf-stable heavy cream for cooking, sauces, and desserts. No refrigeration until opened.",
        "category": "Dairy & Milk",
        "price_usd": 5.00,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1698943510650-9232c98a5328?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1764403714198-f10e8e4039d0?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "JP-PAP-001",
        "name": "Jugo de Papaya 1L (3-Pack)",
        "description": "Papaya juice, 3 × 1L cartons. Smooth, tropical sweetness packed with digestive enzymes and vitamins.",
        "category": "Juice Packs",
        "price_usd": 6.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1760533536165-ddaf3c79b814?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "JP-GUA-001",
        "name": "Jugo de Guayaba 1L (3-Pack)",
        "description": "Guava juice, 3 × 1L cartons. Intensely aromatic, pink-hued Caribbean classic. Rich in vitamin C.",
        "category": "Juice Packs",
        "price_usd": 6.00,
        "stock_quantity": 85,
        "image_url": "https://images.unsplash.com/photo-1718942900907-06790d4a852c?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "JP-COC-001",
        "name": "Agua de Coco 330ml (6-Pack)",
        "description": "Pure coconut water, 6 × 330ml cans. Natural electrolyte hydration straight from Caribbean coconuts. Refreshing and healthy.",
        "category": "Juice Packs",
        "price_usd": 7.00,
        "stock_quantity": 75,
        "image_url": "https://images.unsplash.com/photo-1629908011199-c57e22fe9207?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "JP-COC-002",
        "name": "Leche de Coco 400ml (3-Pack)",
        "description": "Coconut milk, 3 × 400ml cans. Rich, creamy. Essential for Caribbean cooking, curries, rice, and smoothies.",
        "category": "Juice Packs",
        "price_usd": 5.50,
        "stock_quantity": 90,
        "image_url": "https://images.unsplash.com/photo-1743947063655-30e3b4e07db7?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "JP-GBN-001",
        "name": "Jugo de Guanabana 1L (3-Pack)",
        "description": "Soursop (guanábana) juice, 3 × 1L cartons. Unique creamy-tart tropical flavor. Rich in antioxidants.",
        "category": "Juice Packs",
        "price_usd": 7.00,
        "stock_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1650547002496-e7ed9df4bf3c?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "JP-MIX-001",
        "name": "Pack Tropical Surtido (6 unidades)",
        "description": "Mixed tropical juice pack: 1L each of mango, guava, papaya, guanábana, coconut water, and passion fruit. Taste the Caribbean.",
        "category": "Juice Packs",
        "price_usd": 12.00,
        "stock_quantity": 45,
        "image_url": "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "JP-CIR-001",
        "name": "Jugo de Ciruela 1L (3-Pack)",
        "description": "Tropical plum juice, 3 × 1L cartons. Sweet-tart and refreshing. Made from Caribbean ciruelas.",
        "category": "Juice Packs",
        "price_usd": 5.50,
        "stock_quantity": 65,
        "image_url": "https://images.unsplash.com/photo-1697642452436-9c40773cbcbb?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "JP-PSN-001",
        "name": "Jugo de Maracuya 1L (3-Pack)",
        "description": "Passion fruit (maracuyá) juice, 3 × 1L cartons. Tangy, aromatic, and intensely tropical. A Cuban favorite.",
        "category": "Juice Packs",
        "price_usd": 6.50,
        "stock_quantity": 70,
        "image_url": "https://images.unsplash.com/photo-1764403726655-5b24a34df0cc?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1548243325-bf5b90ad929f?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "AE-FAN-001",
        "name": "Ventilador Solar DC 16\"",
        "description": "16-inch DC solar-compatible fan. Runs directly from 12V solar systems or batteries. Ultra-low power consumption, silent operation.",
        "category": "Appliances & Energy",
        "price_usd": 45.00,
        "stock_quantity": 30,
        "image_url": "https://images.unsplash.com/photo-1576503963299-fcd31822b523?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "AE-FAN-002",
        "name": "Ventilador de Techo Solar DC 52\"",
        "description": "52-inch DC ceiling fan with remote. Designed for off-grid homes. Runs on 12V/24V solar systems. Cools large rooms efficiently.",
        "category": "Appliances & Energy",
        "price_usd": 85.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1555470100-1728256970aa?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "AE-REF-001",
        "name": "Mini Refrigerador 12V/DC 50L",
        "description": "DC-powered mini fridge, 50L. Designed for solar and battery systems. Low energy consumption (45W). Keeps food fresh off-grid.",
        "category": "Appliances & Energy",
        "price_usd": 160.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1655776012241-0729290d1e11?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "AE-REF-002",
        "name": "Refrigerador Solar DC 100L",
        "description": "Solar DC refrigerator, 100L with small freezer. Runs on 12V/24V systems. Designed for tropical climates and off-grid living.",
        "category": "Appliances & Energy",
        "price_usd": 320.00,
        "stock_quantity": 8,
        "image_url": "https://images.unsplash.com/photo-1589557944589-c1d0eaabc88e?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "AE-LED-001",
        "name": "Kit Iluminacion LED Solar (6 bombillas)",
        "description": "Solar LED lighting kit: 6 × 5W LED bulbs with 12V wiring harness. Plug-and-play with any solar system. Lights an entire home.",
        "category": "Appliances & Energy",
        "price_usd": 28.00,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1601260483544-72824cd8634d?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "AE-CHG-001",
        "name": "Cargador Solar USB Multi-Puerto",
        "description": "Solar-compatible USB charging station. 4 USB ports + 2 USB-C. Runs on 12V DC. Charge phones, tablets, and devices off-grid.",
        "category": "Appliances & Energy",
        "price_usd": 15.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1581153691064-8d0ec09725b9?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1652326320478-38c1e9842e85?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-PNL-002",
        "name": "Panel Solar Portatil 200W",
        "description": "Portable monocrystalline solar panel, 200W. Higher output for fans, laptops, and small refrigerators.",
        "category": "Solar Energy",
        "price_usd": 160.00,
        "stock_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1652326291220-658ebcb8d223?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-PNL-003",
        "name": "Panel Solar Portatil 400W",
        "description": "High-output portable solar panel, 400W. Powers multiple devices simultaneously. Ideal for off-grid homes.",
        "category": "Solar Energy",
        "price_usd": 290.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1652326319476-d061f4cf7f28?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-RPM-001",
        "name": "Modulo Solar para Techo 300W",
        "description": "Rooftop solar panel module, 300W monocrystalline. Fixed-mount for permanent installation. 25-year performance warranty.",
        "category": "Solar Energy",
        "price_usd": 220.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1652326291289-f666da315e7b?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-RPM-002",
        "name": "Modulo Solar para Techo 550W",
        "description": "High-efficiency rooftop solar panel, 550W bifacial. Captures reflected light. Commercial-grade for maximum output.",
        "category": "Solar Energy",
        "price_usd": 380.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1652326320134-3571944c83b4?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-BAT-001",
        "name": "Sistema de Bateria Solar 5kWh",
        "description": "Solar battery storage system, 5kWh lithium-ion. Wall-mounted. Stores daytime solar energy for nighttime use.",
        "category": "Solar Energy",
        "price_usd": 650.00,
        "stock_quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1650866137641-4246da0f5f09?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-BAT-002",
        "name": "Sistema de Bateria Solar 10kWh",
        "description": "Solar battery storage system, 10kWh lithium-ion. Powers an entire household overnight. Expandable.",
        "category": "Solar Energy",
        "price_usd": 1200.00,
        "stock_quantity": 8,
        "image_url": "https://images.unsplash.com/photo-1650866156457-bb7c4afd54da?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-INV-001",
        "name": "Inversor Solar 3kW",
        "description": "Solar inverter, 3kW pure sine wave. Converts DC solar power to AC household electricity. LCD display with monitoring.",
        "category": "Solar Energy",
        "price_usd": 320.00,
        "stock_quantity": 18,
        "image_url": "https://images.unsplash.com/photo-1650865939539-583831ef0c00?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-INV-002",
        "name": "Inversor Solar 5kW",
        "description": "Solar inverter, 5kW pure sine wave. For larger installations. Supports battery charging and grid-tie capability.",
        "category": "Solar Energy",
        "price_usd": 480.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1650865940168-074387fb7d46?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-PWB-001",
        "name": "Power Bank Solar 20,000mAh",
        "description": "Solar power bank, 20,000mAh. Dual USB output, built-in solar panel for emergency recharging. Waterproof.",
        "category": "Solar Energy",
        "price_usd": 25.00,
        "stock_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1650866155994-3bd730b5daf9?w=600&h=400&fit=crop&auto=format&q=80",
        "is_featured": True,
    },
    {
        "sku": "SE-PWB-002",
        "name": "Power Bank Solar 50,000mAh",
        "description": "High-capacity solar power bank, 50,000mAh. Charges laptops, tablets, and phones. Built-in LED flashlight.",
        "category": "Solar Energy",
        "price_usd": 45.00,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1650866156027-f1f93931a967?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-FLD-001",
        "name": "Kit Solar Plegable 60W",
        "description": "Foldable solar charging kit, 60W. Lightweight, portable, with USB-A/C outputs. Perfect for travel and emergency power.",
        "category": "Solar Energy",
        "price_usd": 55.00,
        "stock_quantity": 35,
        "image_url": "https://images.unsplash.com/photo-1650865941929-38ba5754ba19?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-FLD-002",
        "name": "Kit Solar Plegable 120W",
        "description": "Foldable solar charging kit, 120W. Higher output with MC4 connector. Charges battery stations and 12V systems.",
        "category": "Solar Energy",
        "price_usd": 95.00,
        "stock_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1650865941863-98a671278203?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-BDL-001",
        "name": "Kit Solar Basico para Hogar",
        "description": "Basic solar home kit: 2 × 200W panels, 3kW inverter, 5kWh battery. Powers lights, phone charging, fans, and a small fridge.",
        "category": "Solar Energy",
        "price_usd": 950.00,
        "stock_quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1652326320285-0fd8bb355255?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "SE-BDL-002",
        "name": "Kit de Iluminacion Solar",
        "description": "Solar lighting kit: 1 × 100W panel, compact battery, and 4 LED light bulbs with wiring. Lights an entire household.",
        "category": "Solar Energy",
        "price_usd": 180.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1652326321057-d3f833c9fa7d?w=600&h=400&fit=crop&auto=format&q=80",
        "is_featured": True,
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
        "image_url": "https://images.unsplash.com/photo-1658260867231-535a1f7c98b9?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DF-DSL-002",
        "name": "Diesel 20L Contenedor",
        "description": "Diesel fuel, 20-liter jerry can. Standard size for generators and backup fuel storage.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 42.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1703095107789-d204fa7d2ad2?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DF-DSL-003",
        "name": "Diesel 50L Barril",
        "description": "Diesel fuel, 50-liter drum. For extended generator operation and commercial use.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 95.00,
        "stock_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1674655798804-b739c31b6cf5?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DF-STR-001",
        "name": "Barril de Almacenamiento 200L",
        "description": "Fuel storage barrel, 200L steel drum. For long-term diesel storage. Includes bung fittings.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 65.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1669300741021-bc29d2a63798?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DF-GEN-001",
        "name": "Generador Diesel 3.5kW",
        "description": "Diesel generator, 3.5kW output. Compact and quiet. Powers lights, fans, fridge, and phone charging.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 450.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1659958196981-0be9d1b7c446?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DF-GEN-002",
        "name": "Generador Diesel 7kW",
        "description": "Diesel generator, 7kW output. Powers an entire household including air conditioning. Low fuel consumption.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 850.00,
        "stock_quantity": 8,
        "image_url": "https://images.unsplash.com/photo-1589225925761-1f31d7ea5468?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DF-GEN-003",
        "name": "Generador Portatil Gasolina 2kW",
        "description": "Portable gasoline generator, 2kW. Lightweight and easy to transport. For emergency backup and outdoor use.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 280.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1699351301924-2d8180c4bd99?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DF-PMP-001",
        "name": "Bomba de Combustible Manual",
        "description": "Manual fuel transfer pump with hose. For safely transferring diesel from storage drums to generators.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 18.00,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1694095691445-f5d62c0f555e?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DF-BDL-001",
        "name": "Kit Generador + Combustible Inicial",
        "description": "Starter bundle: 3.5kW diesel generator + 20L diesel + manual fuel pump. Everything to start generating power.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 490.00,
        "stock_quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1705056561325-efbd3e68de53?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "DF-BDL-002",
        "name": "Kit Energia para Finca",
        "description": "Farm power bundle: 7kW diesel generator + 200L fuel storage barrel + fuel pump. Reliable power for agriculture.",
        "category": "Diesel & Fuel Supply",
        "price_usd": 950.00,
        "stock_quantity": 5,
        "image_url": "https://images.unsplash.com/photo-1759692071712-adc78a8516c8?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1676337167748-00b4e684322a?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BS-LIT-002",
        "name": "Bateria de Litio 200Ah 12V",
        "description": "Lithium iron phosphate battery, 200Ah 12V. Double capacity for extended off-grid use. Built-in BMS protection.",
        "category": "Battery & Energy Storage",
        "price_usd": 580.00,
        "stock_quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1628697550216-c4b824f3e22c?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BS-LED-001",
        "name": "Bateria Ciclo Profundo (Plomo) 100Ah 12V",
        "description": "Deep-cycle lead-acid battery, 100Ah 12V. Reliable and affordable energy storage for solar systems.",
        "category": "Battery & Energy Storage",
        "price_usd": 120.00,
        "stock_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1681263810102-ee12f623a5f3?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BS-LED-002",
        "name": "Bateria Ciclo Profundo (Plomo) 200Ah 12V",
        "description": "Deep-cycle lead-acid battery, 200Ah 12V. Heavy-duty storage for larger solar installations.",
        "category": "Battery & Energy Storage",
        "price_usd": 210.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1515594515116-863345d8507c?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BS-PPS-001",
        "name": "Estacion de Energia Portatil 500Wh",
        "description": "Portable power station, 500Wh. AC/DC/USB outputs. Rechargeable via solar, wall, or car charger. Silent alternative to generators.",
        "category": "Battery & Energy Storage",
        "price_usd": 350.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1732030373864-d37573915751?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BS-PPS-002",
        "name": "Estacion de Energia Portatil 1500Wh",
        "description": "High-capacity portable power station, 1500Wh. Powers fridges, tools, and medical equipment. Multiple charging inputs.",
        "category": "Battery & Energy Storage",
        "price_usd": 750.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1738851941850-c0fca601b398?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BS-SBK-001",
        "name": "Banco de Baterias Solar 2.4kWh",
        "description": "Solar battery bank, 2.4kWh (2 × 100Ah 12V lithium). Pre-wired with charge controller. Plug-and-play.",
        "category": "Battery & Energy Storage",
        "price_usd": 550.00,
        "stock_quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1561115867-be8460fbebfe?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1527971179697-13dce75dfbd0?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "MG-OGK-002",
        "name": "Kit Solar Off-Grid Completo 5kW",
        "description": "Premium off-grid solar kit: 10 × 550W panels, 8kW inverter, 20kWh battery. For larger homes and small businesses.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 5800.00,
        "stock_quantity": 3,
        "image_url": "https://images.unsplash.com/photo-1695736122218-0bd73e177484?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "MG-HYB-001",
        "name": "Sistema Hibrido Solar + Generador",
        "description": "Hybrid power system: 2kW solar array, 5kWh battery, 3.5kW diesel generator with automatic transfer switch.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 2800.00,
        "stock_quantity": 5,
        "image_url": "https://images.unsplash.com/photo-1687865014576-9ae3570f550a?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "MG-HYB-002",
        "name": "Sistema Hibrido Solar + Generador Premium",
        "description": "Premium hybrid: 5kW solar, 15kWh battery, 7kW diesel generator, smart controller. Full energy independence.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 5200.00,
        "stock_quantity": 3,
        "image_url": "https://images.unsplash.com/photo-1681263849578-7585abbe0455?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "MG-CTR-001",
        "name": "Controlador Inteligente de Energia",
        "description": "Smart energy controller with LCD. Manages solar input, battery charging, generator auto-start, and load distribution. WiFi app.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 280.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1692611825915-0f3c9bdb257d?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "MG-PDB-001",
        "name": "Caja de Distribucion Electrica",
        "description": "Power distribution box with circuit breakers, surge protection, and metering. Distributes generated power to household circuits.",
        "category": "Micro-grid & Home Energy",
        "price_usd": 120.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1761158495585-eac721decf1b?w=600&h=400&fit=crop&auto=format&q=80",
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
        "image_url": "https://images.unsplash.com/photo-1637087788835-4f051e32bfa1?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BX-PRO-001",
        "name": "Paquete de Proteinas",
        "description": "Protein Power Bundle: Canned Tuna 6-Pack, Canned Chicken 350g, Sardines 4-Pack, Luncheon Meat 3-Pack, Black Beans 2.5kg, Lentils 500g, Chickpeas 500g. High-protein essentials for active families.",
        "category": "Essential Bundles",
        "price_usd": 38.00,
        "stock_quantity": 80,
        "image_url": "https://images.unsplash.com/photo-1554702309-b733f9d3a552?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BX-BEB-001",
        "name": "Paquete de Bebidas Tropicales",
        "description": "Tropical Drinks Bundle: Mango Juice 3-Pack, Guava Juice 3-Pack, Coconut Water 6-Pack, Passion Fruit Juice 3-Pack, Soursop Juice 3-Pack. A refreshing Caribbean experience.",
        "category": "Essential Bundles",
        "price_usd": 32.00,
        "stock_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BX-CAF-001",
        "name": "Paquete Cafetalero Cubano",
        "description": "Cuban Coffee Lovers Bundle: Cubita Dark 500g, Serrano Whole Bean 500g, Turquino Mountain 250g, Espresso Blend 250g. Four legendary Cuban coffees in one pack.",
        "category": "Essential Bundles",
        "price_usd": 35.00,
        "stock_quantity": 70,
        "image_url": "https://images.unsplash.com/photo-1606102906144-96b3c8d73719?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BX-FRU-001",
        "name": "Paquete de Frutas Frescas",
        "description": "Fresh Tropical Fruits Bundle: Avocados (3), Mangoes (4), Plantains (6), Papaya (1), Guavas (6), Coconuts (2). Farm-fresh Caribbean tropical selection.",
        "category": "Essential Bundles",
        "price_usd": 28.00,
        "stock_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1758184875542-2a30993210b4?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BX-SOL-001",
        "name": "Paquete Solar Basico",
        "description": "Basic Solar Starter Bundle: 100W Portable Solar Panel, Solar Power Bank 20,000mAh, LED Lighting Kit (6 bulbs), Multi-Port USB Charger. Get started with solar energy.",
        "category": "Essential Bundles",
        "price_usd": 220.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1652326320478-38c1e9842e85?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BX-DES-001",
        "name": "Paquete Despensa Completa",
        "description": "Complete Pantry Bundle: Rice 10kg, Black Beans 2.5kg, Red Beans 1kg, Pasta 500g, Flour 5kg, Cornmeal 2.5kg, Oats 500g, Powdered Milk 2.5kg, Condensed Milk 3-Pack, Cooking Oil 2L. Stocks a full pantry.",
        "category": "Essential Bundles",
        "price_usd": 65.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1543168256-418811576931?w=600&h=400&fit=crop&auto=format&q=80",
    },
    {
        "sku": "BX-BLK-001",
        "name": "Mega Paquete Todo Incluido",
        "description": "All-In-One Mega Bundle: Rice, Beans, Pasta, Flour, Canned Meats, Fresh Fruits, Coffee, Powdered Milk, Juices, and LED Lights. The ultimate care package — everything a household needs.",
        "category": "Essential Bundles",
        "price_usd": 120.00,
        "stock_quantity": 30,
        "image_url": "https://images.unsplash.com/photo-1578730260644-8d1b35ce2c69?w=600&h=400&fit=crop&auto=format&q=80",
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

        # Upsert products — add missing, update images for existing
        result = await session.execute(select(Product))
        existing = {p.sku: p for p in result.scalars().all() if p.sku}

        # Build lookup of desired images from PRODUCTS list
        desired_images = {p["sku"]: p["image_url"] for p in PRODUCTS}

        new_products = []
        updated_images = 0
        for p_data in PRODUCTS:
            sku = p_data["sku"]
            if sku not in existing:
                product = Product(**p_data)
                session.add(product)
                new_products.append((product, p_data["stock_quantity"]))
            else:
                # Update image if it's a placeholder or different from desired
                existing_product = existing[sku]
                if existing_product.image_url != p_data["image_url"] and (
                    not existing_product.image_url
                    or "placehold.co" in (existing_product.image_url or "")
                    or existing_product.image_url.startswith("https://placehold")
                ):
                    existing_product.image_url = p_data["image_url"]
                    updated_images += 1

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

        if updated_images:
            print(f"Updated {updated_images} product images to Unsplash photos")

        await session.commit()
    print("Seed complete.")


if __name__ == "__main__":
    async def _run():
        await create_tables()
        await seed()
    asyncio.run(_run())
