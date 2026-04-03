import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n, translate, tCat } from '../i18n'
import { api } from '../api'

export default function Home() {
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)
  const [featured, setFeatured] = useState<any[]>([])

  useEffect(() => {
    api.getProducts('limit=8').then(data => {
      const products = Array.isArray(data) ? data : data.products || data.items || []
      setFeatured(products.slice(0, 8))
    }).catch(() => {})
  }, [])

  return (
    <div className="-mx-4 -mt-6 -mb-6">
      {/* ───── HERO — compact, Caribbean coastline ───── */}
      <section className="relative h-[50vh] min-h-[360px] max-h-[500px] flex items-center justify-center overflow-hidden">
        <img
          src="/kenrick-baksh-7F334ZFrp7w-unsplash.jpg"
          alt="Caribbean coastline"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1628]/60 via-[#0B1628]/40 to-[#0B1628]/70" />

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-4 font-light">
            {t('home.hero.badge')}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-[1.15]">
            {lang === 'es' ? 'El mercado del Caribe' : lang === 'fr' ? 'Le march\u00E9 des Cara\u00EFbes' : 'The Caribbean Marketplace'}
          </h1>
          <p className="text-white/65 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-8">
            {lang === 'es'
              ? 'Reserve con un 20% de dep\u00F3sito y reciba productos esenciales, agricultura y energ\u00EDa solar en el Caribe.'
              : lang === 'fr'
              ? 'R\u00E9servez avec un acompte de 20% et recevez produits essentiels, agriculture et \u00E9nergie solaire dans les Cara\u00EFbes.'
              : 'Reserve with a 20% deposit and get essential goods, agriculture, and solar energy delivered across the Caribbean.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/catalog"
              className="bg-green-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-green-700 transition-all text-sm w-full sm:w-auto"
            >
              {t('home.hero.cta')}
            </Link>
            <Link
              to="/track"
              className="bg-white/10 backdrop-blur-sm text-white font-medium px-8 py-3 rounded-lg hover:bg-white/20 transition-all border border-white/20 text-sm w-full sm:w-auto"
            >
              {t('home.hero.ctaTrack')}
            </Link>
          </div>
        </div>
      </section>

      {/* ───── FEATURED PRODUCTS ───── */}
      {featured.length > 0 && (
        <section className="bg-white py-12 sm:py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B1628]">
                {t('home.featured')}
              </h2>
              <Link to="/catalog" className="text-sm text-green-600 hover:text-green-700 font-medium">
                {lang === 'es' ? 'Ver todo' : lang === 'fr' ? 'Voir tout' : 'View all'} &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
              {featured.map((p: any) => (
                <Link to={`/product/${p.id}`} key={p.id} className="group bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img
                      src={p.image_url || '/placeholder.png'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">{tCat(lang, p.category)}</p>
                    <p className="font-medium text-[#0B1628] text-xs sm:text-sm leading-tight mb-1.5 line-clamp-2">{p.name}</p>
                    <span className="font-bold text-[#0B1628] text-sm">${p.price_usd?.toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── HOW IT WORKS — 5 steps ───── */}
      <section className="bg-[#FAFAFA] py-14 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-3xl font-bold text-[#0B1628] text-center mb-3">
            {t('home.services.title')}
          </h2>
          <p className="text-gray-500 text-center max-w-lg mx-auto mb-12 text-xs sm:text-sm">
            {t('home.howItWorks.subtitle')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-3">
            {[
              { step: '1', title: t('home.step1.title'), desc: t('home.step1.desc'), color: 'bg-[#0B1628] text-white' },
              { step: '2', title: t('home.step2.title'), desc: t('home.step2.desc'), color: 'bg-green-600 text-white' },
              { step: '3', title: t('home.step3.title'), desc: t('home.step3.desc'), color: 'bg-amber-500 text-white' },
              { step: '4', title: t('home.step4.title'), desc: t('home.step4.desc'), color: 'bg-purple-600 text-white' },
              { step: '5', title: t('home.step5.title'), desc: t('home.step5.desc'), color: 'bg-teal-600 text-white' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center font-bold text-xs mx-auto mb-2.5`}>
                  {s.step}
                </div>
                <h3 className="font-semibold text-[#0B1628] text-xs sm:text-sm mb-1">{s.title}</h3>
                <p className="text-gray-500 text-[10px] sm:text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CATEGORIES with real photos ───── */}
      <section className="bg-white py-14 sm:py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-xl sm:text-3xl font-bold text-[#0B1628] mb-3">
            {t('home.categories')}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto mb-10">
            {lang === 'es' ? 'Desde granos y productos frescos hasta paneles solares y equipos de energ\u00EDa.' : lang === 'fr' ? 'Des c\u00E9r\u00E9ales et produits frais aux panneaux solaires et \u00E9quipements \u00E9nerg\u00E9tiques.' : 'From grains and fresh produce to solar panels and energy equipment.'}
          </p>
          <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-lg mx-auto">
            {[
              { label: t('home.value.agriculture'), img: '/farmers.png', category: 'Fresh Produce' },
              { label: t('home.value.energy'), img: '/red-zeppelin-UVGE-o757-g-unsplash.jpg', category: 'Solar Energy' },
              { label: t('home.value.logistics'), img: '/omar-eagle-bG_xVUDGiQw-unsplash.jpg', category: 'Essential Bundles' },
            ].map(cat => (
              <Link to={`/catalog?category=${encodeURIComponent(cat.category)}`} key={cat.label} className="group">
                <div className="rounded-lg overflow-hidden aspect-square mb-2 border border-gray-100">
                  <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#0B1628]">{cat.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───── ABOUT BANNER with logo ───── */}
      <section className="relative overflow-hidden">
        <img
          src="/company_agriculture.jpg"
          alt="Agriculture landscape"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0B1628]/85" />
        <div className="relative z-10 py-16 sm:py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <img src="/white_logo.png" alt="Asymmetrica" className="h-10 sm:h-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">{t('home.about.title')}</h2>
            <p className="text-white/55 text-xs sm:text-sm leading-relaxed mb-6">
              {t('home.about.text')}
            </p>
            <Link to="/about" className="inline-block text-white border border-white/20 px-6 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-xs font-medium">
              {lang === 'es' ? 'Conocer m\u00E1s' : lang === 'fr' ? 'En savoir plus' : 'Learn more'}
            </Link>
          </div>
        </div>
      </section>

      {/* ───── FEATURED IN — real logos ───── */}
      <section className="bg-[#FAFAFA] py-10 sm:py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[9px] uppercase tracking-[0.3em] text-gray-400 font-medium mb-6">
            {t('home.featured.title')}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 sm:gap-8 items-center justify-items-center">
            <img src="/Forbes.png" alt="Forbes" className="h-5 sm:h-6 object-contain opacity-50 hover:opacity-80 transition-opacity" />
            <img src="/cnn.png" alt="CNN" className="h-5 sm:h-6 object-contain opacity-50 hover:opacity-80 transition-opacity" />
            <img src="/freshplaza.png" alt="Fresh Plaza" className="h-6 sm:h-7 object-contain opacity-50 hover:opacity-80 transition-opacity" />
            <img src="/impactalpha.png" alt="ImpactAlpha" className="h-4 sm:h-5 object-contain opacity-50 hover:opacity-80 transition-opacity" />
            <div className="text-center opacity-40 hover:opacity-70 transition-opacity">
              <span className="text-xs sm:text-sm font-serif font-bold text-[#0B1628]">El Financiero</span>
            </div>
            <img src="/inforural.png" alt="Inforural" className="h-6 sm:h-7 object-contain opacity-50 hover:opacity-80 transition-opacity" />
          </div>
        </div>
      </section>

      {/* ───── MEMBERS OF ───── */}
      <section className="bg-white py-10 sm:py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[9px] uppercase tracking-[0.3em] text-gray-400 font-medium mb-6">
            {t('home.members.title')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14">
            <div className="text-center opacity-50 hover:opacity-80 transition-opacity">
              <p className="text-sm sm:text-base font-bold text-[#0B1628] font-serif leading-tight">Swiss Sustainable<br />Finance</p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-200" />
            <div className="text-center opacity-50 hover:opacity-80 transition-opacity">
              <p className="text-sm sm:text-base font-bold text-[#0B1628] font-serif leading-tight">Alianza por la<br />Inversi&oacute;n de Impacto</p>
              <p className="text-[10px] text-gray-400 mt-0.5">M&eacute;xico</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
