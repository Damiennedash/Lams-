import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre compte LAMS pour accéder à vos commandes et bénéficier de nos offres exclusives.',
  openGraph: {
    title: 'Connexion | LAMS Boutique',
    description: 'Connectez-vous à votre compte LAMS.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
