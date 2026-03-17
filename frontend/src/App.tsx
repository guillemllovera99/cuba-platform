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

function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" fill="none" className={className}>
      <polyline points="40,65 70,45 90,60 120,25" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="100" y="90" textAnchor="middle" fontFamily="'Inter','Helvetica Neue',sans-serif" fontSize="22" fontWeight="400" fill="currentColor" letterSpacing="1">Asymmetrica</text>
    </svg>
  )
}

function LangSwitcher() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex items-center rounded overflow-hidden text-xs">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-1 transition-colors ${lang === l.code ? 'bg-white text-[#0B1628]' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
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
    <nav className="bg-[#0B1628] sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-white shrink-0">
          <Logo className="h-10 w-auto" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/catalog" className="text-sm text-white/80 hover:text-white transition-colors">{t('nav.catalog')}</Link>
          <Link to="/track" className="text-sm text-white/80 hover:text-white transition-colors">{t('nav.track')}</Link>
          {isAdmin() && (
            <Link to="/admin" className="text-sm text-blue-300 hover:text-blue-200 font-medium">{t('nav.admin')}</Link>
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          <LangSwitcher />
          <Link to="/cart" className="text-sm text-white/80 hover:text-white relative transition-colors">
            {t('nav.cart')}
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {isLoggedIn() ? (
            <div className="flex items-center gap-3">
              <Link to="/orders" className="text-sm text-white/80 hover:text-white transition-colors">{t('nav.orders')}</Link>
              <span className="text-xs text-white/40">{user?.email}</span>
              <button onClick={() => { logout(); navigate('/') }} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm bg-white text-[#0B1628] px-4 py-1.5 rounded hover:bg-white/90 font-medium transition-colors">
              {t('nav.login')}
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white p-2">
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
        <div className="md:hidden bg-[#0B1628] border-t border-white/10 px-4 py-4 space-y-3">
          <Link to="/catalog" onClick={() => setMobileOpen(false)} className="block text-sm text-white/80 hover:text-white">{t('nav.catalog')}</Link>
          <Link to="/track" onClick={() => setMobileOpen(false)} className="block text-sm text-white/80 hover:text-white">{t('nav.track')}</Link>
          <Link to="/cart" onClick={() => setMobileOpen(false)} className="block text-sm text-white/80 hover:text-white">
            {t('nav.cart')} {cartCount > 0 && `(${cartCount})`}
          </Link>
          {isLoggedIn() ? (
            <>
              <Link to="/orders" onClick={() => setMobileOpen(false)} className="block text-sm text-white/80 hover:text-white">{t('nav.orders')}</Link>
              <button onClick={() => { logout(); navigate('/'); setMobileOpen(false) }} className="block text-sm text-red-400">{t('nav.logout')}</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-white font-medium">{t('nav.login')}</Link>
          )}
          {isAdmin() && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="block text-sm text-blue-300">{t('nav.admin')}</Link>
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
    <footer>
      {/* Forest image band */}
      <div className="relative h-48 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1511497584788-876760111969?w=1200&q=80"
          alt="Forest"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F5F0]/80 to-[#0B1628]/90" />
      </div>

      {/* Footer content */}
      <div className="bg-[#0B1628] text-white/70 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="text-center md:text-left max-w-md">
              <Logo className="h-10 w-auto text-white mb-3 mx-auto md:mx-0" />
              <p className="text-sm leading-relaxed">{t('footer.tagline')}</p>
            </div>
            <div className="text-center md:text-right text-sm space-y-1">
              <p>info@asymmetrica-investments.com</p>
              <p>www.asymmetrica-investments.com</p>
            </div>
          </div>
          <div className="border-t border-white/10 mt-6 pt-4 text-center text-xs text-white/40">
            &copy; {new Date().getFullYear()} Asymmetrica Investments. {t('footer.rights')}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F0]">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id/confirmed" element={<OrderConfirmation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
