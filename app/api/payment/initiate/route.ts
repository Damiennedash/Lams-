import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { initiatePayment } from '@/lib/payment'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { orderId, operator, phone } = await req.json()

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order || order.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    const result = await initiatePayment({
      operator,
      phone,
      amount: order.total,
      orderId: order.id,
      customerName: session.user?.name || '',
    })

    if (result.success && result.reference) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentRef: result.reference },
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur de paiement' }, { status: 500 })
  }
}
