import { useState } from 'react'
import { api } from '../api'
import { useI18n, translate } from '../i18n'

const STATUS_STEPS = ['paid', 'processing', 'shipped', 'delivered']

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  preparing: 'bg-yellow-100 text-yellow-800',
  packed: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  customs: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export default function TrackOrder() {
  const [code, setCode] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [shipment, setShipment] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setOrder(null)
    setShipment(null)
    try {
      const orderCode = code.trim().toUpperCase()
      const result = await api.trackOrder(orderCode)
      setOrder(result)
      // Also fetch shipment info if exists
      try {
        const ship = await api.getShipmentByOrderCode(orderCode)
        if (ship) setShipment(ship)
      } catch {
        // No shipment yet — that's fine
      }
    } catch {
      setError(t('track.notFound'))
    } finally {
      setLoading(false)
    }
  }

  const currentStep = STATUS_STEPS.indexOf(order?.status ?? '')

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0B1628] mb-6">{t('track.title')}</h1>

      <form onSubmit={handleTrack} className="flex gap-2 mb-8">
        <input
          value={code} onChange={e => setCode(e.target.value)}
          placeholder={t('track.placeholder')}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 font-mono text-lg uppercase tracking-wider focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]"
        />
        <button type="submit" disabled={loading}
          className="bg-[#0B1628] text-white px-6 py-3 rounded-lg hover:bg-[#0B1628]/90 font-semibold disabled:bg-gray-400 transition-colors min-h-[44px]">
          {loading ? t('track.searching') : t('track.button')}
        </button>
      </form>

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      {order && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono font-bold text-xl text-[#0B1628]">{order.order_code}</span>
            <span className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>

          {order.status === 'cancelled' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700 font-medium">{t('track.cancelled')}</p>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6">
              {STATUS_STEPS.map((step, idx) => (
                <div key={step} className="flex-1 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${idx <= currentStep ? 'bg-[#0B1628] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {idx <= currentStep ? '\u2713' : idx + 1}
                  </div>
                  <span className={`text-xs mt-1 text-center ${idx <= currentStep ? 'text-[#0B1628] font-medium' : 'text-gray-400'}`}>
                    {t(`status.${step}`)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Shipment details — only shown when a shipment exists */}
          {shipment && (
            <div className="border-t pt-4 mb-4">
              <h3 className="text-sm font-semibold text-[#0B1628] mb-3">{t('track.shipmentDetails')}</h3>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                {shipment.carrier && (
                  <div>
                    <span className="text-gray-400">{t('track.carrier')}: </span>
                    <span className="font-medium text-gray-700">{shipment.carrier}</span>
                  </div>
                )}
                {shipment.tracking_number && (
                  <div>
                    <span className="text-gray-400">{t('track.trackingNo')}: </span>
                    <span className="font-mono text-xs text-gray-700">{shipment.tracking_number}</span>
                  </div>
                )}
                {shipment.estimated_delivery && (
                  <div>
                    <span className="text-gray-400">{t('track.eta')}: </span>
                    <span className="font-medium text-gray-700">{new Date(shipment.estimated_delivery).toLocaleDateString()}</span>
                  </div>
                )}
                {shipment.actual_delivery && (
                  <div>
                    <span className="text-gray-400">{t('track.deliveredAt')}: </span>
                    <span className="font-medium text-green-700">{new Date(shipment.actual_delivery).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Shipment event timeline (newest first) */}
              {shipment.events && shipment.events.length > 0 && (
                <div className="space-y-3">
                  {[...shipment.events].reverse().map((ev: any, idx: number) => (
                    <div key={ev.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${idx === 0 ? 'bg-[#0B1628]' : 'bg-gray-300'}`} />
                        {idx < shipment.events.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${SHIPMENT_STATUS_COLORS[ev.status] || 'bg-gray-100'}`}>
                            {t(`shipment.${ev.status}`)}
                          </span>
                          {ev.location && <span className="text-xs text-gray-500">{ev.location}</span>}
                        </div>
                        {ev.description && <p className="text-sm text-gray-600 mt-0.5">{ev.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(ev.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            <h3 className="text-sm font-semibold text-[#0B1628] mb-2">{t('track.items')}</h3>
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
