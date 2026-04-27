'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { useNotificationStore } from '@/store/notificationStore'

const statusIcon: Record<string, string> = {
  CONFIRMED: '✅',
  SHIPPED:   '🚚',
  DELIVERED: '🎉',
  CANCELLED: '❌',
}

export function useRealtimeUpdates() {
  const { status, data: session } = useSession()
  const { addNotification } = useNotificationStore()
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return

    const connect = () => {
      esRef.current?.close()
      const es = new EventSource('/api/sse')
      esRef.current = es

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'ping' || data.type === 'connected') return

          // ① Ajoute la notif dans le store (cloche + badge rouge)
          if (data.notification) {
            addNotification({
              ...data.notification,
              type: data.notification.type,
            })

            // ② Toast visuel immédiat en bas à droite
            const icon = statusIcon[data.orderUpdate?.status ?? ''] ?? '🔔'
            const link = data.notification.link

            toast(
              `${icon}  ${data.notification.title}\n${data.notification.message}`,
              {
                duration: 7000,
                style: {
                  background: '#1A1A1A',
                  color: '#F7F4EF',
                  borderRadius: '0',
                  padding: '14px 18px',
                  fontSize: '13px',
                  whiteSpace: 'pre-line',
                  cursor: link ? 'pointer' : 'default',
                },
                onClick: link ? () => { window.location.href = link } : undefined,
              } as any
            )
          }

          // ③ Dispatche un événement DOM → la page commandes se met à jour seule
          if (data.orderUpdate) {
            window.dispatchEvent(
              new CustomEvent('lams:orderUpdated', { detail: data.orderUpdate })
            )
          }

          // ④ Nouvelle commande reçue (admin)
          if (data.type === 'new_order') {
            window.dispatchEvent(new CustomEvent('lams:newOrder'))
          }

          // ⑤ Nouvelle livraison assignée (livreur)
          if (data.type === 'new_assignment') {
            window.dispatchEvent(new CustomEvent('lams:newAssignment'))
          }

          // ④ Nouveau message reçu → dispatch + cloche + toast
          if (data.type === 'new_message' && data.message) {
            window.dispatchEvent(
              new CustomEvent('lams:newMessage', { detail: data.message })
            )
            const senderName = data.message.sender?.name ?? 'Quelqu\'un'
            const role = (session?.user as any)?.role
            const msgLink = role === 'LIVREUR' ? '/livreur' : role === 'ADMIN' ? '/admin/orders' : '/orders'
            // Ajoute dans la cloche
            addNotification({
              id: `msg-${data.message.id}`,
              title: `Message de ${senderName}`,
              message: data.message.content?.slice(0, 80) || 'Nouveau message',
              type: 'INFO',
              read: false,
              link: msgLink,
              createdAt: data.message.createdAt || new Date().toISOString(),
            })
            toast(
              `💬 ${senderName}\n${data.message.content?.slice(0, 60) || ''}`,
              {
                duration: 5000,
                style: {
                  background: '#1A1A1A',
                  color: '#F7F4EF',
                  borderRadius: '0',
                  padding: '14px 18px',
                  fontSize: '13px',
                  whiteSpace: 'pre-line',
                  cursor: 'pointer',
                },
                onClick: () => { window.location.href = msgLink },
              } as any
            )
          }
        } catch {}
      }

      // Reconnexion automatique en cas de perte réseau
      es.onerror = () => {
        es.close()
        setTimeout(connect, 3000)
      }
    }

    connect()
    return () => { esRef.current?.close(); esRef.current = null }
  }, [status, session, addNotification])
}
