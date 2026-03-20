import { useI18n, translate } from '../i18n'

export default function About() {
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  return (
    <div className="-mx-4 -mt-6">
      {/* Hero banner */}
      <div className="relative h-44 sm:h-56 overflow-hidden mb-8">
        <img src="/agriculture_1.jpg" alt="About Asymmetrica" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1628]/80 to-[#0B1628]/40" />
        <div className="relative z-10 flex items-center h-full px-6 sm:px-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{t('home.about.title')}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Team photo + description */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src="/brother.jpg" alt="Asymmetrica team" className="w-full h-72 sm:h-96 object-cover" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1628] mb-5 leading-tight">
              {t('home.hero.badge')}
            </h2>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
              {t('home.about.text')}
            </p>
            <a
              href="https://www.asymmetrica-investments.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0B1628] font-semibold text-base border-b-2 border-[#0B1628] pb-1 hover:opacity-70 transition-opacity"
            >
              www.asymmetrica-investments.com &rarr;
            </a>
          </div>
        </div>

        {/* Company photos */}
        <div className="grid grid-cols-2 gap-4 mb-16">
          <div className="rounded-xl overflow-hidden">
            <img src="/coffee.jpg" alt="Agriculture" className="w-full h-48 sm:h-64 object-cover" />
          </div>
          <div className="rounded-xl overflow-hidden">
            <img src="/energy_photo.png" alt="Energy" className="w-full h-48 sm:h-64 object-cover" />
          </div>
        </div>
      </div>
    </div>
  )
}
