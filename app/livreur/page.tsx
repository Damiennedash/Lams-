'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Package, MessageCircle, MapPin, CheckCircle, Send,
  Loader, X, Phone, LogOut, ChevronDown, Menu, Truck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '@/lib/utils'
import NotificationBell from '@/components/shop/NotificationBell'

const DeliveryMap = dynamic(() => import('@/components/livreur/DeliveryMap'), { ssr: false })

interface Message {
  id: string; orderId: string; content: string; isAdmin: boolean
  toRole?: string
  createdAt: string; sender: { id: string; name: string; role: string }
}

interface Order {
  id: string; status: string; total: number; createdAt: string
  deliveryAddress: string | null; deliveryLat: number | null; deliveryLng: number | null
  deliveryName: string | null; deliveryPhone: string | null
  items: any[]; user: { id: string; name: string; phone: string | null; email: string }
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

function ChatPanel({ order, myId, onClose }: { order: Order; myId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [tab, setTab] = useState<'CLIENT' | 'ADMIN'>('CLIENT')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/messages?orderId=${order.id}`)
      .then(r => r.json()).then(d => { if (d.messages) setMessages(d.messages) })
  }, [order.id])

  useEffect(() => {
    const h = (e: Event) => {
      const msg = (e as CustomEvent<Message>).detail
      if (msg.orderId === order.id)
        setMessages(p => p.find(m => m.id === msg.id) ? p : [...p, msg])
    }
    window.addEventListener('lams:newMessage', h)
    return () => window.removeEventListener('lams:newMessage', h)
  }, [order.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, tab])

  // CLIENT tab: livreur's messages to client (toRole='CUSTOMER')
  // ADMIN tab: livreur's messages to admin (toRole='ADMIN') + admin's messages to livreur (toRole='LIVREUR')
  const filtered = messages.filter(m => {
    if (tab === 'CLIENT') return m.sender.id === myId && m.toRole === 'CUSTOMER'
    return m.toRole === 'LIVREUR' || (m.sender.id === myId && m.toRole === 'ADMIN')
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
          toRole: tab === 'CLIENT' ? 'CUSTOMER' : 'ADMIN',
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(p => [...p, data.message])
        setText('')
      }
    } catch { toast.error('Erreur envoi') } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-white flex flex-col" style={{ height: '70vh' }}>
        <div className="flex items-center justify-between px-4 py-3 bg-lams-dark text-lams-cream">
          <div>
            <p className="text-xs opacity-60">{order.user.name}</p>
            <p className="font-mono font-bold text-sm">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex border-b border-lams-border">
          {(['CLIENT', 'ADMIN'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[11px] tracking-widest font-medium transition-colors ${
                tab === t ? 'text-lams-dark border-b-2 border-lams-dark' : 'text-lams-gray hover:text-lams-dark'
              }`}
            >
              {t === 'CLIENT' ? '👤 CLIENT' : '🏪 ADMIN'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-lams-cream/30">
          {filtered.length === 0 && (
            <p className="text-center text-xs text-lams-gray py-8">
              {tab === 'CLIENT' ? 'Aucun message au client.' : "Aucun message avec l'admin."}
            </p>
          )}
          {filtered.map(msg => {
            const isMe = msg.sender.id === myId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 text-sm ${isMe ? 'bg-lams-dark text-lams-cream' : 'bg-white border border-lams-border text-lams-dark'}`}>
                  {!isMe && (
                    <p className="text-[10px] mb-1 text-lams-gold">ADMIN</p>
                  )}
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-lams-cream/50 text-right' : 'text-lams-gray'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        <div className="flex border-t border-lams-border bg-white">
          <input
            className="flex-1 px-4 py-3 text-sm outline-none"
            placeholder={tab === 'CLIENT' ? 'Message au client...' : "Message à l'admin..."}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
          />
          <button onClick={send} disabled={sending || !text.trim()} className="px-4 text-lams-dark disabled:opacity-40">
            {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function LivreurSidebar({ name, code, onClose }: { name: string; code: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-lams-dark">
      <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="text-lams-cream font-serif text-xl tracking-[0.25em]">LAMS</p>
          <p className="text-lams-gold text-[9px] tracking-[0.3em]">LIVREUR</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          {onClose && (
            <button onClick={onClose} className="text-lams-gray hover:text-lams-cream md:hidden">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-lams-cream font-semibold text-sm">{name}</p>
        <p className="text-lams-gray text-[10px] font-mono mt-0.5">{code}</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="sidebar-link active">
          <Truck size={16} />
          <span>Mes Livraisons</span>
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="sidebar-link w-full text-left text-red-400 hover:text-red-300"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LivreurPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [chatOrder, setChatOrder] = useState<Order | null>(null)
  const chatOrderRef = useRef<Order | null>(null)
  const [mapOrder, setMapOrder] = useState<Order | null>(null)
  const [delivering, setDelivering] = useState<string | null>(null)
  const [tab, setTab] = useState<'active' | 'history'>('active')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const countedMsgIds = useRef<Set<string>>(new Set())

  // Keep ref in sync so badge handler can read current chatOrder without closure issues
  useEffect(() => { chatOrderRef.current = chatOrder }, [chatOrder])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      if ((session.user as any).role !== 'LIVREUR') { router.push('/'); return }
      fetch('/api/livreur/orders')
        .then(r => r.json())
        .then(d => {
          if (d.orders) setOrders(d.orders)
          else if (d.error) toast.error('Erreur: ' + d.error)
        })
        .catch(() => toast.error('Erreur réseau'))
        .finally(() => setLoading(false))
    }
  }, [status, session])

  useEffect(() => {
    const h = () => {
      fetch('/api/livreur/orders').then(r => r.json()).then(d => {
        if (d.orders) setOrders(d.orders)
      })
    }
    window.addEventListener('lams:newAssignment', h)
    return () => window.removeEventListener('lams:newAssignment', h)
  }, [])

  // Unread message badge — dedup by message ID to prevent any double-count
  useEffect(() => {
    const h = (e: Event) => {
      const msg = (e as CustomEvent<Message>).detail
      if (!msg?.orderId || !msg?.id) return
      if (countedMsgIds.current.has(msg.id)) return          // already counted
      if (chatOrderRef.current?.id === msg.orderId) return   // chat is open
      if (msg.sender?.role === 'LIVREUR') return             // own message
      countedMsgIds.current.add(msg.id)
      setUnreadMap(prev => ({ ...prev, [msg.orderId]: (prev[msg.orderId] || 0) + 1 }))
    }
    window.addEventListener('lams:newMessage', h)
    return () => window.removeEventListener('lams:newMessage', h)
  }, [])

  const markDelivered = async (orderId: string) => {
    if (!confirm('Confirmer la livraison ?')) return
    setDelivering(orderId)
    try {
      const res = await fetch(`/api/livreur/orders/${orderId}`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Livraison confirmée !')
        setOrders(p => p.map(o => o.id === orderId ? { ...o, status: 'DELIVERED' } : o))
        setTab('history')
      } else {
        toast.error(data.error ?? 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setDelivering(null)
    }
  }

  const myId = (session?.user as any)?.id ?? ''
  const myName = (session?.user as any)?.name ?? ''
  const myCode = (session?.user as any)?.uniqueId ?? ''
  const visibleOrders = orders.filter(o => tab === 'active' ? o.status === 'SHIPPED' : o.status === 'DELIVERED')

  return (
    <div className="flex min-h-screen bg-[#F0EDE8]">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col min-h-screen">
        <LivreurSidebar name={myName} code={myCode} />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Mobile drawer */}
      <div className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <LivreurSidebar name={myName} code={myCode} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <header className="md:hidden bg-lams-dark px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div>
            <p className="text-lams-cream font-serif text-lg tracking-[0.25em]">LAMS</p>
            <p className="text-lams-gold text-[9px] tracking-[0.3em]">LIVREUR</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button onClick={() => setSidebarOpen(true)} className="text-lams-cream">
              <Menu size={22} />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-2xl text-lams-dark mb-5">Mes Livraisons</h1>

            {/* Tabs */}
            {!loading && (
              <div className="flex mb-4 overflow-hidden border border-lams-border bg-white">
                <button
                  onClick={() => setTab('active')}
                  className={`flex-1 py-2.5 text-[11px] tracking-widest font-semibold transition-all ${
                    tab === 'active' ? 'bg-blue-600 text-white' : 'text-lams-gray hover:bg-lams-cream'
                  }`}
                >
                  🚚 EN COURS ({orders.filter(o => o.status === 'SHIPPED').length})
                </button>
                <button
                  onClick={() => setTab('history')}
                  className={`flex-1 py-2.5 text-[11px] tracking-widest font-semibold border-l border-lams-border transition-all ${
                    tab === 'history' ? 'bg-green-600 text-white' : 'text-lams-gray hover:bg-lams-cream'
                  }`}
                >
                  ✅ EFFECTUÉES ({orders.filter(o => o.status === 'DELIVERED').length})
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
              </div>
            ) : visibleOrders.length === 0 ? (
              <div className="bg-white text-center py-16">
                <Package size={48} className="text-lams-border mx-auto mb-4" />
                <p className="text-lams-gray">
                  {tab === 'active' ? 'Aucune livraison en cours.' : 'Aucune livraison effectuée.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleOrders.map(order => (
                  <div key={order.id} className={`bg-white overflow-hidden border-l-4 ${
                    order.status === 'DELIVERED' ? 'border-l-green-500' : 'border-l-blue-500'
                  }`}>

                    {/* Collapsed header — always visible, click to expand */}
                    <div
                      className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-lams-cream/20 transition-colors"
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ChevronDown size={15} className={`text-lams-gray flex-shrink-0 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
                        <div className="min-w-0">
                          <p className="font-mono font-bold text-lams-dark text-sm">#{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-[11px] text-lams-gray truncate">{order.user.name} · {formatDate(order.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {/* Unread message badge */}
                        <button
                          onClick={() => {
                            setChatOrder(order)
                            setUnreadMap(prev => { const n = { ...prev }; delete n[order.id]; return n })
                          }}
                          className="relative flex items-center gap-1 text-[11px] text-lams-gray hover:text-lams-dark border border-lams-border px-2.5 py-1.5 transition-all"
                        >
                          <MessageCircle size={13} />
                          MSG
                          {unreadMap[order.id] > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                              {unreadMap[order.id]}
                            </span>
                          )}
                        </button>

                        <span className={`text-[10px] tracking-widest px-2.5 py-1 font-semibold rounded-full ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status === 'DELIVERED' ? '✅ LIVRÉ' : '🚚 EN COURS'}
                        </span>

                        <span className="text-sm font-bold text-lams-dark">{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expanded === order.id && (
                      <div className="border-t border-lams-border">

                        {/* Client contact */}
                        <div className="px-4 py-3 flex items-center justify-between gap-3 bg-lams-cream/30">
                          <div>
                            <p className="font-semibold text-lams-dark text-sm">{order.user.name}</p>
                            {order.user.phone && <p className="text-[12px] text-lams-gray font-mono">{order.user.phone}</p>}
                          </div>
                          <div className="flex gap-2">
                            {order.user.phone && (
                              <a href={`tel:${order.user.phone}`}
                                className="flex items-center gap-1 text-[11px] font-medium border border-lams-border px-3 py-2 text-lams-dark hover:bg-white transition-all">
                                <Phone size={13} /> Appeler
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Address + navigation */}
                        {(order.deliveryLat || order.deliveryAddress) && (
                          <div className="px-4 py-3 border-t border-lams-border">
                            <div className="flex items-start gap-2 mb-3">
                              <MapPin size={14} className="text-lams-gold flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-lams-dark leading-snug">{order.deliveryAddress || 'Adresse GPS'}</p>
                            </div>
                            <div className="flex gap-2">
                              {order.deliveryLat && order.deliveryLng && (
                                <button onClick={() => setMapOrder(order)}
                                  className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-lams-dark border border-lams-border py-2 hover:bg-lams-cream transition-all">
                                  <MapPin size={13} /> Voir carte
                                </button>
                              )}
                              {order.deliveryLat && (
                                <a href={`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-white bg-green-600 py-2 hover:bg-green-700 transition-all">
                                  <MapPin size={13} /> Google Maps
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Articles summary */}
                        <div className="px-4 py-2.5 bg-lams-cream/40 border-t border-lams-border flex items-center justify-between">
                          <span className="text-[11px] text-lams-gray">
                            {order.items.length} article{order.items.length > 1 ? 's' : ''} · {
                              order.items.map((i: any) => i.name).join(', ').slice(0, 45)
                            }{order.items.map((i: any) => i.name).join(', ').length > 45 ? '…' : ''}
                          </span>
                          <span className="font-bold text-lams-dark text-sm">{formatPrice(order.total)}</span>
                        </div>

                        {/* Confirm delivery */}
                        {order.status === 'SHIPPED' && (
                          <button
                            onClick={() => markDelivered(order.id)}
                            disabled={delivering === order.id}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 text-sm tracking-widest font-semibold hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50"
                          >
                            {delivering === order.id
                              ? <Loader size={16} className="animate-spin" />
                              : <CheckCircle size={16} />
                            }
                            CONFIRMER LA LIVRAISON
                          </button>
                        )}
                        {order.status === 'DELIVERED' && (
                          <div className="py-3 flex items-center justify-center gap-2 text-green-700 text-sm font-medium bg-green-50">
                            <CheckCircle size={15} /> Livraison effectuée
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {chatOrder && <ChatPanel order={chatOrder} myId={myId} onClose={() => setChatOrder(null)} />}

      {mapOrder && mapOrder.deliveryLat && mapOrder.deliveryLng && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg flex flex-col" style={{ height: '80vh' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-lams-border">
              <p className="font-semibold text-lams-dark text-sm flex items-center gap-2">
                <MapPin size={16} className="text-lams-gold" /> Localisation client
              </p>
              <button onClick={() => setMapOrder(null)}><X size={18} /></button>
            </div>
            <div className="flex-1">
              <DeliveryMap lat={mapOrder.deliveryLat} lng={mapOrder.deliveryLng} address={mapOrder.deliveryAddress ?? ''} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
