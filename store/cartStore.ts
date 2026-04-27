import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LocalCartItem } from '@/types'

interface CartStore {
  items: LocalCartItem[]
  isOpen: boolean
  addItem: (item: LocalCartItem) => void
  removeItem: (productId: string, color?: string, size?: string) => void
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        const items = get().items
        const existing = items.find(
          (i) => i.productId === item.productId && i.color === item.color && i.size === item.size
        )
        if (existing) {
          const newQty = Math.min(existing.quantity + item.quantity, item.stock)
          set({
            items: items.map((i) =>
              i.productId === item.productId && i.color === item.color && i.size === item.size
                ? { ...i, quantity: newQty }
                : i
            ),
          })
        } else {
          set({ items: [...items, item] })
        }
      },
      removeItem: (productId, color, size) => {
        set({
          items: get().items.filter(
            (i) => !(i.productId === productId && i.color === color && i.size === size)
          ),
        })
      },
      updateQuantity: (productId, quantity, color, size) => {
        if (quantity <= 0) {
          get().removeItem(productId, color, size)
          return
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.color === color && i.size === size
              ? { ...i, quantity }
              : i
          ),
        })
      },
      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'lams-cart' }
  )
)
