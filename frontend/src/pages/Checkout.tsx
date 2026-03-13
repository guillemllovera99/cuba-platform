import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, useAuth } from '../store'
import { api } from '../api'

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const isLoggedIn = useAuth(s => s.isLoggedIn())
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    recipient_name: '',
    recipient_phone: '',
    recipient_city: '',
    recipient_address: '',
    notes: '',
  })

  if (!isLoggedIn) { navigate('/login'); return null }
  if (items.length === 0) { navigate('/cart'); return null }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.recipient_name || !form.recipient_phone || !form.recipient_city) {
      setError('Please fill in all required fields'); return
    }
    setLoading(true)
    setError('')
    try {
      const order = await api.checkout({
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        ...form,
      })
      clearCart()
      navigate(`/order/${order.id}/confirmed`)
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Order Summary</h2>
        {items.map(i => (
          <div key={i.product_id} className="flex justify-between text-sm py-1">
            <span className="text-gray-600">{i.name} x{i.quantity}</span>
            <span className="font-medium">${(i.price_usd * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span>${total().toFixed(2)} USD</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Recipient in Cuba</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input value={form.recipient_name} onChange={set('recipient_name')} required
              className="w-full border rounded px-3 py-2" placeholder="Juan Garcia" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input value={form.recipient_phone} onChange={set('recipient_phone')} required
              className="w-full border rounded px-3 py-2" placeholder="+53 5 1234567" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input value={form.recipient_city} onChange={set('recipient_city')} required
              className="w-full border rounded px-3 py-2" placeholder="Havana" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input value={form.recipient_address} onChange={set('recipient_address')}
              className="w-full border rounded px-3 py-2" placeholder="Calle 23 #456, Vedado" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              className="w-full border rounded px-3 py-2" placeholder="Delivery instructions..." />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
          <p className="text-sm text-yellow-800">Payment is simulated for this prototype. Your order will be confirmed immediately.</p>
        </div>

        <button type="submit" disabled={loading}
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400">
          {loading ? 'Processing...' : `Place Order — $${total().toFixed(2)} USD`}
        </button>
      </form>
    </div>
  )
}
