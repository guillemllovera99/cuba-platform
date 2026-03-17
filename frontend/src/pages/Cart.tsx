import { Link } from 'react-router-dom'
import { useCart } from '../store'
import { useAuth } from '../store'
import { useI18n, translate } from '../i18n'

export default function Cart() {
  const { items, removeItem, updateQty, total, count } = useCart()
  const isLoggedIn = useAuth(s => s.isLoggedIn())
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">{t('cart.empty')}</p>
        <Link to="/catalog" className="text-[#0B1628] hover:underline font-medium">{t('cart.browse')}</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0B1628] mb-6">{t('cart.title')} ({count()} {t('cart.items')})</h1>
      <div className="bg-white border border-gray-200 rounded-lg divide-y">
        {items.map(item => (
          <div key={item.product_id} className="flex items-center gap-4 p-4">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded" />
            )}
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.product_id}`} className="font-medium text-gray-800 hover:text-[#0B1628]">
                {item.name}
              </Link>
              <p className="text-sm text-gray-500">${item.price_usd.toFixed(2)} {t('cart.each')}</p>
            </div>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100">-</button>
              <span className="px-3 py-1 font-medium text-sm">{item.quantity}</span>
              <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100">+</button>
            </div>
            <p className="font-bold text-[#0B1628] w-24 text-right">${(item.price_usd * item.quantity).toFixed(2)}</p>
            <button onClick={() => removeItem(item.product_id)} className="text-red-500 hover:text-red-700 text-sm">{t('cart.remove')}</button>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4 flex items-center justify-between">
        <p className="text-xl font-bold text-[#0B1628]">{t('cart.total')}: ${total().toFixed(2)} USD</p>
        {isLoggedIn ? (
          <Link to="/checkout" className="bg-[#0B1628] text-white px-8 py-3 rounded-lg hover:bg-[#0B1628]/90 font-semibold transition-colors">
            {t('cart.checkout')}
          </Link>
        ) : (
          <Link to="/login" className="bg-[#0B1628] text-white px-8 py-3 rounded-lg hover:bg-[#0B1628]/90 font-semibold transition-colors">
            {t('cart.loginToCheckout')}
          </Link>
        )}
      </div>
    </div>
  )
}
