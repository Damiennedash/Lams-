'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Download, Loader, MessageCircle, X, Send, Phone, CreditCard, Pencil, Trash2, MapPin, Minus, Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import OrderTracker from '@/components/shop/OrderTracker'
import type { Order } from '@/types'
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils'

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string
  orderId: string
  content: string
  isAdmin: boolean
  toRole?: string
  createdAt: string
  sender: { id: string; name: string; role: string }
}

// ─── Download button ──────────────────────────────────────────────────────────

function DownloadButton({ order }: { order: Order }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const { downloadInvoicePDF } = await import('@/lib/generateInvoicePDF')
      await downloadInvoicePDF(order)
      toast.success('Facture PDF téléchargée')
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-1.5 text-[11px] tracking-widest text-lams-gray hover:text-lams-dark border border-lams-border hover:border-lams-dark px-3 py-1.5 transition-all disabled:opacity-50"
      title="Télécharger la facture PDF"
    >
      {loading ? <Loader size={13} className="animate-spin" /> : <Download size={13} />}
      {loading ? 'PDF...' : 'FACTURE PDF'}
    </button>
  )
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({ order, onClose, initialTab = 'VENDOR', initialText = '' }: {
  order: Order
  onClose: () => void
  initialTab?: 'VENDOR' | 'LIVREUR'
  initialText?: string
}) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [tab, setTab] = useState<'VENDOR' | 'LIVREUR'>(initialTab)
  const [text, setText] = useState(initialText)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const myId = (session?.user as any)?.id
  const hasLivreur = !!(order as any).deliveryName

  useEffect(() => { setTab(initialTab) }, [initialTab])

  useEffect(() => {
    fetch(`/api/messages?orderId=${order.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.messages) setMessages(d.messages) })
  }, [order.id])

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<Message>).detail
      if (msg.orderId === order.id) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    }
    window.addEventListener('lams:newMessage', handler)
    return () => window.removeEventListener('lams:newMessage', handler)
  }, [order.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, tab])

  // VENDOR tab: admin messages + my messages to admin (toRole='ADMIN' or legacy null)
  // LIVREUR tab: livreur messages + my messages to livreur (toRole='LIVREUR')
  const filtered = messages.filter((m) => {
    if (tab === 'LIVREUR') {
      return m.sender.role === 'LIVREUR' || (m.sender.id === myId && m.toRole === 'LIVREUR')
    }
    return m.sender.role === 'ADMIN' || (m.sender.id === myId && m.toRole !== 'LIVREUR')
  })

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          content: text.trim(),
          toRole: tab === 'LIVREUR' ? 'LIVREUR' : 'ADMIN',
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, data.message])
        setText('')
      }
    } catch {
      toast.error('Erreur envoi message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-white flex flex-col" style={{ height: '70vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-lams-dark text-lams-cream">
          <div>
            <p className="text-xs tracking-widest opacity-60">COMMANDE</p>
            <p className="font-mono font-bold text-sm">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tabs — affiché seulement si un livreur est assigné */}
        {hasLivreur && (
          <div className="flex border-b border-lams-border">
            <button
              onClick={() => setTab('VENDOR')}
              className={`flex-1 py-2.5 text-[11px] tracking-widest font-medium transition-colors ${
                tab === 'VENDOR' ? 'text-lams-dark border-b-2 border-lams-dark' : 'text-lams-gray hover:text-lams-dark'
              }`}
            >
              💬 VENDEUR
            </button>
            <button
              onClick={() => setTab('LIVREUR')}
              className={`flex-1 py-2.5 text-[11px] tracking-widest font-medium transition-colors ${
                tab === 'LIVREUR' ? 'text-lams-dark border-b-2 border-lams-dark' : 'text-lams-gray hover:text-lams-dark'
              }`}
            >
              🚚 LIVREUR
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-lams-cream/30">
          {filtered.length === 0 && (
            <p className="text-center text-xs text-lams-gray py-8">
              {tab === 'LIVREUR' ? 'Aucun message avec le livreur.' : 'Aucun message. Écrivez au vendeur !'}
            </p>
          )}
          {filtered.map((msg) => {
            const isMe = msg.sender.id === myId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 text-sm ${
                  isMe ? 'bg-lams-dark text-lams-cream' : 'bg-white border border-lams-border text-lams-dark'
                }`}>
                  {!isMe && (
                    <p className={`text-[10px] tracking-widest mb-1 ${msg.sender.role === 'LIVREUR' ? 'text-blue-500' : 'text-lams-gold'}`}>
                      {msg.sender.role === 'LIVREUR' ? 'LIVREUR' : 'VENDEUR'}
                    </p>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-lams-cream/50 text-right' : 'text-lams-gray'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex border-t border-lams-border bg-white">
          <input
            className="flex-1 px-4 py-3 text-sm text-lams-dark outline-none bg-transparent"
            placeholder={tab === 'LIVREUR' ? 'Message au livreur...' : 'Message au vendeur...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="px-4 text-lams-dark hover:text-lams-gold disabled:opacity-40 transition-colors"
          >
            {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit order modal ────────────────────────────────────────────────────────

function EditOrderModal({ order, onClose, onSaved }: {
  order: Order
  onClose: () => void
  onSaved: (updated: Order) => void
}) {
  const [address, setAddress] = useState((order as any).deliveryAddress ?? '')
  const [lat, setLat] = useState<number | null>((order as any).deliveryLat ?? null)
  const [lng, setLng] = useState<number | null>((order as any).deliveryLng ?? null)
  const [note, setNote] = useState((order as any).note ?? '')
  const [localItems, setLocalItems] = useState(order.items.map(i => ({ ...i })))
  const [saving, setSaving] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const updateQty = (id: string, delta: number) => {
    setLocalItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }
  const removeItem = (id: string) => {
    if (localItems.length === 1) { toast.error('Au moins un article requis'); return }
    setLocalItems(prev => prev.filter(i => i.id !== id))
  }

  const newTotal = localItems.reduce((s, i) => s + i.price * i.quantity, 0)

  const save = async () => {
    if (!address && !lat) { toast.error('Adresse requise'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: address,
          deliveryLat: lat,
          deliveryLng: lng,
          note,
          items: localItems.map(i => ({ id: i.id, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erreur'); return }
      toast.success('Commande mise à jour !')
      onSaved(data.order)
      onClose()
    } catch { toast.error('Erreur réseau') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-lams-border flex-shrink-0">
          <div>
            <p className="font-semibold text-lams-dark flex items-center gap-2">
              <Pencil size={15} className="text-lams-gold" /> Modifier la commande
            </p>
            <p className="text-[11px] text-lams-gray font-mono mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-lams-gray" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Articles */}
          <div>
            <label className="text-[11px] tracking-widest text-lams-gray block mb-2">ARTICLES</label>
            <div className="space-y-2">
              {localItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 border border-lams-border">
                  {item.image && (
                    <div className="relative w-10 h-12 flex-shrink-0 bg-lams-cream overflow-hidden">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-lams-dark truncate">{item.name}</p>
                    {(item.color || item.size) && (
                      <p className="text-[10px] text-lams-gray">
                        {item.color && item.color} {item.size && `· T.${item.size}`}
                      </p>
                    )}
                    <p className="text-xs text-lams-gray">{formatPrice(item.price)} / u</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      disabled={item.quantity <= 1}
                      className="w-7 h-7 flex items-center justify-center border border-lams-border hover:bg-lams-cream disabled:opacity-30"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center border border-lams-border hover:bg-lams-cream"
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 ml-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-lams-border">
              <span className="text-lams-gray">Nouveau total</span>
              <span className="text-lams-dark">{formatPrice(newTotal)}</span>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">ADRESSE DE LIVRAISON *</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setLat(null); setLng(null) }}
                  placeholder="Votre adresse"
                  className="input-field pr-8 text-sm"
                />
                {address && (
                  <button type="button" onClick={() => { setAddress(''); setLat(null); setLng(null) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-lams-gray hover:text-lams-dark">
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className={`flex-shrink-0 flex items-center justify-center w-10 h-10 border transition-all ${
                  lat ? 'bg-green-50 border-green-400 text-green-600' : 'border-lams-border text-lams-gray hover:border-lams-dark'
                }`}
              >
                <MapPin size={16} />
              </button>
            </div>
            {lat && <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1"><MapPin size={9} /> GPS enregistré</p>}
          </div>

          <div>
            <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">NOTE (optionnel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="input-field resize-none text-sm"
              placeholder="Instructions spéciales..."
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-lams-border flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-outline flex-1">ANNULER</button>
          <button onClick={save} disabled={saving} className="btn-dark flex-1 disabled:opacity-50">
            {saving ? <Loader size={15} className="animate-spin mx-auto" /> : 'ENREGISTRER'}
          </button>
        </div>
      </div>

      {showMap && (
        <LocationPicker
          onSelect={(loc) => { setAddress(loc.address); setLat(loc.lat); setLng(loc.lng); setShowMap(false) }}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  )
}

// ─── Payment modal ───────────────────────────────────────────────────────────

function PaymentModal({ order, onClose, onPaid }: {
  order: Order
  onClose: () => void
  onPaid: (orderId: string) => void
}) {
  const [payOp, setPayOp] = useState<'MOOV' | 'YAS'>('MOOV')
  const [phone, setPhone] = useState('')
  const [paying, setPaying] = useState(false)

  const pay = async () => {
    if (!phone.trim()) { toast.error('Entrez votre numéro de téléphone'); return }
    setPaying(true)
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, operator: payOp, phone: phone.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Demande de paiement envoyée sur votre téléphone !')
        onPaid(order.id)
        onClose()
      } else {
        toast.error(data.message || 'Erreur de paiement. Vérifiez votre numéro.')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-lams-border">
          <div>
            <p className="font-semibold text-lams-dark flex items-center gap-2">
              <CreditCard size={16} className="text-lams-gold" /> Payer la commande
            </p>
            <p className="text-[11px] text-lams-gray font-mono mt-0.5">
              #{order.id.slice(-8).toUpperCase()} · {formatPrice(order.total)}
            </p>
          </div>
          <button onClick={onClose}><X size={18} className="text-lams-gray" /></button>
        </div>
        <div className="p-5 space-y-4">
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
              NUMÉRO {payOp} *
            </label>
            <div className="flex border border-lams-border overflow-hidden">
              <span className="flex items-center justify-center px-3 bg-lams-cream border-r border-lams-border">
                <Phone size={14} className="text-lams-gray" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+228 XX XX XX XX"
                className="flex-1 px-3 py-2.5 text-sm outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter') pay() }}
                autoFocus
              />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">ANNULER</button>
          <button onClick={pay} disabled={paying || !phone.trim()} className="btn-dark flex-1 disabled:opacity-50">
            {paying ? <Loader size={15} className="animate-spin mx-auto" /> : `PAYER ${formatPrice(order.total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [chatOrder, setChatOrder] = useState<Order | null>(null)
  const [chatInitTab, setChatInitTab] = useState<'VENDOR' | 'LIVREUR'>('VENDOR')
  const [chatInitText, setChatInitText] = useState('')
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null)
  const [ratingVal, setRatingVal] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [payingOrder, setPayingOrder] = useState<Order | null>(null)
  const [editOrder, setEditOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      fetch('/api/orders')
        .then((r) => r.json())
        .then((data) => { if (data.orders) setOrders(data.orders) })
        .finally(() => setLoading(false))
    }
  }, [status, router])

  // Real-time order updates (status + paymentStatus + delivery info)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setOrders((prev) =>
        prev.map((o) =>
          o.id === detail.id
            ? {
                ...o,
                ...(detail.status !== undefined && { status: detail.status }),
                ...(detail.paymentStatus !== undefined && { paymentStatus: detail.paymentStatus }),
                ...(detail.deliveryName !== undefined && { deliveryName: detail.deliveryName }),
                ...(detail.deliveryPhone !== undefined && { deliveryPhone: detail.deliveryPhone }),
              }
            : o
        )
      )
    }
    window.addEventListener('lams:orderUpdated', handler)
    return () => window.removeEventListener('lams:orderUpdated', handler)
  }, [])

  // Badge rouge sur MESSAGE quand nouveau message reçu
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail
      if (!msg?.orderId) return
      setChatOrder((current) => {
        // Si ce chat est déjà ouvert, pas de badge
        if (current?.id === msg.orderId) return current
        setUnreadMap((prev) => ({ ...prev, [msg.orderId]: (prev[msg.orderId] || 0) + 1 }))
        return current
      })
    }
    window.addEventListener('lams:newMessage', handler)
    return () => window.removeEventListener('lams:newMessage', handler)
  }, [])

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Annuler cette commande ?')) return
    setCancelling(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur')
      } else {
        toast.success('Commande annulée')
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o)))
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setCancelling(null)
    }
  }

  const submitRating = async () => {
    if (!ratingOrder || ratingVal === 0) return
    setSubmittingRating(true)
    const res = await fetch(`/api/orders/${ratingOrder.id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: ratingVal, ratingComment }),
    })
    if (res.ok) {
      toast.success('Merci pour votre note !')
      setOrders(prev => prev.map(o => o.id === ratingOrder!.id ? { ...o, rating: ratingVal } as any : o))
      setRatingOrder(null); setRatingVal(0); setRatingComment('')
    } else {
      toast.error('Erreur')
    }
    setSubmittingRating(false)
  }

  const clientName = (session?.user as any)?.name ?? 'Client'

  return (
    <>
      <Header />
      <main className="min-h-screen bg-lams-cream">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="font-serif text-3xl text-lams-dark mb-8">Mes Commandes</h1>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package size={64} className="text-lams-border mb-6" />
              <h2 className="text-xl text-lams-dark mb-3">Aucune commande</h2>
              <p className="text-lams-gray text-sm mb-8">Commencez vos achats dès maintenant !</p>
              <Link href="/" className="btn-dark">DÉCOUVRIR LA BOUTIQUE</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const canCancel = ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(order.status)
                const canEdit   = ['PENDING', 'CONFIRMED'].includes(order.status)
                const isShipped = order.status === 'SHIPPED' || order.status === 'DELIVERED'
                const mapsLink = (order as any).deliveryLat && (order as any).deliveryLng
                  ? `https://www.google.com/maps?q=${(order as any).deliveryLat},${(order as any).deliveryLng}`
                  : null
                const greetingMsg = `Bonjour, je suis ${clientName}, client de la commande #${order.id.slice(-8).toUpperCase()}. Je vous contacte au sujet de ma livraison.${mapsLink ? `\nMon adresse : ${mapsLink}` : ''}`
                const whatsappMsg = encodeURIComponent(greetingMsg)
                const whatsappPhone = (order as any).deliveryPhone?.replace(/\D/g, '') ?? ''

                return (
                  <div key={order.id} className="bg-white shadow-sm">
                    {/* Order header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-lams-border">
                      <div>
                        <p className="text-[10px] tracking-[0.3em] text-lams-gray">N° DE COMMANDE</p>
                        <p className="font-mono font-bold text-lams-dark mt-0.5 text-base">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                      </div>

                      <div className="hidden sm:block">
                        <p className="text-[10px] tracking-[0.3em] text-lams-gray">DATE</p>
                        <p className="text-sm text-lams-dark mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>

                      <div>
                        <p className="text-[10px] tracking-[0.3em] text-lams-gray">TOTAL</p>
                        <p className="font-semibold text-lams-dark mt-0.5 text-base">{formatPrice(order.total)}</p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-[10px] tracking-widest px-3 py-1.5 border font-medium ${
                          order.status === 'DELIVERED'  ? 'bg-green-50 text-green-700 border-green-200'
                          : order.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-200'
                          : order.status === 'SHIPPED'   ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : order.status === 'CONFIRMED' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-stone-50 text-stone-600 border-stone-200'
                        }`}>
                          {getStatusLabel(order.status).toUpperCase()}
                        </span>

                        <DownloadButton order={order} />

                        {/* Bouton PAYER si paiement en attente */}
                        {order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setPayingOrder(order)}
                            className="flex items-center gap-1.5 text-[11px] tracking-widest text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 transition-all font-semibold"
                          >
                            <CreditCard size={13} />
                            PAYER
                          </button>
                        )}

                        {/* Message vendeur */}
                        <button
                          onClick={() => {
                            setChatInitTab('VENDOR')
                            setChatInitText('')
                            setChatOrder(order)
                            setUnreadMap(prev => { const n = { ...prev }; delete n[order.id]; return n })
                          }}
                          className="relative flex items-center gap-1.5 text-[11px] tracking-widest text-lams-gray hover:text-lams-dark border border-lams-border hover:border-lams-dark px-3 py-1.5 transition-all"
                          title="Contacter le vendeur"
                        >
                          <MessageCircle size={13} />
                          MESSAGE
                          {unreadMap[order.id] > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                              {unreadMap[order.id]}
                            </span>
                          )}
                        </button>

                        {/* Notation livraison */}
                        {order.status === 'DELIVERED' && !(order as any).rating && (
                          <button
                            onClick={() => { setRatingOrder(order); setRatingVal(0) }}
                            className="flex items-center gap-1.5 text-[11px] tracking-widest text-lams-gold hover:text-lams-dark border border-lams-gold/40 hover:border-lams-dark px-3 py-1.5 transition-all"
                          >
                            ★ NOTER
                          </button>
                        )}
                        {(order as any).rating && (
                          <span className="text-[11px] text-lams-gold tracking-wider">
                            {'★'.repeat((order as any).rating)}{'☆'.repeat(5 - (order as any).rating)}
                          </span>
                        )}

                        {/* Modifier (PENDING + CONFIRMED) */}
                        {canEdit && (
                          <button
                            onClick={() => setEditOrder(order)}
                            className="flex items-center gap-1.5 text-[11px] tracking-widest text-lams-dark border border-lams-border hover:border-lams-dark px-3 py-1.5 transition-all"
                          >
                            <Pencil size={13} />
                            MODIFIER
                          </button>
                        )}

                        {/* Supprimer / Annuler */}
                        {canCancel && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            disabled={cancelling === order.id}
                            className="flex items-center gap-1.5 text-[11px] tracking-widest text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 transition-all disabled:opacity-50"
                          >
                            {cancelling === order.id
                              ? <Loader size={13} className="animate-spin" />
                              : <Trash2 size={13} />
                            }
                            SUPPRIMER
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress tracker */}
                    <div className="px-5 pt-2 pb-0">
                      <OrderTracker status={order.status} />
                    </div>

                    {/* Delivery person card (shown when SHIPPED or DELIVERED) */}
                    {isShipped && (order as any).deliveryName && (
                      <div className="mx-5 my-3 p-4 bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] tracking-widest text-blue-500 mb-1">LIVREUR ASSIGNÉ</p>
                          <p className="font-semibold text-lams-dark">{(order as any).deliveryName}</p>
                          {(order as any).deliveryPhone && (
                            <p className="text-sm text-lams-gray mt-0.5">{(order as any).deliveryPhone}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {(order as any).deliveryPhone && (
                            <>
                              {/* WhatsApp */}
                              <a
                                href={`https://wa.me/${whatsappPhone}?text=${whatsappMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[11px] tracking-widest bg-green-500 text-white px-3 py-1.5 hover:bg-green-600 transition-colors"
                              >
                                <Phone size={13} />
                                WHATSAPP
                              </a>
                              {/* Message livreur → onglet LIVREUR pré-sélectionné */}
                              <button
                                onClick={() => {
                                  setChatInitTab('LIVREUR')
                                  setChatInitText(greetingMsg)
                                  setChatOrder(order)
                                  setUnreadMap(prev => { const n = { ...prev }; delete n[order.id]; return n })
                                }}
                                className="flex items-center gap-1.5 text-[11px] tracking-widest text-lams-dark border border-lams-dark px-3 py-1.5 hover:bg-lams-dark hover:text-lams-cream transition-all"
                              >
                                <MessageCircle size={13} />
                                ÉCRIRE
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="divide-y divide-lams-border/50">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                          {item.image ? (
                            <div className="relative w-12 h-14 bg-lams-cream flex-shrink-0 overflow-hidden">
                              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                            </div>
                          ) : (
                            <div className="w-12 h-14 bg-lams-cream flex items-center justify-center flex-shrink-0">
                              <Package size={16} className="text-lams-lightgray" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-lams-dark truncate">{item.name}</p>
                            <p className="text-[11px] text-lams-gray mt-0.5">
                              Qté : {item.quantity}
                              {item.color && (
                                <span className="inline-flex items-center gap-1 ml-2">
                                  · <span className="w-2.5 h-2.5 rounded-full inline-block border border-lams-border" style={{ backgroundColor: item.color }} />
                                  {item.color}
                                </span>
                              )}
                              {item.size && ` · T. ${item.size}`}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-lams-dark flex-shrink-0">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Payment footer */}
                    <div className="px-5 py-3 bg-lams-cream/40 flex flex-wrap gap-4 text-[11px] text-lams-gray tracking-wider border-t border-lams-border">
                      <span>PAIEMENT : {order.paymentMethod}</span>
                      <span>·</span>
                      <span className={
                        order.paymentStatus === 'PAID'   ? 'text-green-600 font-medium'
                        : order.paymentStatus === 'FAILED' ? 'text-red-500 font-medium'
                        : 'text-amber-600'
                      }>
                        {order.paymentStatus === 'PAID' ? '✓ PAYÉ' : order.paymentStatus === 'FAILED' ? '✗ ÉCHOUÉ' : '⏳ EN ATTENTE'}
                      </span>
                      {order.deliveryAddress && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-xs">{order.deliveryAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Edit order modal */}
      {editOrder && (
        <EditOrderModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSaved={(updated) => {
            setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
            setEditOrder(null)
          }}
        />
      )}

      {/* Payment modal */}
      {payingOrder && (
        <PaymentModal
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onPaid={(orderId) => {
            setOrders(prev => prev.map(o =>
              o.id === orderId ? { ...o, paymentStatus: 'PENDING' as const } : o
            ))
          }}
        />
      )}

      {/* Chat modal */}
      {chatOrder && (
        <ChatPanel
          order={chatOrder}
          onClose={() => { setChatOrder(null); setChatInitText('') }}
          initialTab={chatInitTab}
          initialText={chatInitText}
        />
      )}

      {/* Rating modal */}
      {ratingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-lams-border">
              <p className="font-semibold text-lams-dark">Noter la livraison</p>
              <button onClick={() => { setRatingOrder(null); setRatingVal(0); setRatingComment('') }}><X size={18} className="text-lams-gray" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-lams-gray">Commande #{ratingOrder.id.slice(-8).toUpperCase()}</p>
              <div>
                <p className="text-[11px] tracking-widest text-lams-gray mb-2">VOTRE NOTE</p>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRatingVal(star)}
                      className={`text-3xl transition-transform hover:scale-110 ${star <= ratingVal ? 'text-lams-gold' : 'text-lams-border'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">COMMENTAIRE (optionnel)</label>
                <textarea
                  className="input-field resize-none text-sm"
                  rows={3}
                  placeholder="Votre avis sur la livraison..."
                  value={ratingComment}
                  onChange={e => setRatingComment(e.target.value)}
                />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => { setRatingOrder(null); setRatingVal(0) }} className="btn-outline flex-1">ANNULER</button>
              <button onClick={submitRating} disabled={ratingVal === 0 || submittingRating} className="btn-dark flex-1 disabled:opacity-50">
                {submittingRating ? <Loader size={15} className="animate-spin mx-auto" /> : 'ENVOYER'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
