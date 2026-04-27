import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { lamsEmitter } from '@/lib/sse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Non autorisé', { status: 401 })
  }

  const userId = (session.user as any).id
  const encoder = new TextEncoder()

  let handler: ((event: any) => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // connection closed
        }
      }

      // Heartbeat toutes les 25s pour garder la connexion vivante
      const heartbeat = setInterval(() => send({ type: 'ping' }), 25000)

      // Confirmation de connexion
      send({ type: 'connected', userId })

      // Écoute les événements de cet utilisateur
      handler = (event: object) => send(event)
      lamsEmitter.on(`user:${userId}`, handler)

      // Nettoyage à la déconnexion
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        if (handler) lamsEmitter.off(`user:${userId}`, handler)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
