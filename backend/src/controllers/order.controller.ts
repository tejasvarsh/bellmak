import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import {
  generateOrderId,
  calculateDeliveryCharge,
  getExpectedDelivery,
  sendResponse
} from '../utils/helpers'

// ─────────────────────────────────────────────────────────────
// @route POST /api/orders
// ─────────────────────────────────────────────────────────────
export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      couponCode,
      coinsUsed = 0
    } = req.body

    if (!items || items.length === 0) {
      throw new AppError('No items in order', 400)
    }

    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })
      if (!product) throw new AppError(`Product not found: ${item.productId}`, 404)
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for: ${product.title}`, 400)
      }

      subtotal += product.price * item.quantity
      orderItems.push({
        productId: product.id,
        title: product.title,
        image: product.images[0] || '',
        quantity: item.quantity,
        price: product.price,
        mrp: product.mrp,
        variant: item.variant || null,
        sellerId: product.sellerId
      })
    }

    let discount = 0
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
      if (coupon && subtotal >= coupon.minOrderValue) {
        discount = coupon.discountType === 'PERCENT'
          ? (subtotal * coupon.discountValue) / 100
          : coupon.discountValue
      }
    }

    const coinsDiscount = coinsUsed * 0.25
    const deliveryCharge = calculateDeliveryCharge(subtotal - discount)
    const totalAmount = subtotal - discount - coinsDiscount + deliveryCharge

    const order = await prisma.order.create({
      data: {
        orderId: generateOrderId(),
        userId: req.user!.id,
        subtotal,
        discount,
        deliveryCharge,
        coinsDiscount,
        coinsUsed,
        totalAmount,
        couponCode: couponCode || null,
        paymentMethod,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        shippingAddress,
        expectedDelivery: getExpectedDelivery(shippingAddress.city),
        items: {
          create: orderItems
        }
      },
      include: { items: true }
    })

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      })
    }

    if (coinsUsed > 0) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { bellmakCoins: { decrement: coinsUsed } }
      })
    }

    sendResponse(res, 201, true, 'Order created successfully', order)
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// @route GET /api/orders
// ─────────────────────────────────────────────────────────────
export const getOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page = '1', limit = '10' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    const where: any = { userId: req.user!.id }
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          items: {
            include: {
              product: {
                select: { title: true, images: true, slug: true }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ])

    sendResponse(res, 200, true, 'Orders fetched', orders, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// @route GET /api/orders/:orderId
// ─────────────────────────────────────────────────────────────
export const getOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        orderId: req.params.orderId,
        userId: req.user!.id
      },
      include: {
        items: {
          include: {
            product: { select: { title: true, images: true, slug: true } }
          }
        }
      }
    })
    if (!order) throw new AppError('Order not found', 404)
    sendResponse(res, 200, true, 'Order fetched', order)
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// @route POST /api/orders/:orderId/cancel
// ─────────────────────────────────────────────────────────────
export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await prisma.order.findFirst({
      where: { orderId: req.params.orderId, userId: req.user!.id }
    })
    if (!order) throw new AppError('Order not found', 404)
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400)
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', cancelReason: req.body.reason }
    })

    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id }
    })
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      })
    }

    sendResponse(res, 200, true, 'Order cancelled')
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// @route POST /api/orders/:orderId/return
// ─────────────────────────────────────────────────────────────
export const returnOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await prisma.order.findFirst({
      where: { orderId: req.params.orderId, userId: req.user!.id }
    })
    if (!order) throw new AppError('Order not found', 404)
    if (order.status !== 'DELIVERED') {
      throw new AppError('Only delivered orders can be returned', 400)
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'RETURN_REQUESTED',
        returnReason: req.body.reason
      }
    })
    sendResponse(res, 200, true, 'Return request submitted')
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// @route GET /api/orders/:orderId/track
// ─────────────────────────────────────────────────────────────
export const trackOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await prisma.order.findFirst({
      where: { orderId: req.params.orderId, userId: req.user!.id },
      select: {
        orderId: true,
        status: true,
        trackingId: true,
        deliveryPartner: true,
        expectedDelivery: true,
        createdAt: true,
        updatedAt: true
      }
    })
    if (!order) throw new AppError('Order not found', 404)

    const allStatuses = [
      'PENDING', 'CONFIRMED', 'PROCESSING',
      'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'
    ]
    const currentIndex = allStatuses.indexOf(order.status)

    const timeline = allStatuses.map((status, index) => ({
      status,
      completed: index <= currentIndex,
      current: index === currentIndex
    }))

    sendResponse(res, 200, true, 'Tracking info', { order, timeline })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// @route POST /api/orders/:orderId/confirm-delivery
// Customer confirms: "Mujhe order mil gaya"
// ─────────────────────────────────────────────────────────────
export const confirmDelivery = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await prisma.order.findFirst({
      where: { orderId: req.params.orderId, userId: req.user!.id }
    })
    if (!order) throw new AppError('Order not found', 404)
    if (!['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status)) {
      throw new AppError('Order is not in a deliverable state', 400)
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'DELIVERED',
        // COD order: payment abhi confirm karna baaki hai
        // Non-COD order: payment already ho chuki thi
        paymentStatus: order.paymentMethod === 'COD'
          ? 'COD_PENDING_CONFIRMATION'
          : 'PAID',
        deliveredAt: new Date()
      }
    })

    sendResponse(res, 200, true, 'Delivery confirmed successfully! 🎉')
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// @route POST /api/orders/:orderId/confirm-cod-payment
// Customer confirms: "Maine cash de diya delivery boy ko"
// ─────────────────────────────────────────────────────────────
export const confirmCODPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await prisma.order.findFirst({
      where: { orderId: req.params.orderId, userId: req.user!.id }
    })
    if (!order) throw new AppError('Order not found', 404)
    if (order.paymentMethod !== 'COD') {
      throw new AppError('This is not a COD order', 400)
    }
    if (order.status !== 'DELIVERED') {
      throw new AppError('Order must be delivered first', 400)
    }
    if (order.paymentStatus !== 'COD_PENDING_CONFIRMATION') {
      throw new AppError('Payment already confirmed', 400)
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'COD_PAID_BY_CUSTOMER'
      }
    })

    sendResponse(res, 200, true, 'COD payment confirmed! Seller will verify. ✅')
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// @route POST /api/seller/orders/:orderId/confirm-cod-received
// Seller confirms: "Mujhe cash mil gaya"
// ─────────────────────────────────────────────────────────────
export const sellerConfirmCODReceived = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await prisma.order.findFirst({
      where: { orderId: req.params.orderId },
      include: { items: true }
    })
    if (!order) throw new AppError('Order not found', 404)

    const seller = await prisma.seller.findUnique({
      where: { userId: req.user!.id }
    })
    if (!seller) throw new AppError('Seller not found', 404)

    const sellerOwnsItem = order.items.some(
      (item: any) => item.sellerId === seller.id
    )
    if (!sellerOwnsItem) throw new AppError('Unauthorized', 403)

    if (order.paymentStatus !== 'COD_PAID_BY_CUSTOMER') {
      throw new AppError('Customer ne abhi payment confirm nahi ki', 400)
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PAID' }
    })

    sendResponse(res, 200, true, 'COD payment received confirmed! Order complete. ✅')
  } catch (err) {
    next(err)
  }
}