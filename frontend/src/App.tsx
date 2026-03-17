import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuth, useCart } from './store'
import { useI18n, LANGS } from './i18n'
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

function LangSwitcher() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex items-center border rounded overflow-hidden text-xs">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-1 ${lang === l.code ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
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
  const t = useI18n(s => s.t)
  const navigate = useNavigate()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold text-green-700">{t('nav.brand')}</Link>
          <Link to="/catalog" className="text-sm text-gray-600 hover:text-gray-900">{t('nav.catalog')}</Link>
          <Link to="/track" className="text-sm text-gray-600 hover:text-gray-900">{t('nav.track')}</Link>
          {isAdmin() && (
            <Link to="/admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">{t('nav.admin')}</Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <LangSwitcher />
          <Link to="/cart" className="text-sm text-gray-600 hover:text-gray-900 relative">
            {t('nav.cart')}
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {isLoggedIn() ? (
            <div className="flex items-center gap-3">
              <Link to="/orders" className="text-sm text-gray-600 hover:text-gray-900">{t('nav.orders')}</Link>
              <span className="text-xs text-gray-400">{user?.email}</span>
              <button onClick={() => { logout(); navigate('/') }} className="text-sm text-red-600 hover:text-red-800">
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
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
    </div>
  )
}
