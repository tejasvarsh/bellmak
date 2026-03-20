import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { sendResponse } from '../utils/helpers'

// @route GET /api/reviews/product/:productId
export const getReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params
    const { rating, sort = 'recent', page = '1', limit = '10' } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    const where: any = { productId }
    if (rating) where.rating = parseInt(rating as string)

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'helpful') orderBy = { helpfulVotes: 'desc' }
    if (sort === 'rating_high') orderBy = { rating: 'desc' }
    if (sort === 'rating_low') orderBy = { rating: 'asc' }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { name: true, avatar: true } }
        }
      }),
      prisma.review.count({ where })
    ])

    // Rating breakdown
    const breakdown = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true }
    })

    sendResponse(res, 200, true, 'Reviews fetched', {
      reviews,
      breakdown
    }, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (err) {
    next(err)
  }
}

// @route POST /api/reviews
export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, rating, title, body, images } = req.body

    if (!productId || !rating) {
      throw new AppError('Product ID and rating required', 400)
    }
    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400)
    }

    // Check if already reviewed
    const existing = await prisma.review.findFirst({
      where: { productId, userId: req.user!.id }
    })
    if (existing) throw new AppError('You already reviewed this product', 409)

    // Check if purchased
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: req.user!.id,
          status: 'DELIVERED'
        }
      }
    })

    const review = await prisma.review.create({
      data: {
        productId,
        userId: req.user!.id,
        rating,
        title,
        body,
        images: images || [],
        isVerifiedPurchase: !!purchased
      },
      include: {
        user: { select: { name: true, avatar: true } }
      }
    })

    // Update product average rating
    const allReviews = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true }
    })

    await prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: allReviews._avg.rating || 0,
        totalReviews: allReviews._count.rating
      }
    })

    sendResponse(res, 201, true, 'Review submitted', review)
  } catch (err) {
    next(err)
  }
}

// @route PUT /api/reviews/:id
export const updateReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const review = await prisma.review.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    })
    if (!review) throw new AppError('Review not found', 404)

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        rating: req.body.rating,
        title: req.body.title,
        body: req.body.body
      }
    })

    sendResponse(res, 200, true, 'Review updated', updated)
  } catch (err) {
    next(err)
  }
}

// @route DELETE /api/reviews/:id
export const deleteReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const review = await prisma.review.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.user!.id },
          { user: { role: 'ADMIN' } }
        ]
      }
    })
    if (!review) throw new AppError('Review not found', 404)

    await prisma.review.delete({ where: { id: req.params.id } })
    sendResponse(res, 200, true, 'Review deleted')
  } catch (err) {
    next(err)
  }
}

// @route POST /api/reviews/:id/helpful
export const markHelpful = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { helpfulVotes: { increment: 1 } }
    })
    sendResponse(res, 200, true, 'Marked as helpful', review)
  } catch (err) {
    next(err)
  }
}