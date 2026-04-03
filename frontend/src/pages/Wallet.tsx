import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../store'
import { useI18n } from '../i18n'
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

type TopupPaymentMethod = 'stripe' | 'paypal' | 'bank_transfer'

export default function WalletPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const lang = useI18n(s => s.lang)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Top-up state
  const [showTopup, setShowTopup] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')
  const [topupMethod, setTopupMethod] = useState<TopupPaymentMethod>('stripe')
  const [topupLoading, setTopupLoading] = useState(false)
  const [topupStep, setTopupStep] = useState<'amount' | 'confirm'>('amount')

  const [showGuide, setShowGuide] = useState(false)

  const L = {
    title: lang === 'es' ? 'Mi Billetera' : lang === 'fr' ? 'Mon Portefeuille' : 'My Wallet',
    available: lang === 'es' ? 'Saldo Disponible' : lang === 'fr' ? 'Solde Disponible' : 'Available Balance',
    total: lang === 'es' ? 'Saldo Total' : lang === 'fr' ? 'Solde Total' : 'Total Balance',
    reserved: lang === 'es' ? 'Reservado' : lang === 'fr' ? 'Réservé' : 'Reserved',
    addCredits: lang === 'es' ? 'Agregar Créditos' : lang === 'fr' ? 'Ajouter des Crédits' : 'Add Credits',
    amount: lang === 'es' ? 'Monto (USD)' : lang === 'fr' ? 'Montant (USD)' : 'Amount (USD)',
    cancel: lang === 'es' ? 'Cancelar' : lang === 'fr' ? 'Annuler' : 'Cancel',
    history: lang === 'es' ? 'Historial de Transacciones' : lang === 'fr' ? 'Historique des Transactions' : 'Transaction History',
    noTx: lang === 'es' ? 'Sin transacciones aún. Agrega créditos para comenzar.' : lang === 'fr' ? 'Pas encore de transactions. Ajoutez des crédits pour commencer.' : 'No transactions yet. Add credits to get started.',
    guideTitle: lang === 'es' ? '¿Qué son los Créditos de Plataforma?' : lang === 'fr' ? 'Que sont les Crédits Plateforme ?' : 'What are Platform Credits?',
    howItWorks: lang === 'es' ? '¿Cómo funciona?' : lang === 'fr' ? 'Comment ça marche ?' : 'How does it work?',
    learnMore: lang === 'es' ? 'Conocer más' : lang === 'fr' ? 'En savoir plus' : 'Learn how it works',
    shopNow: lang === 'es' ? 'Ir al catálogo' : lang === 'fr' ? 'Voir le catalogue' : 'Browse catalog',
    selectPayment: lang === 'es' ? 'Método de pago' : lang === 'fr' ? 'Méthode de paiement' : 'Payment method',
    confirmTopup: lang === 'es' ? 'Confirmar recarga' : lang === 'fr' ? 'Confirmer la recharge' : 'Confirm top-up',
    processing: lang === 'es' ? 'Procesando...' : lang === 'fr' ? 'Traitement...' : 'Processing...',
    back: lang === 'es' ? 'Atrás' : lang === 'fr' ? 'Retour' : 'Back',
    presetAmounts: lang === 'es' ? 'Montos sugeridos' : lang === 'fr' ? 'Montants suggérés' : 'Suggested amounts',
    customAmount: lang === 'es' ? 'Monto personalizado' : lang === 'fr' ? 'Montant personnalisé' : 'Custom amount',
    next: lang === 'es' ? 'Continuar' : lang === 'fr' ? 'Continuer' : 'Continue',
    topupSummary: lang === 'es' ? 'Resumen de recarga' : lang === 'fr' ? 'Résumé de la recharge' : 'Top-up summary',
    youWillPay: lang === 'es' ? 'Pagarás' : lang === 'fr' ? 'Vous paierez' : 'You will pay',
    creditsAdded: lang === 'es' ? 'Créditos agregados' : lang === 'fr' ? 'Crédits ajoutés' : 'Credits added',
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
      // For card and PayPal, in production this would redirect to payment provider
      // then a webhook calls the topup endpoint. For now we simulate the full flow.
      if (topupMethod === 'stripe') {
        // In production: create Stripe checkout session for wallet topup
        // For now: directly add credits (simulating successful payment)
        const updated = await api.walletTopup(amount)
        setWallet(updated)
      } else if (topupMethod === 'paypal') {
        // In production: create PayPal order for wallet topup
        // For now: directly add credits (simulating successful payment)
        const updated = await api.walletTopup(amount)
        setWallet(updated)
      } else if (topupMethod === 'bank_transfer') {
        // For bank transfer: add credits pending admin confirmation
        const updated = await api.walletTopup(amount)
        setWallet(updated)
      }

      setTopupAmount('')
      setShowTopup(false)
      setTopupStep('amount')
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
  const topupAmountNum = parseFloat(topupAmount) || 0

  const presetAmounts = [10, 25, 50, 100, 250]

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
          <>
            <button onClick={() => setShowTopup(true)}
              className="bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
              {L.addCredits}
            </button>
            {hasBalance && (
              <Link to="/catalog"
                className="border border-gray-200 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                {L.shopNow}
              </Link>
            )}
          </>
        ) : (
          /* ───── Top-Up Flow ───── */
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex-1">

            {topupStep === 'amount' && (
              <div>
                <h3 className="text-sm font-semibold text-[#0B1628] mb-4">{L.addCredits}</h3>

                {/* Preset amounts */}
                <p className="text-xs text-gray-400 mb-2">{L.presetAmounts}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {presetAmounts.map(amt => (
                    <button key={amt} onClick={() => setTopupAmount(String(amt))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        topupAmount === String(amt)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      ${amt}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <p className="text-xs text-gray-400 mb-1">{L.customAmount}</p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-gray-400 text-lg">$</span>
                  <input type="number" min="1" step="0.01" value={topupAmount}
                    onChange={e => setTopupAmount(e.target.value)} placeholder="0.00"
                    className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500" />
                  <span className="text-xs text-gray-400">USD</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { if (topupAmountNum > 0) setTopupStep('confirm') }}
                    disabled={topupAmountNum <= 0}
                    className="bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                    {L.next}
                  </button>
                  <button onClick={() => { setShowTopup(false); setTopupAmount(''); setTopupStep('amount') }}
                    className="text-sm text-gray-400 px-3 py-2.5 hover:text-gray-600">{L.cancel}</button>
                </div>
              </div>
            )}

            {topupStep === 'confirm' && (
              <div>
                <h3 className="text-sm font-semibold text-[#0B1628] mb-4">{L.topupSummary}</h3>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">{L.youWillPay}</span>
                    <span className="text-lg font-bold text-[#0B1628]">${topupAmountNum.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{L.creditsAdded}</span>
                    <span className="text-sm font-medium text-green-600">+${topupAmountNum.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-400">{L.available} {lang === 'es' ? 'después' : lang === 'fr' ? 'après' : 'after'}</span>
                    <span className="text-sm font-medium text-gray-700">${(available + topupAmountNum).toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment method selection */}
                <p className="text-xs text-gray-400 mb-2">{L.selectPayment}</p>
                <div className="space-y-2 mb-4">
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${topupMethod === 'stripe' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="topup-payment" checked={topupMethod === 'stripe'}
                      onChange={() => setTopupMethod('stripe')} className="accent-green-600" />
                    <svg viewBox="0 0 28 12" className="h-4 w-7" aria-label="Card">
                      <rect width="28" height="12" rx="2" fill="#635BFF"/>
                      <text x="14" y="9" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">S</text>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {lang === 'es' ? 'Tarjeta de Crédito / Débito' : lang === 'fr' ? 'Carte de Crédit / Débit' : 'Credit / Debit Card'}
                    </span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${topupMethod === 'paypal' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="topup-payment" checked={topupMethod === 'paypal'}
                      onChange={() => setTopupMethod('paypal')} className="accent-green-600" />
                    <svg viewBox="0 0 28 12" className="h-4 w-7" aria-label="PayPal">
                      <rect width="28" height="12" rx="2" fill="#003087"/>
                      <text x="14" y="9" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">P</text>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">PayPal</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${topupMethod === 'bank_transfer' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="topup-payment" checked={topupMethod === 'bank_transfer'}
                      onChange={() => setTopupMethod('bank_transfer')} className="accent-green-600" />
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {lang === 'es' ? 'Transferencia Bancaria' : lang === 'fr' ? 'Virement Bancaire' : 'Bank Transfer'}
                    </span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleTopup} disabled={topupLoading}
                    className="bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                    {topupLoading ? L.processing : `${L.confirmTopup} — $${topupAmountNum.toFixed(2)}`}
                  </button>
                  <button onClick={() => setTopupStep('amount')}
                    className="text-sm text-gray-400 px-3 py-2.5 hover:text-gray-600">{L.back}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ───── Onboarding Guide ───── */}
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

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{L.howItWorks}</h3>
          <div className="space-y-3 mb-5">
            {[
              {
                step: '1',
                title: lang === 'es' ? 'Agrega fondos' : lang === 'fr' ? 'Ajoutez des fonds' : 'Add funds',
                desc: lang === 'es' ? 'Carga tu billetera pagando con tarjeta, PayPal o transferencia. 1 crédito = $1 USD.' : lang === 'fr' ? 'Rechargez votre portefeuille par carte, PayPal ou virement. 1 crédit = 1$ USD.' : 'Top up your wallet by paying with card, PayPal, or bank transfer. 1 credit = $1 USD.',
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
                desc: lang === 'es' ? 'Al pagar, selecciona "Créditos de Plataforma". El monto del depósito (20%) se deduce de tu saldo.' : lang === 'fr' ? 'Au paiement, sélectionnez "Crédits Plateforme". Le montant de l\'acompte (20%) est déduit de votre solde.' : 'At checkout, select "Platform Credits". The deposit amount (20%) is deducted from your balance instantly.',
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
