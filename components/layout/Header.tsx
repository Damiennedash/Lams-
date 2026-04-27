'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { ShoppingBag, Heart, User, Menu, X, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import CartDrawer from '@/components/shop/CartDrawer'
import NotificationBell from '@/components/shop/NotificationBell'

export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { openCart } = useCartStore()
  const cartCount = useCartStore((s) => s.count())
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navigate = (category?: string) => {
    setMenuOpen(false)
    if (category) {
      router.push(`/?category=${category}`)
    } else {
      router.push('/')
    }
  }

  const navItems = [
    { label: 'ACCUEIL', action: () => navigate() },
    { label: 'VINTAGE', action: () => navigate('VINTAGE') },
    { label: 'STOCKS', action: () => navigate('STOCKS') },
    { label: 'COLLECTION LAMS', action: () => navigate('LAMS_COLLECTION') },
  ]

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-lams-dark shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Main bar */}
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-lams-cream p-1"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <button onClick={() => navigate()} className="flex flex-col items-center group">
              <span className="text-lams-cream font-serif text-2xl sm:text-3xl tracking-[0.3em] font-light group-hover:text-lams-gold transition-colors">
                LAMS
              </span>
              <span className="text-lams-gold text-[9px] tracking-[0.4em] -mt-0.5 hidden sm:block">
                BOUTIQUE
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="text-lams-lightgray hover:text-lams-cream text-[11px] tracking-[0.25em] font-medium transition-colors duration-200 hover:text-lams-gold"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {session && <NotificationBell />}

              <Link
                href="/wishlist"
                className="text-lams-lightgray hover:text-lams-cream transition-colors p-1"
                aria-label="Favoris"
              >
                <Heart size={18} />
              </Link>

              <button
                onClick={openCart}
                className="relative text-lams-lightgray hover:text-lams-cream transition-colors p-1"
                aria-label="Panier"
              >
                <ShoppingBag size={18} />
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-lams-gold text-lams-dark text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1 text-lams-lightgray hover:text-lams-cream transition-colors"
                  >
                    <div className="w-7 h-7 bg-lams-gold/20 rounded-full flex items-center justify-center">
                      <User size={14} className="text-lams-gold" />
                    </div>
                    <ChevronDown size={12} />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-lams-dark border border-white/10 shadow-xl z-50">
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-lams-cream text-xs font-medium truncate">{session.user?.name}</p>
                          <p className="text-lams-gray text-[10px] tracking-widest mt-0.5">
                            {(session.user as any)?.uniqueId}
                          </p>
                        </div>
                        {[
                          { label: 'MON PROFIL', href: '/profile' },
                          { label: 'MES COMMANDES', href: '/orders' },
                          { label: 'MES FAVORIS', href: '/wishlist' },
                        ].map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            onClick={() => setUserMenuOpen(false)}
                            className="block px-4 py-3 text-xs text-lams-lightgray hover:text-lams-cream hover:bg-white/5 tracking-wider transition-colors"
                          >
                            {l.label}
                          </Link>
                        ))}
                        {(session.user as any)?.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="block px-4 py-3 text-xs text-lams-gold hover:text-lams-cream hover:bg-white/5 tracking-wider transition-colors"
                          >
                            ★ ADMIN PANEL
                          </Link>
                        )}
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                          className="w-full text-left px-4 py-3 text-xs text-red-400 hover:text-red-300 hover:bg-white/5 tracking-wider transition-colors border-t border-white/10"
                        >
                          SE DÉCONNECTER
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-lams-lightgray hover:text-lams-cream transition-colors p-1"
                  aria-label="Connexion"
                >
                  <User size={18} />
                </Link>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          {menuOpen && (
            <nav className="lg:hidden border-t border-white/10 py-3 space-y-0.5">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full text-left px-2 py-3 text-[11px] tracking-[0.25em] text-lams-lightgray hover:text-lams-gold transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="border-t border-white/10 pt-2 mt-2">
                {!session ? (
                  <>
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-2 py-3 text-[11px] tracking-[0.25em] text-lams-gold">
                      CONNEXION
                    </Link>
                    <Link href="/register" onClick={() => setMenuOpen(false)} className="block px-2 py-3 text-[11px] tracking-[0.25em] text-lams-lightgray hover:text-lams-cream">
                      INSCRIPTION
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-2 py-3 text-[11px] tracking-[0.25em] text-lams-lightgray hover:text-lams-cream">
                      MON PROFIL
                    </Link>
                    <Link href="/orders" onClick={() => setMenuOpen(false)} className="block px-2 py-3 text-[11px] tracking-[0.25em] text-lams-lightgray hover:text-lams-cream">
                      MES COMMANDES
                    </Link>
                    {(session.user as any)?.role === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-2 py-3 text-[11px] tracking-[0.25em] text-lams-gold">
                        ADMIN PANEL
                      </Link>
                    )}
                  </>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16" />

      <CartDrawer />
    </>
  )
}
