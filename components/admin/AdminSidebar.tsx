'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Package, ShoppingBag, Calendar, Truck,
  LogOut, ExternalLink, Menu, X,
} from 'lucide-react'
import NotificationBell from '@/components/shop/NotificationBell'

const navItems = [
  { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { label: 'Produits', href: '/admin/products', icon: Package },
  { label: 'Commandes', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Livreurs', href: '/admin/livreurs', icon: Truck },
  { label: 'Événements', href: '/admin/events', icon: Calendar },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
          <div>
            <p className="text-lams-cream font-serif text-xl tracking-[0.25em]">LAMS</p>
            <p className="text-lams-gold text-[9px] tracking-[0.3em]">ADMIN</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          {onClose && (
            <button onClick={onClose} className="text-lams-gray hover:text-lams-cream md:hidden">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <Link href="/" className="sidebar-link" target="_blank" onClick={onClose}>
          <ExternalLink size={16} />
          <span>Voir la boutique</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="sidebar-link w-full text-left text-red-400 hover:text-red-300"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )
}

export default function AdminSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-lams-dark px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div>
          <p className="text-lams-cream font-serif text-lg tracking-[0.25em]">LAMS</p>
          <p className="text-lams-gold text-[9px] tracking-[0.3em]">ADMIN</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button onClick={() => setOpen(true)} className="text-lams-cream">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-lams-dark transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent onClose={() => setOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-lams-dark flex-shrink-0 flex-col min-h-screen">
        <SidebarContent />
      </aside>
    </>
  )
}
