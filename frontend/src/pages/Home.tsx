import { Link } from 'react-router-dom'
import { useI18n, translate } from '../i18n'

export default function Home() {
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  return (
    <div className="-mx-4 -mt-6">
      {/* FULL-SCREEN HERO */}
      <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
        {/* Background image — fills entire viewport */}
        <img
          src="/agriculture_1.jpg"
          alt="Caribbean agriculture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          {/* Logo */}
          <img
            src="/logo.png"
            alt="Asymmetrica"
            className="h-14 sm:h-20 mx-auto mb-6 brightness-0 invert"
          />

          {/* Badge */}
          <p className="text-green-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-4">
            {t('home.hero.badge')}
          </p>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            {t('home.hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
            {t('home.hero.subtitle')}
          </p>

          {/* Value props row */}
          <div className="flex justify-center gap-6 sm:gap-10 mb-10">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-1">🌱</div>
              <p className="text-white/70 text-xs sm:text-sm font-medium">{t('home.value.agriculture')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-1">⚡</div>
              <p className="text-white/70 text-xs sm:text-sm font-medium">{t('home.value.energy')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-1">🚢</div>
              <p className="text-white/70 text-xs sm:text-sm font-medium">{t('home.value.logistics')}</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10">
            <Link
              to="/catalog"
              className="bg-green-600 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-600/30 min-h-[48px] text-base sm:text-lg w-full sm:w-auto"
            >
              {t('home.hero.cta')}
            </Link>
            <Link
              to="/track"
              className="bg-white/10 backdrop-blur-sm text-white font-medium px-8 py-3.5 rounded-lg hover:bg-white/20 transition-all border border-white/30 min-h-[48px] text-base sm:text-lg w-full sm:w-auto"
            >
              {t('home.hero.ctaTrack')}
            </Link>
          </div>

          {/* Buyer / Seller / Both role cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
            <Link
              to="/login"
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 sm:p-4 text-center hover:bg-white/20 transition-all group"
            >
              <p className="text-white font-semibold text-sm sm:text-base">{t('login.buyer')}</p>
              <p className="text-white/50 text-[10px] sm:text-xs mt-1">{t('login.buyerDesc')}</p>
            </Link>
            <Link
              to="/login"
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 sm:p-4 text-center hover:bg-white/20 transition-all group"
            >
              <p className="text-white font-semibold text-sm sm:text-base">{t('login.seller')}</p>
              <p className="text-white/50 text-[10px] sm:text-xs mt-1">{t('login.sellerDesc')}</p>
            </Link>
            <Link
              to="/login"
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 sm:p-4 text-center hover:bg-white/20 transition-all group"
            >
              <p className="text-white font-semibold text-sm sm:text-base">{t('login.both')}</p>
              <p className="text-white/50 text-[10px] sm:text-xs mt-1">{t('login.bothDesc')}</p>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  )
}
