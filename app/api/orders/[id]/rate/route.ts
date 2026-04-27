import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const { rating, ratingComment } = await req.json()

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Note invalide (1-5)' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  if (order.userId !== userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  if (order.status !== 'DELIVERED') return NextResponse.json({ error: 'La commande doit être livrée' }, { status: 400 })

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { rating, ratingComment: ratingComment?.trim() || null },
  })

  return NextResponse.json({ order: updated })
}
