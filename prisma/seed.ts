import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPass = await bcrypt.hash('admin123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lams.com' },
    update: {},
    create: {
      uniqueId: 'LMS-ADMIN001',
      name: 'LAMS Admin',
      email: 'admin@lams.com',
      password: adminPass,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created:', admin.email, '/ ID:', admin.uniqueId)

  // Create sample products
  const products = [
    {
      name: 'Veste en Cuir Vintage',
      description: 'Une magnifique veste en cuir d\'époque, authentique des années 80. Patine naturelle et caractère unique.',
      price: 45000,
      category: 'VINTAGE' as const,
      images: JSON.stringify(['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80']),
      colors: JSON.stringify(['#5C3317', '#1A1A1A']),
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      stock: 3,
      featured: true,
    },
    {
      name: 'Chemise Oxford Classique',
      description: 'Chemise Oxford de qualité premium, coupe slim fit. Idéale pour toutes les occasions.',
      price: 18000,
      category: 'STOCKS' as const,
      images: JSON.stringify(['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80']),
      colors: JSON.stringify(['#FFFFFF', '#87CEEB', '#F5F5DC']),
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
      stock: 25,
      featured: false,
    },
    {
      name: 'Robe Bohème LAMS',
      description: 'Création exclusive LAMS. Robe fluide aux motifs élégants, parfaite pour l\'été.',
      price: 32000,
      category: 'LAMS_COLLECTION' as const,
      images: JSON.stringify(['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80']),
      colors: JSON.stringify(['#E8D5B7', '#C4A882']),
      sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
      stock: 8,
      featured: true,
    },
    {
      name: 'Jean Vintage Délavé',
      description: 'Jean authentique des années 90, délavé naturellement. Une pièce collector en excellent état.',
      price: 28000,
      category: 'VINTAGE' as const,
      images: JSON.stringify(['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80']),
      colors: JSON.stringify(['#4169E1', '#87CEEB']),
      sizes: JSON.stringify(['28', '30', '32', '34', '36']),
      stock: 5,
      featured: false,
    },
    {
      name: 'T-shirt Premium LAMS',
      description: 'T-shirt en coton biologique 100%. Design épuré, logo LAMS brodé au cœur.',
      price: 12000,
      category: 'LAMS_COLLECTION' as const,
      images: JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80']),
      colors: JSON.stringify(['#1A1A1A', '#F7F4EF', '#C9A96E']),
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
      stock: 50,
      featured: false,
    },
    {
      name: 'Manteau Cachemire',
      description: 'Manteau en laine et cachemire, coupe ajustée. Élégance intemporelle.',
      price: 89000,
      category: 'STOCKS' as const,
      images: JSON.stringify(['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80']),
      colors: JSON.stringify(['#8B7355', '#1A1A1A', '#F5F5DC']),
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      stock: 4,
      featured: true,
    },
    {
      name: 'Blouson Bomber Vintage',
      description: 'Blouson bomber authentique des années 70. Doublure satin, broderies d\'origine.',
      price: 55000,
      category: 'VINTAGE' as const,
      images: JSON.stringify(['https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&q=80']),
      colors: JSON.stringify(['#2F4F4F', '#1A1A1A']),
      sizes: JSON.stringify(['S', 'M', 'L']),
      stock: 2,
      featured: false,
    },
    {
      name: 'Pantalon Tailleur LAMS',
      description: 'Pantalon tailleur en crêpe de qualité. Coupe droite parfaite, finitions soignées.',
      price: 38000,
      category: 'LAMS_COLLECTION' as const,
      images: JSON.stringify(['https://images.unsplash.com/photo-1560243563-062bfc001d68?w=600&q=80']),
      colors: JSON.stringify(['#1A1A1A', '#F7F4EF', '#8B7355']),
      sizes: JSON.stringify(['34', '36', '38', '40', '42', '44']),
      stock: 15,
      featured: false,
    },
  ]

  for (const p of products) {
    await prisma.product.create({ data: p })
  }
  console.log(`✅ ${products.length} produits créés`)

  // Sample event
  await prisma.event.create({
    data: {
      title: 'Nouvelle Collection LAMS 🌿',
      content: 'Découvrez notre toute nouvelle collection printemps-été. Des pièces exclusives qui allient style et élégance pour sublimer votre quotidien.',
      ctaText: 'Découvrir',
      ctaLink: '/?category=LAMS_COLLECTION',
      active: true,
    },
  })
  console.log('✅ Événement créé')

  console.log('\n🎉 Seed terminé !')
  console.log('Admin: admin@lams.com / admin123456')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
