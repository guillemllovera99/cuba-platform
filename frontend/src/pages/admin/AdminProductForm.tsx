import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../store'
import { api } from '../../api'

const CATEGORIES = [
  'Grains & Carbohydrates', 'Beans & Legumes', 'Canned & Preserved Foods',
  'Fresh Produce', 'Coffee & Beverages', 'Dairy & Milk', 'Juice Packs',
  'Appliances & Energy', 'Solar Energy', 'Diesel & Fuel Supply',
  'Battery & Energy Storage', 'Micro-grid & Home Energy', 'Essential Bundles',
]

export default function AdminProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const isAdmin = useAuth(s => s.isAdmin())
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [shipmentWindows, setShipmentWindows] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '', sku: '', description: '', category: CATEGORIES[0],
    price_usd: 0, stock_quantity: 0, image_url: '', is_active: true,
    is_preorder: false, preorder_deadline: '', estimated_ship_date: '', shipment_window_id: '',
  })

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    api.activeShipmentWindows().then(setShipmentWindows).catch(() => {})
    if (isEdit) {
      api.getProduct(id!).then(p => setForm({
        name: p.name, sku: p.sku || '', description: p.description || '',
        category: p.category, price_usd: p.price_usd, stock_quantity: p.stock_quantity,
        image_url: p.image_url || '', is_active: p.is_active,
        is_preorder: p.is_preorder || false,
        preorder_deadline: p.preorder_deadline ? p.preorder_deadline.slice(0, 16) : '',
        estimated_ship_date: p.estimated_ship_date ? p.estimated_ship_date.slice(0, 16) : '',
        shipment_window_id: p.shipment_window_id || '',
      })).catch(() => {})
    }
  }, [id, isAdmin])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm(prev => ({ ...prev, [f]: val }))
  }

  const handleImageUpload = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const result = await api.uploadProductImage(file)
      setForm(prev => ({ ...prev, image_url: result.url }))
    } catch (err: any) {
      setError(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageUpload(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload: any = { ...form }
      // Convert datetime-local to ISO for backend
      if (payload.preorder_deadline) payload.preorder_deadline = new Date(payload.preorder_deadline).toISOString()
      else payload.preorder_deadline = null
      if (payload.estimated_ship_date) payload.estimated_ship_date = new Date(payload.estimated_ship_date).toISOString()
      else payload.estimated_ship_date = null
      if (!payload.shipment_window_id) payload.shipment_window_id = null

      if (isEdit) {
        await api.updateProduct(id!, payload)
      } else {
        await api.createProduct(payload)
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>

          {/* Image preview */}
          {form.image_url && (
            <div className="mb-3 relative inline-block">
              <img
                src={form.image_url}
                alt="Product preview"
                className="w-40 h-40 object-cover rounded-lg border shadow-sm"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow"
              >
                &times;
              </button>
            </div>
          )}

          {/* Drop zone / upload button */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            {uploading ? (
              <div className="text-gray-500">
                <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-green-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm">Uploading...</p>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600 font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF &middot; Max 10MB</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload(file)
              e.target.value = ''
            }}
          />

          {/* Fallback: manual URL entry */}
          <details className="mt-2">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Or enter image URL manually</summary>
            <input value={form.image_url} onChange={set('image_url')} className="w-full border rounded px-3 py-2 mt-1 text-sm" placeholder="https://..." />
          </details>
        </div>
        {/* Preorder Settings */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={form.is_preorder} onChange={e => setForm(f => ({ ...f, is_preorder: e.target.checked }))} id="preorder" />
            <label htmlFor="preorder" className="text-sm font-medium text-gray-700">Preorder Product</label>
          </div>
          {form.is_preorder && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-0 sm:ml-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Deadline</label>
                <input type="datetime-local" value={form.preorder_deadline} onChange={set('preorder_deadline')}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Est. Ship Date</label>
                <input type="datetime-local" value={form.estimated_ship_date} onChange={set('estimated_ship_date')}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              {shipmentWindows.length > 0 && (
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Window</label>
                  <select value={form.shipment_window_id} onChange={set('shipment_window_id')}
                    className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">No window (manual dates)</option>
                    {shipmentWindows.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
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
