import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { pushToUser } from '@/lib/sse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { reference, status, order_id } = body

    const orderId = order_id || reference?.split('-')[2]
    if (!orderId) return NextResponse.json({ ok: true })

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { paymentRef: reference }] },
    })

    if (!order) return NextResponse.json({ ok: true })

    if (status === 'SUCCESS' || status === 'SUCCESSFUL' || status === 'PAID') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
      })

      // Push real-time update to customer
      pushToUser(order.userId, {
        type: 'order_update' as any,
        orderUpdate: { id: order.id, status: 'CONFIRMED', paymentStatus: 'PAID' } as any,
      })

      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: 'Paiement reçu !',
          message: `Votre paiement de ${order.total.toLocaleString()} FCFA a été reçu pour la commande #${order.id.slice(-8).toUpperCase()}.`,
          type: 'SUCCESS',
          link: '/orders',
        },
      })

      // Push notification SSE
      pushToUser(order.userId, {
        type: 'notification' as any,
        notification: {
          id: `pay-${order.id}`,
          title: 'Paiement reçu !',
          message: `Paiement de ${order.total.toLocaleString()} FCFA confirmé.`,
          type: 'SUCCESS',
          read: false,
          link: '/orders',
          createdAt: new Date().toISOString(),
        },
      })

      // Notify admins
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
      admins.forEach(a => pushToUser(a.id, {
        type: 'order_update' as any,
        orderUpdate: { id: order.id, status: 'CONFIRMED', paymentStatus: 'PAID' } as any,
      }))

    } else if (status === 'FAILED' || status === 'REJECTED') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED' },
      })

      // Push real-time failure to customer
      pushToUser(order.userId, {
        type: 'order_update' as any,
        orderUpdate: { id: order.id, status: order.status, paymentStatus: 'FAILED' } as any,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
