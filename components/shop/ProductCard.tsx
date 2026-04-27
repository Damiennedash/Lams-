'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, Eye } from 'lucide-react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cartStore'
import type { Product } from '@/types'
import { formatPrice, getCategoryLabel, parseImages, parseArray } from '@/lib/utils'

interface Props {
  product: Product
  wishlistIds?: string[]
  onWishlistToggle?: (id: string) => void
}

export default function ProductCard({ product, wishlistIds = [], onWishlistToggle }: Props) {
  const { data: session } = useSession()
  const { addItem, openCart } = useCartStore()
  const [isWished, setIsWished] = useState(wishlistIds.includes(product.id))
  const [wishLoading, setWishLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  const images = parseImages(product.images as unknown as string)
  const colors = parseArray(product.colors as unknown as string)
  const categoryLabel = getCategoryLabel(product.category)

  const categoryClass =
    product.category === 'VINTAGE'
      ? 'badge-vintage'
      : product.category === 'STOCKS'
      ? 'badge-stocks'
      : 'badge-lams'

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (product.stock === 0) return
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0] || '',
      quantity: 1,
      color: colors[0],
      stock: product.stock,
    })
    openCart()
    toast.success(`${product.name} ajouté au panier`)
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) { toast.error('Connectez-vous pour ajouter aux favoris'); return }
    setWishLoading(true)
    try {
      const res = await fetch('/api/wishlist', {
        method: isWished ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      if (res.ok) {
        setIsWished(!isWished)
        onWishlistToggle?.(product.id)
        toast.success(isWished ? 'Retiré des favoris' : 'Ajouté aux favoris')
      }
    } finally {
      setWishLoading(false)
    }
  }

  return (
    <div
      className="product-card group relative bg-white overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <Link href={`/products/${product.id}`}>
        <div className="relative overflow-hidden bg-lams-cream aspect-[3/4]">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={product.name}
              fill
              className="product-card-img object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-lams-border">
              <ShoppingBag size={32} className="text-lams-lightgray" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className={`category-badge ${categoryClass}`}>{categoryLabel}</span>
            {product.stock === 0 && (
              <span className="category-badge bg-red-50 text-red-600 border border-red-200">
                Épuisé
              </span>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <span className="category-badge bg-orange-50 text-orange-700 border border-orange-200">
                Plus que {product.stock}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            disabled={wishLoading}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-all duration-200"
          >
            <Heart
              size={15}
              className={isWished ? 'fill-lams-dark text-lams-dark' : 'text-lams-gray'}
            />
          </button>

          {/* Quick actions overlay */}
          <div
            className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-lams-dark/90 transition-all duration-300 ${
              hovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
          >
            <Link
              href={`/products/${product.id}`}
              className="flex items-center gap-2 text-lams-cream text-[11px] tracking-widest hover:text-lams-gold transition-colors"
            >
              <Eye size={13} />
              VOIR
            </Link>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex items-center gap-2 text-lams-cream text-[11px] tracking-widest hover:text-lams-gold transition-colors disabled:opacity-40"
            >
              <ShoppingBag size={13} />
              AJOUTER
            </button>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-medium text-lams-dark hover:text-lams-brown transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {colors.slice(0, 5).map((color) => (
              <div
                key={color}
                className="w-3 h-3 rounded-full border border-lams-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-[10px] text-lams-gray">+{colors.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-semibold text-lams-dark">{formatPrice(product.price)}</span>
          {product.sold > 0 && (
            <span className="text-[10px] text-lams-gray">{product.sold} vendus</span>
          )}
        </div>
      </div>
    </div>
  )
}
