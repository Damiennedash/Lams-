'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import ProductCard from '@/components/shop/ProductCard'
import type { Product } from '@/types'
import { getCategoryLabel } from '@/lib/utils'

const categories = [
  { value: '', label: 'TOUT' },
  { value: 'VINTAGE', label: 'VINTAGE' },
  { value: 'STOCKS', label: 'STOCKS' },
  { value: 'LAMS_COLLECTION', label: 'COLLECTION LAMS' },
]

const sortOptions = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Plus populaires' },
]

export default function HomeClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Sync category with URL param — updates on every navigation
  const urlCategory = searchParams.get('category') || ''

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Derive selected category directly from URL
  const category = urlCategory

  const setCategory = useCallback((cat: string, scrollToProducts = false) => {
    router.push(cat ? `/?category=${cat}` : '/', { scroll: false })
    setPage(1)
    if (scrollToProducts) {
      setTimeout(() => {
        document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }, [router])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' })
      if (category) params.set('category', category)
      if (search) params.set('search', search)

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()

      let sorted = [...(data.products || [])]
      if (sort === 'price_asc') sorted.sort((a, b) => a.price - b.price)
      else if (sort === 'price_desc') sorted.sort((a, b) => b.price - a.price)
      else if (sort === 'popular') sorted.sort((a, b) => b.sold - a.sold)

      setProducts(sorted)
      setTotalPages(data.pages || 1)
    } catch {}
    setLoading(false)
  }, [category, search, sort, page])

  useEffect(() => { loadProducts() }, [loadProducts])

  // Reset page and scroll to products when category changes via URL
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setPage(1)
    if (urlCategory) {
      setTimeout(() => {
        document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }, [urlCategory])

  useEffect(() => {
    fetch('/api/wishlist')
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setWishlistIds(data.items.map((i: any) => i.productId))
      })
      .catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadProducts()
  }

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="relative h-[80vh] min-h-[520px] bg-lams-dark flex items-end overflow-hidden">
        {/* Hero background — remplacez l'URL par votre propre image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,26,26,0.92) 0%, rgba(26,26,26,0.25) 50%, rgba(26,26,26,0.45) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pb-20 sm:pb-24 w-full">
          <div className="max-w-xl animate-slide-up">
            <p className="text-lams-gold text-[11px] tracking-[0.5em] mb-5 uppercase">Nouvelle Saison</p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-lams-cream font-light leading-[1.1] mb-6">
              Style &amp;<br />
              <em>Authenticité</em>
            </h1>
            <p className="text-lams-lightgray text-sm leading-relaxed mb-10 max-w-sm">
              Découvrez nos collections vintage, stocks exclusifs et créations LAMS pour un style intemporel.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setCategory('LAMS_COLLECTION', true)}
                className="btn-dark px-8 py-3.5"
              >
                COLLECTION LAMS
              </button>
              <button
                onClick={() => setCategory('VINTAGE', true)}
                className="px-8 py-3.5 border border-lams-cream text-lams-cream text-xs tracking-widest font-medium hover:bg-lams-cream hover:text-lams-dark transition-colors duration-200"
              >
                VINTAGE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── CATEGORY BAR ───────── */}
      <section className="bg-lams-dark border-t border-white/10 sticky top-[64px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex-shrink-0 px-6 py-4 text-[11px] tracking-[0.3em] font-medium transition-all duration-200 border-b-2 ${
                  category === cat.value
                    ? 'text-lams-gold border-lams-gold'
                    : 'text-lams-gray border-transparent hover:text-lams-cream hover:border-white/30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FILTERS ───────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-lams-gray" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 pr-4 py-2.5 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lams-gray hover:text-lams-dark"
              >
                <X size={14} />
              </button>
            )}
          </form>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}
              className="input-field pr-8 text-sm appearance-none cursor-pointer w-full sm:w-44"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-lams-gray pointer-events-none" />
          </div>
        </div>

        <p className="text-[11px] text-lams-gray mt-3 tracking-wider">
          {loading ? '...' : `${products.length} produit${products.length !== 1 ? 's' : ''}`}
          {category ? ` · ${getCategoryLabel(category)}` : ''}
          {search ? ` · "${search}"` : ''}
        </p>
      </section>

      {/* ───────── PRODUCTS GRID ───────── */}
      <section id="products-grid" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white animate-pulse">
                <div className="aspect-[3/4] bg-lams-border" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-lams-border rounded" />
                  <div className="h-3 w-2/3 bg-lams-border rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <SlidersHorizontal size={48} className="text-lams-border mb-4" />
            <h3 className="text-lg font-medium text-lams-dark mb-2">Aucun produit trouvé</h3>
            <p className="text-lams-gray text-sm mb-6">Essayez de modifier vos filtres</p>
            <button
              onClick={() => { setCategory(''); setSearch(''); setPage(1) }}
              className="btn-outline"
            >
              RÉINITIALISER
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlistIds={wishlistIds}
                onWishlistToggle={(id) =>
                  setWishlistIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-outline disabled:opacity-40 px-4 py-2"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 text-sm transition-colors ${
                  p === page
                    ? 'bg-lams-dark text-lams-cream'
                    : 'border border-lams-border text-lams-gray hover:border-lams-dark hover:text-lams-dark'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-outline disabled:opacity-40 px-4 py-2"
            >
              →
            </button>
          </div>
        )}
      </section>

      {/* ───────── UNIVERSE SECTION ───────── */}
      <section className="bg-lams-dark py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-lams-gold text-[10px] tracking-[0.5em] mb-3">NOS UNIVERS</p>
            <h2 className="font-serif text-4xl text-lams-cream font-light">Explorez nos Collections</h2>
            <div className="w-16 h-px bg-lams-gold mx-auto mt-5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                cat: 'VINTAGE',
                label: 'Vintage',
                sub: 'Pièces authentiques & rares des décennies passées',
                accent: '#C9A96E',
              },
              {
                cat: 'STOCKS',
                label: 'Stocks',
                sub: 'Sélection exclusive de stocks premium',
                accent: '#8B7355',
              },
              {
                cat: 'LAMS_COLLECTION',
                label: "Collection LAMS",
                sub: 'Créations originales et exclusives LAMS',
                accent: '#F7F4EF',
              },
            ].map((item) => (
              <button
                key={item.cat}
                onClick={() => setCategory(item.cat, true)}
                className="group relative bg-white/5 hover:bg-white/10 p-10 text-left transition-all duration-300 border border-white/10 hover:border-lams-gold/40"
              >
                <div
                  className="w-8 h-0.5 mb-6 transition-all duration-300 group-hover:w-16"
                  style={{ backgroundColor: item.accent }}
                />
                <p className="text-[10px] tracking-[0.4em] mb-2" style={{ color: item.accent }}>
                  {item.cat}
                </p>
                <h3 className="text-lams-cream font-serif text-2xl font-light mb-3">{item.label}</h3>
                <p className="text-lams-gray text-sm leading-relaxed">{item.sub}</p>
                <div className="mt-6 text-[10px] tracking-[0.3em] flex items-center gap-2 transition-all" style={{ color: item.accent }}>
                  DÉCOUVRIR
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
