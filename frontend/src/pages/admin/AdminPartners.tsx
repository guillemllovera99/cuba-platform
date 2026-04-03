import { useState, useEffect } from 'react'
import { api } from '../../api'

export default function AdminPartners() {
  const [partners, setPartners] = useState<any[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => { load() }, [filter])

  const load = async () => {
    const data = await api.adminPartnerList(filter || undefined)
    setPartners(data)
  }

  const approve = async (id: string, status: string) => {
    await api.adminApprovePartner(id, status)
    load()
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      suspended: 'bg-red-100 text-red-700',
    }
    return colors[s] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Partners</h1>

      <div className="flex gap-2 mb-4">
        {['', 'pending', 'approved', 'suspended'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border ${filter === f ? 'bg-[#0B1628] text-white border-[#0B1628]' : 'border-gray-200 text-gray-500'}`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {partners.map((p: any) => (
          <div key={p.id} className="border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold">{p.company_name}</span>
                <span className="ml-2 text-sm text-gray-400">{p.region || 'No region'}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(p.status)}`}>
                {p.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mb-3">
              <p>Contact: {p.contact_name || 'N/A'}</p>
              <p>Phone: {p.contact_phone || 'N/A'}</p>
              <p>Email: {p.user_email || 'N/A'}</p>
              <p>Registered: {new Date(p.created_at).toLocaleDateString()}</p>
            </div>
            {p.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => approve(p.id, 'approved')} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700">Approve</button>
                <button onClick={() => approve(p.id, 'suspended')} className="bg-red-100 text-red-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-red-200">Reject</button>
              </div>
            )}
            {p.status === 'approved' && (
              <button onClick={() => approve(p.id, 'suspended')} className="text-red-500 text-sm hover:text-red-700">Suspend</button>
            )}
          </div>
        ))}
        {partners.length === 0 && <p className="text-gray-400 text-center py-8">No partners registered yet.</p>}
      </div>
    </div>
  )
}
