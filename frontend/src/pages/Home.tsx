import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n, translate, tCat } from '../i18n'
import { api } from '../api'

// Quick product name translation for featured display
// Keys match actual seed data product names (no accents)
const productNameTranslations: Record<string, Record<string, string>> = {
  en: {
    // Solar / Energy
    'Panel Solar Portatil': 'Portable Solar Panel',
    'Panel Solar': 'Solar Panel',
    'Modulo Solar': 'Solar Roof Module',
    'Kit Solar Basico para Hogar': 'Basic Home Solar Kit',
    'Kit Solar Basico': 'Basic Solar Kit',
    'Kit Solar Plegable': 'Foldable Solar Kit',
    'Kit Solar Off-Grid': 'Off-Grid Solar Kit',
    'Paquete Solar Basico': 'Basic Solar Package',
    'Inversor Solar': 'Solar Inverter',
    'Sistema de Bateria Solar': 'Solar Battery System',
    'Power Bank Solar': 'Solar Power Bank',
    'Generador Diesel': 'Diesel Generator',
    'Generador Portatil': 'Portable Generator',
    'Estacion de Energia Portatil': 'Portable Power Station',
    'Bateria de Litio': 'Lithium Battery',
    'Bateria Ciclo Profundo': 'Deep Cycle Battery',
    'Banco de Baterias Solar': 'Solar Battery Bank',
    'Sistema Hibrido Solar': 'Hybrid Solar System',
    'Controlador Inteligente': 'Smart Energy Controller',
    'Ventilador Solar': 'Solar Fan',
    'Ventilador de Techo Solar': 'Solar Ceiling Fan',
    'Mini Refrigerador': 'Mini Fridge',
    'Refrigerador Solar': 'Solar Fridge',
    'Kit Iluminacion LED Solar': 'Solar LED Lighting Kit',
    'Kit de Iluminacion Solar': 'Solar Lighting Kit',
    'Cargador Solar USB': 'Solar USB Charger',
    'Olla Arrocera': 'Rice Cooker',
    // Coffee
    'Cafe Cubita Molido Oscuro': 'Cubita Dark Roast Coffee',
    'Cafe Cubita Molido Medio': 'Cubita Medium Roast Coffee',
    'Cafe Serrano Molido Oscuro': 'Serrano Dark Roast Coffee',
    'Cafe Serrano Grano Entero': 'Serrano Whole Bean Coffee',
    'Cafe Serrano Molido Suave': 'Serrano Light Roast Coffee',
    'Cafe Turquino Montanes': 'Turquino Mountain Coffee',
    'Cafe Mezcla Cubana': 'Cuban Espresso Blend',
    'Cafe Descafeinado': 'Decaf Coffee',
    'Cafe Instantaneo': 'Instant Coffee',
    // Bundles
    'Paquete Despensa Completa': 'Complete Pantry Bundle',
    'Paquete Familiar Esencial': 'Essential Family Package',
    'Paquete de Proteinas': 'Protein Package',
    'Paquete de Bebidas Tropicales': 'Tropical Beverages Package',
    'Paquete Cafetalero Cubano': 'Cuban Coffee Lovers Package',
    'Paquete de Frutas Frescas': 'Fresh Fruits Package',
    'Mega Paquete Todo Incluido': 'Mega All-Inclusive Package',
    'Kit Generador': 'Generator Kit',
    'Kit Energia para Finca': 'Farm Energy Kit',
    // Produce / Food
    'Arroz Blanco Premium': 'Premium White Rice',
    'Frijoles Negros': 'Black Beans',
    'Leche en Polvo': 'Powdered Milk',
    'Atun en Aceite': 'Tuna in Oil',
    'Aguacate Cubano': 'Cuban Avocado',
  },
  fr: {
    // Solar / Energy
    'Panel Solar Portatil': 'Panneau Solaire Portable',
    'Panel Solar': 'Panneau Solaire',
    'Modulo Solar': 'Module Solaire pour Toit',
    'Kit Solar Basico para Hogar': 'Kit Solaire de Base pour Maison',
    'Kit Solar Basico': 'Kit Solaire de Base',
    'Kit Solar Plegable': 'Kit Solaire Pliable',
    'Kit Solar Off-Grid': 'Kit Solaire Autonome',
    'Paquete Solar Basico': 'Pack Solaire de Base',
    'Inversor Solar': 'Onduleur Solaire',
    'Sistema de Bateria Solar': 'Système de Batterie Solaire',
    'Power Bank Solar': 'Batterie Externe Solaire',
    'Generador Diesel': 'Générateur Diesel',
    'Generador Portatil': 'Générateur Portable',
    'Estacion de Energia Portatil': 'Station d\'Énergie Portable',
    'Bateria de Litio': 'Batterie au Lithium',
    'Bateria Ciclo Profundo': 'Batterie à Décharge Profonde',
    'Banco de Baterias Solar': 'Banque de Batteries Solaire',
    'Sistema Hibrido Solar': 'Système Hybride Solaire',
    'Controlador Inteligente': 'Contrôleur Intelligent d\'Énergie',
    'Ventilador Solar': 'Ventilateur Solaire',
    'Ventilador de Techo Solar': 'Ventilateur de Plafond Solaire',
    'Mini Refrigerador': 'Mini Réfrigérateur',
    'Refrigerador Solar': 'Réfrigérateur Solaire',
    'Kit Iluminacion LED Solar': 'Kit Éclairage LED Solaire',
    'Kit de Iluminacion Solar': 'Kit Éclairage Solaire',
    'Cargador Solar USB': 'Chargeur Solaire USB',
    'Olla Arrocera': 'Cuiseur à Riz',
    // Coffee
    'Cafe Cubita Molido Oscuro': 'Café Cubita Torréfaction Foncée',
    'Cafe Cubita Molido Medio': 'Café Cubita Torréfaction Moyenne',
    'Cafe Serrano Molido Oscuro': 'Café Serrano Torréfaction Foncée',
    'Cafe Serrano Grano Entero': 'Café Serrano Grains Entiers',
    'Cafe Serrano Molido Suave': 'Café Serrano Torréfaction Légère',
    'Cafe Turquino Montanes': 'Café Turquino des Montagnes',
    'Cafe Mezcla Cubana': 'Mélange Espresso Cubain',
    'Cafe Descafeinado': 'Café Décaféiné',
    'Cafe Instantaneo': 'Café Instantané',
    // Bundles
    'Paquete Despensa Completa': 'Pack Garde-Manger Complet',
    'Paquete Familiar Esencial': 'Pack Familial Essentiel',
    'Paquete de Proteinas': 'Pack de Protéines',
    'Paquete de Bebidas Tropicales': 'Pack de Boissons Tropicales',
    'Paquete Cafetalero Cubano': 'Pack Café Cubain',
    'Paquete de Frutas Frescas': 'Pack de Fruits Frais',
    'Mega Paquete Todo Incluido': 'Méga Pack Tout Compris',
    'Kit Generador': 'Kit Générateur',
    'Kit Energia para Finca': 'Kit Énergie pour Ferme',
    // Produce / Food
    'Arroz Blanco Premium': 'Riz Blanc Premium',
    'Frijoles Negros': 'Haricots Noirs',
    'Leche en Polvo': 'Lait en Poudre',
    'Atun en Aceite': 'Thon à l\'Huile',
    'Aguacate Cubano': 'Avocat Cubain',
  },
}

function translateProductName(name: string, lang: string): string {
  if (lang === 'es') return name // Keep original Spanish
  const dict = productNameTranslations[lang] || {}
  // Try exact match first
  if (dict[name]) return dict[name]
  // Try partial match — find the longest key that matches at the start of the name
  for (const [es, translated] of Object.entries(dict)) {
    if (name.toLowerCase().startsWith(es.toLowerCase())) {
      return translated + name.slice(es.length)
    }
  }
  return name // Fallback to original
}

export default function Home() {
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)
  const [featured, setFeatured] = useState<any[]>([])

  useEffect(() => {
    // Use the featured products API (admin-selectable)
    api.getFeaturedProducts().then((data: any) => {
      const arr = Array.isArray(data) ? data : data.products || data.items || []
      if (arr.length > 0) {
        setFeatured(arr.slice(0, 8))
      } else {
        // Fallback: fetch all and pick first 8
        api.getProducts().then((all: any) => {
          const list = Array.isArray(all) ? all : all.products || all.items || []
          setFeatured(list.slice(0, 8))
        }).catch(() => {})
      }
    }).catch(() => {
      // Fallback on error
      api.getProducts().then((all: any) => {
        const list = Array.isArray(all) ? all : all.products || all.items || []
        setFeatured(list.slice(0, 8))
      }).catch(() => {})
    })
  }, [])

  return (
    <div className="-mx-4 -mt-6 -mb-6">
      {/* ───── HERO — compact, Caribbean coastline ───── */}
      <section className="relative h-[50vh] min-h-[360px] max-h-[500px] flex items-center justify-center overflow-hidden">
        <img
          src="/field.png"
          alt="Caribbean agriculture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1628]/60 via-[#0B1628]/40 to-[#0B1628]/70" />

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-4 font-light">
            {t('home.hero.badge')}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-[1.15]">
            {lang === 'es' ? 'El Marketplace de Preorden del Caribe' : lang === 'fr' ? 'Le March\u00E9 de Pr\u00E9commande des Cara\u00EFbes' : 'The Caribbean Preorder Marketplace'}
          </h1>
          <p className="text-white/65 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-8">
            {lang === 'es'
              ? 'Compre productos esenciales, agricultura y energía solar y recíbalos directamente en Cuba.'
              : lang === 'fr'
              ? 'Achetez des produits essentiels, agriculture et énergie solaire livrés directement à Cuba.'
              : 'Purchase essential goods, agriculture, and solar energy delivered directly to Cuba.'}
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
                    <p className="font-medium text-[#0B1628] text-xs sm:text-sm leading-tight mb-1.5 line-clamp-2">{translateProductName(p.name, lang)}</p>
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

      {/* ───── FEATURED IN — logos on light gray bar ───── */}
      <section className="bg-white py-10 sm:py-14 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[9px] uppercase tracking-[0.3em] text-gray-400 font-medium mb-8">
            {t('home.featured.title')}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 sm:gap-10 items-center justify-items-center">
            <img src="/Forbes.png" alt="Forbes" className="h-6 sm:h-7 w-auto max-w-[100px] object-contain opacity-60 hover:opacity-100 transition-opacity" />
            <img src="/cnn.png" alt="CNN" className="h-6 sm:h-7 w-auto max-w-[100px] object-contain opacity-60 hover:opacity-100 transition-opacity" />
            <img src="/freshplaza.png" alt="Fresh Plaza" className="h-6 sm:h-7 w-auto max-w-[100px] object-contain opacity-60 hover:opacity-100 transition-opacity" />
            <img src="/impactalpha.png" alt="ImpactAlpha" className="h-6 sm:h-7 w-auto max-w-[100px] object-contain opacity-60 hover:opacity-100 transition-opacity" />
            <img src="/El_Financiero_Logo.svg.png" alt="El Financiero" className="h-6 sm:h-7 w-auto max-w-[100px] object-contain rounded opacity-80 hover:opacity-100 transition-opacity" />
            <img src="/inforural.png" alt="Inforural" className="h-6 sm:h-7 w-auto max-w-[100px] object-contain opacity-60 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </section>

      {/* ───── MEMBERS OF ───── */}
      <section className="bg-gray-50 py-10 sm:py-14 px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[9px] uppercase tracking-[0.3em] text-gray-400 font-medium mb-8">
            {t('home.members.title')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14">
            <img src="/logo-swiss-sustinable-finance.png" alt="Swiss Sustainable Finance" className="h-10 sm:h-12 w-auto max-w-[180px] object-contain opacity-70 hover:opacity-100 transition-opacity" />
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <img src="/logo-AIIMX-GSGnational-partner-1024x418.png" alt="Alianza por la Inversión de Impacto México" className="h-10 sm:h-12 w-auto max-w-[180px] object-contain opacity-70 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </section>
    </div>
  )
}
