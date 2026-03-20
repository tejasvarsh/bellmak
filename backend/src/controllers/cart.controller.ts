import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { sendResponse } from '../utils/helpers'

// @route GET /api/cart
export const getCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id

    // Get user's pending cart items from orders
    // We store cart in a simple JSON approach
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    // For simplicity, cart is stored client-side
    // and synced here. Return empty for now.
    sendResponse(res, 200, true, 'Cart fetched', { items: [], total: 0 })
  } catch (err) {
    next(err)
  }
}

// @route POST /api/cart/add
export const addToCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, quantity = 1 } = req.body
    if (!productId) throw new AppError('Product ID required', 400)

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true, title: true, price: true,
        mrp: true, images: true, stock: true,
        isActive: true
      }
    })

    if (!product) throw new AppError('Product not found', 404)
    if (!product.isActive) throw new AppError('Product not available', 400)
    if (product.stock < quantity) {
      throw new AppError('Insufficient stock', 400)
    }

    sendResponse(res, 200, true, 'Added to cart', {
      product,
      quantity
    })
  } catch (err) {
    next(err)
  }
}

// @route PUT /api/cart/update
export const updateCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, quantity } = req.body
    if (!productId || !quantity) {
      throw new AppError('Product ID and quantity required', 400)
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, title: true }
    })

    if (!product) throw new AppError('Product not found', 404)
    if (product.stock < quantity) {
      throw new AppError(`Only ${product.stock} items available`, 400)
    }

    sendResponse(res, 200, true, 'Cart updated', { productId, quantity })
  } catch (err) {
    next(err)
  }
}

// @route DELETE /api/cart/remove/:productId
export const removeFromCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params
    sendResponse(res, 200, true, 'Item removed from cart', { productId })
  } catch (err) {
    next(err)
  }
}

// @route DELETE /api/cart/clear
export const clearCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    sendResponse(res, 200, true, 'Cart cleared')
  } catch (err) {
    next(err)
  }
}

// @route POST /api/cart/apply-coupon
export const applyCoupon = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, orderAmount } = req.body
    if (!code) throw new AppError('Coupon code required', 400)

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })

    if (!coupon) throw new AppError('Invalid or expired coupon', 400)

    if (orderAmount < coupon.minOrderValue) {
      throw new AppError(
        `Minimum order value ₹${coupon.minOrderValue} required`,
        400
      )
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new AppError('Coupon usage limit reached', 400)
    }

    const discountAmount = coupon.discountType === 'PERCENT'
      ? (orderAmount * coupon.discountValue) / 100
      : coupon.discountValue

    sendResponse(res, 200, true, 'Coupon applied!', {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discountAmount)
    })
  } catch (err) {
    next(err)
  }
}

// @route DELETE /api/cart/remove-coupon
export const removeCoupon = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    sendResponse(res, 200, true, 'Coupon removed')
  } catch (err) {
    next(err)
  }
}