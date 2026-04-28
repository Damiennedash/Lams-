import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Créez votre compte LAMS gratuitement et profitez de la livraison à domicile au Togo.',
  openGraph: {
    title: 'Créer un compte | LAMS Boutique',
    description: 'Rejoignez LAMS Boutique et découvrez nos collections exclusives.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
