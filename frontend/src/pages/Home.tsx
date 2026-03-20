import { Link } from 'react-router-dom'
import { useI18n, translate } from '../i18n'

export default function Home() {
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  return (
    <div className="-mx-4 -mt-6 -mb-6">
      {/* ───── HERO — full viewport ───── */}
      <section className="relative h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
        <img
          src="/agriculture_1.jpg"
          alt="Caribbean agriculture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <img
            src="/white_logo.png"
            alt="Asymmetrica Investments"
            className="h-16 sm:h-24 mx-auto mb-8"
          />
          <p className="text-white/60 text-xs sm:text-sm uppercase tracking-[0.25em] mb-4 font-light">
            {t('home.hero.badge')}
          </p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            {t('home.hero.title')}
          </h1>
          <p className="text-white/70 text-sm sm:text-lg leading-relaxed max-w-lg mx-auto mb-10">
            {t('home.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12">
            <Link
              to="/catalog"
              className="bg-green-600 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-600/25 min-h-[48px] text-base w-full sm:w-auto"
            >
              {t('home.hero.cta')}
            </Link>
            <Link
              to="/track"
              className="bg-white/10 backdrop-blur-sm text-white font-medium px-8 py-3.5 rounded-lg hover:bg-white/20 transition-all border border-white/20 min-h-[48px] text-base w-full sm:w-auto"
            >
              {t('home.hero.ctaTrack')}
            </Link>
          </div>

          {/* Buyer / Seller / Both */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <Link
              to="/login"
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg py-3 px-2 text-center hover:bg-white/15 transition-all"
            >
              <p className="text-white font-medium text-sm">{t('login.buyer')}</p>
              <p className="text-white/40 text-[10px] mt-0.5 hidden sm:block">{t('login.buyerDesc')}</p>
            </Link>
            <Link
              to="/login"
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg py-3 px-2 text-center hover:bg-white/15 transition-all"
            >
              <p className="text-white font-medium text-sm">{t('login.seller')}</p>
              <p className="text-white/40 text-[10px] mt-0.5 hidden sm:block">{t('login.sellerDesc')}</p>
            </Link>
            <Link
              to="/login"
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg py-3 px-2 text-center hover:bg-white/15 transition-all"
            >
              <p className="text-white font-medium text-sm">{t('login.both')}</p>
              <p className="text-white/40 text-[10px] mt-0.5 hidden sm:block">{t('login.bothDesc')}</p>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ───── ABOUT SECTION — white, clean ───── */}
      <section className="bg-white py-20 sm:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-[#0B1628] mb-6 leading-tight">
            {t('home.about.title')}
          </h2>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            {t('home.about.text')}
          </p>
        </div>
      </section>

      {/* ───── SERVICES — light gray background ───── */}
      <section className="bg-[#F5F5F0] py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold text-[#0B1628] text-center mb-14">
            {t('home.services.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: 'sourcing', title: t('home.services.sourcing'), desc: t('home.services.sourcingDesc') },
              { icon: 'logistics', title: t('home.services.logistics'), desc: t('home.services.logisticsDesc') },
              { icon: 'advisory', title: t('home.services.advisory'), desc: t('home.services.advisoryDesc') },
            ].map(s => (
              <div key={s.icon} className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="w-14 h-14 bg-[#0B1628] rounded-full flex items-center justify-center mx-auto mb-5">
                  {s.icon === 'sourcing' && (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {s.icon === 'logistics' && (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  )}
                  {s.icon === 'advisory' && (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#0B1628] mb-3">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── IMAGE BREAK — coffee photo ───── */}
      <section className="relative h-64 sm:h-80 overflow-hidden">
        <img src="/coffee.jpg" alt="Caribbean coffee" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0B1628]/40" />
      </section>

      {/* ───── FEATURED IN ───── */}
      <section className="bg-white py-16 sm:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B1628] text-center mb-12 uppercase tracking-wider">
            {t('home.featured.title')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center opacity-70">
            {['Forbes', 'CNN', 'Fresh Plaza', 'ImpactAlpha', 'El Financiero', 'Inforural'].map(name => (
              <div key={name} className="text-center">
                <span className="text-lg sm:text-xl font-bold text-[#0B1628]/80 tracking-wide">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── MEMBERS OF ───── */}
      <section className="bg-[#F5F5F0] py-16 sm:py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B1628] text-center mb-12 uppercase tracking-wider">
            {t('home.members.title')}
          </h2>
          <div className="grid sm:grid-cols-2 gap-8 items-center justify-items-center">
            <div className="bg-white rounded-xl p-6 sm:p-8 text-center shadow-sm w-full max-w-sm">
              <p className="text-lg font-bold text-[#0B1628] mb-1">Swiss Sustainable Finance</p>
              <p className="text-sm text-gray-500">Switzerland</p>
            </div>
            <div className="bg-white rounded-xl p-6 sm:p-8 text-center shadow-sm w-full max-w-sm">
              <p className="text-lg font-bold text-[#0B1628] mb-1">Alianza por la Inversi&oacute;n</p>
              <p className="text-lg font-bold text-[#0B1628]">de Impacto M&eacute;xico</p>
              <p className="text-sm text-gray-500 mt-1">Mexico</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── CTA BAND — before footer ───── */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <img src="/energy_photo.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0B1628]/80" />
        <div className="relative z-10 text-center px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
            {lang === 'es' ? 'Comienza a comerciar hoy' : lang === 'fr' ? 'Commencez maintenant' : 'Start Trading Today'}
          </h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">
            {lang === 'es' ? 'Accede a productos premium del Caribe.' : lang === 'fr' ? "Accédez aux produits premium des Caraïbes." : 'Access premium Caribbean agricultural products and global logistics.'}
          </p>
          <Link
            to="/catalog"
            className="inline-block bg-green-600 text-white font-semibold px-10 py-4 rounded-lg hover:bg-green-700 transition-all text-lg"
          >
            {t('home.hero.cta')}
          </Link>
        </div>
      </section>
    </div>
  )
}
