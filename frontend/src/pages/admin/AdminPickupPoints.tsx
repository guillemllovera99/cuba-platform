import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store'
import { api } from '../../api'

interface PickupPoint {
  id: string
  name: string
  city: string
  address: string
  contact_phone: string
  contact_name: string
  is_active: boolean
  created_at: string
}

const emptyForm = {
  name: '',
  city: '',
  address: '',
  contact_phone: '',
  contact_name: '',
}

export default function AdminPickupPoints() {
  const [points, setPoints] = useState<PickupPoint[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const isAdmin = useAuth(s => s.isAdmin())
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    loadPoints()
  }, [isAdmin])

  const loadPoints = () => {
    api.adminPickupPoints().then(setPoints).catch(() => {})
  }

  const handleSave = async () => {
    const data = {
      name: form.name,
      city: form.city,
      address: form.address,
      contact_phone: form.contact_phone,
      contact_name: form.contact_name,
    }
    try {
      if (editing) {
        await api.adminUpdatePickupPoint(editing, data)
      } else {
        await api.adminCreatePickupPoint(data)
      }
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      loadPoints()
    } catch (err: any) {
      alert(err.message || 'Failed to save')
    }
  }

  const handleEdit = (p: PickupPoint) => {
    setEditing(p.id)
    setForm({
      name: p.name,
      city: p.city,
      address: p.address,
      contact_phone: p.contact_phone,
      contact_name: p.contact_name,
    })
    setShowForm(true)
  }

  const handleToggleActive = async (p: PickupPoint) => {
    try {
      await api.adminUpdatePickupPoint(p.id, {
        ...p,
        is_active: !p.is_active,
      })
      loadPoints()
    } catch (err: any) {
      alert(err.message || 'Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pickup point?')) return
    try {
      await api.adminDeletePickupPoint(id)
      loadPoints()
    } catch (err: any) {
      alert(err.message || 'Failed to delete')
    }
  }

  const groupedByCities = points.reduce((acc, point) => {
    const city = point.city || 'Unknown'
    if (!acc[city]) acc[city] = []
    acc[city].push(point)
    return acc
  }, {} as Record<string, PickupPoint[]>)

  const sortedCities = Object.keys(groupedByCities).sort()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pickup Points</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm) }}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 font-medium"
          >
            {showForm ? 'Cancel' : '+ New Point'}
          </button>
          <Link to="/admin" className="bg-white border px-3 py-2 rounded text-sm hover:bg-gray-50">&larr; Dashboard</Link>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-3">{editing ? 'Edit Pickup Point' : 'Create Pickup Point'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Havana Central Hub"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Havana"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
              <input
                value={form.contact_name}
                onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Juan Martinez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
              <input
                value={form.contact_phone}
                onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="+53-12-345-6789"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.city || !form.address || !form.contact_name || !form.contact_phone}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-300 font-medium"
          >
            {editing ? 'Update' : 'Create'}
          </button>
        </div>
      )}

      {points.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No pickup points yet. Create one to start accepting pickups.</p>
      ) : (
        <div>
          {sortedCities.map(city => (
            <div key={city} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">{city}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedByCities[city].map(p => (
                  <div key={p.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{p.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{p.address}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Contact:</span> {p.contact_name}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {p.contact_phone}
                      </div>
                      <div className="text-xs text-gray-500">
                        Created {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50 font-medium"
                      >
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(p)}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-sm text-red-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
