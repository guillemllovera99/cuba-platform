import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useI18n, translate, tCat } from '../i18n'

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  useEffect(() => {
    api.getProducts('in_stock=true').then(setProducts).catch(() => {})
    api.getCategories().then(setCategories).catch(() => {})
  }, [])

  return (
    <div>
      {/* Hero with background image */}
      <div className="relative rounded-lg overflow-hidden mb-6 sm:mb-8 -mx-4 sm:mx-0">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80"
          alt="Hero"
          className="w-full h-56 sm:h-80 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1628]/85 to-[#0B1628]/40" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">{t('home.hero.title')}</h1>
          <p className="text-white/80 mb-4 sm:mb-5 max-w-lg text-sm sm:text-base">{t('home.hero.subtitle')}</p>
          <Link to="/catalog" className="inline-block bg-white text-[#0B1628] font-semibold px-6 py-3 rounded hover:bg-white/90 transition-colors w-fit min-h-[44px] text-sm sm:text-base">
            {t('home.hero.cta')}
          </Link>
        </div>
      </div>

      {/* Categories */}
      <h2 className="text-xl font-bold text-[#0B1628] mb-4">{t('home.categories')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {categories.map(cat => (
          <Link
            key={cat}
            to={`/catalog?category=${encodeURIComponent(cat)}`}
            className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:border-[#0B1628] hover:shadow-md transition group"
          >
            <span className="font-medium text-gray-800 group-hover:text-[#0B1628]">{tCat(lang, cat)}</span>
          </Link>
        ))}
      </div>

      {/* Featured products */}
      <h2 className="text-xl font-bold text-[#0B1628] mb-4">{t('home.featured')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {products.slice(0, 6).map(p => (
          <Link key={p.id} to={`/product/${p.id}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition group">
            {p.image_url && (
              <img src={p.image_url} alt={p.name} className="w-full h-32 sm:h-48 object-cover" />
            )}
            <div className="p-3 sm:p-4">
              <span className="text-xs text-[#0B1628]/60 font-medium">{tCat(lang, p.category)}</span>
              <h3 className="font-semibold text-gray-800 mt-1 group-hover:text-[#0B1628] text-sm sm:text-base line-clamp-2">{p.name}</h3>
              <p className="text-base sm:text-lg font-bold text-[#0B1628] mt-1 sm:mt-2">${p.price_usd.toFixed(2)}</p>
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
