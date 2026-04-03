import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store'
import { api } from '../../api'

interface ShipmentWindow {
  id: string
  name: string
  description: string | null
  order_deadline: string
  estimated_departure: string
  estimated_arrival: string | null
  is_active: boolean
  created_at: string
}

const emptyForm = {
  name: '',
  description: '',
  order_deadline: '',
  estimated_departure: '',
  estimated_arrival: '',
}

export default function AdminShipmentWindows() {
  const [windows, setWindows] = useState<ShipmentWindow[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const isAdmin = useAuth(s => s.isAdmin())
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    loadWindows()
  }, [isAdmin])

  const loadWindows = () => {
    api.adminShipmentWindows().then(setWindows).catch(() => {})
  }

  const handleSave = async () => {
    const data = {
      name: form.name,
      description: form.description || null,
      order_deadline: form.order_deadline ? new Date(form.order_deadline).toISOString() : '',
      estimated_departure: form.estimated_departure ? new Date(form.estimated_departure).toISOString() : '',
      estimated_arrival: form.estimated_arrival ? new Date(form.estimated_arrival).toISOString() : null,
    }
    try {
      if (editing) {
        await api.adminUpdateShipmentWindow(editing, data)
      } else {
        await api.adminCreateShipmentWindow(data)
      }
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      loadWindows()
    } catch (err: any) {
      alert(err.message || 'Failed to save')
    }
  }

  const handleEdit = (w: ShipmentWindow) => {
    setEditing(w.id)
    setForm({
      name: w.name,
      description: w.description || '',
      order_deadline: w.order_deadline ? w.order_deadline.slice(0, 16) : '',
      estimated_departure: w.estimated_departure ? w.estimated_departure.slice(0, 16) : '',
      estimated_arrival: w.estimated_arrival ? w.estimated_arrival.slice(0, 16) : '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shipment window?')) return
    await api.adminDeleteShipmentWindow(id)
    loadWindows()
  }

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Preorder Shipment Windows</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm) }}
            className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 font-medium"
          >
            {showForm ? 'Cancel' : '+ New Window'}
          </button>
          <Link to="/admin" className="bg-white border px-3 py-2 rounded text-sm hover:bg-gray-50">&larr; Dashboard</Link>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-3">{editing ? 'Edit Window' : 'Create Window'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="April 2026 Caribbean Shipment"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Monthly container to Havana"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Deadline *</label>
              <input
                type="datetime-local"
                value={form.order_deadline}
                onChange={e => setForm(f => ({ ...f, order_deadline: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Departure *</label>
              <input
                type="datetime-local"
                value={form.estimated_departure}
                onChange={e => setForm(f => ({ ...f, estimated_departure: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Arrival</label>
              <input
                type="datetime-local"
                value={form.estimated_arrival}
                onChange={e => setForm(f => ({ ...f, estimated_arrival: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.order_deadline || !form.estimated_departure}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-300 font-medium"
          >
            {editing ? 'Update' : 'Create'}
          </button>
        </div>
      )}

      {windows.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No shipment windows yet. Create one to start accepting preorders.</p>
      ) : (
        <div className="space-y-3">
          {windows.map(w => {
            const deadline = new Date(w.order_deadline)
            const now = new Date()
            const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            const isExpired = daysLeft === 0

            return (
              <div key={w.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800">{w.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isExpired ? 'Closed' : `${daysLeft}d left`}
                      </span>
                    </div>
                    {w.description && <p className="text-sm text-gray-500 mb-2">{w.description}</p>}
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Deadline: {fmtDate(w.order_deadline)}</span>
                      <span>Departure: {fmtDate(w.estimated_departure)}</span>
                      {w.estimated_arrival && <span>Arrival: {fmtDate(w.estimated_arrival)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(w)} className="text-sm text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(w.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
