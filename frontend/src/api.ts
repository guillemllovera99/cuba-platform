const BASE = '' // proxied via vite in dev, nginx in prod

function getToken(): string | null {
  const raw = localStorage.getItem('cuba-auth')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed?.state?.token ?? null
  } catch {
    return null
  }
}

export async function apiFetch<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // auth
  register: (data: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiFetch('/auth/me'),

  // catalog
  getProducts: (params?: string) => apiFetch(`/api/v1/catalog/products${params ? '?' + params : ''}`),
  getProduct: (id: string) => apiFetch(`/api/v1/catalog/products/${id}`),
  getCategories: () => apiFetch('/api/v1/catalog/categories'),

  // admin catalog
  createProduct: (data: any) => apiFetch('/api/v1/catalog/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => apiFetch(`/api/v1/catalog/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => apiFetch(`/api/v1/catalog/admin/products/${id}`, { method: 'DELETE' }),

  // orders
  checkout: (data: any) => apiFetch('/api/v1/orders/checkout', { method: 'POST', body: JSON.stringify(data) }),
  myOrders: () => apiFetch('/api/v1/orders/mine'),
  getOrder: (id: string) => apiFetch(`/api/v1/orders/${id}`),
  trackOrder: (code: string) => apiFetch(`/api/v1/orders/track/${code}`),

  // admin orders
  adminOrders: (status?: string) => apiFetch(`/api/v1/orders/admin/all${status ? '?status=' + status : ''}`),
  updateOrderStatus: (id: string, status: string) =>
    apiFetch(`/api/v1/orders/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // admin stats
  adminStats: () => apiFetch('/api/v1/admin/stats'),
}
