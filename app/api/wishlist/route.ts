import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const items = await prisma.wishlistItem.findMany({
    where: { userId: (session.user as any).id },
    include: { product: true },
  })

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { productId } = await req.json()
  const userId = (session.user as any).id

  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  })

  return NextResponse.json({ item })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { productId } = await req.json()
  const userId = (session.user as any).id

  await prisma.wishlistItem.deleteMany({ where: { userId, productId } })
  return NextResponse.json({ success: true })
}
