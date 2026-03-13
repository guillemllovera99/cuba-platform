import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

export default function OrderConfirmation() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (id) api.getOrder(id).then(setOrder).catch(() => {})
  }, [id])

  if (!order) return <p className="text-center py-12 text-gray-500">Loading...</p>

  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="bg-white border rounded-lg p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 mb-6">Your order has been placed successfully.</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Order Code</p>
          <p className="text-2xl font-mono font-bold text-green-700">{order.order_code}</p>
          <p className="text-xs text-gray-400 mt-1">Share this code with the recipient to track the order</p>
        </div>

        <div className="text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Recipient</span>
            <span className="font-medium">{order.recipient_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">City</span>
            <span className="font-medium">{order.recipient_city}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-bold">${order.total_usd?.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium uppercase">{order.status}</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 text-left">Items</h3>
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
              <span className="font-medium">${item.subtotal_usd.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Link to="/orders" className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 font-medium text-sm">
            My Orders
          </Link>
          <Link to="/catalog" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
