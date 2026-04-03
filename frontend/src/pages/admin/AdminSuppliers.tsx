import { useState, useEffect } from 'react'
import { api } from '../../api'

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [pos, setPOs] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [tab, setTab] = useState<'suppliers' | 'pos'>('suppliers')

  // New PO form
  const [showPOForm, setShowPOForm] = useState(false)
  const [poSupplier, setPOSupplier] = useState('')
  const [poItems, setPOItems] = useState([{ description: '', quantity: 1, unit_cost_usd: 0 }])
  const [poNotes, setPONotes] = useState('')

  useEffect(() => { load() }, [filter, tab])

  const load = async () => {
    if (tab === 'suppliers') {
      const data = await api.adminSupplierList(filter || undefined)
      setSuppliers(data)
    } else {
      const data = await api.adminListPOs(filter || undefined)
      setPOs(data)
    }
  }

  const approve = async (id: string, status: string) => {
    await api.adminApproveSupplier(id, status)
    load()
  }

  const createPO = async () => {
    if (!poSupplier) return
    try {
      await api.adminCreatePO({
        supplier_id: poSupplier,
        items: poItems.filter(i => i.description).map(i => ({
          description: i.description,
          quantity: i.quantity,
          unit_cost_usd: i.unit_cost_usd,
        })),
        notes: poNotes || undefined,
      })
      setShowPOForm(false)
      setPOItems([{ description: '', quantity: 1, unit_cost_usd: 0 }])
      setPONotes('')
      setTab('pos')
      load()
    } catch (e: any) { alert(e.message) }
  }

  const sendPO = async (poId: string) => {
    await api.adminSendPO(poId)
    load()
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      suspended: 'bg-red-100 text-red-700',
      draft: 'bg-gray-100 text-gray-600',
      sent: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      shipped: 'bg-purple-100 text-purple-700',
    }
    return colors[s] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Suppliers & Purchase Orders</h1>
        <button onClick={() => setShowPOForm(!showPOForm)} className="bg-[#0B1628] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0B1628]/90">
          + New PO
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b">
        {(['suppliers', 'pos'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setFilter('') }}
            className={`pb-2 px-1 text-sm font-medium border-b-2 ${tab === t ? 'border-[#0B1628] text-[#0B1628]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {t === 'suppliers' ? 'Suppliers' : 'Purchase Orders'}
          </button>
        ))}
      </div>

      {/* New PO Form */}
      {showPOForm && (
        <div className="bg-gray-50 border rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-3">Create Purchase Order</h3>
          <select value={poSupplier} onChange={e => setPOSupplier(e.target.value)} className="w-full border rounded-lg px-3 py-2 mb-3">
            <option value="">Select supplier...</option>
            {suppliers.filter(s => s.status === 'approved').map(s => (
              <option key={s.id} value={s.id}>{s.company_name}</option>
            ))}
          </select>

          <div className="space-y-2 mb-3">
            {poItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input value={item.description} onChange={e => { const n = [...poItems]; n[i].description = e.target.value; setPOItems(n) }} placeholder="Item description" className="flex-1 border rounded px-3 py-2 text-sm" />
                <input type="number" value={item.quantity} onChange={e => { const n = [...poItems]; n[i].quantity = +e.target.value; setPOItems(n) }} className="w-20 border rounded px-3 py-2 text-sm" placeholder="Qty" />
                <input type="number" value={item.unit_cost_usd} onChange={e => { const n = [...poItems]; n[i].unit_cost_usd = +e.target.value; setPOItems(n) }} className="w-28 border rounded px-3 py-2 text-sm" placeholder="Unit $" />
              </div>
            ))}
            <button onClick={() => setPOItems([...poItems, { description: '', quantity: 1, unit_cost_usd: 0 }])} className="text-sm text-blue-600 hover:text-blue-800">+ Add item</button>
          </div>

          <textarea value={poNotes} onChange={e => setPONotes(e.target.value)} placeholder="Notes..." rows={2} className="w-full border rounded px-3 py-2 text-sm mb-3" />
          <div className="flex gap-2">
            <button onClick={createPO} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium">Create PO (Draft)</button>
            <button onClick={() => setShowPOForm(false)} className="text-gray-500 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Suppliers tab */}
      {tab === 'suppliers' && (
        <div className="space-y-3">
          {suppliers.map((s: any) => (
            <div key={s.id} className="border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold">{s.company_name}</span>
                  <span className="ml-2 text-sm text-gray-400">{s.country || 'N/A'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(s.status)}`}>
                  {s.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mb-3">
                <p>Contact: {s.contact_name || 'N/A'}</p>
                <p>Email: {s.contact_email || s.user_email || 'N/A'}</p>
                <p>Phone: {s.contact_phone || 'N/A'}</p>
                <p>Categories: {s.product_categories || 'N/A'}</p>
              </div>
              {s.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => approve(s.id, 'approved')} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium">Approve</button>
                  <button onClick={() => approve(s.id, 'suspended')} className="bg-red-100 text-red-700 px-4 py-1.5 rounded text-sm font-medium">Reject</button>
                </div>
              )}
            </div>
          ))}
          {suppliers.length === 0 && <p className="text-gray-400 text-center py-8">No suppliers registered.</p>}
        </div>
      )}

      {/* POs tab */}
      {tab === 'pos' && (
        <div className="space-y-3">
          {pos.map((po: any) => (
            <div key={po.id} className="border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-sm font-bold">{po.po_number}</span>
                  <span className="ml-2 text-sm text-gray-400">{po.supplier_name || 'Unknown'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(po.status)}`}>
                  {po.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {po.items?.length || 0} items — Total: ${po.total_usd || 0}
              </p>
              {po.status === 'draft' && (
                <button onClick={() => sendPO(po.id)} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700">
                  Send to Supplier
                </button>
              )}
            </div>
          ))}
          {pos.length === 0 && <p className="text-gray-400 text-center py-8">No purchase orders yet.</p>}
        </div>
      )}
    </div>
  )
}
