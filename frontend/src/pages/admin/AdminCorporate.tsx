import { useState, useEffect } from 'react'
import { useAuth } from '../../store'
import { api } from '../../api'

interface CorporateProfile {
  id: string
  user_id: string
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
  notes?: string
  created_at: string
  user_email?: string
  user_name?: string
}

export default function AdminCorporate() {
  const { isAdmin } = useAuth()
  const [profiles, setProfiles] = useState<CorporateProfile[]>([])
  const [filter, setFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)

  // Approval form
  const [approvalForm, setApprovalForm] = useState({
    pricing_tier: 'standard',
    discount_pct: 0,
    deposit_pct: 50,
    notes: '',
  })

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.adminCorporateList(filter || undefined)
      setProfiles(data)
    } catch { }
    setLoading(false)
  }

  const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.adminCorporateApprove(id, {
        status,
        ...(status === 'approved' ? approvalForm : { notes: approvalForm.notes }),
      })
      setApproving(null)
      load()
    } catch (e: any) {
      alert(e.message || 'Action failed')
    }
  }

  if (!isAdmin()) return <p className="py-10 text-center text-red-500">Admin access required</p>

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-[#0B1628] mb-6">Corporate Accounts</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${filter === s ? 'bg-[#0B1628] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-400">Loading...</p>
      ) : profiles.length === 0 ? (
        <p className="py-10 text-center text-gray-400">No corporate accounts found</p>
      ) : (
        <div className="space-y-4">
          {profiles.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-[#0B1628]">{p.company_name}</h3>
                  <p className="text-xs text-gray-400">{p.user_email} {p.user_name ? `(${p.user_name})` : ''}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[p.status] || 'bg-gray-100'}`}>
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 mb-3">
                <div><span className="text-gray-400">Industry:</span> {p.industry || '—'}</div>
                <div><span className="text-gray-400">Tax ID:</span> {p.tax_id || '—'}</div>
                <div><span className="text-gray-400">Contact:</span> {p.contact_name || '—'}</div>
                <div><span className="text-gray-400">Tier:</span> {p.pricing_tier} ({p.discount_pct}% off)</div>
              </div>

              {p.status === 'pending' && (
                <div>
                  {approving === p.id ? (
                    <div className="bg-gray-50 rounded-lg p-4 mt-3 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Pricing Tier</label>
                          <select value={approvalForm.pricing_tier}
                            onChange={e => setApprovalForm(f => ({ ...f, pricing_tier: e.target.value }))}
                            className="w-full px-2 py-2 rounded border border-gray-200 text-xs">
                            <option value="standard">Standard</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="platinum">Platinum</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Discount %</label>
                          <input type="number" min="0" max="50" value={approvalForm.discount_pct}
                            onChange={e => setApprovalForm(f => ({ ...f, discount_pct: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-2 py-2 rounded border border-gray-200 text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Deposit %</label>
                          <input type="number" min="10" max="100" value={approvalForm.deposit_pct}
                            onChange={e => setApprovalForm(f => ({ ...f, deposit_pct: parseFloat(e.target.value) || 50 }))}
                            className="w-full px-2 py-2 rounded border border-gray-200 text-xs" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Notes</label>
                        <input type="text" value={approvalForm.notes}
                          onChange={e => setApprovalForm(f => ({ ...f, notes: e.target.value }))}
                          className="w-full px-2 py-2 rounded border border-gray-200 text-xs" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(p.id, 'approved')}
                          className="bg-green-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-green-700">
                          Approve
                        </button>
                        <button onClick={() => handleApprove(p.id, 'rejected')}
                          className="bg-red-500 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-red-600">
                          Reject
                        </button>
                        <button onClick={() => setApproving(null)}
                          className="text-xs text-gray-400 px-3 py-2 hover:text-gray-600">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setApproving(p.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1">
                      Review & Approve
                    </button>
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
