// In web mode: use relative URLs (nginx proxies /api/ and /auth/ to backend)
// In native (Capacitor) mode: hit the cloud backend directly
const isNative = typeof (window as any).Capacitor !== 'undefined';

const BASE = isNative
  ? (import.meta as any).env?.VITE_BACKEND_URL || ''
  : '';

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

  // shipments / delivery
  adminShipments: (status?: string) =>
    apiFetch(`/api/v1/shipments/admin/all${status ? '?status=' + status : ''}`),
  adminGetShipment: (id: string) => apiFetch(`/api/v1/shipments/admin/${id}`),
  adminUpdateShipment: (id: string, data: any) =>
    apiFetch(`/api/v1/shipments/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminAddShipmentEvent: (id: string, data: any) =>
    apiFetch(`/api/v1/shipments/admin/${id}/events`, { method: 'POST', body: JSON.stringify(data) }),
  getShipmentByOrderCode: (code: string) =>
    apiFetch(`/api/v1/shipments/by-order-code/${code}`),

  // payments
  paymentConfig: () => apiFetch('/api/v1/payments/config'),
  stripeCreateSession: (orderId: string) =>
    apiFetch(`/api/v1/payments/stripe/create-session?order_id=${orderId}`, { method: 'POST' }),
  paypalCreateOrder: (orderId: string) =>
    apiFetch(`/api/v1/payments/paypal/create-order?order_id=${orderId}`, { method: 'POST' }),
  paypalCapture: (paypalOrderId: string, orderId: string) =>
    apiFetch(`/api/v1/payments/paypal/capture?paypal_order_id=${paypalOrderId}&order_id=${orderId}`, { method: 'POST' }),

  // analytics (US-13)
  analyticsOverview: () => apiFetch('/api/v1/admin/analytics/overview'),
  analyticsTopProducts: (limit = 10) => apiFetch(`/api/v1/admin/analytics/top-products?limit=${limit}`),
  analyticsRevenueOverTime: (days = 30) => apiFetch(`/api/v1/admin/analytics/revenue-over-time?days=${days}`),
  analyticsAccountTypes: () => apiFetch('/api/v1/admin/analytics/account-types'),
}
