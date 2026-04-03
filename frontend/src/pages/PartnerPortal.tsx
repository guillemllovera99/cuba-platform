import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../store'
import { useI18n } from '../i18n'

export default function PartnerPortal() {
  const { isLoggedIn } = useAuth()
  const lang = useI18n(s => s.lang)
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'orders' | 'register'>('orders')

  // Register form
  const [form, setForm] = useState({ company_name: '', region: '', contact_phone: '', contact_name: '' })
  const [regMsg, setRegMsg] = useState('')

  // Delivery confirm
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [pickupCode, setPickupCode] = useState('')
  const [idCheck, setIdCheck] = useState(false)
  const [confirmNotes, setConfirmNotes] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) return
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const p = await api.partnerProfile()
      setProfile(p)
      if (p.status === 'approved') {
        const [o, s] = await Promise.all([api.partnerOrders(), api.partnerStats()])
        setOrders(o)
        setStats(s)
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
      const p = await api.partnerRegister(form)
      setProfile(p)
      setTab('orders')
      setRegMsg('')
    } catch (e: any) {
      setRegMsg(e.message)
    }
  }

  const confirmDelivery = async (orderId: string) => {
    try {
      await api.confirmDelivery({
        order_id: orderId,
        pickup_code: pickupCode || undefined,
        recipient_id_check: idCheck,
        notes: confirmNotes || undefined,
      })
      setConfirmingId(null)
      setPickupCode('')
      setIdCheck(false)
      setConfirmNotes('')
      loadProfile()
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (!isLoggedIn()) {
    return <div className="py-12 text-center text-gray-500">Please log in to access the Partner Portal.</div>
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Loading...</div>

  // Not registered yet
  if (!profile || tab === 'register') {
    return (
      <div className="max-w-lg mx-auto py-8">
        <h1 className="text-2xl font-bold mb-2">{lang === 'es' ? 'Portal de Socio' : lang === 'fr' ? 'Portail Partenaire' : 'Partner Portal'}</h1>
        <p className="text-gray-500 mb-6">{lang === 'es' ? 'Regístrese como socio de distribución local en Cuba' : 'Register as a local distribution partner in Cuba'}</p>

        <div className="space-y-4">
          <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Company / Organization Name" className="w-full border rounded-lg px-4 py-3" />
          <input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="Region (e.g. Havana, Santiago)" className="w-full border rounded-lg px-4 py-3" />
          <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Contact Name" className="w-full border rounded-lg px-4 py-3" />
          <input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="Contact Phone" className="w-full border rounded-lg px-4 py-3" />
          {regMsg && <p className="text-red-600 text-sm">{regMsg}</p>}
          <button onClick={register} className="bg-[#0B1628] text-white px-6 py-3 rounded-lg font-medium w-full hover:bg-[#0B1628]/90">
            Register as Partner
          </button>
        </div>
      </div>
    )
  }

  // Pending approval
  if (profile.status === 'pending') {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
          <h2 className="text-xl font-bold mb-2">Application Pending</h2>
          <p className="text-gray-600">Your partner application for <strong>{profile.company_name}</strong> is being reviewed. You'll get access once approved by admin.</p>
        </div>
      </div>
    )
  }

  // Approved — show dashboard
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{lang === 'es' ? 'Portal de Socio' : 'Partner Portal'}</h1>
          <p className="text-gray-500">{profile.company_name} — {profile.region || 'All Regions'}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Approved</span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-5">
            <p className="text-2xl font-bold text-blue-700">{stats.deliveries_confirmed}</p>
            <p className="text-sm text-blue-500">{lang === 'es' ? 'Entregas Confirmadas' : 'Deliveries Confirmed'}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-5">
            <p className="text-2xl font-bold text-purple-700">{stats.feedback_received}</p>
            <p className="text-sm text-purple-500">{lang === 'es' ? 'Comentarios Recibidos' : 'Feedback Received'}</p>
          </div>
        </div>
      )}

      {/* Orders list */}
      <h2 className="text-lg font-semibold mb-3">{lang === 'es' ? 'Pedidos en Tu Región' : 'Orders in Your Region'} ({orders.length})</h2>
      <div className="space-y-3">
        {orders.map((o: any) => (
          <div key={o.id} className="border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium">{o.order_code}</span>
                <span className="ml-2 text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.delivery_confirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {o.delivery_confirmed ? 'Delivered' : o.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
              <p><span className="text-gray-400">To:</span> {o.recipient_name}</p>
              <p><span className="text-gray-400">City:</span> {o.recipient_city}</p>
              {o.recipient_phone && <p><span className="text-gray-400">Phone:</span> {o.recipient_phone}</p>}
              {o.total_usd && <p><span className="text-gray-400">Total:</span> ${o.total_usd}</p>}
            </div>

            {!o.delivery_confirmed && (
              <>
                {confirmingId === o.id ? (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-3">
                    <input value={pickupCode} onChange={e => setPickupCode(e.target.value)} placeholder="Pickup code" className="w-full border rounded px-3 py-2 text-sm" />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={idCheck} onChange={e => setIdCheck(e.target.checked)} />
                      ID verified
                    </label>
                    <textarea value={confirmNotes} onChange={e => setConfirmNotes(e.target.value)} placeholder="Notes..." rows={2} className="w-full border rounded px-3 py-2 text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => confirmDelivery(o.id)} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700">
                        Confirm Delivery
                      </button>
                      <button onClick={() => setConfirmingId(null)} className="text-gray-500 text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmingId(o.id)} className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium">
                    Confirm Delivery &rarr;
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="text-gray-400 text-center py-8">No orders in your region yet.</p>}
      </div>
    </div>
  )
}
