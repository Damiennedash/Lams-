import Link from 'next/link'
import { Instagram, Facebook, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-lams-dark text-lams-lightgray mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <h2 className="text-lams-cream font-serif text-3xl tracking-[0.3em] mb-2">LAMS</h2>
            <p className="text-lams-gold text-[10px] tracking-[0.4em] mb-4">BOUTIQUE</p>
            <p className="text-sm leading-relaxed text-lams-gray">
              Mode authentique, style intemporel. Découvrez nos collections vintage et exclusives.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-lams-gray hover:text-lams-cream transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-lams-gray hover:text-lams-cream transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-lams-gray hover:text-lams-cream transition-colors">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-lams-cream text-[11px] tracking-[0.3em] font-medium mb-5">BOUTIQUE</h3>
            <ul className="space-y-3">
              {[
                { label: 'Vintage', href: '/?category=VINTAGE' },
                { label: 'Stocks', href: '/?category=STOCKS' },
                { label: 'Collection LAMS', href: '/?category=LAMS_COLLECTION' },
                { label: 'Nouveautés', href: '/' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-lams-gray hover:text-lams-cream transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-lams-cream text-[11px] tracking-[0.3em] font-medium mb-5">COMPTE</h3>
            <ul className="space-y-3">
              {[
                { label: 'Se connecter', href: '/login' },
                { label: "S'inscrire", href: '/register' },
                { label: 'Mes commandes', href: '/orders' },
                { label: 'Mes favoris', href: '/wishlist' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-lams-gray hover:text-lams-cream transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-lams-cream text-[11px] tracking-[0.3em] font-medium mb-5">INFORMATIONS</h3>
            <ul className="space-y-3">
              <li className="text-sm text-lams-gray">Paiement sécurisé</li>
              <li className="text-sm text-lams-gray">Moov Money</li>
              <li className="text-sm text-lams-gray">Yas Pay</li>
              <li className="text-sm text-lams-gray">Livraison rapide</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-lams-gray tracking-wider">
            © {new Date().getFullYear()} LAMS BOUTIQUE. TOUS DROITS RÉSERVÉS.
          </p>
          <div className="flex gap-6 text-[11px] text-lams-gray tracking-wider">
            <span>MOOV MONEY</span>
            <span>·</span>
            <span>YAS PAY</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
