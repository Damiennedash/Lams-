import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const items = await prisma.cartItem.findMany({
    where: { userId: (session.user as any).id },
    include: { product: true },
  })

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { productId, quantity = 1, color, size } = await req.json()
  const userId = (session.user as any).id

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || product.stock < quantity) {
    return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 })
  }

  const existing = await prisma.cartItem.findFirst({
    where: { userId, productId, color: color || null, size: size || null },
  })

  let item
  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, product.stock)
    item = await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } })
  } else {
    item = await prisma.cartItem.create({
      data: { userId, productId, quantity, color, size },
    })
  }

  return NextResponse.json({ item })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await prisma.cartItem.deleteMany({ where: { userId: (session.user as any).id } })
  return NextResponse.json({ success: true })
}
