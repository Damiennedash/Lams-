'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import type { Product } from '@/types'
import { formatPrice, getCategoryLabel, parseImages, parseArray } from '@/lib/utils'

export default function ProductPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addItem, openCart } = useCartStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [wished, setWished] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product)
          const colors = parseArray(data.product.colors)
          const sizes = parseArray(data.product.sizes)
          if (colors.length) setSelectedColor(colors[0])
          if (sizes.length) setSelectedSize(sizes[0])
        }
      })
      .finally(() => setLoading(false))

    fetch('/api/wishlist')
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setWished(data.items.some((i: any) => i.productId === params.id))
      })
      .catch(() => {})
  }, [params.id])

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0] || '',
      quantity,
      color: selectedColor || undefined,
      size: selectedSize || undefined,
      stock: product.stock,
    })
    openCart()
    toast.success('Ajouté au panier')
  }

  const handleWishlist = async () => {
    if (!session) { toast.error('Connectez-vous pour ajouter aux favoris'); return }
    const res = await fetch('/api/wishlist', {
      method: wished ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: params.id }),
    })
    if (res.ok) {
      setWished(!wished)
      toast.success(wished ? 'Retiré des favoris' : 'Ajouté aux favoris')
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-lams-cream flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
        </div>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-lams-cream flex flex-col items-center justify-center gap-4">
          <p className="text-lams-gray">Produit introuvable</p>
          <Link href="/" className="btn-outline">RETOUR À LA BOUTIQUE</Link>
        </div>
        <Footer />
      </>
    )
  }

  const images = parseImages(product.images as unknown as string)
  const colors = parseArray(product.colors as unknown as string)
  const sizes = parseArray(product.sizes as unknown as string)
  const categoryLabel = getCategoryLabel(product.category)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-lams-cream">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-[11px] text-lams-gray tracking-wider">
            <Link href="/" className="hover:text-lams-dark transition-colors">ACCUEIL</Link>
            <span>/</span>
            <span className="text-lams-dark">{product.name.toUpperCase()}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Images */}
            <div>
              {/* Main image */}
              <div
                className="relative aspect-[4/5] bg-lams-cream overflow-hidden cursor-zoom-in mb-3"
                onClick={() => setZoomed(true)}
              >
                {images[imgIdx] ? (
                  <Image
                    src={images[imgIdx]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={64} className="text-lams-border" />
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setImgIdx((i) => Math.max(0, i - 1)) }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                      disabled={imgIdx === 0}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setImgIdx((i) => Math.min(images.length - 1, i + 1)) }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                      disabled={imgIdx === images.length - 1}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`relative w-20 h-20 flex-shrink-0 overflow-hidden border-2 transition-colors ${
                        i === imgIdx ? 'border-lams-dark' : 'border-transparent'
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="lg:pt-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`text-[10px] tracking-[0.3em] px-3 py-1 ${
                    product.category === 'VINTAGE' ? 'bg-amber-50 text-amber-800'
                    : product.category === 'STOCKS' ? 'bg-stone-100 text-stone-700'
                    : 'bg-lams-dark text-lams-cream'
                  }`}>
                    {categoryLabel.toUpperCase()}
                  </span>
                </div>
                <button onClick={handleWishlist} className="p-2 hover:scale-110 transition-transform">
                  <Heart
                    size={22}
                    className={wished ? 'fill-lams-dark text-lams-dark' : 'text-lams-lightgray'}
                  />
                </button>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-lams-dark font-light mb-3">
                {product.name}
              </h1>

              <p className="text-2xl font-semibold text-lams-dark mb-6">
                {formatPrice(product.price)}
              </p>

              <p className="text-sm text-lams-gray leading-relaxed mb-8">{product.description}</p>

              {/* Stock */}
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${product.stock > 5 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
                <span className="text-sm text-lams-gray">
                  {product.stock === 0 ? 'Épuisé' : product.stock <= 5 ? `Plus que ${product.stock} en stock` : 'En stock'}
                </span>
              </div>

              {/* Colors */}
              {colors.length > 0 && (
                <div className="mb-6">
                  <p className="text-[11px] tracking-widest text-lams-gray mb-2">
                    COULEUR{selectedColor ? ` — ${selectedColor}` : ''}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((color, idx) => (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color)
                          // Switch to the image corresponding to this color index
                          if (images[idx] !== undefined) setImgIdx(idx)
                        }}
                        title={color}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === color ? 'border-lams-dark scale-110' : 'border-lams-border'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {sizes.length > 0 && (
                <div className="mb-6">
                  <p className="text-[11px] tracking-widest text-lams-gray mb-2">TAILLE</p>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[40px] h-10 px-3 border text-sm transition-colors ${
                          selectedSize === size
                            ? 'bg-lams-dark text-lams-cream border-lams-dark'
                            : 'border-lams-border text-lams-gray hover:border-lams-dark hover:text-lams-dark'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <p className="text-[11px] tracking-widest text-lams-gray mb-2">QUANTITÉ</p>
                <div className="flex items-center border border-lams-border w-fit">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-lams-gray hover:text-lams-dark hover:bg-lams-cream transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="w-10 h-10 flex items-center justify-center text-lams-gray hover:text-lams-dark hover:bg-lams-cream transition-colors disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="btn-dark flex-1 flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} />
                  {product.stock === 0 ? 'ÉPUISÉ' : 'AJOUTER AU PANIER'}
                </button>
              </div>

              {product.sold > 0 && (
                <p className="text-[11px] text-lams-gray mt-4 text-center">{product.sold} article(s) déjà vendus</p>
              )}

              <div className="mt-8 pt-8 border-t border-lams-border space-y-3">
                <p className="text-[11px] tracking-widest text-lams-gray">PAIEMENT SÉCURISÉ</p>
                <div className="flex gap-4">
                  <span className="text-[11px] text-lams-gray border border-lams-border px-3 py-1">MOOV MONEY</span>
                  <span className="text-[11px] text-lams-gray border border-lams-border px-3 py-1">YAS PAY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Zoom overlay */}
      {zoomed && images[imgIdx] && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] aspect-[4/5]">
            <Image src={images[imgIdx]} alt={product.name} fill className="object-contain" />
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
