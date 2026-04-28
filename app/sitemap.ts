import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lams-boutique.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, updatedAt: true },
  })

  return [
    { url: siteUrl,                                lastModified: new Date(), changeFrequency: 'daily'  as const, priority: 1.0 },
    { url: `${siteUrl}/login`,                     lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${siteUrl}/register`,                  lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.4 },
    ...products.map(p => ({
      url: `${siteUrl}/products/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
