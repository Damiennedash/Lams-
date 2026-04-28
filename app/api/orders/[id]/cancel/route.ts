import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pushToUser } from '@/lib/sse'

export const dynamic = 'force-dynamic'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const order = await prisma.order.findUnique({ where: { id: params.id } })

  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  if (order.userId !== userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  if (!['PENDING', 'CONFIRMED', 'SHIPPED'].includes(order.status)) {
    return NextResponse.json(
      { error: 'Cette commande ne peut plus être annulée.' },
      { status: 400 }
    )
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  })

  // Notification in DB
  const notif = await prisma.notification.create({
    data: {
      userId,
      title: '❌ Commande annulée',
      message: `Votre commande #${order.id.slice(-8).toUpperCase()} a été annulée à votre demande.`,
      type: 'ORDER',
      link: '/orders',
    },
  })

  // SSE push to client (confirm cancellation)
  pushToUser(userId, {
    type: 'order_update',
    notification: {
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: false,
      link: notif.link,
      createdAt: notif.createdAt.toISOString(),
    },
    orderUpdate: { id: order.id, status: 'CANCELLED' },
  })

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  admins.forEach((a) =>
    pushToUser(a.id, {
      type: 'order_update',
      notification: {
        id: notif.id,
        title: `Annulation commande`,
        message: `${user?.name ?? 'Un client'} a annulé la commande #${order.id.slice(-8).toUpperCase()}`,
        type: 'ORDER',
        read: false,
        link: `/admin/orders`,
        createdAt: notif.createdAt.toISOString(),
      },
      orderUpdate: { id: order.id, status: 'CANCELLED' },
    })
  )

  return NextResponse.json({ order: updated })
}
