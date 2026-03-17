import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store'
import { api } from '../../api'

const SHIPMENT_STATUSES = ['', 'preparing', 'packed', 'in_transit', 'customs', 'out_for_delivery', 'delivered', 'failed']
const STATUS_COLORS: Record<string, string> = {
  preparing: 'bg-yellow-100 text-yellow-800',
  packed: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  customs: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export default function AdminShipments() {
  const [shipments, setShipments] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ carrier: '', tracking_number: '', estimated_delivery: '', notes: '' })
  const [eventForm, setEventForm] = useState({ status: '', location: '', description: '' })
  const [eventShipmentId, setEventShipmentId] = useState<string | null>(null)
  const isAdmin = useAuth(s => s.isAdmin())
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    loadShipments()
  }, [isAdmin, filter])

  const loadShipments = () => {
    api.adminShipments(filter || undefined).then(setShipments).catch(() => {})
  }

  const handleSaveDetails = async (shipmentId: string) => {
    const payload: any = {}
    if (editForm.carrier) payload.carrier = editForm.carrier
    if (editForm.tracking_number) payload.tracking_number = editForm.tracking_number
    if (editForm.estimated_delivery) payload.estimated_delivery = new Date(editForm.estimated_delivery).toISOString()
    if (editForm.notes) payload.notes = editForm.notes
    await api.adminUpdateShipment(shipmentId, payload)
    setEditingId(null)
    loadShipments()
  }

  const handleAddEvent = async (shipmentId: string) => {
    if (!eventForm.status) return
    await api.adminAddShipmentEvent(shipmentId, eventForm)
    setEventShipmentId(null)
    setEventForm({ status: '', location: '', description: '' })
    loadShipments()
  }

  const startEdit = (s: any) => {
    setEditingId(s.id)
    setEditForm({
      carrier: s.carrier || '',
      tracking_number: s.tracking_number || '',
      estimated_delivery: s.estimated_delivery ? s.estimated_delivery.slice(0, 16) : '',
      notes: s.notes || '',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Shipments & Delivery</h1>
        <Link to="/admin" className="bg-white border px-3 py-2 rounded text-sm hover:bg-gray-50">&larr; Dashboard</Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {SHIPMENT_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded text-sm ${filter === s ? 'bg-[#0B1628] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      {shipments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No shipments found.</p>
          <p className="text-sm text-gray-400">Shipments are auto-created when orders move to "processing".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map(s => (
            <div key={s.id} className="bg-white border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-[#0B1628]">{s.order_code}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${STATUS_COLORS[s.status] || 'bg-gray-100'}`}>
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created {new Date(s.created_at).toLocaleDateString()}
                      {s.carrier && <> &middot; <span className="font-medium text-gray-700">{s.carrier}</span></>}
                      {s.tracking_number && <> &middot; <span className="font-mono text-xs">{s.tracking_number}</span></>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(s)}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50">
                      Edit
                    </button>
                    <button onClick={() => setEventShipmentId(eventShipmentId === s.id ? null : s.id)}
                      className="text-xs px-2 py-1 bg-[#0B1628] text-white rounded hover:bg-[#0B1628]/90">
                      + Event
                    </button>
                    <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50">
                      {expandedId === s.id ? 'Collapse' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Recipient info row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-gray-400">To: </span><span className="text-gray-700">{s.recipient_name}</span></div>
                  <div><span className="text-gray-400">City: </span><span className="text-gray-700">{s.recipient_city}</span></div>
                  <div><span className="text-gray-400">Phone: </span><span className="text-gray-700">{s.recipient_phone}</span></div>
                  <div><span className="text-gray-400">Total: </span><span className="font-medium">${s.total_usd?.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Edit form */}
              {editingId === s.id && (
                <div className="border-t bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold mb-3">Edit Shipment Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Carrier</label>
                      <input value={editForm.carrier} onChange={e => setEditForm(f => ({ ...f, carrier: e.target.value }))}
                        placeholder="DHL, FedEx, local courier..."
                        className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tracking Number</label>
                      <input value={editForm.tracking_number} onChange={e => setEditForm(f => ({ ...f, tracking_number: e.target.value }))}
                        placeholder="1Z999AA10123456784"
                        className="w-full border rounded px-3 py-2 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Estimated Delivery</label>
                      <input type="datetime-local" value={editForm.estimated_delivery}
                        onChange={e => setEditForm(f => ({ ...f, estimated_delivery: e.target.value }))}
                        className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Notes</label>
                      <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Internal notes..."
                        className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveDetails(s.id)}
                      className="px-4 py-1.5 bg-[#0B1628] text-white rounded text-sm hover:bg-[#0B1628]/90">Save</button>
                    <button onClick={() => setEditingId(null)}
                      className="px-4 py-1.5 border rounded text-sm hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}

              {/* Add event form */}
              {eventShipmentId === s.id && (
                <div className="border-t bg-blue-50 p-4">
                  <h3 className="text-sm font-semibold mb-3">Add Shipment Event</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Status *</label>
                      <select value={eventForm.status} onChange={e => setEventForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full border rounded px-3 py-2 text-sm">
                        <option value="">Select status...</option>
                        {SHIPMENT_STATUSES.filter(Boolean).map(st => (
                          <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Location</label>
                      <input value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))}
                        placeholder="Miami warehouse, Havana port..."
                        className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Package cleared customs..."
                        className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAddEvent(s.id)}
                      disabled={!eventForm.status}
                      className="px-4 py-1.5 bg-[#0B1628] text-white rounded text-sm hover:bg-[#0B1628]/90 disabled:bg-gray-400">
                      Add Event
                    </button>
                    <button onClick={() => setEventShipmentId(null)}
                      className="px-4 py-1.5 border rounded text-sm hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}

              {/* Expanded: Event timeline */}
              {expandedId === s.id && (
                <div className="border-t bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold mb-3">Shipment Timeline</h3>
                  {s.events.length === 0 ? (
                    <p className="text-sm text-gray-400">No events recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {s.events.map((ev: any, idx: number) => (
                        <div key={ev.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mt-1 ${idx === s.events.length - 1 ? 'bg-[#0B1628]' : 'bg-gray-300'}`} />
                            {idx < s.events.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                          </div>
                          <div className="pb-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${STATUS_COLORS[ev.status] || 'bg-gray-100'}`}>
                                {ev.status.replace(/_/g, ' ')}
                              </span>
                              {ev.location && <span className="text-xs text-gray-500">{ev.location}</span>}
                            </div>
                            {ev.description && <p className="text-sm text-gray-600 mt-0.5">{ev.description}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(ev.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Address details */}
                  {s.recipient_address && (
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-xs text-gray-400 mb-1">Delivery Address</p>
                      <p className="text-sm text-gray-700">{s.recipient_address}</p>
                    </div>
                  )}

                  {s.estimated_delivery && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400">Estimated Delivery</p>
                      <p className="text-sm font-medium text-gray-700">{new Date(s.estimated_delivery).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
