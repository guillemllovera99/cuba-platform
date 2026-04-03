import { useState, useEffect } from 'react'
import { api } from '../../api'

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => { load() }, [filter])

  const load = async () => {
    const [fb, st] = await Promise.all([
      api.adminFeedbackList(filter || undefined),
      api.adminFeedbackStats(),
    ])
    setFeedback(fb)
    setStats(st)
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Customer Feedback</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-5 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="bg-green-50 rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.ok}</p>
            <p className="text-sm text-green-500">OK</p>
          </div>
          <div className="bg-red-50 rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.problem}</p>
            <p className="text-sm text-red-500">Problems</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'ok', 'problem'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border ${filter === f ? 'bg-[#0B1628] text-white border-[#0B1628]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            {f === '' ? 'All' : f === 'ok' ? 'OK' : 'Problems'}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {feedback.map((f: any) => (
          <div key={f.id} className={`border rounded-xl p-4 ${f.rating === 'problem' ? 'border-red-200 bg-red-50/30' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`text-lg ${f.rating === 'ok' ? '' : ''}`}>
                  {f.rating === 'ok' ? '\u{1F44D}' : '\u{1F44E}'}
                </span>
                <span className="font-mono text-sm">{f.order_code}</span>
                {f.category && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{f.category}</span>
                )}
              </div>
              <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleString()}</span>
            </div>
            {f.comment && <p className="text-sm text-gray-700 ml-8">{f.comment}</p>}
          </div>
        ))}
        {feedback.length === 0 && <p className="text-gray-400 text-center py-8">No feedback yet.</p>}
      </div>
    </div>
  )
}
