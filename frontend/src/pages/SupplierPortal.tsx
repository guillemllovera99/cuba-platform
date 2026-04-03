import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../store'
import { useI18n } from '../i18n'

export default function SupplierPortal() {
  const { isLoggedIn } = useAuth()
  const lang = useI18n(s => s.lang)
  const [profile, setProfile] = useState<any>(null)
  const [pos, setPOs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pos' | 'register'>('pos')

  // Register form
  const [form, setForm] = useState({
    company_name: '', country: '', contact_name: '',
    contact_email: '', contact_phone: '', product_categories: ''
  })
  const [regMsg, setRegMsg] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) return
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const p = await api.supplierProfile()
      setProfile(p)
      if (p.status === 'approved') {
        const data = await api.supplierPurchaseOrders()
        setPOs(data)
      }
    } catch {
      setTab('register')
    } finally {
      setLoading(false)
    }
  }

  const register = async () => {
    if (!form.company_name) return
    try {
      const p = await api.supplierRegister(form)
      setProfile(p)
      setTab('pos')
    } catch (e: any) {
      setRegMsg(e.message)
    }
  }

  const confirmPO = async (poId: string) => {
    try {
      await api.supplierConfirmPO(poId)
      loadProfile()
    } catch (e: any) { alert(e.message) }
  }

  const shipPO = async (poId: string) => {
    try {
      await api.supplierShipPO(poId)
      loadProfile()
    } catch (e: any) { alert(e.message) }
  }

  if (!isLoggedIn()) {
    return <div className="py-12 text-center text-gray-500">Please log in to access the Supplier Portal.</div>
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Loading...</div>

  if (!profile || tab === 'register') {
    return (
      <div className="max-w-lg mx-auto py-8">
        <h1 className="text-2xl font-bold mb-2">{lang === 'es' ? 'Portal de Proveedor' : 'Supplier Portal'}</h1>
        <p className="text-gray-500 mb-6">Register as a supplier to receive and manage purchase orders.</p>
        <div className="space-y-4">
          <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Company Name" className="w-full border rounded-lg px-4 py-3" />
          <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Country" className="w-full border rounded-lg px-4 py-3" />
          <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Contact Name" className="w-full border rounded-lg px-4 py-3" />
          <input value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="Contact Email" className="w-full border rounded-lg px-4 py-3" />
          <input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="Contact Phone" className="w-full border rounded-lg px-4 py-3" />
          <input value={form.product_categories} onChange={e => setForm({ ...form, product_categories: e.target.value })} placeholder="Product Categories (e.g. food, energy, hygiene)" className="w-full border rounded-lg px-4 py-3" />
          {regMsg && <p className="text-red-600 text-sm">{regMsg}</p>}
          <button onClick={register} className="bg-[#0B1628] text-white px-6 py-3 rounded-lg font-medium w-full hover:bg-[#0B1628]/90">
            Register as Supplier
          </button>
        </div>
      </div>
    )
  }

  if (profile.status === 'pending') {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
          <h2 className="text-xl font-bold mb-2">Application Pending</h2>
          <p className="text-gray-600">Your supplier application for <strong>{profile.company_name}</strong> is under review.</p>
        </div>
      </div>
    )
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      sent: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-200 text-green-900',
      cancelled: 'bg-red-100 text-red-700',
    }
    return colors[s] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{lang === 'es' ? 'Portal de Proveedor' : 'Supplier Portal'}</h1>
          <p className="text-gray-500">{profile.company_name} — {profile.country || 'International'}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Approved</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-blue-700">{pos.length}</p>
          <p className="text-sm text-blue-500">Total POs</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-yellow-700">{pos.filter((p: any) => p.status === 'sent').length}</p>
          <p className="text-sm text-yellow-500">Awaiting Confirmation</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-green-700">{pos.filter((p: any) => p.status === 'shipped' || p.status === 'delivered').length}</p>
          <p className="text-sm text-green-500">Shipped / Delivered</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Purchase Orders ({pos.length})</h2>
      <div className="space-y-3">
        {pos.map((po: any) => (
          <div key={po.id} className="border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-mono text-sm font-bold">{po.po_number}</span>
                <span className="ml-2 text-xs text-gray-400">{new Date(po.created_at).toLocaleDateString()}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(po.status)}`}>
                {po.status}
              </span>
            </div>

            {/* Items table */}
            {po.items?.length > 0 && (
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="text-left text-gray-400 text-xs">
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-right">Qty</th>
                    <th className="pb-1 text-right">Unit Cost</th>
                    <th className="pb-1 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item: any) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-1">{item.description}</td>
                      <td className="py-1 text-right">{item.quantity}</td>
                      <td className="py-1 text-right">${item.unit_cost_usd}</td>
                      <td className="py-1 text-right">${item.subtotal_usd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Total: ${po.total_usd || 0}</p>
              <div className="flex gap-2">
                {po.status === 'sent' && (
                  <button onClick={() => confirmPO(po.id)} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700">
                    Confirm PO
                  </button>
                )}
                {po.status === 'confirmed' && (
                  <button onClick={() => shipPO(po.id)} className="bg-purple-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-purple-700">
                    Mark as Shipped
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {pos.length === 0 && <p className="text-gray-400 text-center py-8">No purchase orders yet.</p>}
      </div>
    </div>
  )
}
