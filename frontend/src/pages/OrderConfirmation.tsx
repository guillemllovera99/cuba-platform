import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useI18n, translate } from '../i18n'

export default function OrderConfirmation() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  const paymentResult = searchParams.get('payment')
  const provider = searchParams.get('provider')
  const paypalToken = searchParams.get('token') // PayPal adds this on return

  useEffect(() => {
    if (!id) return

    // If returning from PayPal with approval, capture the payment first
    if (provider === 'paypal' && paypalToken && paymentResult === 'success') {
      setCapturing(true)
      api.paypalCapture(paypalToken, id)
        .then(() => {
          setPaymentStatus('success')
          // Reload order to get updated status
          return api.getOrder(id)
        })
        .then(setOrder)
        .catch(() => {
          setPaymentStatus('error')
          api.getOrder(id).then(setOrder).catch(() => {})
        })
        .finally(() => setCapturing(false))
    } else {
      // Stripe or mock — just load the order
      if (paymentResult) setPaymentStatus(paymentResult)
      api.getOrder(id).then(setOrder).catch(() => {})
    }
  }, [id])

  if (capturing) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-[#0B1628] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">{t('checkout.processing')}</p>
      </div>
    )
  }

  if (!order) return <p className="text-center py-12 text-gray-500">Loading...</p>

  const isPending = order.status === 'pending_payment'
  const isCancelled = paymentStatus === 'cancelled'

  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        {/* Icon */}
        {isCancelled ? (
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        ) : isPending ? (
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ) : (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        <h1 className="text-2xl font-bold text-[#0B1628] mb-2">
          {isCancelled ? t('confirmation.paymentCancelled') : isPending ? t('confirmation.paymentPending') : t('confirmation.title')}
        </h1>

        {isCancelled && (
          <p className="text-sm text-amber-700 mb-4">{t('confirmation.paymentCancelledDesc')}</p>
        )}
        {isPending && !isCancelled && (
          <p className="text-sm text-blue-700 mb-4">{t('confirmation.paymentPendingDesc')}</p>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">{t('confirmation.code')}</p>
          <p className="text-2xl font-mono font-bold text-[#0B1628]">{order.order_code}</p>
          <p className="text-xs text-gray-400 mt-1">{t('confirmation.shareCode')}</p>
        </div>

        <div className="text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('confirmation.recipient')}</span>
            <span className="font-medium">{order.recipient_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('confirmation.city')}</span>
            <span className="font-medium">{order.recipient_city}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('confirmation.total')}</span>
            <span className="font-bold">${order.total_usd?.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('confirmation.status')}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
              order.status === 'paid' ? 'bg-green-100 text-green-800' :
              order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {t(`status.${order.status}`) || order.status}
            </span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <h3 className="text-sm font-semibold text-[#0B1628] text-left">{t('confirmation.orderItems')}</h3>
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
              <span className="font-medium">${item.subtotal_usd.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Link to="/orders" className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">
            {t('confirmation.myOrders')}
          </Link>
          <Link to="/catalog" className="flex-1 bg-[#0B1628] text-white py-2 rounded-lg hover:bg-[#0B1628]/90 font-medium text-sm transition-colors">
            {t('confirmation.continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  )
}
