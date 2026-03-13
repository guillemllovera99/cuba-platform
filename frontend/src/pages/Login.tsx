import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store'
import { api } from '../api'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuth(s => s.setAuth)
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
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
      <div className="bg-white border rounded-lg p-6">
        <div className="flex mb-6 border-b">
          <button
            onClick={() => { setIsRegister(false); setError('') }}
            className={`flex-1 pb-3 text-sm font-medium ${!isRegister ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsRegister(true); setError('') }}
            className={`flex-1 pb-3 text-sm font-medium ${isRegister ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input value={form.full_name} onChange={set('full_name')} required
                  className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={set('phone')}
                  className="w-full border rounded px-3 py-2" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set('email')} required
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={set('password')} required
              className="w-full border rounded px-3 py-2" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold disabled:bg-gray-400">
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Demo admin: admin@cuba.com / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
