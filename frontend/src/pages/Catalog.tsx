import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../store'
import { useI18n, translate, tCat } from '../i18n'
import { tProductName } from '../productNames'

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [params, setParams] = useSearchParams()
  const activeCategory = params.get('category') || ''
  const addItem = useCart(s => s.addItem)
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}) }, [])

  useEffect(() => {
    const qs = new URLSearchParams()
    if (activeCategory) qs.set('category', activeCategory)
    if (search) qs.set('search', search)
    qs.set('in_stock', 'true')
    api.getProducts(qs.toString()).then(setProducts).catch(() => {})
  }, [activeCategory, search])

  return (
    <div className="-mx-4 -mt-6">
      {/* Catalog hero banner */}
      <div className="relative h-40 sm:h-52 overflow-hidden mb-6">
        <img src="/energy_photo.png" alt="Products" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1628]/80 to-[#0B1628]/40" />
        <div className="relative z-10 flex items-center h-full px-6 sm:px-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('catalog.title')}</h1>
            <p className="text-white/60 text-sm mt-1">{t('home.hero.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Search */}
        <input
          type="text"
          placeholder={t('catalog.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-5 py-3.5 mb-5 text-base bg-gray-50 focus:bg-white focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628] transition-colors"
        />

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-hide">
          <button
            onClick={() => setParams({})}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!activeCategory ? 'bg-[#0B1628] text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
          >
            {t('catalog.all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setParams({ category: cat })}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-[#0B1628] text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            >
              {tCat(lang, cat)}
            </button>
          ))}
        </div>

        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-12">{t('catalog.noProducts')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/product/${p.id}`}>
                  {p.image_url && <img src={p.image_url} alt={tProductName(lang, p.sku, p.name)} className="w-full h-36 sm:h-52 object-cover" />}
                  <div className="p-4 sm:p-5">
                    <span className="text-xs text-[#0B1628]/50 font-medium uppercase tracking-wide">{tCat(lang, p.category)}</span>
                    <h3 className="font-semibold text-[#0B1628] mt-1.5 text-sm sm:text-base leading-snug line-clamp-2">{tProductName(lang, p.sku, p.name)}</h3>
                    <p className="text-lg sm:text-xl font-bold text-[#0B1628] mt-2">${p.price_usd.toFixed(2)}</p>
                  </div>
                </Link>
                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                  <button
                    onClick={() => addItem(p)}
                    disabled={p.stock_quantity <= 0}
                    className="w-full bg-[#0B1628] text-white py-3 rounded-lg hover:bg-[#0B1628]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors min-h-[48px]"
                  >
                    {p.stock_quantity > 0 ? t('catalog.addToCart') : t('catalog.outOfStock')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
