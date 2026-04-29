'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, X, Package, AlertTriangle, CheckCircle, Info, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useNotificationStore } from '@/store/notificationStore'
import type { Notification } from '@/types'
import { formatDate } from '@/lib/utils'

const typeIcon = (type: Notification['type'], title?: string) => {
  if (title?.startsWith('Message')) return <MessageCircle size={14} className="text-blue-400" />
  switch (type) {
    case 'ORDER':   return <Package size={14} className="text-lams-gold" />
    case 'STOCK':   return <AlertTriangle size={14} className="text-orange-400" />
    case 'SUCCESS': return <CheckCircle size={14} className="text-green-400" />
    case 'WARNING': return <AlertTriangle size={14} className="text-yellow-400" />
    default:        return <Info size={14} className="text-blue-400" />
  }
}

function NotifItem({ notif, onClose }: { notif: Notification; onClose: () => void }) {
  const cls = `px-4 py-3 border-b border-white/5 transition-colors ${!notif.read ? 'bg-white/5' : ''} hover:bg-white/10`
  const content = (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0">{typeIcon(notif.type, notif.title)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-lams-cream text-xs font-medium">{notif.title}</p>
        <p className="text-lams-gray text-[11px] mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
        <p className="text-lams-gray/60 text-[10px] mt-1">{formatDate(notif.createdAt)}</p>
      </div>
      {!notif.read && <div className="w-2 h-2 bg-lams-gold rounded-full mt-1 flex-shrink-0" />}
    </div>
  )

  if (notif.link) {
    return (
      <Link href={notif.link} onClick={onClose} className={`block ${cls}`}>
        {content}
      </Link>
    )
  }
  return <div className={cls}>{content}</div>
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, setNotifications, markAllRead } = useNotificationStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNotifs = () => {
      fetch('/api/notifications')
        .then((r) => r.json())
        .then((data) => { if (data.notifications) setNotifications(data.notifications) })
        .catch(() => {})
    }
    fetchNotifs()
    // Refresh on poll so badge stays up to date (SSE doesn't cross Vercel instances)
    window.addEventListener('lams:poll', fetchNotifs)
    return () => window.removeEventListener('lams:poll', fetchNotifs)
  }, [setNotifications])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = () => {
    setOpen(!open)
    if (!open && unreadCount > 0) {
      fetch('/api/notifications/read', { method: 'POST' }).then(() => markAllRead()).catch(() => {})
    }
  }

  const close = () => setOpen(false)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative text-lams-lightgray hover:text-lams-cream transition-colors p-1"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 z-40 sm:hidden" onClick={close} />
          <div className="
            fixed left-2 right-2 top-[4.5rem] z-50
            sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80
            bg-lams-dark border border-white/10 shadow-xl max-h-[70vh] sm:max-h-96 overflow-hidden flex flex-col
          ">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-lams-cream text-[11px] tracking-[0.2em]">NOTIFICATIONS</span>
            <button onClick={close} className="text-lams-gray hover:text-lams-cream">
              <X size={14} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell size={24} className="text-lams-gray mb-2" />
                <p className="text-lams-gray text-xs">Aucune notification</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <NotifItem key={notif.id} notif={notif} onClose={close} />
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2">
              <Link
                href="/notifications"
                onClick={close}
                className="text-[10px] text-lams-gold tracking-wider hover:text-lams-cream transition-colors"
              >
                VOIR TOUTES LES NOTIFICATIONS
              </Link>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  )
}
