'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total } = useCartStore()
  const cartTotal = useCartStore((s) => s.total())

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-lams-dark/50 z-40 animate-fade-in"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-lams-white z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-lams-dark">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-lams-cream" />
            <h2 className="text-lams-cream text-[11px] tracking-[0.3em] font-medium">
              MON PANIER
              {items.length > 0 && (
                <span className="ml-2 text-lams-gold">({items.length})</span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="text-lams-lightgray hover:text-lams-cream transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <ShoppingBag size={48} className="text-lams-border" />
              <p className="text-lams-gray text-sm">Votre panier est vide</p>
              <button
                onClick={closeCart}
                className="btn-outline text-sm"
              >
                DÉCOUVRIR NOS PRODUITS
              </button>
            </div>
          ) : (
            <div className="divide-y divide-lams-border">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.color}-${item.size}`}
                  className="flex gap-4 p-5"
                >
                  {/* Image */}
                  <div className="w-20 h-24 bg-lams-cream flex-shrink-0 relative overflow-hidden">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={20} className="text-lams-lightgray" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-lams-dark line-clamp-2">{item.name}</p>
                    <div className="flex gap-3 mt-1">
                      {item.color && (
                        <span className="text-[11px] text-lams-gray flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-lams-border inline-block"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.color}
                        </span>
                      )}
                      {item.size && (
                        <span className="text-[11px] text-lams-gray">T. {item.size}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-lams-dark mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity & remove */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-lams-border">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.color, item.size)
                          }
                          className="w-7 h-7 flex items-center justify-center text-lams-gray hover:text-lams-dark hover:bg-lams-cream transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              Math.min(item.quantity + 1, item.stock),
                              item.color,
                              item.size
                            )
                          }
                          disabled={item.quantity >= item.stock}
                          className="w-7 h-7 flex items-center justify-center text-lams-gray hover:text-lams-dark hover:bg-lams-cream transition-colors disabled:opacity-40"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.color, item.size)}
                        className="text-lams-gray hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-lams-border bg-lams-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.2em] text-lams-gray">SOUS-TOTAL</span>
              <span className="text-base font-semibold text-lams-dark">{formatPrice(cartTotal)}</span>
            </div>
            <p className="text-[11px] text-lams-gray">Livraison calculée à la commande</p>
            <Link
              href="/cart"
              onClick={closeCart}
              className="btn-dark w-full text-center block"
            >
              COMMANDER
            </Link>
            <button
              onClick={closeCart}
              className="w-full text-center text-[11px] tracking-widest text-lams-gray hover:text-lams-dark transition-colors"
            >
              Continuer mes achats
            </button>
          </div>
        )}
      </div>
    </>
  )
}
