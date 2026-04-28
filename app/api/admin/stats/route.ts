import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = new Date()
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    recentOrders,
    dailySales,
    categorySales,
    topProducts,
    lowStockProducts,
    monthlyRevenue,
    weeklyRevenue,
  ] = await Promise.all([
    // Total revenue from paid orders
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { total: true },
    }),

    // Total orders
    prisma.order.count(),

    // Total customers
    prisma.user.count({ where: { role: 'CUSTOMER' } }),

    // Total active products
    prisma.product.count({ where: { active: true } }),

    // Pending orders
    prisma.order.count({ where: { status: 'PENDING' } }),

    // Recent orders (last 5)
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } }, items: { take: 1 } },
    }),

    // Sales per day (last 7 days)
    prisma.order.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: last7Days }, paymentStatus: 'PAID' },
      _sum: { total: true },
      _count: true,
    }),

    // Sales by category
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: last30Days }, paymentStatus: 'PAID' } },
      include: { product: { select: { category: true } } },
    }),

    // Top 5 products
    prisma.product.findMany({
      where: { active: true, sold: { gt: 0 } },
      orderBy: { sold: 'desc' },
      take: 5,
      select: { id: true, name: true, sold: true, price: true, stock: true, category: true },
    }),

    // Low stock products (≤ 5)
    prisma.product.findMany({
      where: { active: true, stock: { lte: 5 } },
      orderBy: { stock: 'asc' },
      take: 10,
      select: { id: true, name: true, stock: true, category: true },
    }),

    // Monthly revenue
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, paymentStatus: 'PAID' },
      _sum: { total: true },
    }),

    // Weekly revenue
    prisma.order.aggregate({
      where: { createdAt: { gte: last7Days }, paymentStatus: 'PAID' },
      _sum: { total: true },
    }),
  ])

  // Build daily sales chart data
  const days: Record<string, { revenue: number; count: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split('T')[0]
    days[key] = { revenue: 0, count: 0 }
  }

  for (const row of dailySales) {
    const key = new Date(row.createdAt).toISOString().split('T')[0]
    if (days[key]) {
      days[key].revenue += row._sum.total || 0
      days[key].count += row._count
    }
  }

  // Build category chart data
  const catMap: Record<string, { revenue: number; count: number }> = {
    VINTAGE: { revenue: 0, count: 0 },
    STOCKS: { revenue: 0, count: 0 },
    LAMS_COLLECTION: { revenue: 0, count: 0 },
  }
  for (const item of categorySales) {
    const cat = item.product.category
    if (catMap[cat]) {
      catMap[cat].revenue += item.price * item.quantity
      catMap[cat].count += item.quantity
    }
  }

  return NextResponse.json({
    overview: {
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      weeklyRevenue: weeklyRevenue._sum.total || 0,
    },
    dailySales: Object.entries(days).map(([date, v]) => ({ date, ...v })),
    categorySales: Object.entries(catMap).map(([category, v]) => ({ category, ...v })),
    topProducts: topProducts.map((p) => ({
      ...p,
      revenue: p.price * p.sold,
    })),
    lowStockProducts,
    recentOrders,
  })
}
