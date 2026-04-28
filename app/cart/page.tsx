'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Trash2, Minus, Plus, Phone, Loader, MapPin, X, CreditCard, Package } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), { ssr: false })

export default function CartPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const cartTotal = useCartStore((s) => s.total())

  const [payMode, setPayMode] = useState<'NOW' | 'LATER'>('NOW')
  const [payOp, setPayOp] = useState<'MOOV' | 'YAS'>('MOOV')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null)
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [addressError, setAddressError] = useState(false)

  const handleCheckout = async () => {
    if (!session) { router.push('/login'); return }
    if (payMode === 'NOW' && !phone) { toast.error('Entrez votre numéro de téléphone'); return }
    if (!address && !deliveryLat) {
      toast.error('Veuillez indiquer votre adresse de livraison')
      setAddressError(true)
      setOrdering(false)
      return
    }
    setAddressError(false)

    setOrdering(true)
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            color: i.color,
            size: i.size,
          })),
          paymentMethod: payMode === 'NOW' ? payOp : 'PLUS_TARD',
          deliveryAddress: address,
          deliveryLat,
          deliveryLng,
          note,
        }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        toast.error(orderData.error || 'Erreur commande')
        setOrdering(false)
        return
      }

      const orderId = orderData.order.id

      if (payMode === 'NOW') {
        fetch('/api/payment/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, operator: payOp, phone }),
        }).then(r => r.json()).then(payData => {
          if (payData.success) {
            toast.success(payData.message || 'Demande de paiement envoyée sur votre téléphone')
          } else {
            toast.error(payData.message || 'Vérifiez votre numéro et réessayez')
          }
        }).catch(() => {})
      } else {
        toast.success('Commande passée ! Vous pouvez payer depuis vos commandes.')
      }

      clearCart()
      router.push('/orders')
    } catch {
      toast.error('Erreur réseau')
      setOrdering(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-lams-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="font-serif text-3xl text-lams-dark mb-8">Mon Panier</h1>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShoppingBag size={64} className="text-lams-border mb-6" />
              <h2 className="text-xl text-lams-dark mb-3">Votre panier est vide</h2>
              <p className="text-lams-gray text-sm mb-8">Découvrez nos collections pour trouver la pièce parfaite.</p>
              <Link href="/" className="btn-dark">DÉCOUVRIR LA BOUTIQUE</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2 space-y-0 divide-y divide-lams-border bg-white">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-4 p-5">
                    <div className="relative w-24 h-28 bg-lams-cream flex-shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={24} className="text-lams-border" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-lams-dark">{item.name}</p>
                      <div className="flex gap-3 mt-1">
                        {item.color && (
                          <span className="text-[11px] text-lams-gray flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full border border-lams-border" style={{ backgroundColor: item.color }} />
                            {item.color}
                          </span>
                        )}
                        {item.size && <span className="text-[11px] text-lams-gray">T. {item.size}</span>}
                      </div>
                      <p className="text-base font-semibold mt-1">{formatPrice(item.price)}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-lams-border">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.color, item.size)}
                            className="w-8 h-8 flex items-center justify-center text-lams-gray hover:text-lams-dark hover:bg-lams-cream transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, Math.min(item.quantity + 1, item.stock), item.color, item.size)}
                            disabled={item.quantity >= item.stock}
                            className="w-8 h-8 flex items-center justify-center text-lams-gray hover:text-lams-dark hover:bg-lams-cream transition-colors disabled:opacity-40"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                          <button
                            onClick={() => removeItem(item.productId, item.color, item.size)}
                            className="text-lams-gray hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary & payment */}
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-white p-6">
                  <h2 className="text-[11px] tracking-[0.3em] text-lams-gray mb-4">RÉCAPITULATIF</h2>
                  <div className="space-y-3">
                    {items.map((i) => (
                      <div key={`${i.productId}-${i.color}-${i.size}`} className="flex justify-between text-sm">
                        <span className="text-lams-gray truncate mr-2">{i.name} × {i.quantity}</span>
                        <span className="font-medium flex-shrink-0">{formatPrice(i.price * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-lams-border mt-4 pt-4 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                {/* Checkout */}
                <div className="bg-white p-6 space-y-4">
                  <h2 className="text-[11px] tracking-[0.3em] text-lams-gray">FINALISER LA COMMANDE</h2>

                  {/* Mode selector */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPayMode('NOW')}
                      className={`flex-1 py-3 text-xs font-semibold tracking-widest border transition-all flex flex-col items-center gap-1 ${
                        payMode === 'NOW'
                          ? 'bg-lams-dark text-lams-cream border-lams-dark'
                          : 'border-lams-border text-lams-gray hover:border-lams-dark hover:text-lams-dark'
                      }`}
                    >
                      <CreditCard size={16} />
                      PAYER MAINTENANT
                    </button>
                    <button
                      onClick={() => setPayMode('LATER')}
                      className={`flex-1 py-3 text-xs font-semibold tracking-widest border transition-all flex flex-col items-center gap-1 ${
                        payMode === 'LATER'
                          ? 'bg-lams-dark text-lams-cream border-lams-dark'
                          : 'border-lams-border text-lams-gray hover:border-lams-dark hover:text-lams-dark'
                      }`}
                    >
                      <Package size={16} />
                      COMMANDER D'ABORD
                    </button>
                  </div>

                  {payMode === 'LATER' && (
                    <p className="text-[11px] text-lams-gray bg-amber-50 border border-amber-200 px-3 py-2">
                      Commandez maintenant et payez plus tard depuis vos commandes.
                    </p>
                  )}

                  {/* Operator selector — only when paying now */}
                  {payMode === 'NOW' && (
                    <>
                      <div>
                        <label className="text-[11px] tracking-widest text-lams-gray block mb-2">OPÉRATEUR MOBILE</label>
                        <div className="flex gap-2">
                          {(['MOOV', 'YAS'] as const).map((op) => (
                            <button
                              key={op}
                              onClick={() => setPayOp(op)}
                              className={`flex-1 py-2.5 text-sm font-medium border transition-colors ${
                                payOp === op
                                  ? 'bg-lams-dark text-lams-cream border-lams-dark'
                                  : 'border-lams-border text-lams-gray hover:border-lams-dark hover:text-lams-dark'
                              }`}
                            >
                              {op === 'MOOV' ? 'MOOV MONEY' : 'YAS PAY'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">
                          NUMÉRO {payOp === 'MOOV' ? 'MOOV' : 'YAS'} *
                        </label>
                        <div className="flex border border-lams-border bg-white overflow-hidden">
                          <span className="flex items-center justify-center px-3 bg-lams-cream border-r border-lams-border flex-shrink-0">
                            <Phone size={14} className="text-lams-gray" />
                          </span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+228 XX XX XX XX"
                            className="flex-1 px-3 py-2.5 text-sm outline-none bg-white text-lams-dark"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Address — always shown */}
                  <div>
                    <label className={`text-[11px] tracking-widest block mb-1.5 ${addressError ? 'text-red-500 font-semibold' : 'text-lams-gray'}`}>
                      ADRESSE DE LIVRAISON *{addressError && ' — requis'}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => { setAddress(e.target.value); setDeliveryLat(null); setDeliveryLng(null); setAddressError(false) }}
                          placeholder="Votre adresse de livraison"
                          className={`input-field pr-8 text-sm ${addressError ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                        />
                        {address && (
                          <button
                            type="button"
                            onClick={() => { setAddress(''); setDeliveryLat(null); setDeliveryLng(null) }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-lams-gray hover:text-lams-dark"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        title="Choisir sur la carte"
                        className={`flex-shrink-0 flex items-center justify-center w-10 h-10 border transition-all ${
                          deliveryLat ? 'bg-green-50 border-green-400 text-green-600' : 'border-lams-border text-lams-gray hover:border-lams-dark hover:text-lams-dark'
                        }`}
                      >
                        <MapPin size={16} />
                      </button>
                    </div>
                    {deliveryLat && (
                      <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                        <MapPin size={10} /> Position GPS enregistrée
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">NOTE (optionnel)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Instructions spéciales..."
                      rows={2}
                      className="input-field resize-none"
                    />
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={ordering}
                    className="btn-dark w-full flex items-center justify-center gap-2"
                  >
                    {ordering ? (
                      <Loader size={16} className="animate-spin" />
                    ) : payMode === 'NOW' ? (
                      `PAYER ${formatPrice(cartTotal)}`
                    ) : (
                      'PASSER LA COMMANDE'
                    )}
                  </button>

                  {!session && (
                    <p className="text-[11px] text-center text-lams-gray">
                      <Link href="/login" className="text-lams-dark underline">Connectez-vous</Link> pour commander
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {showMap && (
        <LocationPicker
          onSelect={(loc) => {
            setAddress(loc.address)
            setDeliveryLat(loc.lat)
            setDeliveryLng(loc.lng)
            setShowMap(false)
          }}
          onClose={() => setShowMap(false)}
        />
      )}
    </>
  )
}
