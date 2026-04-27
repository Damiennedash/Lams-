'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { Event } from '@/types'

export default function EventPopup() {
  const [event, setEvent] = useState<Event | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('lams-event-dismissed')
    if (dismissed) return

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/events/active')
        if (res.ok) {
          const data = await res.json()
          if (data.event) {
            setEvent(data.event)
            setVisible(true)
          }
        }
      } catch {}
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setVisible(false)
    sessionStorage.setItem('lams-event-dismissed', '1')
  }

  if (!event || !visible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-lams-dark/60 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-lams-white max-w-lg w-full shadow-2xl animate-slide-up overflow-hidden">
        {event.image && (
          <div className="relative h-48 sm:h-64 w-full overflow-hidden">
            <Image src={event.image} alt={event.title} fill className="object-cover" />
          </div>
        )}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 bg-lams-dark/70 flex items-center justify-center text-lams-cream hover:bg-lams-dark transition-colors z-10"
        >
          <X size={16} />
        </button>
        <div className="p-6 sm:p-8">
          <h2 className="font-serif text-2xl text-lams-dark mb-3">{event.title}</h2>
          <p className="text-sm text-lams-gray leading-relaxed mb-6">{event.content}</p>
          <div className="flex gap-3">
            {event.ctaText && event.ctaLink && (
              <Link href={event.ctaLink} onClick={dismiss} className="btn-dark flex-1 text-center">
                {event.ctaText.toUpperCase()}
              </Link>
            )}
            <button onClick={dismiss} className="btn-outline flex-1">
              FERMER
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
