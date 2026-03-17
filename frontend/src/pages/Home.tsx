import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useI18n } from '../i18n'

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const t = useI18n(s => s.t)

  useEffect(() => {
    api.getProducts('in_stock=true').then(setProducts).catch(() => {})
    api.getCategories().then(setCategories).catch(() => {})
  }, [])

  return (
    <div>
      <div className="bg-green-700 text-white rounded-lg p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('home.hero.title')}</h1>
        <p className="text-green-100 mb-4">{t('home.hero.subtitle')}</p>
        <Link to="/catalog" className="inline-block bg-white text-green-700 font-semibold px-5 py-2 rounded hover:bg-green-50">
          {t('home.hero.cta')}
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {categories.map(cat => (
          <Link
            key={cat}
            to={`/catalog?category=${encodeURIComponent(cat)}`}
            className="bg-white border rounded-lg p-4 text-center hover:border-green-500 hover:shadow transition"
          >
            <span className="font-medium text-gray-800">{cat}</span>
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-4">{t('home.featured')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.slice(0, 6).map(p => (
          <Link key={p.id} to={`/product/${p.id}`} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition">
            {p.image_url && (
              <img src={p.image_url} alt={p.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <span className="text-xs text-green-600 font-medium">{p.category}</span>
              <h3 className="font-semibold text-gray-800 mt-1">{p.name}</h3>
              <p className="text-lg font-bold text-gray-900 mt-2">${p.price_usd.toFixed(2)}</p>
              {p.stock_quantity > 0 ? (
                <span className="text-xs text-green-600">{t('home.inStock')}</span>
              ) : (
                <span className="text-xs text-red-500">{t('home.outOfStock')}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
