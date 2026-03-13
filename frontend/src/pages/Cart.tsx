import { Link } from 'react-router-dom'
import { useCart } from '../store'
import { useAuth } from '../store'

export default function Cart() {
  const { items, removeItem, updateQty, total, count } = useCart()
  const isLoggedIn = useAuth(s => s.isLoggedIn())

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
        <Link to="/catalog" className="text-green-600 hover:underline font-medium">Browse products</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart ({count()} items)</h1>
      <div className="bg-white border rounded-lg divide-y">
        {items.map(item => (
          <div key={item.product_id} className="flex items-center gap-4 p-4">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded" />
            )}
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.product_id}`} className="font-medium text-gray-800 hover:text-green-600">
                {item.name}
              </Link>
              <p className="text-sm text-gray-500">${item.price_usd.toFixed(2)} each</p>
            </div>
            <div className="flex items-center border rounded">
              <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100">-</button>
              <span className="px-3 py-1 font-medium text-sm">{item.quantity}</span>
              <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100">+</button>
            </div>
            <p className="font-bold text-gray-900 w-24 text-right">${(item.price_usd * item.quantity).toFixed(2)}</p>
            <button onClick={() => removeItem(item.product_id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-lg p-6 mt-4 flex items-center justify-between">
        <p className="text-xl font-bold text-gray-900">Total: ${total().toFixed(2)} USD</p>
        {isLoggedIn ? (
          <Link to="/checkout" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold">
            Proceed to Checkout
          </Link>
        ) : (
          <Link to="/login" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold">
            Login to Checkout
          </Link>
        )}
      </div>
    </div>
  )
}
