import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pushToUser } from '@/lib/sse'

export const dynamic = 'force-dynamic'

// PATCH — customer updates delivery info of their own PENDING order
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const order = await prisma.order.findUnique({ where: { id: params.id } })

  if (!order || order.userId !== userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    return NextResponse.json({ error: 'Seules les commandes en attente ou confirmées peuvent être modifiées.' }, { status: 400 })
  }

  const { deliveryAddress, deliveryLat, deliveryLng, note } = await req.json()
  if (!deliveryAddress && !deliveryLat) {
    return NextResponse.json({ error: 'Adresse de livraison requise.' }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: {
      ...(deliveryAddress !== undefined && { deliveryAddress }),
      ...(deliveryLat  !== undefined && { deliveryLat }),
      ...(deliveryLng  !== undefined && { deliveryLng }),
      ...(note         !== undefined && { note }),
    },
    include: { items: true, user: { select: { name: true, email: true } } },
  })

  // Notify admins so they see the updated address
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  admins.forEach(a => pushToUser(a.id, {
    type: 'order_update',
    orderUpdate: { id: updated.id, status: updated.status },
  }))

  return NextResponse.json({ order: updated })
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, user: { select: { name: true, email: true } } },
  })

  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

  const isAdmin = (session.user as any).role === 'ADMIN'
  if (!isAdmin && order.userId !== (session.user as any).id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  return NextResponse.json({ order })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { status, paymentStatus, deliveryName, deliveryPhone, delivererId } = await req.json()
  const data: any = {}
  if (status) data.status = status
  if (paymentStatus) data.paymentStatus = paymentStatus
  if (deliveryName !== undefined) data.deliveryName = deliveryName
  if (deliveryPhone !== undefined) data.deliveryPhone = deliveryPhone
  if (delivererId !== undefined) data.delivererId = delivererId

  const order = await prisma.order.update({
    where: { id: params.id },
    data,
    include: { user: true },
  })

  const statusMessages: Record<string, { title: string; message: string }> = {
    CONFIRMED: {
      title: `✅ Commande confirmée`,
      message: `Votre commande #${order.id.slice(-8).toUpperCase()} a été confirmée et est en préparation.`,
    },
    SHIPPED: {
      title: `🚚 Commande expédiée`,
      message: `Votre commande #${order.id.slice(-8).toUpperCase()} est en cours de livraison !`,
    },
    DELIVERED: {
      title: `🎉 Commande livrée`,
      message: `Votre commande #${order.id.slice(-8).toUpperCase()} a été livrée. Merci de votre confiance !`,
    },
    CANCELLED: {
      title: `❌ Commande annulée`,
      message: `Votre commande #${order.id.slice(-8).toUpperCase()} a été annulée.`,
    },
  }

  if (status && statusMessages[status]) {
    const { title, message } = statusMessages[status]
    const notif = await prisma.notification.create({
      data: { userId: order.userId, title, message, type: 'ORDER', link: '/orders' },
    })
    // Push SSE to customer
    pushToUser(order.userId, {
      type: 'order_update',
      notification: {
        id: notif.id, title: notif.title, message: notif.message,
        type: notif.type, read: false, link: notif.link,
        createdAt: notif.createdAt.toISOString(),
      },
      orderUpdate: {
        id: order.id,
        status: order.status,
        deliveryName: order.deliveryName ?? null,
        deliveryPhone: order.deliveryPhone ?? null,
      },
    })

    // Push SSE to assigned livreur → reload their order list
    if (order.delivererId) {
      pushToUser(order.delivererId, {
        type: 'new_assignment',
        orderUpdate: { id: order.id, status: order.status },
        notification: {
          id: `assign-${order.id}`,
          title: status === 'SHIPPED' ? '📦 Nouvelle livraison assignée' : `Commande mise à jour`,
          message: `Commande #${order.id.slice(-8).toUpperCase()} — ${order.deliveryAddress ?? ''}`,
          type: 'ORDER',
          read: false,
          link: '/livreur',
          createdAt: new Date().toISOString(),
        },
      })
    }
  }

  // ─── SSE push pour le statut de paiement ───
  if (paymentStatus) {
    const payLabel = paymentStatus === 'PAID' ? 'confirmé ✅' : paymentStatus === 'FAILED' ? 'échoué ❌' : 'mis à jour'
    const notif = await prisma.notification.create({
      data: {
        userId: order.userId,
        title: `Paiement ${payLabel}`,
        message: `Le paiement de votre commande #${order.id.slice(-8).toUpperCase()} est ${payLabel}.`,
        type: 'ORDER',
        link: '/orders',
      },
    })
    pushToUser(order.userId, {
      type: 'order_update',
      notification: {
        id: notif.id, title: notif.title, message: notif.message,
        type: notif.type, read: false, link: notif.link,
        createdAt: notif.createdAt.toISOString(),
      },
      orderUpdate: {
        id: order.id,
        paymentStatus: order.paymentStatus,
      },
    })
  }

  return NextResponse.json({ order })
}
