import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── TYPES ─────────────────────────────────────────────────────
interface User {
  id: string
  name: string
  email?: string
  phone?: string
  role: string
  avatar?: string
  bellmakCoins: number
}

interface CartItem {
  productId: string
  title: string
  name?: string      // alias for title (some APIs return name)
  slug?: string      // for product page links
  price: number
  mrp: number
  image: string
  quantity: number
  variant?: any
}

// ── AUTH STORE ────────────────────────────────────────────────
interface AuthStore {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  setUser: (user: User, token: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      setUser: (user, token) => {
        localStorage.setItem('bellmak_token', token)
        set({ user, token, isLoggedIn: true })
      },
      logout: () => {
        localStorage.removeItem('bellmak_token')
        localStorage.removeItem('bellmak-auth')
        set({ user: null, token: null, isLoggedIn: false })
      },
      updateUser: (updates) => {
        const current = get().user
        if (current) set({ user: { ...current, ...updates } })
      }
    }),
    { name: 'bellmak-auth' }
  )
)

// ── CART STORE ────────────────────────────────────────────────
interface CartStore {
  items: CartItem[]
  coupon: { code: string; discountAmount: number } | null
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setCoupon: (coupon: { code: string; discountAmount: number } | null) => void
  getTotalItems: () => number
  getSubtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (newItem) => {
        const items = get().items
        const existing = items.find(i => i.productId === newItem.productId)
        if (existing) {
          set({
            items: items.map(i =>
              i.productId === newItem.productId
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            )
          })
        } else {
          set({ items: [...items, newItem] })
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.productId !== productId) })
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map(i =>
            i.productId === productId ? { ...i, quantity } : i
          )
        })
      },
      clearCart: () => set({ items: [], coupon: null }),
      setCoupon: (coupon) => set({ coupon }),
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    }),
    { name: 'bellmak-cart' }
  )
)

// ── WISHLIST STORE ────────────────────────────────────────────
interface WishlistStore {
  items: string[]
  addItem: (productId: string) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId) => {
        if (!get().items.includes(productId)) {
          set({ items: [...get().items, productId] })
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter(id => id !== productId) })
      },
      isInWishlist: (productId) => get().items.includes(productId)
    }),
    { name: 'bellmak-wishlist' }
  )
)