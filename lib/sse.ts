import { EventEmitter } from 'events'

// Global singleton emitter survit aux hot-reloads Next.js
declare global {
  var _lamsEmitter: EventEmitter | undefined
}

if (!global._lamsEmitter) {
  global._lamsEmitter = new EventEmitter()
  global._lamsEmitter.setMaxListeners(200)
}

export const lamsEmitter = global._lamsEmitter

export interface SSEEvent {
  type: 'order_update' | 'notification' | 'ping' | 'new_message' | 'new_order' | string
  notification?: {
    id: string
    title: string
    message: string
    type: string
    read: boolean
    link?: string | null
    createdAt: string
  }
  orderUpdate?: {
    id: string
    status?: string
    paymentStatus?: string
    deliveryName?: string | null
    deliveryPhone?: string | null
  }
  message?: {
    id: string
    orderId: string
    content: string
    isAdmin: boolean
    createdAt: string
    sender: { id: string; name: string; role: string }
  }
  [key: string]: any
}

export function pushToUser(userId: string, event: SSEEvent) {
  lamsEmitter.emit(`user:${userId}`, event)
}
