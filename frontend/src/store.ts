import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Auth Store ──
interface User {
  id: string; email: string; role: string; account_type?: string; full_name: string | null
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  isAdmin: () => boolean
  isLoggedIn: () => boolean
  isSeller: () => boolean
  isBuyer: () => boolean
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAdmin: () => get().user?.role === 'admin',
      isLoggedIn: () => !!get().token,
      isSeller: () => { const a = get().user?.account_type; return a === 'seller' || a === 'both' },
      isBuyer: () => { const a = get().user?.account_type; return !a || a === 'buyer' || a === 'both' },
    }),
    { name: 'cuba-auth' }
  )
)

// ── Cart Store ──
export interface CartItem {
  product_id: string
  name: string
  price_usd: number
  image_url: string | null
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (product: { id: string; name: string; price_usd: number; image_url: string | null }, qty?: number) => void
  removeItem: (product_id: string) => void
  updateQty: (product_id: string, qty: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1) => {
        const items = [...get().items]
        const idx = items.findIndex(i => i.product_id === product.id)
        if (idx >= 0) {
          items[idx].quantity += qty
        } else {
          items.push({
            product_id: product.id,
            name: product.name,
            price_usd: product.price_usd,
            image_url: product.image_url,
            quantity: qty,
          })
        }
        set({ items })
      },
      removeItem: (product_id) => set({ items: get().items.filter(i => i.product_id !== product_id) }),
      updateQty: (product_id, qty) => {
        if (qty <= 0) { get().removeItem(product_id); return }
        set({ items: get().items.map(i => i.product_id === product_id ? { ...i, quantity: qty } : i) })
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price_usd * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cuba-cart' }
  )
)
