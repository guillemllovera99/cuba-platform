import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../store'
import { api } from '../../api'

const CATEGORIES = ['E-bikes', 'E-scooters', 'Solar / Energy', 'Spare Parts', 'Accessories']

export default function AdminProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const isAdmin = useAuth(s => s.isAdmin())
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', sku: '', description: '', category: CATEGORIES[0],
    price_usd: 0, stock_quantity: 0, image_url: '', is_active: true,
  })

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    if (isEdit) {
      api.getProduct(id!).then(p => setForm({
        name: p.name, sku: p.sku || '', description: p.description || '',
        category: p.category, price_usd: p.price_usd, stock_quantity: p.stock_quantity,
        image_url: p.image_url || '', is_active: p.is_active,
      })).catch(() => {})
    }
  }, [id, isAdmin])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm(prev => ({ ...prev, [f]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isEdit) {
        await api.updateProduct(id!, form)
      } else {
        await api.createProduct(form)
      }
      navigate('/admin/products')
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        <Link to="/admin/products" className="text-sm text-gray-500 hover:underline">&larr; Back</Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input value={form.name} onChange={set('name')} required className="w-full border rounded px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input value={form.sku} onChange={set('sku')} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select value={form.category} onChange={set('category')} className="w-full border rounded px-3 py-2">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
            <input type="number" step="0.01" min="0" value={form.price_usd} onChange={set('price_usd')} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input type="number" min="0" value={form.stock_quantity} onChange={set('stock_quantity')} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input value={form.image_url} onChange={set('image_url')} className="w-full border rounded px-3 py-2" placeholder="https://..." />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} id="active" />
          <label htmlFor="active" className="text-sm text-gray-700">Active (visible in catalog)</label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold disabled:bg-gray-400">
          {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </form>
    </div>
  )
}
