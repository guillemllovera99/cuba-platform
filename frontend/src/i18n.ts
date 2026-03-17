import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Lang = 'en' | 'es' | 'fr'

interface I18nState {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Navbar
    'nav.brand': 'Asymmetrica Cuba',
    'nav.catalog': 'Catalog',
    'nav.track': 'Track Order',
    'nav.admin': 'Admin',
    'nav.cart': 'Cart',
    'nav.orders': 'My Orders',
    'nav.logout': 'Logout',
    'nav.login': 'Login',

    // Home
    'home.hero.title': 'Asymmetrica Cuba',
    'home.hero.subtitle': 'Food, energy, and essentials — delivered to Cuba.',
    'home.hero.cta': 'Browse Catalog',
    'home.featured': 'Featured Products',
    'home.inStock': 'In stock',
    'home.outOfStock': 'Out of stock',

    // Catalog
    'catalog.title': 'Product Catalog',
    'catalog.search': 'Search products...',
    'catalog.all': 'All',
    'catalog.noProducts': 'No products found.',
    'catalog.addToCart': 'Add to Cart',
    'catalog.outOfStock': 'Out of Stock',

    // Product
    'product.back': 'Back to Catalog',
    'product.sku': 'SKU',
    'product.inStock': 'in stock',
    'product.outOfStock': 'Out of stock',
    'product.addToCart': 'Add to Cart',
    'product.added': 'Added!',

    // Cart
    'cart.title': 'Shopping Cart',
    'cart.items': 'items',
    'cart.empty': 'Your cart is empty',
    'cart.browse': 'Browse products',
    'cart.each': 'each',
    'cart.remove': 'Remove',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    'cart.loginToCheckout': 'Login to Checkout',

    // Checkout
    'checkout.title': 'Checkout',
    'checkout.summary': 'Order Summary',
    'checkout.total': 'Total',
    'checkout.recipient': 'Recipient in Cuba',
    'checkout.name': 'Full Name',
    'checkout.phone': 'Phone Number',
    'checkout.city': 'City',
    'checkout.address': 'Address',
    'checkout.notes': 'Notes',
    'checkout.namePlaceholder': 'Juan Garcia',
    'checkout.phonePlaceholder': '+53 5 1234567',
    'checkout.cityPlaceholder': 'Havana',
    'checkout.addressPlaceholder': 'Calle 23 #456, Vedado',
    'checkout.notesPlaceholder': 'Delivery instructions...',
    'checkout.simulated': 'Payment is simulated for this prototype. Your order will be confirmed immediately.',
    'checkout.placeOrder': 'Place Order',
    'checkout.processing': 'Processing...',
    'checkout.fillRequired': 'Please fill in all required fields',

    // Login
    'login.login': 'Login',
    'login.register': 'Register',
    'login.fullName': 'Full Name',
    'login.phone': 'Phone',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.createAccount': 'Create Account',
    'login.pleaseWait': 'Please wait...',
    'login.demo': 'Demo admin: admin@cuba.com / admin123',

    // Orders
    'orders.title': 'My Orders',
    'orders.noOrders': 'No orders yet.',
    'orders.shopNow': 'Shop now',
    'orders.items': 'items',

    // Track
    'track.title': 'Track Your Order',
    'track.placeholder': 'Enter order code (e.g. CUB-XXXXXX)',
    'track.button': 'Track',
    'track.searching': 'Searching...',
    'track.cancelled': 'This order has been cancelled.',
    'track.recipient': 'Recipient',
    'track.city': 'City',
    'track.total': 'Total',
    'track.items': 'Items',

    // Order status
    'status.pending_payment': 'Pending Payment',
    'status.paid': 'Payment Received',
    'status.processing': 'Processing',
    'status.shipped': 'Shipped to Cuba',
    'status.delivered': 'Delivered',
    'status.cancelled': 'Cancelled',

    // Order confirmation
    'confirmation.title': 'Order Confirmed!',
    'confirmation.code': 'Order Code',
    'confirmation.shareCode': 'Share this code so the recipient can track delivery.',
    'confirmation.recipient': 'Recipient',
    'confirmation.city': 'City',
    'confirmation.total': 'Total',
    'confirmation.status': 'Status',
    'confirmation.orderItems': 'Order Items',
    'confirmation.myOrders': 'My Orders',
    'confirmation.continueShopping': 'Continue Shopping',

    // Language
    'lang.en': 'English',
    'lang.es': 'Español',
    'lang.fr': 'Français',
  },

  es: {
    // Navbar
    'nav.brand': 'Asymmetrica Cuba',
    'nav.catalog': 'Catálogo',
    'nav.track': 'Rastrear Pedido',
    'nav.admin': 'Admin',
    'nav.cart': 'Carrito',
    'nav.orders': 'Mis Pedidos',
    'nav.logout': 'Salir',
    'nav.login': 'Iniciar Sesión',

    // Home
    'home.hero.title': 'Asymmetrica Cuba',
    'home.hero.subtitle': 'Alimentos, energía y esenciales — entregados en Cuba.',
    'home.hero.cta': 'Ver Catálogo',
    'home.featured': 'Productos Destacados',
    'home.inStock': 'En stock',
    'home.outOfStock': 'Agotado',

    // Catalog
    'catalog.title': 'Catálogo de Productos',
    'catalog.search': 'Buscar productos...',
    'catalog.all': 'Todos',
    'catalog.noProducts': 'No se encontraron productos.',
    'catalog.addToCart': 'Agregar al Carrito',
    'catalog.outOfStock': 'Agotado',

    // Product
    'product.back': 'Volver al Catálogo',
    'product.sku': 'SKU',
    'product.inStock': 'en stock',
    'product.outOfStock': 'Agotado',
    'product.addToCart': 'Agregar al Carrito',
    'product.added': '¡Agregado!',

    // Cart
    'cart.title': 'Carrito de Compras',
    'cart.items': 'artículos',
    'cart.empty': 'Tu carrito está vacío',
    'cart.browse': 'Ver productos',
    'cart.each': 'c/u',
    'cart.remove': 'Eliminar',
    'cart.total': 'Total',
    'cart.checkout': 'Proceder al Pago',
    'cart.loginToCheckout': 'Iniciar Sesión para Pagar',

    // Checkout
    'checkout.title': 'Finalizar Compra',
    'checkout.summary': 'Resumen del Pedido',
    'checkout.total': 'Total',
    'checkout.recipient': 'Destinatario en Cuba',
    'checkout.name': 'Nombre Completo',
    'checkout.phone': 'Teléfono',
    'checkout.city': 'Ciudad',
    'checkout.address': 'Dirección',
    'checkout.notes': 'Notas',
    'checkout.namePlaceholder': 'Juan García',
    'checkout.phonePlaceholder': '+53 5 1234567',
    'checkout.cityPlaceholder': 'La Habana',
    'checkout.addressPlaceholder': 'Calle 23 #456, Vedado',
    'checkout.notesPlaceholder': 'Instrucciones de entrega...',
    'checkout.simulated': 'El pago es simulado para este prototipo. Su pedido será confirmado inmediatamente.',
    'checkout.placeOrder': 'Realizar Pedido',
    'checkout.processing': 'Procesando...',
    'checkout.fillRequired': 'Por favor complete todos los campos requeridos',

    // Login
    'login.login': 'Iniciar Sesión',
    'login.register': 'Registrarse',
    'login.fullName': 'Nombre Completo',
    'login.phone': 'Teléfono',
    'login.email': 'Correo Electrónico',
    'login.password': 'Contraseña',
    'login.createAccount': 'Crear Cuenta',
    'login.pleaseWait': 'Espere...',
    'login.demo': 'Demo admin: admin@cuba.com / admin123',

    // Orders
    'orders.title': 'Mis Pedidos',
    'orders.noOrders': 'No tienes pedidos aún.',
    'orders.shopNow': 'Comprar ahora',
    'orders.items': 'artículos',

    // Track
    'track.title': 'Rastrear Tu Pedido',
    'track.placeholder': 'Ingrese código de pedido (ej. CUB-XXXXXX)',
    'track.button': 'Rastrear',
    'track.searching': 'Buscando...',
    'track.cancelled': 'Este pedido ha sido cancelado.',
    'track.recipient': 'Destinatario',
    'track.city': 'Ciudad',
    'track.total': 'Total',
    'track.items': 'Artículos',

    // Order status
    'status.pending_payment': 'Pago Pendiente',
    'status.paid': 'Pago Recibido',
    'status.processing': 'En Proceso',
    'status.shipped': 'Enviado a Cuba',
    'status.delivered': 'Entregado',
    'status.cancelled': 'Cancelado',

    // Order confirmation
    'confirmation.title': '¡Pedido Confirmado!',
    'confirmation.code': 'Código de Pedido',
    'confirmation.shareCode': 'Comparta este código para que el destinatario pueda rastrear la entrega.',
    'confirmation.recipient': 'Destinatario',
    'confirmation.city': 'Ciudad',
    'confirmation.total': 'Total',
    'confirmation.status': 'Estado',
    'confirmation.orderItems': 'Artículos del Pedido',
    'confirmation.myOrders': 'Mis Pedidos',
    'confirmation.continueShopping': 'Seguir Comprando',

    // Language
    'lang.en': 'English',
    'lang.es': 'Español',
    'lang.fr': 'Français',
  },

  fr: {
    // Navbar
    'nav.brand': 'Asymmetrica Cuba',
    'nav.catalog': 'Catalogue',
    'nav.track': 'Suivre Commande',
    'nav.admin': 'Admin',
    'nav.cart': 'Panier',
    'nav.orders': 'Mes Commandes',
    'nav.logout': 'Déconnexion',
    'nav.login': 'Connexion',

    // Home
    'home.hero.title': 'Asymmetrica Cuba',
    'home.hero.subtitle': 'Alimentation, énergie et essentiels — livrés à Cuba.',
    'home.hero.cta': 'Voir le Catalogue',
    'home.featured': 'Produits Vedettes',
    'home.inStock': 'En stock',
    'home.outOfStock': 'Rupture de stock',

    // Catalog
    'catalog.title': 'Catalogue de Produits',
    'catalog.search': 'Rechercher des produits...',
    'catalog.all': 'Tous',
    'catalog.noProducts': 'Aucun produit trouvé.',
    'catalog.addToCart': 'Ajouter au Panier',
    'catalog.outOfStock': 'Rupture de Stock',

    // Product
    'product.back': 'Retour au Catalogue',
    'product.sku': 'SKU',
    'product.inStock': 'en stock',
    'product.outOfStock': 'Rupture de stock',
    'product.addToCart': 'Ajouter au Panier',
    'product.added': 'Ajouté !',

    // Cart
    'cart.title': 'Panier',
    'cart.items': 'articles',
    'cart.empty': 'Votre panier est vide',
    'cart.browse': 'Parcourir les produits',
    'cart.each': 'pièce',
    'cart.remove': 'Supprimer',
    'cart.total': 'Total',
    'cart.checkout': 'Passer à la Caisse',
    'cart.loginToCheckout': 'Se Connecter pour Commander',

    // Checkout
    'checkout.title': 'Finaliser la Commande',
    'checkout.summary': 'Résumé de la Commande',
    'checkout.total': 'Total',
    'checkout.recipient': 'Destinataire à Cuba',
    'checkout.name': 'Nom Complet',
    'checkout.phone': 'Téléphone',
    'checkout.city': 'Ville',
    'checkout.address': 'Adresse',
    'checkout.notes': 'Notes',
    'checkout.namePlaceholder': 'Juan Garcia',
    'checkout.phonePlaceholder': '+53 5 1234567',
    'checkout.cityPlaceholder': 'La Havane',
    'checkout.addressPlaceholder': 'Calle 23 #456, Vedado',
    'checkout.notesPlaceholder': 'Instructions de livraison...',
    'checkout.simulated': 'Le paiement est simulé pour ce prototype. Votre commande sera confirmée immédiatement.',
    'checkout.placeOrder': 'Passer la Commande',
    'checkout.processing': 'Traitement...',
    'checkout.fillRequired': 'Veuillez remplir tous les champs obligatoires',

    // Login
    'login.login': 'Connexion',
    'login.register': "S'inscrire",
    'login.fullName': 'Nom Complet',
    'login.phone': 'Téléphone',
    'login.email': 'E-mail',
    'login.password': 'Mot de Passe',
    'login.createAccount': 'Créer un Compte',
    'login.pleaseWait': 'Patientez...',
    'login.demo': 'Démo admin : admin@cuba.com / admin123',

    // Orders
    'orders.title': 'Mes Commandes',
    'orders.noOrders': "Vous n'avez pas encore de commandes.",
    'orders.shopNow': 'Acheter maintenant',
    'orders.items': 'articles',

    // Track
    'track.title': 'Suivre Votre Commande',
    'track.placeholder': 'Entrez le code de commande (ex. CUB-XXXXXX)',
    'track.button': 'Suivre',
    'track.searching': 'Recherche...',
    'track.cancelled': 'Cette commande a été annulée.',
    'track.recipient': 'Destinataire',
    'track.city': 'Ville',
    'track.total': 'Total',
    'track.items': 'Articles',

    // Order status
    'status.pending_payment': 'Paiement en Attente',
    'status.paid': 'Paiement Reçu',
    'status.processing': 'En Cours',
    'status.shipped': 'Expédié à Cuba',
    'status.delivered': 'Livré',
    'status.cancelled': 'Annulé',

    // Order confirmation
    'confirmation.title': 'Commande Confirmée !',
    'confirmation.code': 'Code de Commande',
    'confirmation.shareCode': 'Partagez ce code pour que le destinataire puisse suivre la livraison.',
    'confirmation.recipient': 'Destinataire',
    'confirmation.city': 'Ville',
    'confirmation.total': 'Total',
    'confirmation.status': 'Statut',
    'confirmation.orderItems': 'Articles de la Commande',
    'confirmation.myOrders': 'Mes Commandes',
    'confirmation.continueShopping': 'Continuer les Achats',

    // Language
    'lang.en': 'English',
    'lang.es': 'Español',
    'lang.fr': 'Français',
  },
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      lang: 'en' as Lang,
      setLang: (lang: Lang) => set({ lang }),
      t: (key: string) => {
        const lang = get().lang
        return translations[lang]?.[key] || translations['en']?.[key] || key
      },
    }),
    { name: 'cuba-lang' }
  )
)

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
]
