import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data: any = {}

    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.price !== undefined) data.price = parseFloat(body.price)
    if (body.category !== undefined) data.category = body.category
    if (body.images !== undefined) data.images = JSON.stringify(body.images)
    if (body.colors !== undefined) data.colors = JSON.stringify(body.colors)
    if (body.sizes !== undefined) data.sizes = JSON.stringify(body.sizes)
    if (body.stock !== undefined) data.stock = parseInt(body.stock)
    if (body.featured !== undefined) data.featured = body.featured
    if (body.active !== undefined) data.active = body.active

    const product = await prisma.product.update({ where: { id: params.id }, data })

    // Low stock notification
    if (data.stock !== undefined && data.stock <= 5 && data.stock > 0) {
      await prisma.notification.create({
        data: {
          title: 'Stock faible',
          message: `Le produit "${product.name}" n'a plus que ${product.stock} article(s) en stock.`,
          type: 'STOCK',
        },
      })
    }

    return NextResponse.json({ product })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  await prisma.product.update({ where: { id: params.id }, data: { active: false } })
  return NextResponse.json({ success: true })
}
