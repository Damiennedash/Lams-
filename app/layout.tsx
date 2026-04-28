import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import { Toaster } from 'react-hot-toast'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lams-boutique.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LAMS – Boutique de Mode',
    template: '%s | LAMS',
  },
  description: 'Découvrez les collections LAMS : vêtements vintage, stocks et pièces exclusives. Livraison partout au Togo.',
  keywords: ['LAMS', 'boutique mode', 'vintage', 'vêtements', 'Togo', 'Lomé', 'fashion', 'stocks'],
  authors: [{ name: 'LAMS Boutique' }],
  creator: 'LAMS',
  openGraph: {
    type: 'website',
    locale: 'fr_TG',
    url: siteUrl,
    siteName: 'LAMS Boutique',
    title: 'LAMS – Boutique de Mode',
    description: 'Découvrez les collections LAMS : vêtements vintage, stocks et pièces exclusives.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'LAMS Boutique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LAMS – Boutique de Mode',
    description: 'Découvrez les collections LAMS : vêtements vintage, stocks et pièces exclusives.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: { icon: '/favicon.ico' },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'LAMS Boutique',
  url: siteUrl,
  logo: `${siteUrl}/LAMS.jpg`,
  description: 'Boutique de mode en ligne au Togo — vêtements vintage, stocks et collections exclusives LAMS.',
  address: { '@type': 'PostalAddress', addressCountry: 'TG', addressLocality: 'Lomé' },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'LAMS Boutique',
  url: siteUrl,
  inLanguage: 'fr',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/?search={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
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
