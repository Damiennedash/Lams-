import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, db: 'connectée', env: !!process.env.DATABASE_URL })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message,
      env: !!process.env.DATABASE_URL,
    }, { status: 500 })
  }
}
