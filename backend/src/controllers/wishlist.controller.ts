import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { sendResponse } from '../utils/helpers'

// @route GET /api/wishlist
export const getWishlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          select: {
            id: true, title: true, slug: true,
            price: true, mrp: true, discount: true,
            images: true, avgRating: true,
            totalReviews: true, stock: true,
            isAssured: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    sendResponse(res, 200, true, 'Wishlist fetched', wishlist)
  } catch (err) {
    next(err)
  }
}

// @route POST /api/wishlist/add
export const addToWishlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.body
    if (!productId) throw new AppError('Product ID required', 400)

    const product = await prisma.product.findUnique({
      where: { id: productId }
    })
    if (!product) throw new AppError('Product not found', 404)

    const wishlist = await prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId: req.user!.id,
          productId
        }
      },
      update: {},
      create: {
        userId: req.user!.id,
        productId
      }
    })

    sendResponse(res, 201, true, 'Added to wishlist', wishlist)
  } catch (err) {
    next(err)
  }
}

// @route DELETE /api/wishlist/remove/:productId
export const removeFromWishlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.wishlist.deleteMany({
      where: {
        userId: req.user!.id,
        productId: req.params.productId
      }
    })
    sendResponse(res, 200, true, 'Removed from wishlist')
  } catch (err) {
    next(err)
  }
}

// @route GET /api/wishlist/check/:productId
export const checkWishlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: req.user!.id,
          productId: req.params.productId
        }
      }
    })
    sendResponse(res, 200, true, 'Checked', { inWishlist: !!item })
  } catch (err) {
    next(err)
  }
}