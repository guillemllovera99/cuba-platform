import { Link } from 'react-router-dom'
import { useI18n, translate } from '../i18n'

export default function Home() {
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  return (
    <div className="-mx-4 -mt-6 -mb-6">
      {/* ───── HERO — full viewport, energy_photo ───── */}
      <section className="relative h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
        <img
          src="/energy_photo.png"
          alt="Energy and agriculture solutions for Cuba"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <img
            src="/white_logo.png"
            alt="Asymmetrica Investments"
            className="h-14 sm:h-20 mx-auto mb-8"
          />
          <p className="text-white/50 text-xs sm:text-sm uppercase tracking-[0.3em] mb-5 font-light">
            {t('home.hero.badge')}
          </p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-5 leading-[1.1]">
            {t('home.hero.title')}
          </h1>
          <p className="text-white/70 text-base sm:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
            {t('home.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/catalog"
              className="bg-green-600 text-white font-semibold px-10 py-4 rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-600/25 text-lg w-full sm:w-auto"
            >
              {t('home.hero.cta')}
            </Link>
            <Link
              to="/track"
              className="bg-white/10 backdrop-blur-sm text-white font-medium px-10 py-4 rounded-lg hover:bg-white/20 transition-all border border-white/20 text-lg w-full sm:w-auto"
            >
              {t('home.hero.ctaTrack')}
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ───── ABOUT US — white, with brother.jpg ───── */}
      <section className="bg-white py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-5xl font-bold text-[#0B1628] mb-6 leading-tight">
                {t('home.about.title')}
              </h2>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                {t('home.about.text')}
              </p>
              <Link
                to="/catalog"
                className="inline-block mt-8 text-[#0B1628] font-semibold text-lg border-b-2 border-[#0B1628] pb-1 hover:opacity-70 transition-opacity"
              >
                {t('home.hero.cta')} &rarr;
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src="/brother.jpg" alt="Asymmetrica team" className="w-full h-72 sm:h-96 object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS — light gray ───── */}
      <section className="bg-[#F7F7F3] py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-[#0B1628] text-center mb-16">
            {t('home.services.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: t('home.services.sourcing'),
                desc: t('home.services.sourcingDesc'),
              },
              {
                step: '02',
                title: t('home.services.logistics'),
                desc: t('home.services.logisticsDesc'),
              },
              {
                step: '03',
                title: t('home.services.advisory'),
                desc: t('home.services.advisoryDesc'),
              },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-bold text-[#0B1628]/10 mb-4">{s.step}</div>
                <h3 className="text-xl font-bold text-[#0B1628] mb-3">{s.title}</h3>
                <p className="text-gray-500 text-base leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── IMAGE BREAK — agriculture_1 ───── */}
      <section className="relative h-56 sm:h-72 overflow-hidden">
        <img src="/agriculture_1.jpg" alt="Caribbean agriculture" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0B1628]/30" />
      </section>

      {/* ───── PRODUCT CATEGORIES PREVIEW ───── */}
      <section className="bg-white py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-[#0B1628] mb-6">
            {t('catalog.title')}
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto mb-12">
            {lang === 'es' ? 'Desde granos y productos frescos hasta paneles solares y equipos de energía.' : lang === 'fr' ? 'Des céréales et produits frais aux panneaux solaires et équipements énergétiques.' : 'From grains and fresh produce to solar panels and energy equipment.'}
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto mb-10">
            {[
              { label: t('home.value.agriculture'), img: '/coffee.jpg' },
              { label: t('home.value.energy'), img: '/energy_photo.png' },
              { label: t('home.value.logistics'), img: '/agriculture_2.jpeg' },
            ].map(cat => (
              <Link to="/catalog" key={cat.label} className="group">
                <div className="rounded-xl overflow-hidden aspect-square mb-3 shadow-sm">
                  <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <p className="text-sm sm:text-base font-semibold text-[#0B1628]">{cat.label}</p>
              </Link>
            ))}
          </div>
          <Link
            to="/catalog"
            className="inline-block bg-[#0B1628] text-white font-semibold px-10 py-4 rounded-lg hover:bg-[#0B1628]/90 transition-all text-lg"
          >
            {t('home.hero.cta')}
          </Link>
        </div>
      </section>

      {/* ───── FEATURED IN — logos as styled text ───── */}
      <section className="bg-[#F7F7F3] py-16 sm:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs sm:text-sm uppercase tracking-[0.3em] text-gray-400 font-medium mb-10">
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
              <div key={m.name} className="text-center opacity-50 hover:opacity-80 transition-opacity">
                <span className={`text-base sm:text-xl text-[#0B1628] ${m.style}`}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── MEMBERS OF — logos as styled text ───── */}
      <section className="bg-white py-16 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs sm:text-sm uppercase tracking-[0.3em] text-gray-400 font-medium mb-10">
            {t('home.members.title')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16">
            <div className="text-center opacity-60 hover:opacity-90 transition-opacity">
              <p className="text-lg sm:text-2xl font-bold text-[#0B1628] font-serif">Swiss Sustainable</p>
              <p className="text-lg sm:text-2xl font-bold text-[#0B1628] font-serif">Finance</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200" />
            <div className="text-center opacity-60 hover:opacity-90 transition-opacity">
              <p className="text-lg sm:text-2xl font-bold text-[#0B1628] font-serif">Alianza por la</p>
              <p className="text-lg sm:text-2xl font-bold text-[#0B1628] font-serif">Inversi&oacute;n de Impacto</p>
              <p className="text-sm text-gray-400 mt-1">M&eacute;xico</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA — agriculture photo ───── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <img src="/coffee.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0B1628]/75" />
        <div className="relative z-10 text-center px-6">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-5">
            {lang === 'es' ? 'Explora el Catálogo' : lang === 'fr' ? 'Parcourez le Catalogue' : 'Explore the Catalog'}
          </h2>
          <p className="text-white/50 text-base sm:text-lg mb-10 max-w-xl mx-auto">
            {lang === 'es' ? 'Productos agrícolas, energéticos y esenciales entregados a Cuba.' : lang === 'fr' ? 'Produits agricoles, énergétiques et essentiels livrés à Cuba.' : 'Agricultural, energy, and essential products delivered to Cuba.'}
          </p>
          <Link
            to="/catalog"
            className="inline-block bg-green-600 text-white font-semibold px-12 py-4 rounded-lg hover:bg-green-700 transition-all text-lg shadow-lg"
          >
            {t('home.hero.cta')}
          </Link>
        </div>
      </section>
    </div>
  )
}
