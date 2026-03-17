import { useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'

const STATUS_STEPS = ['paid', 'processing', 'shipped', 'delivered']

export default function TrackOrder() {
  const [code, setCode] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useI18n(s => s.t)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const result = await api.trackOrder(code.trim().toUpperCase())
      setOrder(result)
    } catch {
      setError('Order not found. Check the code and try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentStep = STATUS_STEPS.indexOf(order?.status ?? '')

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('track.title')}</h1>

      <form onSubmit={handleTrack} className="flex gap-2 mb-8">
        <input
          value={code} onChange={e => setCode(e.target.value)}
          placeholder={t('track.placeholder')}
          className="flex-1 border rounded-lg px-4 py-3 font-mono text-lg uppercase tracking-wider"
        />
        <button type="submit" disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400">
          {loading ? t('track.searching') : t('track.button')}
        </button>
      </form>

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      {order && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono font-bold text-xl text-green-700">{order.order_code}</span>
            <span className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>

          {order.status === 'cancelled' ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
              <p className="text-red-700 font-medium">{t('track.cancelled')}</p>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6">
              {STATUS_STEPS.map((step, idx) => (
                <div key={step} className="flex-1 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${idx <= currentStep ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {idx <= currentStep ? '\u2713' : idx + 1}
                  </div>
                  <span className={`text-xs mt-1 text-center ${idx <= currentStep ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                    {t(`status.${step}`)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('track.recipient')}</span>
              <span className="font-medium">{order.recipient_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('track.city')}</span>
              <span className="font-medium">{order.recipient_city}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('track.total')}</span>
              <span className="font-bold">${order.total_usd?.toFixed(2)} USD</span>
            </div>
          </div>

          <div className="border-t mt-4 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('track.items')}</h3>
            {order.items?.map((i: any) => (
              <div key={i.id} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{i.product_name} x{i.quantity}</span>
                <span>${i.subtotal_usd.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
