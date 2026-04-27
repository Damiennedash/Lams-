export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: 'VINTAGE' | 'STOCKS' | 'LAMS_COLLECTION'
  images: string[]
  colors: string[]
  sizes: string[]
  stock: number
  sold: number
  featured: boolean
  active: boolean
  createdAt: string
}

export interface CartItem {
  id: string
  productId: string
  product: Product
  quantity: number
  color?: string
  size?: string
}

export interface Order {
  id: string
  userId: string
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentMethod: string
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentRef?: string
  deliveryAddress?: string
  note?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
  user?: { name: string; email: string }
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  name: string
  quantity: number
  price: number
  color?: string
  size?: string
  image?: string
}

export interface User {
  id: string
  uniqueId: string
  name: string
  email: string
  phone?: string
  address?: string
  role: 'CUSTOMER' | 'ADMIN'
  createdAt: string
}

export interface Notification {
  id: string
  userId?: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ORDER' | 'STOCK'
  read: boolean
  link?: string
  createdAt: string
}

export interface Event {
  id: string
  title: string
  content: string
  image?: string
  ctaText?: string
  ctaLink?: string
  active: boolean
  startDate?: string
  endDate?: string
  createdAt: string
}

export interface LocalCartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  color?: string
  size?: string
  stock: number
}
