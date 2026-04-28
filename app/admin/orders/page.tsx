'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronDown, RefreshCw, MessageCircle, Send, Loader, X, Truck, Plus, Package, MapPin } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import OrderTracker from '@/components/shop/OrderTracker'
import type { Order } from '@/types'
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils'

const statusOptions = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

interface Message {
  id: string; orderId: string; content: string; isAdmin: boolean
  createdAt: string; sender: { id: string; name: string; role: string }
}
interface Deliverer { id: string; name: string; phone: string; userId?: string }

// ─── Chat panel ───────────────────────────────────────────────────────────────

function AdminChatPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [tab, setTab] = useState<'CLIENT' | 'LIVREUR'>('CLIENT')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [livreurSentIds, setLivreurSentIds] = useState<Set<string>>(new Set())
  const { data: session } = useSession()
  const myId = (session?.user as any)?.id ?? ''
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/messages?orderId=${order.id}`)
      .then(r => r.json()).then(d => { if (d.messages) setMessages(d.messages) })
  }, [order.id])

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<Message>).detail
      if (msg.orderId === order.id) {
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
      }
    }
    window.addEventListener('lams:newMessage', handler)
    return () => window.removeEventListener('lams:newMessage', handler)
  }, [order.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, tab])

  const hasLivreur = !!(order as any).delivererId

  // CLIENT tab: customer messages + admin's own messages sent to client
  // LIVREUR tab: livreur messages + admin's own messages sent to livreur
  const filtered = messages.filter(m => {
    if (m.sender.id === myId) {
      return tab === 'LIVREUR' ? livreurSentIds.has(m.id) : !livreurSentIds.has(m.id)
    }
    return tab === 'LIVREUR' ? m.sender.role === 'LIVREUR' : m.sender.role === 'CUSTOMER'
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
          toRole: tab === 'LIVREUR' ? 'LIVREUR' : 'CUSTOMER',
        }),
      })
      const data = await res.json()
      if (data.message) {
        if (tab === 'LIVREUR') setLivreurSentIds(p => new Set(Array.from(p).concat(data.message.id)))
        setMessages(prev => [...prev, data.message])
        setText('')
      }
    } catch { toast.error('Erreur envoi') } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-white flex flex-col" style={{ height: '70vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-lams-dark text-lams-cream">
          <div>
            <p className="text-xs tracking-widest opacity-60">{(order as any).user?.name ?? ''}</p>
            <p className="font-mono font-bold text-sm">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tabs — show LIVREUR tab only if order has a livreur */}
        {hasLivreur && (
          <div className="flex border-b border-lams-border">
            <button
              onClick={() => setTab('CLIENT')}
              className={`flex-1 py-2.5 text-[11px] tracking-widest font-medium transition-colors ${
                tab === 'CLIENT' ? 'text-lams-dark border-b-2 border-lams-dark' : 'text-lams-gray hover:text-lams-dark'
              }`}
            >
              👤 CLIENT
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
              {tab === 'LIVREUR' ? 'Aucun message avec le livreur.' : 'Aucun message avec le client.'}
            </p>
          )}
          {filtered.map(msg => {
            const isMe = msg.sender.id === myId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 text-sm ${isMe ? 'bg-lams-dark text-lams-cream' : 'bg-white border border-lams-border text-lams-dark'}`}>
                  {!isMe && (
                    <p className={`text-[10px] tracking-widest mb-1 ${msg.sender.role === 'LIVREUR' ? 'text-blue-500' : 'text-lams-gray'}`}>
                      {msg.sender.name}
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
            placeholder={tab === 'LIVREUR' ? 'Message au livreur...' : 'Répondre au client...'}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <button onClick={send} disabled={sending || !text.trim()} className="px-4 text-lams-dark hover:text-lams-gold disabled:opacity-40">
            {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delivery modal with deliverers list ──────────────────────────────────────

function DeliveryModal({ order, onSave, onClose }: {
  order: Order; onClose: () => void
  onSave: (name: string, phone: string, delivererId?: string) => void
}) {
  const [livreurs, setLivreurs] = useState<Deliverer[]>([])
  const [others, setOthers] = useState<Deliverer[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined)
  const [name, setName] = useState((order as any).deliveryName ?? '')
  const [phone, setPhone] = useState((order as any).deliveryPhone ?? '')
  const [addMode, setAddMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Fetch LIVREUR accounts
    fetch('/api/admin/livreurs').then(r => r.json()).then(d => {
      if (d.livreurs) setLivreurs(d.livreurs.map((l: any) => ({ id: l.id, name: l.name, phone: l.phone ?? '', userId: l.id })))
    })
    // Fetch simple deliverers (non-account)
    fetch('/api/deliverers').then(r => r.json()).then(d => {
      if (d.deliverers) setOthers(d.deliverers.filter((d: any) => !d.userId))
    })
  }, [])

  const pickDeliverer = (d: Deliverer) => {
    setSelectedId(d.id)
    setSelectedUserId(d.userId)
    setName(d.name)
    setPhone(d.phone)
  }

  const saveNew = async () => {
    if (!newName.trim() || !newPhone.trim()) return
    setSaving(true)
    const res = await fetch('/api/deliverers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() }),
    })
    const data = await res.json()
    if (data.deliverer) {
      setLivreurs((prev: any[]) => [...prev, data.deliverer])
      pickDeliverer(data.deliverer)
      setAddMode(false)
      setNewName(''); setNewPhone('')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-sm max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-lams-border">
          <p className="font-semibold text-lams-dark flex items-center gap-2"><Truck size={16} /> Assigner un livreur</p>
          <button onClick={onClose}><X size={18} className="text-lams-gray" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Livreur accounts (with portal access) */}
          {livreurs.length > 0 && (
            <div>
              <p className="text-[10px] tracking-widest text-lams-gray mb-2">LIVREURS AVEC COMPTE</p>
              <div className="space-y-2">
                {livreurs.map(d => (
                  <button key={d.id} onClick={() => pickDeliverer(d)}
                    className={`w-full flex items-center justify-between p-3 border text-left transition-all ${selectedId === d.id ? 'border-lams-dark bg-lams-cream' : 'border-lams-border hover:border-lams-dark'}`}>
                    <div>
                      <p className="text-sm font-medium text-lams-dark">{d.name}</p>
                      <p className="text-xs text-lams-gray">{d.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-lams-gold/20 text-lams-gold px-1.5 py-0.5 tracking-wider">COMPTE</span>
                      {selectedId === d.id && <span className="text-lams-dark text-xs">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Simple deliverers (no account) */}
          {others.length > 0 && (
            <div>
              <p className="text-[10px] tracking-widest text-lams-gray mb-2">AUTRES LIVREURS</p>
              <div className="space-y-2">
                {others.map(d => (
                  <button key={d.id} onClick={() => pickDeliverer(d)}
                    className={`w-full flex items-center justify-between p-3 border text-left transition-all ${selectedId === d.id ? 'border-lams-dark bg-lams-cream' : 'border-lams-border hover:border-lams-dark'}`}>
                    <div>
                      <p className="text-sm font-medium text-lams-dark">{d.name}</p>
                      <p className="text-xs text-lams-gray">{d.phone}</p>
                    </div>
                    {selectedId === d.id && <span className="text-lams-dark text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add new deliverer */}
          {addMode ? (
            <div className="space-y-3 border border-lams-border p-3">
              <p className="text-[10px] tracking-widest text-lams-gray">NOUVEAU LIVREUR</p>
              <input className="input-field text-sm" placeholder="Nom complet" value={newName} onChange={e => setNewName(e.target.value)} />
              <input className="input-field text-sm" placeholder="+228 XX XX XX XX" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => setAddMode(false)} className="btn-outline flex-1 text-xs py-2">ANNULER</button>
                <button onClick={saveNew} disabled={saving} className="btn-dark flex-1 text-xs py-2 disabled:opacity-50">
                  {saving ? <Loader size={13} className="animate-spin mx-auto" /> : 'ENREGISTRER'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddMode(true)} className="w-full flex items-center justify-center gap-2 border border-dashed border-lams-border text-lams-gray hover:border-lams-dark hover:text-lams-dark py-3 text-sm transition-all">
              <Plus size={14} /> Ajouter un livreur
            </button>
          )}

          {/* Manual override */}
          <div className="space-y-3 border-t border-lams-border pt-4">
            <p className="text-[10px] tracking-widest text-lams-gray">OU SAISIR MANUELLEMENT</p>
            <input className="input-field text-sm" placeholder="Nom du livreur" value={name} onChange={e => { setName(e.target.value); setSelectedId('') }} />
            <input className="input-field text-sm" placeholder="+228 XX XX XX XX" value={phone} onChange={e => { setPhone(e.target.value); setSelectedId('') }} />
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-lams-border flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">ANNULER</button>
          <button
            onClick={() => { if (name.trim()) onSave(name.trim(), phone.trim(), selectedUserId) }}
            disabled={!name.trim()}
            className="btn-dark flex-1 disabled:opacity-50"
          >
            CONFIRMER EXPÉDITION
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [chatOrder, setChatOrder] = useState<Order | null>(null)
  const chatOrderRef = useRef<Order | null>(null)
  const [deliveryOrder, setDeliveryOrder] = useState<Order | null>(null)
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const countedMsgIds = useRef<Set<string>>(new Set())

  useEffect(() => { chatOrderRef.current = chatOrder }, [chatOrder])

  const load = async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const res = await fetch(`/api/orders${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  // Real-time: new messages + new orders + cancellations
  useEffect(() => {
    const msgHandler = (e: Event) => {
      const msg = (e as CustomEvent<Message>).detail
      if (!msg?.id || !msg?.orderId) return
      if (countedMsgIds.current.has(msg.id)) return
      if (chatOrderRef.current?.id === msg.orderId) return
      if (msg.sender?.role === 'ADMIN') return
      countedMsgIds.current.add(msg.id)
      setUnreadMap(prev => ({ ...prev, [msg.orderId]: (prev[msg.orderId] ?? 0) + 1 }))
    }
    const orderHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setOrders(prev => prev.map(o => o.id === detail.id ? {
        ...o,
        ...(detail.status !== undefined && { status: detail.status }),
        ...(detail.paymentStatus !== undefined && { paymentStatus: detail.paymentStatus }),
      } : o))
    }
    // New order placed — reload list
    const newOrderHandler = () => { load() }

    window.addEventListener('lams:newMessage', msgHandler)
    window.addEventListener('lams:orderUpdated', orderHandler)
    window.addEventListener('lams:newOrder', newOrderHandler)
    return () => {
      window.removeEventListener('lams:newMessage', msgHandler)
      window.removeEventListener('lams:orderUpdated', orderHandler)
      window.removeEventListener('lams:newOrder', newOrderHandler)
    }
  }, [filter])

  const updateStatus = async (orderId: string, status: string) => {
    if (status === 'SHIPPED') {
      const order = orders.find(o => o.id === orderId)
      if (order) { setDeliveryOrder(order); return }
    }
    await doUpdateStatus(orderId, status)
  }

  const doUpdateStatus = async (orderId: string, status: string, deliveryName?: string, deliveryPhone?: string, delivererId?: string) => {
    setUpdating(orderId)
    try {
      const body: any = { status }
      if (deliveryName) body.deliveryName = deliveryName
      if (deliveryPhone) body.deliveryPhone = deliveryPhone
      if (delivererId) body.delivererId = delivererId
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Statut mis à jour')
        setOrders(prev => prev.map(o => o.id === orderId ? {
          ...o, status: status as any,
          ...(deliveryName && { deliveryName }),
          ...(deliveryPhone && { deliveryPhone }),
        } : o))
      }
    } finally { setUpdating(null) }
  }

  const updatePayment = async (orderId: string, paymentStatus: string) => {
    setUpdating(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Paiement mis à jour — client notifié en temps réel')
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: paymentStatus as any } : o))
      } else {
        toast.error(data.error ?? 'Erreur mise à jour paiement')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-lams-dark">Commandes</h1>
          <p className="text-lams-gray text-sm mt-1">{orders.length} commande(s)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field text-sm py-2 flex-1 sm:flex-none">
            <option value="">Toutes les commandes</option>
            {statusOptions.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
          <button onClick={load} className="btn-outline px-3 py-2 flex-shrink-0" title="Actualiser"><RefreshCw size={15} /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white text-center py-16">
              <p className="text-lams-gray">Aucune commande{filter ? ` avec le statut "${getStatusLabel(filter)}"` : ''}</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="bg-white">
              {/* Header row */}
              <div
                className="p-4 sm:p-5 cursor-pointer hover:bg-lams-cream/20 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                {/* Top: order info + price */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ChevronDown size={16} className={`text-lams-gray flex-shrink-0 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
                    <div>
                      <p className="font-mono font-bold text-lams-dark text-sm">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-[11px] text-lams-gray">{(order as any).user?.name || 'Client inconnu'} · {formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-lams-dark flex-shrink-0">{formatPrice(order.total)}</span>
                </div>

                {/* Bottom: actions */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pl-7" onClick={e => e.stopPropagation()}>
                  {/* Message button */}
                  <button
                    onClick={() => { setChatOrder(order); setUnreadMap(prev => { const n = { ...prev }; delete n[order.id]; return n }) }}
                    className="relative flex items-center gap-1.5 text-[11px] tracking-widest text-lams-gray hover:text-lams-dark border border-lams-border hover:border-lams-dark px-3 py-1.5 transition-all"
                  >
                    <MessageCircle size={13} />
                    MSG
                    {unreadMap[order.id] > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                        {unreadMap[order.id]}
                      </span>
                    )}
                  </button>

                  {/* Status */}
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className={`text-[11px] tracking-widest px-2 py-1.5 border appearance-none cursor-pointer ${
                      order.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-200'
                      : order.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-200'
                      : order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : order.status === 'CONFIRMED' ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                    }`}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                  </select>

                  {/* Payment */}
                  <select
                    value={order.paymentStatus}
                    onChange={e => updatePayment(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className={`text-[11px] tracking-widest px-2 py-1.5 border appearance-none cursor-pointer ${
                      order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border-green-200'
                      : order.paymentStatus === 'FAILED' ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    <option value="PENDING">En attente</option>
                    <option value="PAID">Payé ✓</option>
                    <option value="FAILED">Échoué</option>
                    <option value="REFUNDED">Remboursé</option>
                  </select>
                </div>
              </div>

              {/* Expanded */}
              {expanded === order.id && (
                <div className="border-t border-lams-border">
                  <div className="px-6 pt-4">
                    <OrderTracker status={order.status} />
                  </div>

                  {/* Delivery person */}
                  {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                    <div className="mx-6 mt-3 p-4 bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] tracking-widest text-blue-500 mb-1">LIVREUR</p>
                        {(order as any).deliveryName ? (
                          <>
                            <p className="font-semibold text-lams-dark">{(order as any).deliveryName}</p>
                            {(order as any).deliveryPhone && <p className="text-sm text-lams-gray">{(order as any).deliveryPhone}</p>}
                          </>
                        ) : (
                          <p className="text-sm text-lams-gray italic">Aucun livreur assigné</p>
                        )}
                      </div>
                      <button
                        onClick={() => setDeliveryOrder(order)}
                        className="flex items-center gap-1.5 text-[11px] tracking-widest text-lams-dark border border-lams-dark px-3 py-1.5 hover:bg-lams-dark hover:text-lams-cream transition-all"
                      >
                        <Truck size={13} />
                        {(order as any).deliveryName ? 'MODIFIER' : 'ASSIGNER'}
                      </button>
                    </div>
                  )}

                  {/* Items with images */}
                  <div className="px-6 pb-4 mt-3">
                    <div className="divide-y divide-lams-border/50">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-4 py-3">
                          {item.image ? (
                            <div className="relative w-12 h-14 bg-lams-cream flex-shrink-0 overflow-hidden">
                              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                            </div>
                          ) : (
                            <div className="w-12 h-14 bg-lams-cream flex items-center justify-center flex-shrink-0">
                              <Package size={16} className="text-lams-lightgray" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-lams-dark">{item.name}</p>
                            <p className="text-[11px] text-lams-gray">
                              Qté : {item.quantity}
                              {item.color && <span> · <span className="inline-block w-2.5 h-2.5 rounded-full border border-lams-border align-middle" style={{ backgroundColor: item.color }} /> {item.color}</span>}
                              {item.size && ` · T. ${item.size}`}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-lams-dark flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-lams-border mt-2 pt-3 flex justify-between">
                      <span className="text-[11px] tracking-widest text-lams-gray font-semibold">TOTAL</span>
                      <span className="font-bold text-base text-lams-dark">{formatPrice(order.total)}</span>
                    </div>

                    {order.deliveryAddress && (
                      <div className="mt-3 flex flex-wrap items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] tracking-widest text-lams-gray">ADRESSE</p>
                          <p className="text-sm text-lams-dark mt-0.5">{order.deliveryAddress}</p>
                        </div>
                        {(order as any).deliveryLat && (order as any).deliveryLng && (
                          <a
                            href={`https://www.google.com/maps?q=${(order as any).deliveryLat},${(order as any).deliveryLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[11px] tracking-widest text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 hover:bg-blue-100 transition-colors flex-shrink-0"
                          >
                            <MapPin size={12} /> VOIR SUR LA CARTE
                          </a>
                        )}
                      </div>
                    )}
                    {order.note && (
                      <p className="text-sm text-lams-gray mt-1">
                        <span className="text-[10px] tracking-widest">NOTE :</span> {order.note}
                      </p>
                    )}
                    {order.paymentRef && (
                      <p className="text-sm text-lams-gray mt-1 font-mono">
                        <span className="text-[10px] tracking-widest">REF :</span> {order.paymentRef}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {chatOrder && <AdminChatPanel order={chatOrder} onClose={() => setChatOrder(null)} />}
      {deliveryOrder && (
        <DeliveryModal
          order={deliveryOrder}
          onClose={() => setDeliveryOrder(null)}
          onSave={(name, phone, delivererId) => { doUpdateStatus(deliveryOrder.id, 'SHIPPED', name, phone, delivererId); setDeliveryOrder(null) }}
        />
      )}
    </div>
  )
}
