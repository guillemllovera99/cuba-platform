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
          <div key={item.product_id} className="p-4">
            {/* Mobile: stacked layout / Desktop: horizontal */}
            <div className="flex gap-3 sm:gap-4 items-start sm:items-center">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product_id}`} className="font-medium text-gray-800 hover:text-[#0B1628] text-sm sm:text-base line-clamp-2">
                  {item.name}
                </Link>
                <p className="text-sm text-gray-500">${item.price_usd.toFixed(2)} {t('cart.each')}</p>
              </div>
            </div>
            {/* Quantity + price + remove — always below on mobile, inline on desktop */}
            <div className="flex items-center justify-between mt-3 sm:mt-2 sm:pl-20">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center">-</button>
                <span className="px-3 py-1.5 font-medium text-sm">{item.quantity}</span>
                <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center">+</button>
              </div>
              <p className="font-bold text-[#0B1628] text-base">${(item.price_usd * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeItem(item.product_id)} className="text-red-500 hover:text-red-700 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center">{t('cart.remove')}</button>
            </div>
          </div>
        ))}
      </div>
      {/* Total + checkout — stack on mobile */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xl font-bold text-[#0B1628]">{t('cart.total')}: ${total().toFixed(2)} USD</p>
        {isLoggedIn ? (
          <Link to="/checkout" className="w-full sm:w-auto text-center bg-[#0B1628] text-white px-8 py-3 rounded-lg hover:bg-[#0B1628]/90 font-semibold transition-colors min-h-[48px] flex items-center justify-center">
            {t('cart.checkout')}
          </Link>
        ) : (
          <Link to="/login" className="w-full sm:w-auto text-center bg-[#0B1628] text-white px-8 py-3 rounded-lg hover:bg-[#0B1628]/90 font-semibold transition-colors min-h-[48px] flex items-center justify-center">
            {t('cart.loginToCheckout')}
          </Link>
        )}
      </div>
    </div>
  )
}
