import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../store'
import { useI18n, translate, tCat } from '../i18n'

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
    <div>
      <h1 className="text-2xl font-bold text-[#0B1628] mb-4">{t('catalog.title')}</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder={t('catalog.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setParams({})}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!activeCategory ? 'bg-[#0B1628] text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
          >
            {t('catalog.all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setParams({ category: cat })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-[#0B1628] text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            >
              {tCat(lang, cat)}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-12">{t('catalog.noProducts')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
              <Link to={`/product/${p.id}`}>
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-48 object-cover" />}
                <div className="p-4">
                  <span className="text-xs text-[#0B1628]/60 font-medium">{tCat(lang, p.category)}</span>
                  <h3 className="font-semibold text-gray-800 mt-1">{p.name}</h3>
                  <p className="text-lg font-bold text-[#0B1628] mt-2">${p.price_usd.toFixed(2)}</p>
                </div>
              </Link>
              <div className="px-4 pb-4">
                <button
                  onClick={() => addItem(p)}
                  disabled={p.stock_quantity <= 0}
                  className="w-full bg-[#0B1628] text-white py-2 rounded-lg hover:bg-[#0B1628]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {p.stock_quantity > 0 ? t('catalog.addToCart') : t('catalog.outOfStock')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
