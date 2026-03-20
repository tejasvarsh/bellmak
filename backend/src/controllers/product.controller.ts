import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { generateSlug, sendResponse } from '../utils/helpers'

// @route GET /api/products
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      category, brand, minPrice, maxPrice,
      rating, sort = 'createdAt', page = '1', limit = '20', inStock
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: any = { isActive: true }

    if (category) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ slug: category as string }, { name: { equals: category as string, mode: 'insensitive' } }] }
      })
      if (cat) where.categoryId = cat.id
    }
    if (brand) where.brand = { contains: brand as string, mode: 'insensitive' }
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice as string)
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string)
    }
    if (rating) where.avgRating = { gte: parseFloat(rating as string) }
    if (inStock === 'true') where.stock = { gt: 0 }

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price_asc') orderBy = { price: 'asc' }
    else if (sort === 'price_desc') orderBy = { price: 'desc' }
    else if (sort === 'rating') orderBy = { avgRating: 'desc' }
    else if (sort === 'popular') orderBy = { totalSales: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy, skip, take: limitNum,
        include: {
          category: { select: { name: true, slug: true } },
          seller: { select: { businessName: true } }
        }
      }),
      prisma.product.count({ where })
    ])

    sendResponse(res, 200, true, 'Products fetched', products, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (err) {
    next(err)
  }
}

// @route GET /api/products/search
export const searchProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, page = '1', limit = '20' } = req.query
    if (!q) throw new AppError('Search query required', 400)

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: q as string, mode: 'insensitive' } },
            { description: { contains: q as string, mode: 'insensitive' } },
            { brand: { contains: q as string, mode: 'insensitive' } },
          ]
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: { category: { select: { name: true, slug: true } } }
      }),
      prisma.product.count({
        where: {
          isActive: true,
          OR: [
            { title: { contains: q as string, mode: 'insensitive' } },
            { brand: { contains: q as string, mode: 'insensitive' } }
          ]
        }
      })
    ])

    sendResponse(res, 200, true, 'Search results', products, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (err) {
    next(err)
  }
}

// @route GET /api/products/featured
export const getFeaturedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Pehle featured products try karo
    let products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 12,
      include: { category: { select: { name: true } } }
    })

    // Agar featured nahi hain toh latest products lo
    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: { isActive: true },
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { name: true } } }
      })
    }

    sendResponse(res, 200, true, 'Featured products', products)
  } catch (err) {
    next(err)
  }
}

// @route GET /api/products/deals
export const getDeals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let products = await prisma.product.findMany({
      where: { isActive: true, discount: { gte: 20 } },
      orderBy: { discount: 'desc' },
      take: 12
    })

    // Agar deals nahi hain toh sabhi products lo
    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: { isActive: true },
        take: 12,
        orderBy: { createdAt: 'desc' }
      })
    }

    sendResponse(res, 200, true, 'Deals fetched', products)
  } catch (err) {
    next(err)
  }
}

// @route GET /api/products/trending
export const getTrending = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { totalSales: 'desc' },
      take: 12
    })

    // Agar trending nahi hain toh latest lo
    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: { isActive: true },
        take: 12,
        orderBy: { createdAt: 'desc' }
      })
    }

    sendResponse(res, 200, true, 'Trending products', products)
  } catch (err) {
    next(err)
  }
}

// @route GET /api/products/:slug
export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug as string },
      include: {
        category: true,
        seller: {
          include: {
            user: { select: { name: true, avatar: true } }
          }
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, avatar: true } }
          }
        }
      }
    })

    if (!product) throw new AppError('Product not found', 404)
    sendResponse(res, 200, true, 'Product fetched', product)
  } catch (err) {
    next(err)
  }
}

// @route POST /api/products
export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await prisma.seller.findUnique({ where: { userId: req.user!.id } })
    if (!seller) throw new AppError('Seller not found', 403)

    const { title, description, price, mrp, stock, images, categoryId, brand, tags, specifications, variants, weight } = req.body

    const discount = Math.round(((mrp - price) / mrp) * 100)
    const slug = generateSlug(title) + '-' + Date.now()

    const product = await prisma.product.create({
      data: {
        title, description, price, mrp, discount,
        stock, images: images || [], categoryId,
        brand, tags: tags || [], specifications,
        variants, weight, slug,
        sellerId: seller.id,
        isActive: true,
        isApproved: true
      }
    })

    sendResponse(res, 201, true, 'Product created successfully', product)
  } catch (err) {
    next(err)
  }
}

// @route PUT /api/products/:id
export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await prisma.seller.findUnique({ where: { userId: req.user!.id } })

    const product = await prisma.product.findFirst({
      where: { id: req.params.id as string, sellerId: seller?.id }
    })
    if (!product) throw new AppError('Product not found', 404)

    const updated = await prisma.product.update({
      where: { id: req.params.id as string },
      data: req.body
    })

    sendResponse(res, 200, true, 'Product updated', updated)
  } catch (err) {
    next(err)
  }
}

// @route DELETE /api/products/:id
export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id as string },
      data: { isActive: false }
    })
    sendResponse(res, 200, true, 'Product deleted')
  } catch (err) {
    next(err)
  }
}