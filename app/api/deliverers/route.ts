import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const deliverers = await prisma.deliverer.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ deliverers })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { name, phone } = await req.json()
  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'Nom et téléphone requis' }, { status: 400 })
  }
  const deliverer = await prisma.deliverer.create({
    data: { name: name.trim(), phone: phone.trim() },
  })
  return NextResponse.json({ deliverer })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await req.json()
  await prisma.deliverer.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
