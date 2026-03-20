import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../store'
import { useI18n, translate, tCat } from '../i18n'
import { tProductName } from '../productNames'

export default function Product() {
  const { id } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCart(s => s.addItem)
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  useEffect(() => {
    if (id) api.getProduct(id).then(setProduct).catch(() => {})
  }, [id])

  if (!product) return <p className="text-center py-12 text-gray-500">Loading...</p>

  const handleAdd = () => {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div>
      <Link to="/catalog" className="text-sm text-[#0B1628]/70 hover:text-[#0B1628] hover:underline mb-4 inline-block">&larr; {t('product.back')}</Link>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden md:flex shadow-sm">
        {product.image_url && (
          <img src={product.image_url} alt={product.name} className="w-full md:w-1/2 h-72 md:h-auto object-cover" />
        )}
        <div className="p-4 sm:p-6 flex-1">
          <span className="text-sm text-[#0B1628]/60 font-medium">{tCat(lang, product.category)}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1628] mt-1">{tProductName(lang, product.sku, product.name)}</h1>
          {product.sku && <p className="text-xs text-gray-400 mt-1">{t('product.sku')}: {product.sku}</p>}
          <p className="text-3xl font-bold text-[#0B1628] mt-4">${product.price_usd.toFixed(2)} <span className="text-base font-normal text-gray-500">USD</span></p>

          <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-6">
            {product.stock_quantity > 0 ? (
              <p className="text-sm text-green-600 font-medium">{product.stock_quantity} {t('product.inStock')}</p>
            ) : (
              <p className="text-sm text-red-500 font-medium">{t('product.outOfStock')}</p>
            )}
          </div>

          {product.stock_quantity > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded-lg self-start">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg min-w-[44px] min-h-[44px] flex items-center justify-center">-</button>
                <span className="px-4 py-2 font-medium">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg min-w-[44px] min-h-[44px] flex items-center justify-center">+</button>
              </div>
              <button
                onClick={handleAdd}
                className="bg-[#0B1628] text-white px-6 py-3 rounded-lg hover:bg-[#0B1628]/90 font-semibold transition-colors min-h-[48px] w-full sm:w-auto"
              >
                {added ? t('product.added') : t('product.addToCart')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
