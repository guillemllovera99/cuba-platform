import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store'
import { api } from '../api'

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
  const isLoggedIn = useAuth(s => s.isLoggedIn())
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return }
    api.myOrders().then(setOrders).catch(() => {})
  }, [isLoggedIn])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Link to="/catalog" className="text-green-600 hover:underline">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-green-700">{order.order_code}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {order.items?.length || 0} item(s) &middot; To: {order.recipient_name}, {order.recipient_city}
                </div>
                <span className="font-bold text-gray-900">${order.total_usd?.toFixed(2)}</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {order.items?.map((i: any) => (
                  <span key={i.id} className="mr-3">{i.product_name} x{i.quantity}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
