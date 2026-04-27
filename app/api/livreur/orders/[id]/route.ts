import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pushToUser } from '@/lib/sse'

// PATCH /api/livreur/orders/[id] — livreur marks order as DELIVERED
export async function PATCH(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'LIVREUR') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const livreurId = (session.user as any).id
  const livreurName = (session.user as any).name ?? 'Le livreur'

  const order = await prisma.order.findFirst({
    where: { id: params.id, delivererId: livreurId, status: 'SHIPPED' },
    include: { user: true },
  })

  if (!order) {
    return NextResponse.json({ error: 'Commande introuvable ou déjà livrée' }, { status: 404 })
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: 'DELIVERED' },
    include: { user: true },
  })

  const orderRef = `#${updated.id.slice(-8).toUpperCase()}`

  // 1. Notify the customer
  const customerNotif = await prisma.notification.create({
    data: {
      userId: updated.userId,
      title: '🎉 Commande livrée',
      message: `Votre commande ${orderRef} a été livrée. Merci de votre confiance !`,
      type: 'ORDER',
      link: '/orders',
    },
  })
  pushToUser(updated.userId, {
    type: 'order_update',
    notification: {
      id: customerNotif.id,
      title: customerNotif.title,
      message: customerNotif.message,
      type: customerNotif.type,
      read: false,
      link: customerNotif.link,
      createdAt: customerNotif.createdAt.toISOString(),
    },
    orderUpdate: { id: updated.id, status: 'DELIVERED' },
  })

  // 2. Notify all admins
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
  await Promise.all(
    admins.map(async (admin) => {
      const adminNotif = await prisma.notification.create({
        data: {
          userId: admin.id,
          title: `✅ Livraison confirmée`,
          message: `${livreurName} a confirmé la livraison de la commande ${orderRef}.`,
          type: 'ORDER',
          link: '/admin/orders',
        },
      })
      pushToUser(admin.id, {
        type: 'new_order',
        notification: {
          id: adminNotif.id,
          title: adminNotif.title,
          message: adminNotif.message,
          type: adminNotif.type,
          read: false,
          link: adminNotif.link,
          createdAt: adminNotif.createdAt.toISOString(),
        },
        orderUpdate: { id: updated.id, status: 'DELIVERED' },
      })
    })
  )

  return NextResponse.json({ order: updated })
}
