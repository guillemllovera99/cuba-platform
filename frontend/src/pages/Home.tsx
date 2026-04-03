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
      {/* ───── HERO ───── */}
      <section className="relative h-[85vh] min-h-[550px] flex items-center justify-center overflow-hidden">
        <img
          src="/energy_photo.png"
          alt="Caribbean agriculture and energy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1628]/70 via-[#0B1628]/50 to-[#0B1628]/80" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-6 font-light">
            {t('home.hero.badge')}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.1]">
            {lang === 'es' ? 'Productos esenciales entregados a Cuba' : lang === 'fr' ? 'Produits essentiels livr\u00E9s \u00E0 Cuba' : 'Essential products delivered to Cuba'}
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            {lang === 'es' ? 'Alimentos, agricultura y energ\u00EDa solar \u2014 pida desde cualquier lugar, nosotros nos encargamos del env\u00EDo.' : lang === 'fr' ? 'Alimentation, agriculture et \u00E9nergie solaire \u2014 commandez de partout, nous livrons.' : 'Food, agriculture, and solar energy \u2014 order from anywhere, we handle the shipping.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/catalog"
              className="bg-green-600 text-white font-semibold px-10 py-4 rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-600/25 text-base w-full sm:w-auto"
            >
              {t('home.hero.cta')}
            </Link>
            <Link
              to="/track"
              className="bg-white/10 backdrop-blur-sm text-white font-medium px-10 py-4 rounded-lg hover:bg-white/20 transition-all border border-white/20 text-base w-full sm:w-auto"
            >
              {t('home.hero.ctaTrack')}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ───── VALUE PROPS — 3 columns ───── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {[
            { icon: '🌾', title: lang === 'es' ? 'Productos Frescos' : lang === 'fr' ? 'Produits Frais' : 'Fresh Produce', desc: lang === 'es' ? 'Granos, caf\u00E9, l\u00E1cteos y m\u00E1s' : lang === 'fr' ? 'C\u00E9r\u00E9ales, caf\u00E9, produits laitiers' : 'Grains, coffee, dairy, and more' },
            { icon: '☀️', title: lang === 'es' ? 'Energ\u00EDa Solar' : lang === 'fr' ? '\u00C9nergie Solaire' : 'Solar Energy', desc: lang === 'es' ? 'Paneles, bater\u00EDas, micro-redes' : lang === 'fr' ? 'Panneaux, batteries, micro-r\u00E9seaux' : 'Panels, batteries, micro-grids' },
            { icon: '📦', title: lang === 'es' ? 'Env\u00EDo Directo' : lang === 'fr' ? 'Livraison Directe' : 'Direct Shipping', desc: lang === 'es' ? 'Rastreo completo hasta la puerta' : lang === 'fr' ? 'Suivi complet jusqu\'\u00E0 la porte' : 'Full tracking to the doorstep' },
          ].map(v => (
            <div key={v.title} className="flex items-center gap-4 px-8 py-6">
              <span className="text-2xl">{v.icon}</span>
              <div>
                <p className="font-semibold text-[#0B1628] text-sm">{v.title}</p>
                <p className="text-gray-500 text-xs">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── FEATURED PRODUCTS ───── */}
      {featured.length > 0 && (
        <section className="bg-[#FAFAFA] py-16 sm:py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1628]">
                {t('home.featured')}
              </h2>
              <Link to="/catalog" className="text-sm text-green-600 hover:text-green-700 font-medium">
                {lang === 'es' ? 'Ver todo' : lang === 'fr' ? 'Voir tout' : 'View all'} &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {featured.map((p: any) => (
                <Link to={`/product/${p.id}`} key={p.id} className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img
                      src={p.image_url || '/placeholder.png'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-xs text-gray-400 mb-1">{tCat(lang, p.category)}</p>
                    <p className="font-medium text-[#0B1628] text-sm leading-tight mb-2 line-clamp-2">{p.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0B1628]">${p.price_usd?.toFixed(2)}</span>
                      {p.stock > 0 ? (
                        <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{t('home.inStock')}</span>
                      ) : (
                        <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{t('home.outOfStock')}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── HOW IT WORKS — 5 steps ───── */}
      <section className="bg-white py-16 sm:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold text-[#0B1628] text-center mb-4">
            {t('home.services.title')}
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-14 text-sm sm:text-base">
            {t('home.howItWorks.subtitle')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-4">
            {[
              { step: '1', title: t('home.step1.title'), desc: t('home.step1.desc'), color: 'bg-blue-50 text-blue-700' },
              { step: '2', title: t('home.step2.title'), desc: t('home.step2.desc'), color: 'bg-green-50 text-green-700' },
              { step: '3', title: t('home.step3.title'), desc: t('home.step3.desc'), color: 'bg-amber-50 text-amber-700' },
              { step: '4', title: t('home.step4.title'), desc: t('home.step4.desc'), color: 'bg-purple-50 text-purple-700' },
              { step: '5', title: t('home.step5.title'), desc: t('home.step5.desc'), color: 'bg-teal-50 text-teal-700' },
            ].map((s, i) => (
              <div key={s.step} className="relative text-center sm:text-left">
                {/* Connector line (desktop only) */}
                {i < 4 && <div className="hidden sm:block absolute top-5 left-[60%] w-[80%] h-px bg-gray-200 z-0" />}
                <div className={`relative z-10 w-10 h-10 rounded-full ${s.color} flex items-center justify-center font-bold text-sm mx-auto sm:mx-0 mb-3`}>
                  {s.step}
                </div>
                <h3 className="font-semibold text-[#0B1628] text-sm mb-1.5">{s.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CATEGORIES ───── */}
      <section className="bg-[#FAFAFA] py-16 sm:py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-[#0B1628] mb-4">
            {t('home.categories')}
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto mb-12">
            {lang === 'es' ? 'Desde granos y productos frescos hasta paneles solares y equipos de energ\u00EDa.' : lang === 'fr' ? 'Des c\u00E9r\u00E9ales et produits frais aux panneaux solaires et \u00E9quipements \u00E9nerg\u00E9tiques.' : 'From grains and fresh produce to solar panels and energy equipment.'}
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto">
            {[
              { label: t('home.value.agriculture'), img: '/coffee.jpg', category: 'Fresh Produce' },
              { label: t('home.value.energy'), img: '/energy_photo.png', category: 'Solar Energy' },
              { label: t('home.value.logistics'), img: '/agriculture_2.jpeg', category: 'Essential Bundles' },
            ].map(cat => (
              <Link to={`/catalog?category=${encodeURIComponent(cat.category)}`} key={cat.label} className="group">
                <div className="rounded-xl overflow-hidden aspect-square mb-3 shadow-sm border border-gray-100">
                  <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <p className="text-sm font-semibold text-[#0B1628]">{cat.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───── ABOUT BANNER ───── */}
      <section className="bg-[#0B1628] py-16 sm:py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-5">{t('home.about.title')}</h2>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-8">
            {t('home.about.text')}
          </p>
          <Link to="/about" className="inline-block text-white border border-white/20 px-8 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
            {lang === 'es' ? 'Conocer m\u00E1s' : lang === 'fr' ? 'En savoir plus' : 'Learn more'}
          </Link>
        </div>
      </section>

      {/* ───── TRUST SIGNALS ───── */}
      <section className="bg-white py-12 sm:py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium mb-8">
            {t('home.featured.title')}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 sm:gap-8 items-center justify-items-center">
            {[
              { name: 'Forbes', style: 'font-serif italic' },
              { name: 'CNN', style: 'font-sans font-black tracking-wider' },
              { name: 'Fresh Plaza', style: 'font-sans font-bold' },
              { name: 'ImpactAlpha', style: 'font-sans font-bold italic' },
              { name: 'El Financiero', style: 'font-serif font-bold' },
              { name: 'Inforural', style: 'font-sans font-bold' },
            ].map(m => (
              <div key={m.name} className="text-center opacity-40 hover:opacity-70 transition-opacity">
                <span className={`text-sm sm:text-base text-[#0B1628] ${m.style}`}>{m.name}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-10 pt-10">
            <p className="text-center text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium mb-8">
              {t('home.members.title')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14">
              <div className="text-center opacity-50 hover:opacity-80 transition-opacity">
                <p className="text-base sm:text-lg font-bold text-[#0B1628] font-serif leading-tight">Swiss Sustainable<br />Finance</p>
              </div>
              <div className="hidden sm:block w-px h-10 bg-gray-200" />
              <div className="text-center opacity-50 hover:opacity-80 transition-opacity">
                <p className="text-base sm:text-lg font-bold text-[#0B1628] font-serif leading-tight">Alianza por la<br />Inversi&oacute;n de Impacto</p>
                <p className="text-xs text-gray-400 mt-1">M&eacute;xico</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
