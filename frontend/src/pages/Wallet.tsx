import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store'
import { api } from '../api'

interface WalletData {
  id: string
  balance: number
  reserved: number
  currency: string
}

interface Transaction {
  id: string
  tx_type: string
  amount: number
  balance_after: number
  reference_type?: string
  reference_id?: string
  description?: string
  created_at: string
}

export default function WalletPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [topupAmount, setTopupAmount] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)
  const [showTopup, setShowTopup] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return }
    loadWallet()
  }, [isLoggedIn])

  const loadWallet = async () => {
    setLoading(true)
    try {
      const [w, txs] = await Promise.all([
        api.walletMe(),
        api.walletTransactions(50),
      ])
      setWallet(w)
      setTransactions(txs)
    } catch {
      // Wallet auto-created on first access
    }
    setLoading(false)
  }

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount)
    if (!amount || amount <= 0) return
    setTopupLoading(true)
    try {
      const updated = await api.walletTopup(amount)
      setWallet(updated)
      setTopupAmount('')
      setShowTopup(false)
      // Reload transactions
      const txs = await api.walletTransactions(50)
      setTransactions(txs)
    } catch (e: any) {
      alert(e.message || 'Top-up failed')
    }
    setTopupLoading(false)
  }

  const txTypeLabels: Record<string, { label: string; color: string }> = {
    topup: { label: 'Top Up', color: 'text-green-600' },
    reserve: { label: 'Reserved', color: 'text-amber-600' },
    release: { label: 'Released', color: 'text-blue-600' },
    spend: { label: 'Spent', color: 'text-red-600' },
    refund: { label: 'Refund', color: 'text-green-600' },
    admin_adjust: { label: 'Adjustment', color: 'text-purple-600' },
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">Loading...</div>
  }

  const available = (wallet?.balance || 0) - (wallet?.reserved || 0)

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-[#0B1628] mb-8">My Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#0B1628] to-[#1a2d4a] text-white rounded-2xl p-6 mb-6">
        <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Available Balance</p>
        <p className="text-3xl font-bold mb-4">${available.toFixed(2)} <span className="text-sm font-normal text-white/50">{wallet?.currency || 'USD'}</span></p>

        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-white/40 text-xs">Total Balance</p>
            <p className="font-medium">${(wallet?.balance || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs">Reserved</p>
            <p className="font-medium">${(wallet?.reserved || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Top Up */}
      <div className="mb-6">
        {!showTopup ? (
          <button onClick={() => setShowTopup(true)}
            className="bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
            Add Credits
          </button>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Amount (USD)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={topupAmount}
                onChange={e => setTopupAmount(e.target.value)}
                placeholder="50.00"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <button onClick={handleTopup} disabled={topupLoading}
              className="bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
              {topupLoading ? 'Adding...' : 'Add Credits'}
            </button>
            <button onClick={() => { setShowTopup(false); setTopupAmount('') }}
              className="text-sm text-gray-400 px-3 py-2.5 hover:text-gray-600">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Token State Info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How Credits Work</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-green-500 mb-2" />
            <p className="font-medium text-[#0B1628]">Available</p>
            <p className="text-gray-400">Ready to spend</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-amber-500 mb-2" />
            <p className="font-medium text-[#0B1628]">Reserved</p>
            <p className="text-gray-400">Held for order</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-blue-500 mb-2" />
            <p className="font-medium text-[#0B1628]">Released</p>
            <p className="text-gray-400">Returned to balance</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-purple-500 mb-2" />
            <p className="font-medium text-[#0B1628]">Refunded</p>
            <p className="text-gray-400">Credited back</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-[#0B1628]">Transaction History</h3>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">No transactions yet. Add credits to get started.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map(tx => {
              const info = txTypeLabels[tx.tx_type] || { label: tx.tx_type, color: 'text-gray-600' }
              const isCredit = tx.amount > 0
              return (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {isCredit ? '+' : '-'}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${info.color}`}>{info.label}</p>
                      <p className="text-xs text-gray-400">{tx.description || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
