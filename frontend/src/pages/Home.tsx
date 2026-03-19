import { Link } from 'react-router-dom'
import { useI18n, translate } from '../i18n'

export default function Home() {
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  return (
    <div className="-mx-4 -mt-6 -mb-6">
      {/* FULL-SCREEN HERO — fills entire viewport below navbar */}
      <div className="relative h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <img
          src="/agriculture_1.jpg"
          alt="Caribbean agriculture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          {/* Company logo */}
          <img
            src="/white_logo.png"
            alt="Asymmetrica Investments"
            className="h-16 sm:h-24 mx-auto mb-8"
          />

          {/* Tagline */}
          <p className="text-white/60 text-xs sm:text-sm uppercase tracking-[0.25em] mb-4 font-light">
            {t('home.hero.badge')}
          </p>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            {t('home.hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-white/70 text-sm sm:text-lg leading-relaxed max-w-lg mx-auto mb-10">
            {t('home.hero.subtitle')}
          </p>

          {/* CTA buttons */}
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

          {/* Buyer / Seller / Both — subtle entry points */}
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
      </div>
    </div>
  )
}
