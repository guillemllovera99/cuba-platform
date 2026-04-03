import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../store'
import { api } from '../api'

interface CorporateProfile {
  id: string
  company_name: string
  tax_id?: string
  industry?: string
  billing_address?: string
  billing_city?: string
  billing_country?: string
  contact_name?: string
  contact_phone?: string
  status: string
  pricing_tier: string
  discount_pct: number
  deposit_pct: number
}

interface DashboardData {
  profile: CorporateProfile
  stats: {
    total_orders: number
    total_spend: number
    pricing_tier: string
    discount_pct: number
    deposit_pct: number
  }
  recent_orders: {
    id: string
    order_code: string
    status: string
    total_usd: number
    created_at: string
    item_count: number
  }[]
}

export default function CorporatePortal() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [profile, setProfile] = useState<CorporateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [tab, setTab] = useState<'dashboard' | 'profile'>('dashboard')

  // Registration form
  const [regForm, setRegForm] = useState({
    company_name: '',
    tax_id: '',
    industry: '',
    billing_address: '',
    billing_city: '',
    billing_country: '',
    contact_name: '',
    contact_phone: '',
  })
  const [regError, setRegError] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return }
    loadData()
  }, [isLoggedIn])

  const loadData = async () => {
    setLoading(true)
    try {
      // Try loading corporate profile first
      const prof = await api.corporateProfile()
      setProfile(prof)
      if (prof.status === 'approved') {
        const dash = await api.corporateDashboard()
        setDashboard(dash)
      }
    } catch {
      // No corporate profile — show registration
      setProfile(null)
    }
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!regForm.company_name.trim()) {
      setRegError('Company name is required')
      return
    }
    setRegistering(true)
    setRegError('')
    try {
      const result = await api.corporateRegister(regForm)
      setProfile(result)
    } catch (e: any) {
      setRegError(e.message || 'Registration failed')
    }
    setRegistering(false)
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">Loading...</div>
  }

  // ── No corporate profile: show registration ──
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <h1 className="text-2xl font-bold text-[#0B1628] mb-2">Corporate Account</h1>
        <p className="text-sm text-gray-500 mb-8">
          Register your company for bulk ordering, wholesale pricing, and dedicated invoicing.
        </p>

        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Company Name *</label>
            <input type="text" value={regForm.company_name}
              onChange={e => setRegForm(f => ({ ...f, company_name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tax ID</label>
              <input type="text" value={regForm.tax_id}
                onChange={e => setRegForm(f => ({ ...f, tax_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Industry</label>
              <input type="text" value={regForm.industry}
                onChange={e => setRegForm(f => ({ ...f, industry: e.target.value }))}
                placeholder="e.g. Energy, Agriculture"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Billing Address</label>
            <input type="text" value={regForm.billing_address}
              onChange={e => setRegForm(f => ({ ...f, billing_address: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
              <input type="text" value={regForm.billing_city}
                onChange={e => setRegForm(f => ({ ...f, billing_city: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
              <input type="text" value={regForm.billing_country}
                onChange={e => setRegForm(f => ({ ...f, billing_country: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contact Name</label>
              <input type="text" value={regForm.contact_name}
                onChange={e => setRegForm(f => ({ ...f, contact_name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contact Phone</label>
              <input type="text" value={regForm.contact_phone}
                onChange={e => setRegForm(f => ({ ...f, contact_phone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500" />
            </div>
          </div>

          {regError && <p className="text-red-500 text-sm">{regError}</p>}

          <button onClick={handleRegister} disabled={registering}
            className="w-full bg-[#0B1628] text-white font-medium py-3 rounded-lg hover:bg-[#0B1628]/90 transition-colors text-sm disabled:opacity-50">
            {registering ? 'Submitting...' : 'Apply for Corporate Account'}
          </button>
        </div>
      </div>
    )
  }

  // ── Pending approval ──
  if (profile.status === 'pending') {
    return (
      <div className="max-w-xl mx-auto py-10">
        <h1 className="text-2xl font-bold text-[#0B1628] mb-2">Corporate Account</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-amber-800 mb-2">Application Under Review</h2>
          <p className="text-sm text-amber-700">
            Your corporate account for <strong>{profile.company_name}</strong> is pending admin approval.
            You'll receive access to bulk ordering and wholesale pricing once approved.
          </p>
        </div>
      </div>
    )
  }

  // ── Rejected ──
  if (profile.status === 'rejected') {
    return (
      <div className="max-w-xl mx-auto py-10">
        <h1 className="text-2xl font-bold text-[#0B1628] mb-2">Corporate Account</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Application Not Approved</h2>
          <p className="text-sm text-red-700">
            Your application for <strong>{profile.company_name}</strong> was not approved.
            Please contact support for more information.
          </p>
        </div>
      </div>
    )
  }

  // ── Approved: Full dashboard ──
  const stats = dashboard?.stats
  const orders = dashboard?.recent_orders || []

  const tierColors: Record<string, string> = {
    standard: 'bg-gray-100 text-gray-700',
    silver: 'bg-gray-200 text-gray-800',
    gold: 'bg-amber-100 text-amber-800',
    platinum: 'bg-purple-100 text-purple-800',
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1628]">{profile.company_name}</h1>
          <p className="text-sm text-gray-500">Corporate Portal</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${tierColors[stats?.pricing_tier || 'standard']}`}>
          {(stats?.pricing_tier || 'standard').toUpperCase()} TIER
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        <button onClick={() => setTab('dashboard')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'dashboard' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Dashboard
        </button>
        <button onClick={() => setTab('profile')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'profile' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Company Profile
        </button>
      </div>

      {tab === 'dashboard' && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-[#0B1628]">{stats?.total_orders || 0}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Total Spend</p>
              <p className="text-2xl font-bold text-[#0B1628]">${(stats?.total_spend || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Discount</p>
              <p className="text-2xl font-bold text-green-600">{stats?.discount_pct || 0}%</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Deposit Rate</p>
              <p className="text-2xl font-bold text-[#0B1628]">{stats?.deposit_pct || 50}%</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <Link to="/catalog"
              className="bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
              Place Bulk Order
            </Link>
            <Link to="/orders"
              className="border border-gray-200 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              View All Orders
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-[#0B1628]">Recent Orders</h3>
            </div>
            {orders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No orders yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-50">
                    <th className="px-5 py-2 text-left font-medium">Order</th>
                    <th className="px-5 py-2 text-left font-medium">Status</th>
                    <th className="px-5 py-2 text-right font-medium">Items</th>
                    <th className="px-5 py-2 text-right font-medium">Total</th>
                    <th className="px-5 py-2 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-mono text-xs">{o.order_code}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          o.status === 'delivered' ? 'bg-green-100 text-green-700'
                          : o.status.includes('paid') ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>{o.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">{o.item_count}</td>
                      <td className="px-5 py-3 text-right font-medium">${o.total_usd.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-gray-400">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'profile' && (
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">Company:</span> <span className="ml-2 font-medium">{profile.company_name}</span></div>
            <div><span className="text-gray-400">Tax ID:</span> <span className="ml-2">{profile.tax_id || '—'}</span></div>
            <div><span className="text-gray-400">Industry:</span> <span className="ml-2">{profile.industry || '—'}</span></div>
            <div><span className="text-gray-400">Contact:</span> <span className="ml-2">{profile.contact_name || '—'}</span></div>
            <div><span className="text-gray-400">Phone:</span> <span className="ml-2">{profile.contact_phone || '—'}</span></div>
            <div><span className="text-gray-400">Billing:</span> <span className="ml-2">{[profile.billing_address, profile.billing_city, profile.billing_country].filter(Boolean).join(', ') || '—'}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
