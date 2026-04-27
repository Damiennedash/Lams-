import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'LAMS – Boutique de Mode',
  description: 'Vintage, stocks et collections exclusives LAMS',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1A1A1A',
                color: '#F7F4EF',
                borderRadius: '0',
                padding: '14px 18px',
                fontSize: '13px',
                letterSpacing: '0.02em',
              },
              success: { iconTheme: { primary: '#C9A96E', secondary: '#1A1A1A' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#F7F4EF' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
