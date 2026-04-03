import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store'
import { useI18n, translate } from '../i18n'
import { api } from '../api'

interface ProfileData {
  full_name: string
  phone: string
  address: string
  city: string
  country: string
}

export default function Profile() {
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)
  const { user, isLoggedIn, setAuth, token } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn()) navigate('/login')
  }, [isLoggedIn, navigate])

  // Load current user data
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        full_name: user.full_name || '',
        phone: (user as any).phone || '',
        address: (user as any).address || '',
        city: (user as any).city || '',
        country: (user as any).country || '',
      }))
    }
    // Also fetch fresh data from /auth/me
    api.me().then((data: any) => {
      setProfile(prev => ({
        ...prev,
        full_name: data.full_name || prev.full_name,
        phone: data.phone || prev.phone,
        address: data.address || prev.address || '',
        city: data.city || prev.city || '',
        country: data.country || prev.country || '',
      }))
    }).catch(() => {})
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const updated = await api.updateProfile(profile)
      // Update local auth store with new data
      if (token && user) {
        setAuth(token, { ...user, full_name: updated.full_name, phone: updated.phone } as any)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const labels = {
    title: lang === 'es' ? 'Mi Perfil' : lang === 'fr' ? 'Mon Profil' : 'My Profile',
    personal: lang === 'es' ? 'Información Personal' : lang === 'fr' ? 'Informations Personnelles' : 'Personal Information',
    billing: lang === 'es' ? 'Métodos de Pago' : lang === 'fr' ? 'Méthodes de Paiement' : 'Payment Methods',
    name: lang === 'es' ? 'Nombre completo' : lang === 'fr' ? 'Nom complet' : 'Full name',
    email: lang === 'es' ? 'Correo electrónico' : lang === 'fr' ? 'Adresse e-mail' : 'Email',
    phone: lang === 'es' ? 'Teléfono' : lang === 'fr' ? 'Téléphone' : 'Phone',
    address: lang === 'es' ? 'Dirección' : lang === 'fr' ? 'Adresse' : 'Address',
    city: lang === 'es' ? 'Ciudad' : lang === 'fr' ? 'Ville' : 'City',
    country: lang === 'es' ? 'País' : lang === 'fr' ? 'Pays' : 'Country',
    save: lang === 'es' ? 'Guardar cambios' : lang === 'fr' ? 'Enregistrer' : 'Save changes',
    saving: lang === 'es' ? 'Guardando...' : lang === 'fr' ? 'Enregistrement...' : 'Saving...',
    saved: lang === 'es' ? 'Guardado' : lang === 'fr' ? 'Enregistré' : 'Saved',
    accountType: lang === 'es' ? 'Tipo de cuenta' : lang === 'fr' ? 'Type de compte' : 'Account type',
    cardSaved: lang === 'es' ? 'Tarjeta guardada' : lang === 'fr' ? 'Carte enregistrée' : 'Saved card',
    noCard: lang === 'es' ? 'No hay tarjeta guardada' : lang === 'fr' ? 'Aucune carte enregistrée' : 'No saved card',
    addCard: lang === 'es' ? 'Agregar tarjeta' : lang === 'fr' ? 'Ajouter une carte' : 'Add card',
    paypal: lang === 'es' ? 'Cuenta PayPal' : lang === 'fr' ? 'Compte PayPal' : 'PayPal account',
    noPaypal: lang === 'es' ? 'No conectado' : lang === 'fr' ? 'Non connecté' : 'Not connected',
    connectPaypal: lang === 'es' ? 'Conectar PayPal' : lang === 'fr' ? 'Connecter PayPal' : 'Connect PayPal',
    bankTransfer: lang === 'es' ? 'Transferencia bancaria' : lang === 'fr' ? 'Virement bancaire' : 'Bank transfer',
    bankDesc: lang === 'es' ? 'Disponible al momento del pago' : lang === 'fr' ? 'Disponible au moment du paiement' : 'Available at checkout',
    comingSoon: lang === 'es' ? 'Próximamente' : lang === 'fr' ? 'Bientôt disponible' : 'Coming soon',
  }

  if (!isLoggedIn()) return null

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-[#0B1628] mb-8">{labels.title}</h1>

      {/* ───── Personal Information ───── */}
      <section className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#0B1628] mb-5">{labels.personal}</h2>

        <div className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{labels.email}</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm"
            />
          </div>

          {/* Account type (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{labels.accountType}</label>
            <input
              type="text"
              value={user?.account_type ? user.account_type.charAt(0).toUpperCase() + user.account_type.slice(1) : 'Buyer'}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm"
            />
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{labels.name}</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{labels.phone}</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="+1 234 567 890"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{labels.address}</label>
            <input
              type="text"
              value={profile.address}
              onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* City + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{labels.city}</label>
              <input
                type="text"
                value={profile.city}
                onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{labels.country}</label>
              <input
                type="text"
                value={profile.country}
                onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
          >
            {saving ? labels.saving : saved ? labels.saved : labels.save}
          </button>
          {saved && <span className="text-green-600 text-sm">&check;</span>}
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
      </section>

      {/* ───── Payment Methods ───── */}
      <section className="bg-white border border-gray-100 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#0B1628] mb-5">{labels.billing}</h2>

        <div className="space-y-4">
          {/* Credit Card (Stripe) */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0B1628] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#0B1628]">
                  {lang === 'es' ? 'Tarjeta de Crédito / Débito' : lang === 'fr' ? 'Carte de Crédit / Débit' : 'Credit / Debit Card'}
                </p>
                <p className="text-xs text-gray-400">
                  {lang === 'es' ? 'Visa, Mastercard, Amex — via Stripe' : lang === 'fr' ? 'Visa, Mastercard, Amex — via Stripe' : 'Visa, Mastercard, Amex — via Stripe'}
                </p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">
              {lang === 'es' ? 'Disponible' : lang === 'fr' ? 'Disponible' : 'Available'}
            </span>
          </div>

          {/* PayPal */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#003087] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">PP</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#0B1628]">PayPal</p>
                <p className="text-xs text-gray-400">
                  {lang === 'es' ? 'Pagar con tu cuenta PayPal' : lang === 'fr' ? 'Payer avec votre compte PayPal' : 'Pay with your PayPal account'}
                </p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">
              {lang === 'es' ? 'Disponible' : lang === 'fr' ? 'Disponible' : 'Available'}
            </span>
          </div>

          {/* Bank Transfer */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#0B1628]">{labels.bankTransfer}</p>
                <p className="text-xs text-gray-400">{labels.bankDesc}</p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">
              {lang === 'es' ? 'Disponible' : lang === 'fr' ? 'Disponible' : 'Available'}
            </span>
          </div>

          {/* Platform Credits */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#0B1628]">
                  {lang === 'es' ? 'Créditos de Plataforma' : lang === 'fr' ? 'Crédits Plateforme' : 'Platform Credits'}
                </p>
                <p className="text-xs text-gray-400">
                  {lang === 'es' ? 'Pagar con tu saldo de billetera' : lang === 'fr' ? 'Payer avec votre solde portefeuille' : 'Pay with your wallet balance'}
                </p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">
              {lang === 'es' ? 'Disponible' : lang === 'fr' ? 'Disponible' : 'Available'}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-400 leading-relaxed">
          {lang === 'es'
            ? 'Todos los métodos de pago se seleccionan al momento del checkout. La tarjeta y PayPal requieren configurar claves Stripe/PayPal en Railway.'
            : lang === 'fr'
            ? 'Toutes les méthodes de paiement sont sélectionnées lors du checkout. La carte et PayPal nécessitent la configuration des clés Stripe/PayPal dans Railway.'
            : 'All payment methods are selected at checkout. Card and PayPal require Stripe/PayPal API keys configured in Railway environment variables.'}
        </p>
      </section>
    </div>
  )
}
