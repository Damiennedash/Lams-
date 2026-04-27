'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/shop/ProductCard'
import type { Product } from '@/types'

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      fetch('/api/wishlist')
        .then((r) => r.json())
        .then((data) => {
          if (data.items) {
            setProducts(data.items.map((i: any) => i.product))
            setWishlistIds(data.items.map((i: any) => i.productId))
          }
        })
        .finally(() => setLoading(false))
    }
  }, [status, router])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-lams-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="font-serif text-3xl text-lams-dark mb-8">Mes Favoris</h1>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Heart size={64} className="text-lams-border mb-6" />
              <h2 className="text-xl text-lams-dark mb-3">Aucun favori</h2>
              <p className="text-lams-gray text-sm mb-8">Ajoutez des articles à votre liste de favoris.</p>
              <Link href="/" className="btn-dark">DÉCOUVRIR LA BOUTIQUE</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  wishlistIds={wishlistIds}
                  onWishlistToggle={(id) => {
                    setProducts((prev) => prev.filter((p) => p.id !== id))
                    setWishlistIds((prev) => prev.filter((i) => i !== id))
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
