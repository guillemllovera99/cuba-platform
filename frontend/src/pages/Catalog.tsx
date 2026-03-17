import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../store'
import { useI18n } from '../i18n'

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [params, setParams] = useSearchParams()
  const activeCategory = params.get('category') || ''
  const addItem = useCart(s => s.addItem)
  const t = useI18n(s => s.t)

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
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('catalog.title')}</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder={t('catalog.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setParams({})}
            className={`px-3 py-1 rounded text-sm ${!activeCategory ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {t('catalog.all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setParams({ category: cat })}
              className={`px-3 py-1 rounded text-sm ${activeCategory === cat ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-12">{t('catalog.noProducts')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition">
              <Link to={`/product/${p.id}`}>
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-48 object-cover" />}
                <div className="p-4">
                  <span className="text-xs text-green-600 font-medium">{p.category}</span>
                  <h3 className="font-semibold text-gray-800 mt-1">{p.name}</h3>
                  <p className="text-lg font-bold text-gray-900 mt-2">${p.price_usd.toFixed(2)}</p>
                </div>
              </Link>
              <div className="px-4 pb-4">
                <button
                  onClick={() => addItem(p)}
                  disabled={p.stock_quantity <= 0}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
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
