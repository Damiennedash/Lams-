import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ma Liste de Souhaits',
  description: 'Vos articles favoris enregistrés sur LAMS Boutique.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
