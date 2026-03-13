import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store'
import { api } from '../../api'

const STATUSES = ['', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const isAdmin = useAuth(s => s.isAdmin())
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    loadOrders()
  }, [isAdmin, filter])

  const loadOrders = () => {
    api.adminOrders(filter || undefined).then(setOrders).catch(() => {})
  }

  const handleStatus = async (orderId: string, newStatus: string) => {
    await api.updateOrderStatus(orderId, newStatus)
    loadOrders()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <Link to="/admin" className="bg-white border px-3 py-2 rounded text-sm hover:bg-gray-50">&larr; Dashboard</Link>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded text-sm ${filter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-green-700">{order.order_code}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()} &middot; ${order.total_usd?.toFixed(2)} USD
                  </p>
                </div>
                <select
                  value={order.status}
                  onChange={e => handleStatus(order.id, e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {STATUSES.filter(Boolean).map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-400">Recipient: </span>
                  <span className="text-gray-700">{order.recipient_name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Phone: </span>
                  <span className="text-gray-700">{order.recipient_phone}</span>
                </div>
                <div>
                  <span className="text-gray-400">City: </span>
                  <span className="text-gray-700">{order.recipient_city}</span>
                </div>
                {order.recipient_address && (
                  <div>
                    <span className="text-gray-400">Address: </span>
                    <span className="text-gray-700">{order.recipient_address}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-2">
                {order.items?.map((i: any) => (
                  <div key={i.id} className="flex justify-between text-sm py-0.5">
                    <span className="text-gray-600">{i.product_name} x{i.quantity}</span>
                    <span className="font-medium">${i.subtotal_usd.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
