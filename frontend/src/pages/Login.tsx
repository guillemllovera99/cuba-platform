import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store'
import { api } from '../api'
import { useI18n, translate } from '../i18n'

const ACCOUNT_TYPES = ['buyer', 'seller', 'both'] as const

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuth(s => s.setAuth)
  const navigate = useNavigate()
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', account_type: 'buyer' })
  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = isRegister
        ? await api.register(form)
        : await api.login({ email: form.email, password: form.password })
      setAuth(result.access_token, result.user)
      navigate(result.user.role === 'admin' ? '/admin' : '/')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex mb-6 border-b">
          <button
            onClick={() => { setIsRegister(false); setError('') }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors min-h-[44px] ${!isRegister ? 'border-b-2 border-[#0B1628] text-[#0B1628]' : 'text-gray-500'}`}
          >
            {t('login.login')}
          </button>
          <button
            onClick={() => { setIsRegister(true); setError('') }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors min-h-[44px] ${isRegister ? 'border-b-2 border-[#0B1628] text-[#0B1628]' : 'text-gray-500'}`}
          >
            {t('login.register')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              {/* Account type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('login.accountType')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCOUNT_TYPES.map(at => (
                    <button
                      key={at}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, account_type: at }))}
                      className={`p-3 rounded-lg border text-center transition-all min-h-[44px] ${
                        form.account_type === at
                          ? 'border-green-600 bg-green-50 ring-1 ring-green-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-[#0B1628]">{t(`login.${at}`)}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{t(`login.${at}Desc`)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.fullName')}</label>
                <input value={form.full_name} onChange={set('full_name')} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.phone')}</label>
                <input value={form.phone} onChange={set('phone')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.email')}</label>
            <input type="email" value={form.email} onChange={set('email')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.password')}</label>
            <input type="password" value={form.password} onChange={set('password')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-[#0B1628] focus:ring-1 focus:ring-[#0B1628]" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#0B1628] text-white py-3 rounded-lg hover:bg-[#0B1628]/90 font-semibold disabled:bg-gray-400 transition-colors min-h-[48px] text-base">
            {loading ? t('login.pleaseWait') : isRegister ? t('login.createAccount') : t('login.login')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">{t('login.demo')}</p>
        </div>
      </div>
    </div>
  )
}
