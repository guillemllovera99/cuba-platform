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
  updateProfile: (data: any) => apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // catalog
  getProducts: (params?: string) => apiFetch(`/api/v1/catalog/products${params ? '?' + params : ''}`),
  getProduct: (id: string) => apiFetch(`/api/v1/catalog/products/${id}`),
  getCategories: () => apiFetch('/api/v1/catalog/categories'),

  // featured products
  getFeaturedProducts: () => apiFetch('/api/v1/catalog/featured'),

  // admin catalog
  adminSetFeatured: (productId: string, featured: boolean) =>
    apiFetch(`/api/v1/catalog/admin/products/${productId}/featured`, { method: 'PUT', body: JSON.stringify({ featured }) }),
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

  // image upload
  uploadProductImage: async (file: File): Promise<{ url: string }> => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${BASE}/api/v1/admin/upload-image`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail || `Upload failed: ${res.status}`)
    }
    return res.json()
  },

  // admin order actions (deposit flow)
  adminRequestBalance: (orderId: string) =>
    apiFetch(`/api/v1/orders/admin/${orderId}/request-balance`, { method: 'PUT' }),
  adminConfirmBalance: (orderId: string) =>
    apiFetch(`/api/v1/orders/admin/${orderId}/confirm-balance`, { method: 'PUT' }),

  // shipment windows (preorder)
  adminShipmentWindows: () => apiFetch('/api/v1/admin/shipment-windows/'),
  adminCreateShipmentWindow: (data: any) =>
    apiFetch('/api/v1/admin/shipment-windows/', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateShipmentWindow: (id: string, data: any) =>
    apiFetch(`/api/v1/admin/shipment-windows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteShipmentWindow: (id: string) =>
    apiFetch(`/api/v1/admin/shipment-windows/${id}`, { method: 'DELETE' }),
  activeShipmentWindows: () => apiFetch('/api/v1/admin/shipment-windows/active'),

  // pickup points (Phase 5)
  getPickupPoints: () => apiFetch('/api/v1/pickup-points/'),
  adminPickupPoints: () => apiFetch('/api/v1/pickup-points/admin/'),
  adminCreatePickupPoint: (data: any) =>
    apiFetch('/api/v1/pickup-points/admin/', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdatePickupPoint: (id: string, data: any) =>
    apiFetch(`/api/v1/pickup-points/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeletePickupPoint: (id: string) =>
    apiFetch(`/api/v1/pickup-points/admin/${id}`, { method: 'DELETE' }),

  // bank transfer (Phase 6)
  bankTransferInitiate: (orderId: string) =>
    apiFetch(`/api/v1/payments/bank-transfer/initiate?order_id=${orderId}`, { method: 'POST' }),
  adminConfirmBankTransfer: (orderId: string, reference?: string) =>
    apiFetch(`/api/v1/payments/admin/bank-transfer/confirm?order_id=${orderId}${reference ? '&reference=' + reference : ''}`, { method: 'POST' }),

  // corporate (Phase 7)
  corporateRegister: (data: any) =>
    apiFetch('/api/v1/corporate/register', { method: 'POST', body: JSON.stringify(data) }),
  corporateProfile: () => apiFetch('/api/v1/corporate/profile'),
  corporateUpdateProfile: (data: any) =>
    apiFetch('/api/v1/corporate/profile', { method: 'PUT', body: JSON.stringify(data) }),
  corporateDashboard: () => apiFetch('/api/v1/corporate/dashboard'),
  corporateBulkOrder: (data: any) =>
    apiFetch('/api/v1/corporate/bulk-order', { method: 'POST', body: JSON.stringify(data) }),
  adminCorporateList: (status?: string) =>
    apiFetch(`/api/v1/corporate/admin/all${status ? '?status=' + status : ''}`),
  adminCorporateApprove: (profileId: string, data: any) =>
    apiFetch(`/api/v1/corporate/admin/${profileId}/approve`, { method: 'PUT', body: JSON.stringify(data) }),
  adminCorporateGet: (profileId: string) =>
    apiFetch(`/api/v1/corporate/admin/${profileId}`),
  corporateInvoice: (orderId: string) =>
    apiFetch(`/api/v1/corporate/invoice/${orderId}`),
  corporateInvoiceHtml: (orderId: string) =>
    `/api/v1/corporate/invoice/${orderId}/html`,

  // wallet (Phase 8)
  walletMe: () => apiFetch('/api/v1/wallet/me'),
  walletTransactions: (limit = 50) => apiFetch(`/api/v1/wallet/me/transactions?limit=${limit}`),
  walletTopup: (amount: number) =>
    apiFetch('/api/v1/wallet/topup', { method: 'POST', body: JSON.stringify({ amount }) }),
  walletReserve: (amount: number, orderId?: string) =>
    apiFetch('/api/v1/wallet/reserve', { method: 'POST', body: JSON.stringify({ amount, order_id: orderId }) }),
  walletSpend: (amount: number, orderId?: string) =>
    apiFetch('/api/v1/wallet/spend', { method: 'POST', body: JSON.stringify({ amount, order_id: orderId }) }),
  walletRelease: (amount: number, orderId?: string) =>
    apiFetch('/api/v1/wallet/release', { method: 'POST', body: JSON.stringify({ amount, order_id: orderId }) }),
  walletRefund: (amount: number, orderId?: string) =>
    apiFetch('/api/v1/wallet/refund', { method: 'POST', body: JSON.stringify({ amount, order_id: orderId }) }),
  adminWalletList: () => apiFetch('/api/v1/wallet/admin/all'),
  adminWalletAdjust: (userId: string, amount: number, description?: string) =>
    apiFetch('/api/v1/wallet/admin/adjust', { method: 'POST', body: JSON.stringify({ user_id: userId, amount, description }) }),
  adminWalletGet: (userId: string) => apiFetch(`/api/v1/wallet/admin/${userId}`),
  adminWalletTransactions: (userId: string) => apiFetch(`/api/v1/wallet/admin/${userId}/transactions`),

  // feedback / recipient (Phase 9)
  recipientTracking: (orderCode: string) =>
    apiFetch(`/api/v1/feedback/recipient/${orderCode}`),
  submitFeedback: (data: any) =>
    apiFetch('/api/v1/feedback/submit', { method: 'POST', body: JSON.stringify(data) }),
  adminFeedbackList: (rating?: string) =>
    apiFetch(`/api/v1/feedback/admin/all${rating ? '?rating=' + rating : ''}`),
  adminFeedbackStats: () => apiFetch('/api/v1/feedback/admin/stats'),
  confirmDelivery: (data: any) =>
    apiFetch('/api/v1/feedback/delivery/confirm', { method: 'POST', body: JSON.stringify(data) }),
  getDeliveryConfirmation: (orderId: string) =>
    apiFetch(`/api/v1/feedback/delivery/${orderId}`),

  // partner (Phase 10)
  partnerRegister: (data: any) =>
    apiFetch('/api/v1/partner/register', { method: 'POST', body: JSON.stringify(data) }),
  partnerProfile: () => apiFetch('/api/v1/partner/profile'),
  partnerOrders: (status?: string) =>
    apiFetch(`/api/v1/partner/orders${status ? '?status=' + status : ''}`),
  partnerStats: () => apiFetch('/api/v1/partner/stats'),
  adminPartnerList: (status?: string) =>
    apiFetch(`/api/v1/partner/admin/all${status ? '?status=' + status : ''}`),
  adminApprovePartner: (profileId: string, status: string, notes?: string) =>
    apiFetch(`/api/v1/partner/admin/${profileId}/approve?status=${status}${notes ? '&notes=' + encodeURIComponent(notes) : ''}`, { method: 'PUT' }),

  // supplier (Phase 10)
  supplierRegister: (data: any) =>
    apiFetch('/api/v1/supplier/register', { method: 'POST', body: JSON.stringify(data) }),
  supplierProfile: () => apiFetch('/api/v1/supplier/profile'),
  supplierPurchaseOrders: (status?: string) =>
    apiFetch(`/api/v1/supplier/purchase-orders${status ? '?status=' + status : ''}`),
  supplierConfirmPO: (poId: string) =>
    apiFetch(`/api/v1/supplier/purchase-orders/${poId}/confirm`, { method: 'PUT' }),
  supplierShipPO: (poId: string) =>
    apiFetch(`/api/v1/supplier/purchase-orders/${poId}/ship`, { method: 'PUT' }),
  adminSupplierList: (status?: string) =>
    apiFetch(`/api/v1/supplier/admin/all${status ? '?status=' + status : ''}`),
  adminApproveSupplier: (profileId: string, status: string, notes?: string) =>
    apiFetch(`/api/v1/supplier/admin/${profileId}/approve?status=${status}${notes ? '&notes=' + encodeURIComponent(notes) : ''}`, { method: 'PUT' }),
  adminCreatePO: (data: any) =>
    apiFetch('/api/v1/supplier/admin/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  adminSendPO: (poId: string) =>
    apiFetch(`/api/v1/supplier/admin/purchase-orders/${poId}/send`, { method: 'PUT' }),
  adminListPOs: (status?: string) =>
    apiFetch(`/api/v1/supplier/admin/purchase-orders${status ? '?status=' + status : ''}`),

  // analytics (US-13)
  analyticsOverview: () => apiFetch('/api/v1/admin/analytics/overview'),
  analyticsTopProducts: (limit = 10) => apiFetch(`/api/v1/admin/analytics/top-products?limit=${limit}`),
  analyticsRevenueOverTime: (days = 30) => apiFetch(`/api/v1/admin/analytics/revenue-over-time?days=${days}`),
  analyticsAccountTypes: () => apiFetch('/api/v1/admin/analytics/account-types'),
}
