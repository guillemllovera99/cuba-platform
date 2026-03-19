import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useCart } from '../store'
import { api } from '../api'
import { useI18n, translate } from '../i18n'

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [reorderedId, setReorderedId] = useState<string | null>(null)
  const isLoggedIn = useAuth(s => s.isLoggedIn())
  const addItem = useCart(s => s.addItem)
  const navigate = useNavigate()
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return }
    api.myOrders().then(setOrders).catch(() => {})
  }, [isLoggedIn])

  const handleReorder = async (order: any) => {
    for (const item of order.items || []) {
      try {
        const product = await api.getProduct(item.product_id)
        if (product && product.stock_quantity > 0) {
          addItem({ id: product.id, name: product.name, price_usd: product.price_usd, image_url: product.image_url }, item.quantity)
        }
      } catch { /* product may have been removed */ }
    }
    setReorderedId(order.id)
    setTimeout(() => setReorderedId(null), 2000)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0B1628] mb-6">{t('orders.title')}</h1>
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{t('orders.noOrders')}</p>
          <Link to="/catalog" className="text-[#0B1628] hover:underline">{t('orders.shopNow')}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#0B1628]">{order.order_code}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {t(`status.${order.status}`) || order.status.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {order.items?.length || 0} {t('orders.items')} &middot; {order.recipient_name}, {order.recipient_city}
                </div>
                <span className="font-bold text-[#0B1628]">${order.total_usd?.toFixed(2)}</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {order.items?.map((i: any) => (
                  <span key={i.id} className="mr-3">{i.product_name} x{i.quantity}</span>
                ))}
              </div>
              {/* Reorder button (US-14) */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => handleReorder(order)}
                  className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors min-h-[44px] font-medium"
                >
                  {reorderedId === order.id ? t('orders.reordered') : t('orders.reorder')}
                </button>
                <Link
                  to={`/track`}
                  className="text-sm text-gray-500 hover:text-[#0B1628] transition-colors"
                >
                  {t('nav.track')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
