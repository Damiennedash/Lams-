'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, Package, AlertTriangle, CheckCircle, Info, X, Check } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import type { Notification } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  ORDER:   { icon: Package,       color: 'text-lams-gold',   bg: 'bg-lams-gold/10' },
  STOCK:   { icon: AlertTriangle, color: 'text-orange-400',  bg: 'bg-orange-50' },
  SUCCESS: { icon: CheckCircle,   color: 'text-green-500',   bg: 'bg-green-50' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-500',  bg: 'bg-yellow-50' },
  ERROR:   { icon: X,             color: 'text-red-500',     bg: 'bg-red-50' },
  INFO:    { icon: Info,          color: 'text-blue-400',    bg: 'bg-blue-50' },
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      fetch('/api/notifications')
        .then((r) => r.json())
        .then((data) => { if (data.notifications) setNotifications(data.notifications) })
        .finally(() => setLoading(false))
    }
  }, [status, router])

  const markAllRead = async () => {
    await fetch('/api/notifications/read', { method: 'POST' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('Toutes les notifications sont lues')
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      <Header />
      <main className="min-h-screen bg-lams-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl text-lams-dark">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-lams-gray mt-1">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 text-[11px] tracking-widest text-lams-dark border border-lams-border hover:bg-lams-dark hover:text-lams-cream px-4 py-2 transition-colors"
              >
                <Check size={13} />
                TOUT MARQUER LU
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white">
              <div className="w-16 h-16 bg-lams-cream rounded-full flex items-center justify-center mb-4">
                <Bell size={28} className="text-lams-lightgray" />
              </div>
              <h2 className="text-lg font-medium text-lams-dark mb-2">Aucune notification</h2>
              <p className="text-lams-gray text-sm">Vous serez notifié ici pour vos commandes et alertes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => {
                const cfg = typeConfig[notif.type] || typeConfig.INFO
                const Icon = cfg.icon
                return (
                  <div
                    key={notif.id}
                    className={`flex gap-4 p-5 bg-white border-l-4 transition-all ${
                      !notif.read
                        ? 'border-lams-gold shadow-sm'
                        : 'border-transparent'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon size={18} className={cfg.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm font-semibold ${!notif.read ? 'text-lams-dark' : 'text-lams-gray'}`}>
                          {notif.title}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notif.read && (
                            <span className="w-2 h-2 bg-lams-gold rounded-full" />
                          )}
                          <span className="text-[10px] text-lams-gray whitespace-nowrap">
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-lams-gray mt-1 leading-relaxed">{notif.message}</p>
                      {notif.link && (
                        <a
                          href={notif.link}
                          className="inline-block mt-2 text-[11px] tracking-widest text-lams-dark hover:text-lams-gold transition-colors underline underline-offset-2"
                        >
                          VOIR →
                        </a>
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
    </>
  )
}
