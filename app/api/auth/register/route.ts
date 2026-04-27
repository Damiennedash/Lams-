import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { generateUniqueId } from '@/lib/utils'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit comporter au moins 8 caractères' }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }

    let uniqueId = generateUniqueId()
    while (await prisma.user.findUnique({ where: { uniqueId } })) {
      uniqueId = generateUniqueId()
    }

    const hash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, password: hash, phone, uniqueId },
    })

    try {
      await sendWelcomeEmail(email, name, uniqueId)
    } catch (emailErr) {
      console.error('Email send failed:', emailErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès. Vérifiez vos emails pour votre ID unique.',
      uniqueId,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
