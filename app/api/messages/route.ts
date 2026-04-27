import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pushToUser } from '@/lib/sse'

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

  const messages = await prisma.message.findMany({
    where: { orderId },
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
// toRole = 'CUSTOMER' | 'ADMIN' | 'LIVREUR' — routes the SSE push
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

  const message = await prisma.message.create({
    data: { orderId, senderId: userId, content: content.trim(), isAdmin: isAdmin || isLivreur },
    include: { sender: { select: { id: true, name: true, role: true } } },
  })

  const ssePayload = {
    type: 'new_message',
    message: {
      id: message.id, orderId: message.orderId,
      content: message.content, isAdmin: message.isAdmin,
      createdAt: message.createdAt.toISOString(), sender: message.sender,
    },
  }

  if (isAdmin) {
    if (toRole === 'LIVREUR') {
      // Admin → livreur private message
      if (order.delivererId) pushToUser(order.delivererId, ssePayload)
    } else {
      // Admin → customer (default)
      pushToUser(order.userId, ssePayload)
      // Also push to other admins
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
      admins.forEach(a => { if (a.id !== userId) pushToUser(a.id, ssePayload) })
    }
  } else if (isLivreur) {
    if (toRole === 'ADMIN') {
      // Livreur → admin private: only admins
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
      admins.forEach(a => pushToUser(a.id, ssePayload))
    } else {
      // Livreur → customer: customer + admins (admin monitors all livreur↔customer comms)
      pushToUser(order.userId, ssePayload)
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
      admins.forEach(a => pushToUser(a.id, ssePayload))
    }
  } else {
    // Customer → push to all admins and assigned livreur
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
    admins.forEach(a => pushToUser(a.id, ssePayload))
    if (order.delivererId && order.delivererId !== userId) {
      pushToUser(order.delivererId, ssePayload)
    }
  }

  return NextResponse.json({ message })
}
