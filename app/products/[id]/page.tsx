import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { parseImages } from '@/lib/utils'
import ProductClient from '@/components/shop/ProductClient'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lams-boutique.com'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product) return { title: 'Produit introuvable' }

  const images = parseImages(product.images as unknown as string)
  const firstImage = images[0]

  return {
    title: product.name,
    description: product.description || `Découvrez ${product.name} sur LAMS Boutique.`,
    openGraph: {
      title: `${product.name} | LAMS`,
      description: product.description || `Découvrez ${product.name} sur LAMS Boutique.`,
      url: `${siteUrl}/products/${product.id}`,
      images: firstImage ? [{ url: firstImage, width: 800, height: 1000, alt: product.name }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | LAMS`,
      description: product.description || `Découvrez ${product.name} sur LAMS Boutique.`,
      images: firstImage ? [firstImage] : [],
    },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product || !product.active) notFound()

  const images = parseImages(product.images as unknown as string)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Découvrez ${product.name} sur LAMS Boutique.`,
    image: images,
    brand: { '@type': 'Brand', name: 'LAMS' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'XOF',
      availability: (product.stock as number) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/products/${product.id}`,
      seller: { '@type': 'Organization', name: 'LAMS Boutique' },
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductClient product={product as any} />
    </>
  )
}
