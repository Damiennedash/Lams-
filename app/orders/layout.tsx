import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mes Commandes',
  description: 'Suivez et gérez vos commandes LAMS.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
