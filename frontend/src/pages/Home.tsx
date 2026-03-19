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
      {/* Hero — tropical agriculture / Caribbean trade */}
      <div className="relative rounded-lg overflow-hidden mb-6 sm:mb-8 -mx-4 sm:mx-0">
        <img
          src="/coffee.jpg"
          alt="Caribbean agriculture"
          className="w-full h-64 sm:h-96 object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1628]/90 via-[#0B1628]/60 to-[#0B1628]/30" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12">
          <p className="text-green-400 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-2">{t('home.hero.badge')}</p>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 leading-tight max-w-xl">{t('home.hero.title')}</h1>
          <p className="text-white/80 mb-4 sm:mb-6 max-w-lg text-sm sm:text-base leading-relaxed">{t('home.hero.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/catalog" className="inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-fit min-h-[44px] text-sm sm:text-base">
              {t('home.hero.cta')}
            </Link>
            <Link to="/track" className="inline-block bg-white/10 backdrop-blur text-white font-medium px-6 py-3 rounded-lg hover:bg-white/20 transition-colors w-fit min-h-[44px] text-sm sm:text-base border border-white/20">
              {t('home.hero.ctaTrack')}
            </Link>
          </div>
        </div>
      </div>

      {/* Value propositions */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl mb-1">🌱</div>
          <p className="text-xs sm:text-sm font-medium text-[#0B1628]">{t('home.value.agriculture')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl mb-1">⚡</div>
          <p className="text-xs sm:text-sm font-medium text-[#0B1628]">{t('home.value.energy')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl mb-1">🚢</div>
          <p className="text-xs sm:text-sm font-medium text-[#0B1628]">{t('home.value.logistics')}</p>
        </div>
      </div>

      {/* Categories */}
      <h2 className="text-xl font-bold text-[#0B1628] mb-4">{t('home.categories')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {categories.map(cat => (
          <Link
            key={cat}
            to={`/catalog?category=${encodeURIComponent(cat)}`}
            className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 text-center hover:border-green-600 hover:shadow-md transition group min-h-[44px] flex items-center justify-center"
          >
            <span className="font-medium text-gray-800 group-hover:text-green-700 text-sm sm:text-base">{tCat(lang, cat)}</span>
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
              <span className="text-xs text-green-700/70 font-medium">{tCat(lang, p.category)}</span>
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
