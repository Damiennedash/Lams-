import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendOrderConfirmation } from '@/lib/email'
import { pushToUser } from '@/lib/sse'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const isAdmin = (session.user as any).role === 'ADMIN'
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: any = isAdmin ? {} : { userId: (session.user as any).id }
  if (status) where.status = status

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: true,
      user: { select: { name: true, email: true, uniqueId: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await req.json()
    const { items, paymentMethod, deliveryAddress, deliveryLat, deliveryLng, note } = body
    const userId = (session.user as any).id

    if (!items?.length) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
    }

    // Validate stock & calculate total
    let total = 0
    const enrichedItems: any[] = []

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) return NextResponse.json({ error: `Produit introuvable: ${item.productId}` }, { status: 400 })
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour: ${product.name}` }, { status: 400 })
      }
      const itemTotal = product.price * item.quantity
      total += itemTotal
      let firstImage = ''
      try { firstImage = JSON.parse(product.images || '[]')[0] || '' } catch {}
      enrichedItems.push({ ...item, price: product.price, name: product.name, image: firstImage })
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        paymentMethod,
        deliveryAddress,
        deliveryLat: deliveryLat != null ? Number(deliveryLat) : null,
        deliveryLng: deliveryLng != null ? Number(deliveryLng) : null,
        note,
        items: {
          create: enrichedItems.map((i) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            color: i.color || null,
            size: i.size || null,
            image: i.image || null,
          })),
        },
      },
      include: { items: true },
    })

    // Update stock & sold count
    for (const item of enrichedItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity }, sold: { increment: item.quantity } },
      })
      const updated = await prisma.product.findUnique({ where: { id: item.productId } })
      if (updated && updated.stock <= 5) {
        await prisma.notification.create({
          data: { title: 'Stock faible', message: `"${updated.name}" n'a plus que ${updated.stock} article(s) en stock.`, type: 'STOCK' },
        })
      }
    }

    // Send confirmation email (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) {
      sendOrderConfirmation(
        user.email, user.name, order.id,
        enrichedItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price, color: i.color, size: i.size })),
        total
      ).catch(() => {})
    }

    // User notification
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: 'Commande reçue !',
          message: `Votre commande #${order.id.slice(-8).toUpperCase()} a été reçue. Total: ${total.toLocaleString()} FCFA.`,
          type: 'ORDER',
          link: '/orders',
        },
      })
    } catch (notifErr: any) {
      console.error('[POST /api/orders] Notification error:', notifErr?.message)
    }

    // Push SSE to all admins (non-blocking)
    prisma.user.findMany({ where: { role: 'ADMIN' } }).then((admins) => {
      const payload = {
        type: 'new_order' as any,
        notification: {
          id: `order-${order.id}`,
          title: 'Nouvelle commande',
          message: `${user?.name ?? 'Un client'} vient de passer une commande de ${total.toLocaleString('fr')} FCFA (#${order.id.slice(-8).toUpperCase()})`,
          type: 'ORDER',
          read: false,
          link: '/admin/orders',
          createdAt: new Date().toISOString(),
        },
      }
      admins.forEach((a) => pushToUser(a.id, payload))
    }).catch(() => {})

    return NextResponse.json({ order }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/orders] FATAL:', err?.message, err?.code, err?.stack?.split('\n')[1])
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 })
  }
}
