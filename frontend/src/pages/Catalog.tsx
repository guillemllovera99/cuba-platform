import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useCart, useAuth } from '../store'
import { useI18n, translate, tCat } from '../i18n'
import { tProductName } from '../productNames'

/* ── tiny icons (inline SVG to avoid deps) ── */
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
)
const GridIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/><rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/></svg>
)
const ListIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><rect x="0" y="1" width="16" height="3" rx="1"/><rect x="0" y="6.5" width="16" height="3" rx="1"/><rect x="0" y="12" width="16" height="3" rx="1"/></svg>
)
const ChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
)
const MessageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
)
const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="w-4 h-4" fill={filled ? '#F59E0B' : 'none'} stroke="#F59E0B" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
)

function PreorderBadge({ product, t }: { product: any; t: (k: string) => string }) {
  if (!product.is_preorder) return null
  const deadline = product.preorder_deadline ? new Date(product.preorder_deadline) : null
  const now = new Date()
  let daysLeft = 0
  if (deadline) daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  return (
    <div className="absolute top-2 left-2 z-10">
      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">{t('catalog.preorder')}</span>
      {deadline && daysLeft > 0 && (
        <span className="block mt-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full text-center">{daysLeft}d {t('catalog.left')}</span>
      )}
    </div>
  )
}

/* ── Message / Contact Modal ── */
function MessageModal({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: string }) {
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)

  if (!open) return null

  const labels = {
    title: lang === 'es' ? 'Enviar Mensaje' : lang === 'fr' ? 'Envoyer un Message' : 'Send a Message',
    placeholder: lang === 'es' ? 'Escriba su mensaje aquí...' : lang === 'fr' ? 'Écrivez votre message ici...' : 'Write your message here...',
    send: lang === 'es' ? 'Enviar' : lang === 'fr' ? 'Envoyer' : 'Send',
    sent: lang === 'es' ? 'Mensaje enviado' : lang === 'fr' ? 'Message envoyé' : 'Message sent!',
    info: lang === 'es' ? 'Nuestro equipo responderá en 24h' : lang === 'fr' ? 'Notre équipe répondra sous 24h' : 'Our team will respond within 24h',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0B1628]">{labels.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {sent ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
            <p className="font-semibold text-[#0B1628]">{labels.sent}</p>
            <p className="text-sm text-gray-500 mt-1">{labels.info}</p>
          </div>
        ) : (
          <>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder={labels.placeholder}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628] resize-none"
            />
            <p className="text-xs text-gray-400 mt-2 mb-4">{labels.info}</p>
            <button
              onClick={() => { if (msg.trim()) setSent(true) }}
              disabled={!msg.trim()}
              className="w-full bg-[#0B1628] text-white py-3 rounded-xl font-medium hover:bg-[#0B1628]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {labels.send}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Admin Featured Toggle (shown for admins) ── */
function FeaturedToggle({ product, onToggle }: { product: any; onToggle: (id: string, val: boolean) => void }) {
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); onToggle(product.id, !product.is_featured) }}
      className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${product.is_featured ? 'bg-amber-400 text-white' : 'bg-white/80 text-gray-400 hover:text-amber-500'}`}
      title={product.is_featured ? 'Remove from Featured' : 'Add to Featured'}
    >
      <StarIcon filled={product.is_featured} />
    </button>
  )
}

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [params, setParams] = useSearchParams()
  const activeCategory = params.get('category') || ''
  const addItem = useCart(s => s.addItem)
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)
  const { isAdmin } = useAuth()

  // Price range
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [maxPrice, setMaxPrice] = useState(10000)

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Sort
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name'>('newest')

  // Sidebar open (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Message modal
  const [msgOpen, setMsgOpen] = useState(false)

  // Load categories & featured on mount
  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {})
    api.getFeaturedProducts().then((data: any) => {
      const arr = Array.isArray(data) ? data : data.products || data.items || []
      setFeaturedProducts(arr)
    }).catch(() => {})
  }, [])

  // Load products with filters
  useEffect(() => {
    const qs = new URLSearchParams()
    if (activeCategory) qs.set('category', activeCategory)
    if (search) qs.set('search', search)
    qs.set('in_stock', 'true')
    api.getProducts(qs.toString()).then((data: any) => {
      const arr = Array.isArray(data) ? data : data.products || data.items || []
      setProducts(arr)
      // Set max price from all products
      if (arr.length > 0) {
        const mp = Math.ceil(Math.max(...arr.map((p: any) => p.price_usd || 0)))
        setMaxPrice(mp)
        setPriceRange(prev => [prev[0], Math.max(prev[1], mp)])
      }
    }).catch(() => {})
  }, [activeCategory, search])

  // Filter + sort products
  const displayProducts = useMemo(() => {
    let filtered = products.filter(p => p.price_usd >= priceRange[0] && p.price_usd <= priceRange[1])
    switch (sortBy) {
      case 'price_asc': filtered.sort((a, b) => a.price_usd - b.price_usd); break
      case 'price_desc': filtered.sort((a, b) => b.price_usd - a.price_usd); break
      case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break
      default: break // newest = default API order
    }
    return filtered
  }, [products, priceRange, sortBy])

  const handleToggleFeatured = async (productId: string, featured: boolean) => {
    try {
      await api.adminSetFeatured(productId, featured)
      // Refresh featured & products
      const fData = await api.getFeaturedProducts()
      setFeaturedProducts(Array.isArray(fData) ? fData : fData.products || fData.items || [])
      // Update in local product list
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_featured: featured } : p))
    } catch (e: any) { alert(e.message) }
  }

  const sortLabels: Record<string, string> = {
    newest: lang === 'es' ? 'Más recientes' : lang === 'fr' ? 'Plus récents' : 'Newest',
    price_asc: lang === 'es' ? 'Precio: menor a mayor' : lang === 'fr' ? 'Prix: croissant' : 'Price: Low to High',
    price_desc: lang === 'es' ? 'Precio: mayor a menor' : lang === 'fr' ? 'Prix: décroissant' : 'Price: High to Low',
    name: lang === 'es' ? 'Nombre A-Z' : lang === 'fr' ? 'Nom A-Z' : 'Name A-Z',
  }

  const categoryIcons: Record<string, string> = {
    'Grains & Carbohydrates': '/agriculture_1.jpg',
    'Beans & Legumes': '/agriculture_2.jpeg',
    'Canned & Preserved Foods': '/agriculture_1.jpg',
    'Fresh Produce': '/farmers.png',
    'Coffee & Beverages': '/coffee.jpg',
    'Dairy & Milk': '/agriculture_2.jpeg',
    'Juice Packs': '/agriculture_1.jpg',
    'Appliances & Energy': '/energy_photo.png',
    'Solar Energy': '/red-zeppelin-UVGE-o757-g-unsplash.jpg',
    'Diesel & Fuel Supply': '/energy_photo.png',
    'Battery & Energy Storage': '/energy_photo.png',
    'Micro-grid & Home Energy': '/red-zeppelin-UVGE-o757-g-unsplash.jpg',
    'Essential Bundles': '/agriculture_1.jpg',
  }

  /* ── Sidebar content (reused on mobile + desktop) ── */
  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-[#0B1628] uppercase tracking-wide mb-3">
          {lang === 'es' ? 'Categorías' : lang === 'fr' ? 'Catégories' : 'Categories'}
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => { setParams({}); setSidebarOpen(false) }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!activeCategory ? 'bg-[#0B1628] text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {t('catalog.all')} <span className="text-xs opacity-60">({products.length})</span>
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => { setParams({ category: cat }); setSidebarOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === cat ? 'bg-[#0B1628] text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {tCat(lang, cat)} {count > 0 && <span className="text-xs opacity-60">({count})</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-bold text-[#0B1628] uppercase tracking-wide mb-3">
          {lang === 'es' ? 'Rango de Precio' : lang === 'fr' ? 'Gamme de Prix' : 'Price Range'}
        </h3>
        <div className="px-1">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
          <input
            type="range"
            min={0}
            max={maxPrice}
            value={priceRange[0]}
            onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
            className="w-full accent-[#0B1628] mb-1"
          />
          <input
            type="range"
            min={0}
            max={maxPrice}
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-[#0B1628]"
          />
          <div className="flex gap-2 mt-3">
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 uppercase">Min</label>
              <input
                type="number"
                value={priceRange[0]}
                onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 uppercase">Max</label>
              <input
                type="number"
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact / Messages */}
      <div>
        <h3 className="text-sm font-bold text-[#0B1628] uppercase tracking-wide mb-3">
          {lang === 'es' ? 'Contacto' : lang === 'fr' ? 'Contact' : 'Contact'}
        </h3>
        <button
          onClick={() => setMsgOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 border border-[#0B1628]/20 rounded-xl text-sm text-[#0B1628] hover:bg-[#0B1628]/5 transition-colors"
        >
          <MessageIcon />
          <span>{lang === 'es' ? 'Enviar mensaje' : lang === 'fr' ? 'Envoyer message' : 'Send a message'}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="-mx-4 -mt-6">
      {/* ── HERO BANNER ── */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        <img src="/field.png" alt="Marketplace" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1628]/85 to-[#0B1628]/50" />
        <div className="relative z-10 flex items-center h-full px-6 sm:px-10">
          <div className="max-w-xl">
            <img src="/white_logo.png" alt="Asymmetrica" className="h-6 sm:h-8 mb-3 opacity-80" />
            <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
              {lang === 'es' ? 'Bienvenido al Marketplace' : lang === 'fr' ? 'Bienvenue sur le Marketplace' : 'Welcome to the Marketplace'}
            </h1>
            <p className="text-white/60 text-sm sm:text-base mt-2 max-w-md">
              {t('home.hero.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* ── POPULAR PRODUCTS (Featured) ── */}
      {featuredProducts.length > 0 && (
        <section className="bg-[#F8F9FB] py-8 sm:py-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-[#0B1628]">
                {lang === 'es' ? 'Productos Populares' : lang === 'fr' ? 'Produits Populaires' : 'Popular Products'}
              </h2>
              {isAdmin() && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">
                  {lang === 'es' ? 'Admin: click estrella para editar' : 'Admin: click star to edit'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {featuredProducts.slice(0, 10).map((p: any) => (
                <Link to={`/product/${p.id}`} key={p.id} className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <img src={p.image_url || '/agriculture_1.jpg'} alt={tProductName(lang, p.sku, p.name)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {p.is_preorder && (
                      <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t('catalog.preorder')}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{tCat(lang, p.category)}</p>
                    <p className="font-medium text-[#0B1628] text-xs sm:text-sm leading-tight mt-1 line-clamp-2">{tProductName(lang, p.sku, p.name)}</p>
                    <p className="font-bold text-[#0B1628] text-sm mt-1.5">${p.price_usd?.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── MAIN CONTENT: Sidebar + Products ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Search bar + controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Mobile filter button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            {lang === 'es' ? 'Filtros' : lang === 'fr' ? 'Filtres' : 'Filters'}
          </button>

          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></div>
            <input
              type="text"
              placeholder={t('catalog.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm bg-white focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628] transition-colors"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm bg-white focus:outline-none focus:border-[#0B1628] cursor-pointer"
            >
              {Object.entries(sortLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown /></div>
          </div>

          {/* View mode toggle */}
          <div className="hidden sm:flex border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-3 transition-colors ${viewMode === 'grid' ? 'bg-[#0B1628] text-white' : 'text-gray-400 hover:text-gray-600'}`}
            ><GridIcon /></button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-3 transition-colors ${viewMode === 'list' ? 'bg-[#0B1628] text-white' : 'text-gray-400 hover:text-gray-600'}`}
            ><ListIcon /></button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar (desktop) ── */}
          <aside className="hidden sm:block w-56 shrink-0">
            <div className="sticky top-24">
              <SidebarContent />
            </div>
          </aside>

          {/* ── Mobile sidebar overlay ── */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setSidebarOpen(false)}>
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-5 overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-[#0B1628]">{lang === 'es' ? 'Filtros' : 'Filters'}</h2>
                  <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>
                <SidebarContent />
              </div>
            </div>
          )}

          {/* ── Product Grid/List ── */}
          <div className="flex-1 min-w-0">
            {/* Result count */}
            <p className="text-sm text-gray-400 mb-4">
              {displayProducts.length} {lang === 'es' ? 'productos' : lang === 'fr' ? 'produits' : 'products'}
              {activeCategory && <span className="ml-1">{lang === 'es' ? 'en' : lang === 'fr' ? 'dans' : 'in'} <span className="font-medium text-[#0B1628]">{tCat(lang, activeCategory)}</span></span>}
            </p>

            {displayProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon />
                </div>
                <p className="text-gray-500 font-medium">{t('catalog.noProducts')}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {lang === 'es' ? 'Intente con otros filtros' : lang === 'fr' ? 'Essayez d\'autres filtres' : 'Try different filters'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {displayProducts.map(p => (
                  <div key={p.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 relative group">
                    {isAdmin() && <FeaturedToggle product={p} onToggle={handleToggleFeatured} />}
                    <Link to={`/product/${p.id}`}>
                      <div className="relative">
                        {p.image_url && <img src={p.image_url} alt={tProductName(lang, p.sku, p.name)} className="w-full h-36 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300" />}
                        <PreorderBadge product={p} t={t} />
                      </div>
                      <div className="p-3 sm:p-4">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{tCat(lang, p.category)}</span>
                        <h3 className="font-semibold text-[#0B1628] mt-1 text-xs sm:text-sm leading-snug line-clamp-2">{tProductName(lang, p.sku, p.name)}</h3>
                        <p className="text-base sm:text-lg font-bold text-[#0B1628] mt-2">${p.price_usd.toFixed(2)}</p>
                        {p.is_preorder && <p className="text-xs text-orange-600 font-medium mt-1">{t('catalog.preorderOnly')}</p>}
                      </div>
                    </Link>
                    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <button
                        onClick={() => addItem(p)}
                        disabled={p.stock_quantity <= 0}
                        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          p.is_preorder
                            ? 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed'
                            : 'bg-[#0B1628] text-white hover:bg-[#0B1628]/90 disabled:bg-gray-200 disabled:cursor-not-allowed'
                        }`}
                      >
                        {p.stock_quantity > 0
                          ? (p.is_preorder ? t('catalog.preorderNow') : t('catalog.addToCart'))
                          : t('catalog.outOfStock')
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                {displayProducts.map(p => (
                  <div key={p.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all flex relative">
                    {isAdmin() && <FeaturedToggle product={p} onToggle={handleToggleFeatured} />}
                    <Link to={`/product/${p.id}`} className="flex flex-1 min-w-0">
                      <div className="w-28 sm:w-40 shrink-0 relative">
                        {p.image_url && <img src={p.image_url} alt={tProductName(lang, p.sku, p.name)} className="w-full h-full object-cover" />}
                        <PreorderBadge product={p} t={t} />
                      </div>
                      <div className="p-3 sm:p-4 flex-1 min-w-0">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{tCat(lang, p.category)}</span>
                        <h3 className="font-semibold text-[#0B1628] mt-1 text-sm leading-snug">{tProductName(lang, p.sku, p.name)}</h3>
                        <p className="text-lg font-bold text-[#0B1628] mt-2">${p.price_usd.toFixed(2)}</p>
                        {p.is_preorder && <p className="text-xs text-orange-600 font-medium mt-1">{t('catalog.preorderOnly')}</p>}
                      </div>
                    </Link>
                    <div className="flex items-end p-3 sm:p-4 shrink-0">
                      <button
                        onClick={() => addItem(p)}
                        disabled={p.stock_quantity <= 0}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          p.is_preorder
                            ? 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-200'
                            : 'bg-[#0B1628] text-white hover:bg-[#0B1628]/90 disabled:bg-gray-200'
                        }`}
                      >
                        {p.stock_quantity > 0
                          ? (p.is_preorder ? t('catalog.preorderNow') : t('catalog.addToCart'))
                          : t('catalog.outOfStock')
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Browse by Category Cards ── */}
        <section className="mt-12 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#0B1628] mb-5">
            {lang === 'es' ? 'Explorar por Categoría' : lang === 'fr' ? 'Explorer par Catégorie' : 'Browse by Category'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.slice(0, 8).map(cat => (
              <Link
                to={`/catalog?category=${encodeURIComponent(cat)}`}
                key={cat}
                className="group relative h-32 sm:h-40 rounded-xl overflow-hidden"
              >
                <img src={categoryIcons[cat] || '/agriculture_1.jpg'} alt={tCat(lang, cat)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1628]/80 to-[#0B1628]/20 group-hover:from-[#0B1628]/90 transition-colors" />
                <div className="relative z-10 flex items-end h-full p-4">
                  <p className="text-white text-sm font-semibold leading-tight">{tCat(lang, cat)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ── Floating message button (mobile) ── */}
      <button
        onClick={() => setMsgOpen(true)}
        className="fixed bottom-6 right-6 sm:hidden z-30 w-14 h-14 bg-[#0B1628] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#0B1628]/90 transition-colors"
      >
        <MessageIcon />
      </button>

      {/* Message Modal */}
      <MessageModal open={msgOpen} onClose={() => setMsgOpen(false)} lang={lang} />
    </div>
  )
}
