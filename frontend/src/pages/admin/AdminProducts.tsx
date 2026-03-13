import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store'
import { api } from '../../api'

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const isAdmin = useAuth(s => s.isAdmin())
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    loadProducts()
  }, [isAdmin])

  const loadProducts = () => api.getProducts().then(setProducts).catch(() => {})

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"?`)) return
    await api.deleteProduct(id)
    loadProducts()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <div className="flex gap-2">
          <Link to="/admin" className="bg-white border px-3 py-2 rounded text-sm hover:bg-gray-50">&larr; Dashboard</Link>
          <Link to="/admin/products/new" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 font-medium">
            + Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Active</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image_url && <img src={p.image_url} className="w-10 h-10 object-cover rounded" />}
                    <div>
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category}</td>
                <td className="px-4 py-3 text-right font-medium">${p.price_usd.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{p.stock_quantity}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/products/${p.id}/edit`} className="text-blue-600 hover:underline mr-3">Edit</Link>
                  <button onClick={() => handleDelete(p.id, p.name)} className="text-red-500 hover:underline">
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
