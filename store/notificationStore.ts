import { create } from 'zustand'
import type { Notification } from '@/types'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  markAllRead: () => void
  addNotification: (n: Notification) => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + (n.read ? 0 : 1),
    })),
}))
