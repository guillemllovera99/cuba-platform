import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart, useAuth } from '../store'
import { api } from '../api'
import { useI18n, translate } from '../i18n'

type PaymentMethod = 'stripe' | 'paypal' | 'bank_transfer'

type PickupPoint = {
  id: string
  name: string
  city: string
  address: string
  contact_phone: string
}

type BankTransferInfo = {
  iban: string
  swift_bic: string
  payment_reference: string
  amount_usd: number
  bank_name: string
  account_holder: string
}

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const isLoggedIn = useAuth(s => s.isLoggedIn())
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  const [paymentConfig, setPaymentConfig] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe')

  const [form, setForm] = useState({
    recipient_name: '',
    recipient_phone: '',
    recipient_city: '',
    recipient_address: '',
    notes: '',
    pickup_point_id: '',
  })

  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
  const [bankTransferInfo, setBankTransferInfo] = useState<BankTransferInfo | null>(null)
  const [bankTransferOrderCode, setBankTransferOrderCode] = useState('')

  useEffect(() => {
    api.paymentConfig().then(cfg => {
      setPaymentConfig(cfg)
      setPaymentMethod('stripe')
    }).catch(() => {
      setPaymentConfig({ stripe_enabled: false, paypal_enabled: false, payments_enabled: true })
      setPaymentMethod('stripe')
    })

    api.getPickupPoints().then((grouped: any) => {
      const flat: PickupPoint[] = []
      if (grouped && typeof grouped === 'object') {
        Object.values(grouped).forEach((cityPoints: any) => {
          if (Array.isArray(cityPoints)) flat.push(...cityPoints)
        })
      }
      setPickupPoints(flat)
    }).catch(() => {
      setPickupPoints([])
    })
  }, [])

  if (!isLoggedIn) { navigate('/login'); return null }
  if (items.length === 0) { navigate('/cart'); return null }

  // If bank transfer instructions are displayed, show them instead of the form
  if (bankTransferInfo) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0B1628] mb-6">{t('checkout.title')}</h1>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex gap-3 mb-4">
            <div className="shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-green-800 mb-2">{t('checkout.bankTransferSuccess')}</h2>
              <p className="text-sm text-green-700 mb-1">{t('checkout.bankTransferNote')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-[#0B1628] mb-4">{t('checkout.bankTransferInstructions')}</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t('checkout.bankName')}</p>
              <p className="text-base text-gray-900">{bankTransferInfo.bank_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t('checkout.iban')}</p>
              <p className="text-base font-mono text-gray-900 break-all">{bankTransferInfo.iban}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t('checkout.swift')}</p>
              <p className="text-base font-mono text-gray-900">{bankTransferInfo.swift_bic}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t('checkout.reference')}</p>
              <p className="text-base font-mono text-gray-900 break-all">{bankTransferInfo.payment_reference}</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Amount</p>
              <p className="text-base font-semibold text-gray-900">${bankTransferInfo.amount_usd.toFixed(2)} USD</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">{t('checkout.recipient')}</p>
              <p className="text-base text-gray-900">{bankTransferInfo.account_holder}</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Order Code</p>
              <p className="text-base font-mono text-gray-900">{bankTransferOrderCode}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-6">{t('checkout.bankTransferDesc')}</p>
        </div>
      </div>
    )
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const subtotal = total()
  const paymentAmount = subtotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.recipient_name || !form.recipient_phone || !form.recipient_city) {
      setError(t('checkout.fillRequired')); return
    }

    setLoading(true)
    setError('')

    try {
      // Step 1: Create order
      const order = await api.checkout({
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        ...form,
      })

      // Step 2: If already paid (mock mode), go to confirmation
      if (order.status === 'paid') {
        clearCart()
        navigate(`/order/${order.id}/confirmed`)
        return
      }

      // Step 3: Handle bank transfer
      if (paymentMethod === 'bank_transfer') {
        const bankInfo = await api.bankTransferInitiate(order.id)
        clearCart()
        setBankTransferInfo(bankInfo)
        setBankTransferOrderCode(order.id)
        return
      }

      // Step 4: Redirect to payment provider for full payment
      if (paymentMethod === 'stripe') {
        const session = await api.stripeCreateSession(order.id)
        clearCart()
        window.location.href = session.url
        return
      }

      if (paymentMethod === 'paypal') {
        const paypalOrder = await api.paypalCreateOrder(order.id)
        clearCart()
        window.location.href = paypalOrder.approve_url
        return
      }

      // Fallback
      clearCart()
      navigate(`/order/${order.id}/confirmed`)
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  // Group pickup points by city for dropdown
  const pickupPointsByCity: { [key: string]: PickupPoint[] } = {}
  pickupPoints.forEach(pp => {
    if (!pickupPointsByCity[pp.city]) {
      pickupPointsByCity[pp.city] = []
    }
    pickupPointsByCity[pp.city].push(pp)
  })

  const handlePickupPointSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pickupId = e.target.value
    setForm(f => ({ ...f, pickup_point_id: pickupId }))
    if (pickupId) {
      const selected = pickupPoints.find(pp => pp.id === pickupId)
      if (selected) {
        setForm(f => ({ ...f, recipient_city: selected.city }))
      }
    }
  }

  // Payment method context messages
  const getPaymentNotice = () => {
    if (paymentMethod === 'bank_transfer') {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800">
            {lang === 'es' ? 'Se mostrarán los datos bancarios para completar la transferencia.'
              : lang === 'fr' ? 'Les coordonnées bancaires seront affichées pour compléter le virement.'
              : 'Bank details will be shown to complete the transfer.'}
          </p>
        </div>
      )
    }
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
        <p className="text-sm text-blue-800">{t('checkout.redirectNotice')}</p>
      </div>
    )
  }

  // Button label
  const getButtonLabel = () => {
    if (loading) return t('checkout.processing')
    return `${t('checkout.payDeposit')} — $${paymentAmount.toFixed(2)} USD`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0B1628] mb-6">{t('checkout.title')}</h1>

      {/* Order Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="font-semibold text-[#0B1628] mb-3">{t('checkout.summary')}</h2>
        {items.map(i => (
          <div key={i.product_id} className="flex justify-between text-sm py-1">
            <span className="text-gray-600">{i.name} x{i.quantity}</span>
            <span className="font-medium">${(i.price_usd * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3">
          <div className="flex justify-between text-sm font-medium text-[#0B1628]">
            <span>{t('checkout.total')}</span>
            <span>${subtotal.toFixed(2)} USD</span>
          </div>
        </div>
      </div>

      {/* Refund Policy Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 sm:mb-6">
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">{t('checkout.depositExplainer')}</p>
            <p className="text-xs text-blue-600 mt-1">{t('checkout.depositExplainerDetail')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        {/* Recipient */}
        <h2 className="font-semibold text-[#0B1628] mb-4">{t('checkout.recipient')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.name')} *</label>
            <input value={form.recipient_name} onChange={set('recipient_name')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]" placeholder={t('checkout.namePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.phone')} *</label>
            <input value={form.recipient_phone} onChange={set('recipient_phone')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]" placeholder={t('checkout.phonePlaceholder')} />
          </div>

          {/* Pickup Point Dropdown (Phase 5) */}
          {pickupPoints.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.pickupPoint')}</label>
              <select value={form.pickup_point_id} onChange={handlePickupPointSelect}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]">
                <option value="">{t('checkout.pickupPointNone')}</option>
                {Object.entries(pickupPointsByCity).map(([city, points]) => (
                  <optgroup key={city} label={city}>
                    {points.map(point => (
                      <option key={point.id} value={point.id}>
                        {point.name} - {point.address}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">{t('checkout.orManualAddress')}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.city')} *</label>
            <input value={form.recipient_city} onChange={set('recipient_city')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]" placeholder={t('checkout.cityPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.address')}</label>
            <input value={form.recipient_address} onChange={set('recipient_address')}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]" placeholder={t('checkout.addressPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.notes')}</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]" placeholder={t('checkout.notesPlaceholder')} />
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mt-6">
          <h2 className="font-semibold text-[#0B1628] mb-3">{t('checkout.paymentMethod')}</h2>
          <div className="space-y-2">
            {/* Credit / Debit Card */}
            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-[#0B1628] bg-[#0B1628]/5' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')} className="accent-[#0B1628]" />
              <div className="flex items-center gap-2 flex-1">
                <svg viewBox="0 0 28 12" className="h-4 w-7" aria-label="Card">
                  <rect width="28" height="12" rx="2" fill="#635BFF"/>
                  <text x="14" y="9" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">S</text>
                </svg>
                <span className="text-sm font-medium text-gray-800">{t('checkout.creditCard')}</span>
              </div>
            </label>

            {/* PayPal */}
            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-[#0B1628] bg-[#0B1628]/5' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'paypal'}
                onChange={() => setPaymentMethod('paypal')} className="accent-[#0B1628]" />
              <div className="flex items-center gap-2 flex-1">
                <svg viewBox="0 0 28 12" className="h-4 w-7" aria-label="PayPal">
                  <rect width="28" height="12" rx="2" fill="#003087"/>
                  <text x="14" y="9" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">P</text>
                </svg>
                <span className="text-sm font-medium text-gray-800">PayPal</span>
              </div>
            </label>

            {/* Bank Transfer */}
            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'bank_transfer' ? 'border-[#0B1628] bg-[#0B1628]/5' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'bank_transfer'}
                onChange={() => setPaymentMethod('bank_transfer')} className="accent-[#0B1628]" />
              <div className="flex items-center gap-2 flex-1">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-800">{t('checkout.bankTransfer')}</span>
              </div>
            </label>
          </div>
        </div>


        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        {/* Context-specific payment notice (not for wallet) */}
        {getPaymentNotice()}

        <button type="submit" disabled={loading}
          className="w-full mt-6 bg-green-600 text-white py-3.5 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 transition-colors min-h-[48px] text-base">
          {getButtonLabel()}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">{t('checkout.totalOrder')}: ${subtotal.toFixed(2)} USD</p>
      </form>
    </div>
  )
}
