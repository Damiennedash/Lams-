'use client'

import { SessionProvider } from 'next-auth/react'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'

function RealtimeListener() {
  useRealtimeUpdates()
  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RealtimeListener />
      {children}
    </SessionProvider>
  )
}
