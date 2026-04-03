import { useState } from 'react'
import { api } from '../api'
import { useI18n, translate } from '../i18n'

const L: Record<string, Record<string, string>> = {
  title: { en: 'Track Your Delivery', es: 'Rastrear Tu Entrega', fr: 'Suivre Votre Livraison' },
  subtitle: { en: 'Enter your order code to check delivery status and leave feedback', es: 'Ingrese su código de pedido para ver el estado y dejar comentarios', fr: 'Entrez votre code de commande pour vérifier le statut' },
  placeholder: { en: 'Enter order code (e.g. ORD-XXXXXX)', es: 'Código de pedido (ej. ORD-XXXXXX)', fr: 'Code de commande (ex. ORD-XXXXXX)' },
  search: { en: 'Track', es: 'Rastrear', fr: 'Suivre' },
  status: { en: 'Order Status', es: 'Estado del Pedido', fr: 'Statut de la Commande' },
  recipient: { en: 'Recipient', es: 'Destinatario', fr: 'Destinataire' },
  city: { en: 'City', es: 'Ciudad', fr: 'Ville' },
  pickup: { en: 'Pickup Point', es: 'Punto de Recogida', fr: 'Point de Retrait' },
  delivery: { en: 'Delivery Status', es: 'Estado de Entrega', fr: 'Statut de Livraison' },
  confirmed: { en: 'Delivery Confirmed', es: 'Entrega Confirmada', fr: 'Livraison Confirmée' },
  timeline: { en: 'Shipment Timeline', es: 'Cronología del Envío', fr: 'Chronologie de l\'Expédition' },
  feedbackTitle: { en: 'Leave Feedback', es: 'Dejar Comentario', fr: 'Laisser un Commentaire' },
  feedbackDone: { en: 'Feedback already submitted for this order', es: 'Ya se envió un comentario para este pedido', fr: 'Commentaire déjà soumis' },
  ok: { en: 'Everything OK', es: 'Todo Bien', fr: 'Tout est OK' },
  problem: { en: 'Report a Problem', es: 'Reportar un Problema', fr: 'Signaler un Problème' },
  commentPlaceholder: { en: 'Optional: describe your experience...', es: 'Opcional: describe tu experiencia...', fr: 'Optionnel: décrivez votre expérience...' },
  submit: { en: 'Submit Feedback', es: 'Enviar', fr: 'Soumettre' },
  submitted: { en: 'Thank you for your feedback!', es: '¡Gracias por tu comentario!', fr: 'Merci pour votre commentaire!' },
  notFound: { en: 'Order not found. Please check the code.', es: 'Pedido no encontrado. Verifique el código.', fr: 'Commande introuvable.' },
  category: { en: 'Category', es: 'Categoría', fr: 'Catégorie' },
}

export default function RecipientView() {
  const lang = useI18n(s => s.lang)
  const l = (k: string) => L[k]?.[lang] || L[k]?.en || k

  const [code, setCode] = useState('')
  const [tracking, setTracking] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Feedback state
  const [rating, setRating] = useState<'ok' | 'problem' | ''>('')
  const [comment, setComment] = useState('')
  const [category, setCategory] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const search = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setTracking(null)
    setFeedbackSent(false)
    try {
      const data = await api.recipientTracking(code.trim())
      setTracking(data)
    } catch {
      setError(l('notFound'))
    } finally {
      setLoading(false)
    }
  }

  const submitFeedback = async () => {
    if (!rating) return
    setSubmitting(true)
    try {
      await api.submitFeedback({
        order_code: code.trim(),
        rating,
        comment: comment || undefined,
        category: category || undefined,
      })
      setFeedbackSent(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const statusColors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    deposit_paid: 'bg-blue-100 text-blue-800',
    balance_due: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-200 text-green-900',
  }

  const categories = [
    { value: 'delivery', label: { en: 'Delivery', es: 'Entrega', fr: 'Livraison' } },
    { value: 'quality', label: { en: 'Product Quality', es: 'Calidad', fr: 'Qualité' } },
    { value: 'missing_items', label: { en: 'Missing Items', es: 'Artículos Faltantes', fr: 'Articles Manquants' } },
    { value: 'damaged', label: { en: 'Damaged', es: 'Dañado', fr: 'Endommagé' } },
    { value: 'other', label: { en: 'Other', es: 'Otro', fr: 'Autre' } },
  ]

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">{l('title')}</h1>
      <p className="text-gray-500 mb-6">{l('subtitle')}</p>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder={l('placeholder')}
          className="flex-1 border rounded-lg px-4 py-3 text-lg"
        />
        <button
          onClick={search}
          disabled={loading}
          className="bg-[#0B1628] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0B1628]/90 disabled:opacity-50"
        >
          {loading ? '...' : l('search')}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

      {tracking && (
        <div className="space-y-6">
          {/* Order status card */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{l('status')}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[tracking.status] || 'bg-gray-100 text-gray-700'}`}>
                {tracking.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">{l('recipient')}</span>
                <p className="font-medium">{tracking.recipient_name}</p>
              </div>
              <div>
                <span className="text-gray-400">{l('city')}</span>
                <p className="font-medium">{tracking.recipient_city}</p>
              </div>
              {tracking.pickup_point_name && (
                <div className="col-span-2">
                  <span className="text-gray-400">{l('pickup')}</span>
                  <p className="font-medium">{tracking.pickup_point_name}</p>
                  <p className="text-gray-500 text-xs">{tracking.pickup_point_address}</p>
                </div>
              )}
            </div>

            {tracking.delivery_confirmed && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <span className="text-green-600 text-lg">&#10003;</span>
                <span className="text-green-800 font-medium">{l('confirmed')}</span>
                {tracking.pickup_code && (
                  <span className="ml-auto text-sm text-green-600">Code: {tracking.pickup_code}</span>
                )}
              </div>
            )}
          </div>

          {/* Shipment timeline */}
          {tracking.shipment_events?.length > 0 && (
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">{l('timeline')}</h2>
              <div className="space-y-4">
                {tracking.shipment_events.map((ev: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === tracking.shipment_events.length - 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {i < tracking.shipment_events.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-sm">{ev.status.replace(/_/g, ' ')}</p>
                      {ev.location && <p className="text-xs text-gray-500">{ev.location}</p>}
                      {ev.description && <p className="text-xs text-gray-400">{ev.description}</p>}
                      <p className="text-xs text-gray-300 mt-1">{new Date(ev.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback section */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">{l('feedbackTitle')}</h2>

            {tracking.has_feedback || feedbackSent ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg">
                {feedbackSent ? l('submitted') : l('feedbackDone')}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quick rating */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setRating('ok')}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${rating === 'ok' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300'}`}
                  >
                    &#128077; {l('ok')}
                  </button>
                  <button
                    onClick={() => setRating('problem')}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${rating === 'problem' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-red-300'}`}
                  >
                    &#128078; {l('problem')}
                  </button>
                </div>

                {/* Category (only for problems) */}
                {rating === 'problem' && (
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">{l('category')}</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setCategory(c.value)}
                          className={`px-3 py-1.5 rounded-full text-sm border ${category === c.value ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                          {c.label[lang as keyof typeof c.label] || c.label.en}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comment */}
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={l('commentPlaceholder')}
                  rows={3}
                  className="w-full border rounded-lg px-4 py-3 text-sm"
                />

                <button
                  onClick={submitFeedback}
                  disabled={!rating || submitting}
                  className="bg-[#0B1628] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#0B1628]/90 disabled:opacity-50"
                >
                  {submitting ? '...' : l('submit')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
