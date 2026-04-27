import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function generateUniqueId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const prefix = 'LMS'
  let result = prefix + '-'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    VINTAGE: 'Vintage',
    STOCKS: 'Stocks',
    LAMS_COLLECTION: "Collection LAMS",
  }
  return labels[category] || category
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmée',
    SHIPPED: 'Expédiée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
  }
  return labels[status] || status
}

export function getStatusStep(status: string): number {
  const steps: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    SHIPPED: 2,
    DELIVERED: 3,
  }
  return steps[status] ?? 0
}

export function parseImages(images: string): string[] {
  try {
    return JSON.parse(images)
  } catch {
    return [images]
  }
}

export function parseArray(val: string): string[] {
  try {
    return JSON.parse(val)
  } catch {
    return []
  }
}
