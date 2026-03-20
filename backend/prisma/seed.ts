import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
async function main() {
  console.log('🌱 Seeding BELLMAK database...')

  // ── ADMIN USER ──
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bellmak.com' },
    update: {},
    create: {
      name: 'BELLMAK Admin',
      email: 'admin@bellmak.com',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true
    }
  })
  console.log('✅ Admin created:', admin.email)

  // ── SELLER USER ──
  const sellerPassword = await bcrypt.hash('Seller@123', 12)
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@bellmak.com' },
    update: {},
    create: {
      name: 'Rajesh Kumar',
      email: 'seller@bellmak.com',
      password: sellerPassword,
      role: 'SELLER',
      isVerified: true
    }
  })

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      businessName: 'Rajesh Electronics',
      gstin: '27AAPFU0939F1ZV',
      panNumber: 'AAPFU0939F',
      commissionRate: 10,
      isApproved: true,
      kycStatus: 'APPROVED'
    }
  })
  console.log('✅ Seller created:', sellerUser.email)

  // ── CUSTOMER USER ──
  const customerPassword = await bcrypt.hash('Customer@123', 12)
  await prisma.user.upsert({
    where: { email: 'customer@bellmak.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'customer@bellmak.com',
      password: customerPassword,
      role: 'CUSTOMER',
      isVerified: true,
      bellmakCoins: 500
    }
  })
  console.log('✅ Customer created')

  // ── CATEGORIES ──
  const categories = [
    { name: 'Electronics', slug: 'electronics', icon: '📱', sortOrder: 1 },
    { name: 'Fashion', slug: 'fashion', icon: '👗', sortOrder: 2 },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: '🏠', sortOrder: 3 },
    { name: 'Beauty', slug: 'beauty', icon: '💄', sortOrder: 4 },
    { name: 'Sports', slug: 'sports', icon: '⚽', sortOrder: 5 },
    { name: 'Books', slug: 'books', icon: '📚', sortOrder: 6 },
    { name: 'Toys', slug: 'toys', icon: '🧸', sortOrder: 7 },
    { name: 'Grocery', slug: 'grocery', icon: '🛒', sortOrder: 8 },
    { name: 'Mobiles', slug: 'mobiles', icon: '📞', sortOrder: 9 },
    { name: 'Appliances', slug: 'appliances', icon: '🔌', sortOrder: 10 },
  ]

  const createdCategories: any = {}
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true, isFeatured: true }
    })
    createdCategories[cat.slug] = created
  }
  console.log('✅ Categories created')

  // ── PRODUCTS ──
  const products = [
    {
      title: 'Samsung Galaxy S23 Ultra 5G',
      slug: 'samsung-galaxy-s23-ultra-5g',
      description: 'Latest Samsung flagship with 200MP camera, S Pen included.',
      price: 89999, mrp: 124999,
      stock: 50, brand: 'Samsung',
      categorySlug: 'mobiles',
      images: ['https://via.placeholder.com/400x400?text=Samsung+S23'],
      tags: ['samsung', 'mobile', '5g', 'smartphone'],
      isAssured: true, isFeatured: true
    },
    {
      title: 'Apple iPhone 15 Pro Max 256GB',
      slug: 'apple-iphone-15-pro-max-256gb',
      description: 'Apple iPhone 15 Pro Max with A17 Pro chip and titanium design.',
      price: 134900, mrp: 159900,
      stock: 30, brand: 'Apple',
      categorySlug: 'mobiles',
      images: ['https://via.placeholder.com/400x400?text=iPhone+15'],
      tags: ['apple', 'iphone', 'ios', 'smartphone'],
      isAssured: true, isFeatured: true
    },
    {
      title: 'Sony WH-1000XM5 Wireless Headphones',
      slug: 'sony-wh-1000xm5-wireless-headphones',
      description: 'Industry leading noise cancelling headphones with 30hr battery.',
      price: 24990, mrp: 34990,
      stock: 100, brand: 'Sony',
      categorySlug: 'electronics',
      images: ['https://via.placeholder.com/400x400?text=Sony+WH1000XM5'],
      tags: ['sony', 'headphones', 'wireless', 'noise-cancelling'],
      isAssured: true, isFeatured: true
    },
    {
      title: 'Nike Air Max 270 Running Shoes',
      slug: 'nike-air-max-270-running-shoes',
      description: 'Comfortable running shoes with Air Max cushioning technology.',
      price: 8995, mrp: 12995,
      stock: 200, brand: 'Nike',
      categorySlug: 'sports',
      images: ['https://via.placeholder.com/400x400?text=Nike+Air+Max'],
      tags: ['nike', 'shoes', 'running', 'sports'],
      isFeatured: true
    },
    {
      title: 'LG 55 inch 4K Smart TV',
      slug: 'lg-55-inch-4k-smart-tv',
      description: '55 inch UHD 4K Smart TV with ThinQ AI and WebOS.',
      price: 49990, mrp: 79990,
      stock: 25, brand: 'LG',
      categorySlug: 'electronics',
      images: ['https://via.placeholder.com/400x400?text=LG+4K+TV'],
      tags: ['lg', 'tv', '4k', 'smart-tv'],
      isAssured: true, isFeatured: true
    },
    {
      title: 'Prestige Iris 750W Mixer Grinder',
      slug: 'prestige-iris-750w-mixer-grinder',
      description: '3 stainless steel jars, 750W motor, 5 year warranty.',
      price: 2499, mrp: 4500,
      stock: 150, brand: 'Prestige',
      categorySlug: 'appliances',
      images: ['https://via.placeholder.com/400x400?text=Prestige+Mixer'],
      tags: ['prestige', 'mixer', 'grinder', 'kitchen'],
      isFeatured: true
    },
    {
      title: 'Lakme Absolute Skin Natural Mousse',
      slug: 'lakme-absolute-skin-natural-mousse',
      description: 'Lightweight foundation mousse for natural finish, SPF 8.',
      price: 699, mrp: 950,
      stock: 500, brand: 'Lakme',
      categorySlug: 'beauty',
      images: ['https://via.placeholder.com/400x400?text=Lakme+Foundation'],
      tags: ['lakme', 'foundation', 'beauty', 'makeup']
    },
    {
      title: 'Harry Potter Complete Book Series',
      slug: 'harry-potter-complete-book-series',
      description: 'All 7 books of Harry Potter series by J.K. Rowling.',
      price: 2499, mrp: 3999,
      stock: 75, brand: 'Bloomsbury',
      categorySlug: 'books',
      images: ['https://via.placeholder.com/400x400?text=Harry+Potter'],
      tags: ['books', 'harry-potter', 'fiction', 'jkrowling'],
      isFeatured: true
    },
    {
      title: 'Adidas Ultraboost 22 Running Shoes',
      slug: 'adidas-ultraboost-22-running-shoes',
      description: 'Premium running shoes with BOOST midsole technology.',
      price: 12999, mrp: 17999,
      stock: 80, brand: 'Adidas',
      categorySlug: 'sports',
      images: ['https://via.placeholder.com/400x400?text=Adidas+Ultraboost'],
      tags: ['adidas', 'shoes', 'running', 'boost']
    },
    {
      title: 'LEGO Technic Ferrari Daytona SP3',
      slug: 'lego-technic-ferrari-daytona-sp3',
      description: '3778 pieces LEGO Technic set for ages 18+.',
      price: 15999, mrp: 21999,
      stock: 40, brand: 'LEGO',
      categorySlug: 'toys',
      images: ['https://via.placeholder.com/400x400?text=LEGO+Ferrari'],
      tags: ['lego', 'technic', 'ferrari', 'toys'],
      isFeatured: true
    }
  ]

  for (const p of products) {
    const { categorySlug, ...productData } = p
    const category = createdCategories[categorySlug]

    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        discount: Math.round(
          ((productData.mrp - productData.price) / productData.mrp) * 100
        ),
        categoryId: category.id,
        sellerId: seller.id,
        isActive: true,
        isApproved: true,
        avgRating: 4.0 + Math.random() * 0.9,
        totalReviews: Math.floor(Math.random() * 500) + 50
      }
    })
  }
  console.log('✅ Products created')

  // ── BANNERS ──
  const banners = [
    {
      title: 'Big Sale - Up to 80% Off',
      image: 'https://via.placeholder.com/1200x400?text=BELLMAK+Big+Sale',
      link: '/products?discount=50',
      sortOrder: 1
    },
    {
      title: 'New Arrivals in Electronics',
      image: 'https://via.placeholder.com/1200x400?text=New+Electronics',
      link: '/category/electronics',
      sortOrder: 2
    },
    {
      title: 'Fashion Week Deals',
      image: 'https://via.placeholder.com/1200x400?text=Fashion+Week',
      link: '/category/fashion',
      sortOrder: 3
    }
  ]

  for (const banner of banners) {
    await prisma.banner.create({ data: { ...banner, isActive: true } })
  }
  console.log('✅ Banners created')

  // ── COUPONS ──
  const coupons = [
    {
      code: 'BELLMAK10',
      discountType: 'PERCENT',
      discountValue: 10,
      minOrderValue: 500,
      maxUses: 1000,
      isActive: true
    },
    {
      code: 'SAVE200',
      discountType: 'FIXED',
      discountValue: 200,
      minOrderValue: 1000,
      maxUses: 500,
      isActive: true
    },
    {
      code: 'FREESHIP',
      discountType: 'FIXED',
      discountValue: 40,
      minOrderValue: 0,
      maxUses: 2000,
      isActive: true
    }
  ]

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon
    })
  }
  console.log('✅ Coupons created')

  console.log(`
  ╔════════════════════════════════════╗
  ║   ✅ BELLMAK Database Seeded!      ║
  ╠════════════════════════════════════╣
  ║  Admin:    admin@bellmak.com       ║
  ║  Password: Admin@123               ║
  ║  Seller:   seller@bellmak.com      ║
  ║  Password: Seller@123              ║
  ║  Customer: customer@bellmak.com    ║
  ║  Password: Customer@123            ║
  ╚════════════════════════════════════╝
  `)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())