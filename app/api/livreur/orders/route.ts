import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'LIVREUR') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const orders = await prisma.order.findMany({
    where: { delivererId: userId, status: { in: ['SHIPPED', 'DELIVERED'] } },
    include: {
      items: true,
      user: { select: { id: true, name: true, phone: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ orders })
}
