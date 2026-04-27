import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

function genUniqueId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = 'LIV-'
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const livreurs = await prisma.user.findMany({
    where: { role: 'LIVREUR' },
    select: { id: true, uniqueId: true, name: true, phone: true, email: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ livreurs })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { name, phone, password } = await req.json()
    if (!name?.trim() || !phone?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Nom, téléphone et mot de passe requis' }, { status: 400 })
    }

    // Generate unique ID LIV-XXXXXXXX
    let uniqueId = genUniqueId()
    let tries = 0
    while (await prisma.user.findUnique({ where: { uniqueId } }) && tries < 10) {
      uniqueId = genUniqueId()
      tries++
    }

    const email = `${uniqueId.toLowerCase()}@lams-livreur.local`
    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { uniqueId, name: name.trim(), email, password: hashed, phone: phone.trim(), role: 'LIVREUR' },
      select: { id: true, uniqueId: true, name: true, phone: true, email: true, createdAt: true },
    })

    // Sync with Deliverer table
    try {
      const existing = await prisma.deliverer.findFirst({ where: { userId: user.id } })
      if (!existing) {
        await prisma.deliverer.create({
          data: { name: user.name, phone: user.phone ?? '', userId: user.id },
        })
      }
    } catch {}

    return NextResponse.json({ user })
  } catch (err: any) {
    console.error('[POST /api/admin/livreurs]', err?.message)
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await req.json()
  await prisma.user.update({ where: { id }, data: { role: 'CUSTOMER' } })
  await prisma.deliverer.updateMany({ where: { userId: id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
