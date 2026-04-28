import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pushToUser } from '@/lib/sse'

export const dynamic = 'force-dynamic'

// GET /api/messages?orderId=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orderId = req.nextUrl.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'orderId requis' }, { status: 400 })

  const userId = (session.user as any).id
  const role = (session.user as any).role
  const isAdmin = role === 'ADMIN'
  const isLivreur = role === 'LIVREUR'

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  const canAccess = isAdmin || isLivreur || order.userId === userId
  if (!canAccess) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  // Build where clause based on role
  // toRole field: 'CUSTOMER' = admin→customer, 'LIVREUR' = admin→livreur,
  //               'ADMIN' = customer→admin or livreur→admin
  let where: any = { orderId }
  if (isLivreur) {
    // Livreur sees only their own messages + messages explicitly sent to them
    where.OR = [{ senderId: userId }, { toRole: 'LIVREUR' }]
  } else if (!isAdmin) {
    // Customer sees only their own messages + messages explicitly sent to them
    where.OR = [{ senderId: userId }, { toRole: 'CUSTOMER' }]
  }
  // Admin sees all messages (no extra filter)

  const messages = await prisma.message.findMany({
    where,
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  })

  await prisma.message.updateMany({
    where: { orderId, read: false, isAdmin: isAdmin ? false : true },
    data: { read: true },
  })

  return NextResponse.json({ messages })
}

// POST /api/messages
// Body: { orderId, content, toRole? }
// toRole = 'CUSTOMER' | 'LIVREUR' | 'ADMIN'
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { orderId, content, toRole } = await req.json()
  if (!orderId || !content?.trim()) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const userId = (session.user as any).id
  const role = (session.user as any).role
  const isAdmin = role === 'ADMIN'
  const isLivreur = role === 'LIVREUR'

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  })
  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  const canAccess = isAdmin || isLivreur || order.userId === userId
  if (!canAccess) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  // Determine who this message is addressed to
  let resolvedToRole: string
  if (isAdmin) {
    resolvedToRole = toRole === 'LIVREUR' ? 'LIVREUR' : 'CUSTOMER'
  } else if (isLivreur) {
    resolvedToRole = 'ADMIN'
  } else {
    // Customer
    resolvedToRole = 'ADMIN'
  }

  const message = await prisma.message.create({
    data: {
      orderId,
      senderId: userId,
      content: content.trim(),
      isAdmin: isAdmin || isLivreur,
      toRole: resolvedToRole,
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  })

  const ssePayload = {
    type: 'new_message',
    message: {
      id: message.id,
      orderId: message.orderId,
      content: message.content,
      isAdmin: message.isAdmin,
      toRole: message.toRole,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender,
    },
  }

  if (isAdmin) {
    if (resolvedToRole === 'LIVREUR') {
      // Admin → livreur: push to livreur + other admins
      if (order.delivererId) pushToUser(order.delivererId, ssePayload)
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
      admins.forEach(a => { if (a.id !== userId) pushToUser(a.id, ssePayload) })
    } else {
      // Admin → customer: push to customer + other admins only (NOT livreur)
      pushToUser(order.userId, ssePayload)
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
      admins.forEach(a => { if (a.id !== userId) pushToUser(a.id, ssePayload) })
    }
  } else if (isLivreur) {
    // Livreur → admin: push to admins only (NOT customer)
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
    admins.forEach(a => pushToUser(a.id, ssePayload))
  } else {
    // Customer → admin: push to admins only (NOT livreur)
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
    admins.forEach(a => pushToUser(a.id, ssePayload))
  }

  return NextResponse.json({ message })
}
