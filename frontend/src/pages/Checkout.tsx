import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, useAuth } from '../store'
import { api } from '../api'
import { useI18n, translate } from '../i18n'

type PaymentMethod = 'stripe' | 'paypal' | 'mock'

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const isLoggedIn = useAuth(s => s.isLoggedIn())
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  const [paymentConfig, setPaymentConfig] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mock')

  const [form, setForm] = useState({
    recipient_name: '',
    recipient_phone: '',
    recipient_city: '',
    recipient_address: '',
    notes: '',
  })

  useEffect(() => {
    api.paymentConfig().then(cfg => {
      setPaymentConfig(cfg)
      if (cfg.stripe_enabled) setPaymentMethod('stripe')
      else if (cfg.paypal_enabled) setPaymentMethod('paypal')
      else setPaymentMethod('mock')
    }).catch(() => {
      setPaymentConfig({ stripe_enabled: false, paypal_enabled: false, payments_enabled: false })
      setPaymentMethod('mock')
    })
  }, [])

  if (!isLoggedIn) { navigate('/login'); return null }
  if (items.length === 0) { navigate('/cart'); return null }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const subtotal = total()
  const depositAmount = Math.round(subtotal * 0.20 * 100) / 100
  const balanceAmount = Math.round((subtotal - depositAmount) * 100) / 100
  const isMock = !paymentConfig?.payments_enabled

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

      // Step 2: If already deposit_paid (mock mode), go to confirmation
      if (order.status === 'deposit_paid' || order.status === 'paid') {
        clearCart()
        navigate(`/order/${order.id}/confirmed`)
        return
      }

      // Step 3: Redirect to payment provider for deposit
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

  const stripeAvailable = paymentConfig?.stripe_enabled
  const paypalAvailable = paymentConfig?.paypal_enabled

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0B1628] mb-6">{t('checkout.title')}</h1>

      {/* Order Summary with Deposit Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="font-semibold text-[#0B1628] mb-3">{t('checkout.summary')}</h2>
        {items.map(i => (
          <div key={i.product_id} className="flex justify-between text-sm py-1">
            <span className="text-gray-600">{i.name} x{i.quantity}</span>
            <span className="font-medium">${(i.price_usd * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t('checkout.subtotal')}</span>
            <span>${subtotal.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-sm font-medium text-green-700 bg-green-50 px-2 py-1.5 rounded">
            <span>{t('checkout.depositNow')} (20%)</span>
            <span>${depositAmount.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>{t('checkout.balanceLater')} (80%)</span>
            <span>${balanceAmount.toFixed(2)} USD</span>
          </div>
        </div>
      </div>

      {/* Deposit Info Banner */}
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
        {!isMock && (
          <div className="mt-6">
            <h2 className="font-semibold text-[#0B1628] mb-3">{t('checkout.paymentMethod')}</h2>
            <div className="space-y-2">
              {stripeAvailable && (
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-[#0B1628] bg-[#0B1628]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')} className="accent-[#0B1628]" />
                  <div className="flex items-center gap-2 flex-1">
                    <svg viewBox="0 0 28 12" className="h-4 w-7" aria-label="Stripe">
                      <rect width="28" height="12" rx="2" fill="#635BFF"/>
                      <text x="14" y="9" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">S</text>
                    </svg>
                    <span className="text-sm font-medium text-gray-800">{t('checkout.creditCard')}</span>
                  </div>
                </label>
              )}
              {paypalAvailable && (
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
              )}
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        {isMock && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-amber-800">{t('checkout.simulated')}</p>
          </div>
        )}

        {!isMock && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-blue-800">{t('checkout.redirectNotice')}</p>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full mt-6 bg-green-600 text-white py-3.5 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 transition-colors min-h-[48px] text-base">
          {loading ? t('checkout.processing') : `${t('checkout.payDeposit')} — $${depositAmount.toFixed(2)} USD`}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">{t('checkout.totalOrder')}: ${subtotal.toFixed(2)} USD</p>
      </form>
    </div>
  )
}
