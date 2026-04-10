import { useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuth, useCart } from './store'
import { useI18n, LANGS, translate } from './i18n'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import Orders from './pages/Orders'
import TrackOrder from './pages/TrackOrder'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminOrders from './pages/admin/AdminOrders'
import AdminShipments from './pages/admin/AdminShipments'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminShipmentWindows from './pages/admin/AdminShipmentWindows'
import AdminPickupPoints from './pages/admin/AdminPickupPoints'
import About from './pages/About'
import Profile from './pages/Profile'
import CorporatePortal from './pages/CorporatePortal'
import WalletPage from './pages/Wallet'
import AdminCorporate from './pages/admin/AdminCorporate'
import AdminWallets from './pages/admin/AdminWallets'
import RecipientView from './pages/RecipientView'
import PartnerPortal from './pages/PartnerPortal'
import SupplierPortal from './pages/SupplierPortal'
import AdminFeedback from './pages/admin/AdminFeedback'
import AdminPartners from './pages/admin/AdminPartners'
import AdminSuppliers from './pages/admin/AdminSuppliers'

function LangSwitcher() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex items-center rounded overflow-hidden text-xs border border-gray-200">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 transition-colors ${lang === l.code ? 'bg-[#0B1628] text-white' : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

function Navbar() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth()
  const cartCount = useCart(s => s.count())
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img src="/black_logo.png" alt="Asymmetrica" className="h-8 sm:h-10 w-auto" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/catalog" className="text-base text-gray-600 hover:text-[#0B1628] transition-colors font-medium">{t('nav.catalog')}</Link>
          <Link to="/track" className="text-base text-gray-600 hover:text-[#0B1628] transition-colors font-medium">{t('nav.track')}</Link>
          <Link to="/about" className="text-base text-gray-600 hover:text-[#0B1628] transition-colors font-medium">{t('nav.about')}</Link>
          {isAdmin() && (
            <Link to="/admin" className="text-base text-blue-600 hover:text-blue-800 font-medium">{t('nav.admin')}</Link>
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-5">
          <LangSwitcher />
          <Link to="/cart" className="text-base text-gray-600 hover:text-[#0B1628] relative transition-colors font-medium">
            {t('nav.cart')}
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {isLoggedIn() ? (
            <div className="flex items-center gap-4">
              <Link to="/orders" className="text-base text-gray-600 hover:text-[#0B1628] transition-colors font-medium">{t('nav.orders')}</Link>
              <Link to="/profile" className="text-base text-gray-600 hover:text-[#0B1628] transition-colors font-medium">
                {lang === 'es' ? 'Perfil' : lang === 'fr' ? 'Profil' : 'Profile'}
              </Link>
              <span className="text-xs text-gray-400">{user?.email}</span>
              <button onClick={() => { logout(); navigate('/') }} className="text-sm text-red-500 hover:text-red-700 transition-colors">
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm bg-[#0B1628] text-white px-5 py-2 rounded-lg hover:bg-[#0B1628]/90 font-medium transition-colors">
              {t('nav.login')}
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-[#0B1628] p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-4 shadow-lg">
          <Link to="/catalog" onClick={() => setMobileOpen(false)} className="block text-base text-gray-700 hover:text-[#0B1628] font-medium">{t('nav.catalog')}</Link>
          <Link to="/track" onClick={() => setMobileOpen(false)} className="block text-base text-gray-700 hover:text-[#0B1628] font-medium">{t('nav.track')}</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block text-base text-gray-700 hover:text-[#0B1628] font-medium">{t('nav.about')}</Link>
          <Link to="/cart" onClick={() => setMobileOpen(false)} className="block text-base text-gray-700 hover:text-[#0B1628] font-medium">
            {t('nav.cart')} {cartCount > 0 && `(${cartCount})`}
          </Link>
          {isLoggedIn() ? (
            <>
              <Link to="/orders" onClick={() => setMobileOpen(false)} className="block text-base text-gray-700 hover:text-[#0B1628] font-medium">{t('nav.orders')}</Link>
              <Link to="/corporate" onClick={() => setMobileOpen(false)} className="block text-base text-gray-700 hover:text-[#0B1628] font-medium">
                {lang === 'es' ? 'Corporativo' : lang === 'fr' ? 'Entreprise' : 'Corporate'}
              </Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block text-base text-gray-700 hover:text-[#0B1628] font-medium">
                {lang === 'es' ? 'Perfil' : lang === 'fr' ? 'Profil' : 'Profile'}
              </Link>
              <button onClick={() => { logout(); navigate('/'); setMobileOpen(false) }} className="block text-sm text-red-500">{t('nav.logout')}</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-base text-[#0B1628] font-semibold">{t('nav.login')}</Link>
          )}
          {isAdmin() && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="block text-base text-blue-600 font-medium">{t('nav.admin')}</Link>
          )}
          <div className="pt-2"><LangSwitcher /></div>
        </div>
      )}
    </nav>
  )
}

function Footer() {
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  return (
    <footer className="bg-[#0B1628]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Company info */}
          <div className="text-center md:text-left max-w-sm">
            <img src="/white_logo.png" alt="Asymmetrica Investments" className="h-10 mx-auto md:mx-0 mb-4" />
            <p className="text-white/50 text-sm leading-relaxed">{t('footer.tagline')}</p>
          </div>
          {/* Contact & links */}
          <div className="text-center md:text-right text-sm space-y-2">
            <a href="https://www.asymmetrica-investments.com" target="_blank" rel="noopener noreferrer" className="block text-white/70 hover:text-white transition-colors">
              www.asymmetrica-investments.com
            </a>
            <a href="mailto:info@asymmetrica-investments.com" className="block text-white/70 hover:text-white transition-colors">
              info@asymmetrica-investments.com
            </a>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-4 text-center text-xs text-white/30">
          &copy; {new Date().getFullYear()} Asymmetrica Investments. {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full text-[#0B1628]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id/confirmed" element={<OrderConfirmation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/corporate" element={<CorporatePortal />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/recipient" element={<RecipientView />} />
          <Route path="/partner" element={<PartnerPortal />} />
          <Route path="/supplier" element={<SupplierPortal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/shipments" element={<AdminShipments />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/shipment-windows" element={<AdminShipmentWindows />} />
          <Route path="/admin/pickup-points" element={<AdminPickupPoints />} />
          <Route path="/admin/corporate" element={<AdminCorporate />} />
          <Route path="/admin/wallets" element={<AdminWallets />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/partners" element={<AdminPartners />} />
          <Route path="/admin/suppliers" element={<AdminSuppliers />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
