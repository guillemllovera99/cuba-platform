import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../store'
import { useI18n, translate } from '../i18n'
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
  const lang = useI18n(s => s.lang)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [topupAmount, setTopupAmount] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)
  const [showTopup, setShowTopup] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const L = {
    title: lang === 'es' ? 'Mi Billetera' : lang === 'fr' ? 'Mon Portefeuille' : 'My Wallet',
    available: lang === 'es' ? 'Saldo Disponible' : lang === 'fr' ? 'Solde Disponible' : 'Available Balance',
    total: lang === 'es' ? 'Saldo Total' : lang === 'fr' ? 'Solde Total' : 'Total Balance',
    reserved: lang === 'es' ? 'Reservado' : lang === 'fr' ? 'Réservé' : 'Reserved',
    addCredits: lang === 'es' ? 'Agregar Créditos' : lang === 'fr' ? 'Ajouter des Crédits' : 'Add Credits',
    amount: lang === 'es' ? 'Monto (USD)' : lang === 'fr' ? 'Montant (USD)' : 'Amount (USD)',
    cancel: lang === 'es' ? 'Cancelar' : lang === 'fr' ? 'Annuler' : 'Cancel',
    adding: lang === 'es' ? 'Agregando...' : lang === 'fr' ? 'Ajout...' : 'Adding...',
    history: lang === 'es' ? 'Historial de Transacciones' : lang === 'fr' ? 'Historique des Transactions' : 'Transaction History',
    noTx: lang === 'es' ? 'Sin transacciones aún. Agrega créditos para comenzar.' : lang === 'fr' ? 'Pas encore de transactions. Ajoutez des crédits pour commencer.' : 'No transactions yet. Add credits to get started.',
    guideTitle: lang === 'es' ? '¿Qué son los Créditos de Plataforma?' : lang === 'fr' ? 'Que sont les Crédits Plateforme ?' : 'What are Platform Credits?',
    howItWorks: lang === 'es' ? '¿Cómo funciona?' : lang === 'fr' ? 'Comment ça marche ?' : 'How does it work?',
    learnMore: lang === 'es' ? 'Conocer más' : lang === 'fr' ? 'En savoir plus' : 'Learn how it works',
    shopNow: lang === 'es' ? 'Ir al catálogo' : lang === 'fr' ? 'Voir le catalogue' : 'Browse catalog',
  }

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
      // Show guide for new users with no transactions
      if (txs.length === 0) setShowGuide(true)
    } catch {
      setShowGuide(true)
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
      const txs = await api.walletTransactions(50)
      setTransactions(txs)
    } catch (e: any) {
      alert(e.message || 'Top-up failed')
    }
    setTopupLoading(false)
  }

  const txLabels: Record<string, { en: string; es: string; fr: string; color: string }> = {
    topup:       { en: 'Top Up',     es: 'Recarga',     fr: 'Recharge',    color: 'text-green-600' },
    reserve:     { en: 'Reserved',   es: 'Reservado',   fr: 'Réservé',     color: 'text-amber-600' },
    release:     { en: 'Released',   es: 'Liberado',    fr: 'Libéré',      color: 'text-blue-600' },
    spend:       { en: 'Spent',      es: 'Gastado',     fr: 'Dépensé',     color: 'text-red-600' },
    refund:      { en: 'Refund',     es: 'Reembolso',   fr: 'Remboursement', color: 'text-green-600' },
    admin_adjust:{ en: 'Adjustment', es: 'Ajuste',      fr: 'Ajustement',  color: 'text-purple-600' },
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">Loading...</div>
  }

  const available = (wallet?.balance || 0) - (wallet?.reserved || 0)
  const hasBalance = (wallet?.balance || 0) > 0

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-[#0B1628] mb-8">{L.title}</h1>

      {/* ───── Balance Card ───── */}
      <div className="bg-gradient-to-br from-[#0B1628] to-[#1a2d4a] text-white rounded-2xl p-6 mb-6">
        <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">{L.available}</p>
        <p className="text-3xl font-bold mb-4">
          ${available.toFixed(2)}
          <span className="text-sm font-normal text-white/50 ml-1">{wallet?.currency || 'USD'}</span>
        </p>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-white/40 text-xs">{L.total}</p>
            <p className="font-medium">${(wallet?.balance || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs">{L.reserved}</p>
            <p className="font-medium">${(wallet?.reserved || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ───── Quick Actions ───── */}
      <div className="flex gap-3 mb-6">
        {!showTopup ? (
          <button onClick={() => setShowTopup(true)}
            className="bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
            {L.addCredits}
          </button>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-end gap-3 flex-1">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">{L.amount}</label>
              <input type="number" min="1" step="0.01" value={topupAmount}
                onChange={e => setTopupAmount(e.target.value)} placeholder="50.00"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500" />
            </div>
            <button onClick={handleTopup} disabled={topupLoading}
              className="bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {topupLoading ? L.adding : L.addCredits}
            </button>
            <button onClick={() => { setShowTopup(false); setTopupAmount('') }}
              className="text-sm text-gray-400 px-3 py-2.5 hover:text-gray-600">{L.cancel}</button>
          </div>
        )}
        {!showTopup && hasBalance && (
          <Link to="/catalog"
            className="border border-gray-200 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
            {L.shopNow}
          </Link>
        )}
      </div>

      {/* ───── Onboarding Guide (shows for new users or on toggle) ───── */}
      {(showGuide || transactions.length === 0) && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-[#0B1628] mb-4">{L.guideTitle}</h2>

          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            {lang === 'es'
              ? 'Los créditos de plataforma son tu saldo interno. Funcionan como una billetera digital que puedes usar para pagar pedidos de forma instantánea, sin necesidad de introducir datos de pago cada vez. Los reembolsos se acreditan directamente a tu billetera para que puedas usarlos en tu próxima compra.'
              : lang === 'fr'
              ? 'Les crédits plateforme sont votre solde interne. Ils fonctionnent comme un portefeuille numérique que vous pouvez utiliser pour payer des commandes instantanément, sans avoir à saisir vos informations de paiement à chaque fois. Les remboursements sont crédités directement sur votre portefeuille.'
              : 'Platform credits are your internal balance. They work like a digital wallet you can use to pay for orders instantly without entering payment details every time. Refunds are credited directly to your wallet so you can use them on your next purchase.'}
          </p>

          {/* Step-by-step flow */}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{L.howItWorks}</h3>
          <div className="space-y-3 mb-5">
            {[
              {
                step: '1',
                title: lang === 'es' ? 'Agrega fondos' : lang === 'fr' ? 'Ajoutez des fonds' : 'Add funds',
                desc: lang === 'es' ? 'Carga tu billetera con tarjeta o transferencia. 1 crédito = $1 USD.' : lang === 'fr' ? 'Rechargez votre portefeuille par carte ou virement. 1 crédit = 1$ USD.' : 'Load your wallet via card or bank transfer. 1 credit = $1 USD.',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                ),
                color: 'bg-green-100 text-green-700',
              },
              {
                step: '2',
                title: lang === 'es' ? 'Haz un pedido' : lang === 'fr' ? 'Passez commande' : 'Place an order',
                desc: lang === 'es' ? 'Al pagar, selecciona "Créditos de Plataforma". El monto se reserva de tu saldo.' : lang === 'fr' ? 'Au paiement, sélectionnez "Crédits Plateforme". Le montant est réservé de votre solde.' : 'At checkout, select "Platform Credits" as your payment method. The amount is reserved from your balance.',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                ),
                color: 'bg-amber-100 text-amber-700',
              },
              {
                step: '3',
                title: lang === 'es' ? 'Pago confirmado' : lang === 'fr' ? 'Paiement confirmé' : 'Payment confirmed',
                desc: lang === 'es' ? 'Los créditos reservados se debitan cuando tu pedido se confirma. Sin cargos adicionales.' : lang === 'fr' ? 'Les crédits réservés sont débités lorsque votre commande est confirmée. Pas de frais supplémentaires.' : 'Reserved credits are debited when your order is confirmed. No extra fees.',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: 'bg-blue-100 text-blue-700',
              },
              {
                step: '4',
                title: lang === 'es' ? 'Reembolsos automáticos' : lang === 'fr' ? 'Remboursements automatiques' : 'Automatic refunds',
                desc: lang === 'es' ? 'Si se cancela un pedido, los créditos regresan a tu billetera automáticamente.' : lang === 'fr' ? 'Si une commande est annulée, les crédits sont retournés automatiquement à votre portefeuille.' : 'If an order is cancelled, credits return to your wallet automatically. No waiting for bank refunds.',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                color: 'bg-purple-100 text-purple-700',
              },
            ].map(s => (
              <div key={s.step} className="flex gap-3 items-start">
                <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0B1628]">{s.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Credit states visual */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-3">
              {lang === 'es' ? 'Estados de crédito' : lang === 'fr' ? 'États des crédits' : 'Credit states'}
            </p>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-gray-100">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {lang === 'es' ? 'Disponible' : lang === 'fr' ? 'Disponible' : 'Available'}
              </span>
              <span className="text-gray-300">&rarr;</span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-gray-100">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {lang === 'es' ? 'Reservado' : lang === 'fr' ? 'Réservé' : 'Reserved'}
              </span>
              <span className="text-gray-300">&rarr;</span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-gray-100">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {lang === 'es' ? 'Gastado' : lang === 'fr' ? 'Dépensé' : 'Spent'}
              </span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-gray-100">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {lang === 'es' ? 'Reembolsado' : lang === 'fr' ? 'Remboursé' : 'Refunded'}
              </span>
            </div>
          </div>

          {transactions.length > 0 && (
            <button onClick={() => setShowGuide(false)}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600">
              {lang === 'es' ? 'Ocultar guía' : lang === 'fr' ? 'Masquer le guide' : 'Hide guide'}
            </button>
          )}
        </div>
      )}

      {/* Toggle guide if hidden */}
      {!showGuide && transactions.length > 0 && (
        <button onClick={() => setShowGuide(true)}
          className="text-xs text-gray-400 hover:text-gray-600 mb-4 block">
          {L.learnMore}
        </button>
      )}

      {/* ───── Transaction History ───── */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-[#0B1628]">{L.history}</h3>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">{L.noTx}</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map(tx => {
              const info = txLabels[tx.tx_type] || { en: tx.tx_type, es: tx.tx_type, fr: tx.tx_type, color: 'text-gray-600' }
              const label = info[lang as 'en' | 'es' | 'fr'] || info.en
              const isCredit = tx.amount > 0
              return (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {isCredit ? '+' : '-'}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${info.color}`}>{label}</p>
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
