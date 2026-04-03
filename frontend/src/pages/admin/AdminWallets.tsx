import { useState, useEffect } from 'react'
import { useAuth } from '../../store'
import { api } from '../../api'

interface WalletInfo {
  id: string
  user_id: string
  balance: number
  reserved: number
  currency: string
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
}

interface Transaction {
  id: string
  tx_type: string
  amount: number
  balance_after: number
  description?: string
  created_at: string
}

export default function AdminWallets() {
  const { isAdmin } = useAuth()
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(false)

  // Adjust form
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustDesc, setAdjustDesc] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.adminWalletList()
      setWallets(data)
    } catch { }
    setLoading(false)
  }

  const loadTransactions = async (userId: string) => {
    setSelectedUserId(userId)
    setTxLoading(true)
    try {
      const txs = await api.adminWalletTransactions(userId)
      setTransactions(txs)
    } catch { }
    setTxLoading(false)
  }

  const handleAdjust = async () => {
    if (!adjustUserId) return
    const amount = parseFloat(adjustAmount)
    if (!amount) return
    try {
      await api.adminWalletAdjust(adjustUserId, amount, adjustDesc || undefined)
      setAdjustUserId(null)
      setAdjustAmount('')
      setAdjustDesc('')
      load()
    } catch (e: any) {
      alert(e.message || 'Adjustment failed')
    }
  }

  if (!isAdmin()) return <p className="py-10 text-center text-red-500">Admin access required</p>

  return (
    <div className="max-w-5xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-[#0B1628] mb-6">Wallet Management</h1>

      {loading ? (
        <p className="py-10 text-center text-gray-400">Loading...</p>
      ) : wallets.length === 0 ? (
        <p className="py-10 text-center text-gray-400">No wallets found. Wallets are created when users first access their wallet.</p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3 text-left font-medium">User</th>
                <th className="px-5 py-3 text-right font-medium">Balance</th>
                <th className="px-5 py-3 text-right font-medium">Reserved</th>
                <th className="px-5 py-3 text-right font-medium">Available</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map(w => (
                <tr key={w.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-[#0B1628]">{w.user_name || w.user_email || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{w.user_email}</p>
                  </td>
                  <td className="px-5 py-3 text-right font-medium">${w.balance.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-amber-600">${w.reserved.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-green-600 font-medium">${(w.balance - w.reserved).toFixed(2)}</td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button onClick={() => loadTransactions(w.user_id)}
                      className="text-xs text-blue-600 hover:text-blue-800">History</button>
                    <button onClick={() => { setAdjustUserId(w.user_id); setAdjustAmount(''); setAdjustDesc('') }}
                      className="text-xs text-purple-600 hover:text-purple-800">Adjust</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust modal */}
      {adjustUserId && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-[#0B1628] mb-3">
            Adjust Balance — {wallets.find(w => w.user_id === adjustUserId)?.user_email}
          </h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Amount (+ credit, - debit)</label>
              <input type="number" step="0.01" value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)}
                placeholder="50.00 or -25.00"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Reason</label>
              <input type="text" value={adjustDesc}
                onChange={e => setAdjustDesc(e.target.value)}
                placeholder="e.g. Promotional credit"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <button onClick={handleAdjust}
              className="bg-purple-600 text-white text-xs font-medium px-4 py-2.5 rounded-lg hover:bg-purple-700">
              Apply
            </button>
            <button onClick={() => setAdjustUserId(null)}
              className="text-xs text-gray-400 px-3 py-2.5 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Transaction history */}
      {selectedUserId && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0B1628]">
              Transaction History — {wallets.find(w => w.user_id === selectedUserId)?.user_email}
            </h3>
            <button onClick={() => setSelectedUserId(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
          </div>
          {txLoading ? (
            <p className="py-6 text-center text-gray-400 text-sm">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="py-6 text-center text-gray-400 text-sm">No transactions</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map(tx => (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.tx_type.replace(/_/g, ' ')}
                    </span>
                    {tx.description && <span className="text-gray-400 text-xs ml-2">{tx.description}</span>}
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">bal: ${tx.balance_after.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
