import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { sendResponse } from '../utils/helpers'

const getOrCreateSeller = async (userId: string) => {
  let seller = await prisma.seller.findUnique({ where: { userId } })
  if (!seller) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    seller = await prisma.seller.create({
      data: {
        userId,
        businessName: user!.name + "'s Store",
        kycStatus: 'APPROVED',
        isApproved: true
      }
    })
  }
  return seller
}

export const registerSeller = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.seller.findUnique({ where: { userId: req.user!.id } })
    if (existing) throw new AppError('Already registered as seller', 409)

    const { businessName, gstin, panNumber, bankAccount } = req.body
    if (!businessName) throw new AppError('Business name required', 400)

    const seller = await prisma.seller.create({
      data: {
        userId: req.user!.id,
        businessName, gstin, panNumber, bankAccount,
        kycStatus: 'APPROVED', isApproved: true
      }
    })

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { role: 'SELLER' }
    })

    sendResponse(res, 201, true, 'Seller registered successfully', seller)
  } catch (err) { next(err) }
}

export const getSellerDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await getOrCreateSeller(req.user!.id)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalProducts, todayOrders, totalOrders, pendingOrders, lowStockProducts, codPendingCount] = await Promise.all([
      prisma.product.count({ where: { sellerId: seller.id } }),
      prisma.orderItem.count({ where: { sellerId: seller.id, order: { createdAt: { gte: today } } } }),
      prisma.orderItem.count({ where: { sellerId: seller.id } }),
      prisma.orderItem.count({ where: { sellerId: seller.id, order: { status: 'CONFIRMED' } } }),
      prisma.product.count({ where: { sellerId: seller.id, stock: { lte: 5 }, isActive: true } }),
      prisma.order.count({
        where: {
          items: { some: { sellerId: seller.id } },
          paymentStatus: 'COD_PAID_BY_CUSTOMER'
        }
      })
    ])

    const revenueData = await prisma.orderItem.aggregate({
      where: { sellerId: seller.id, order: { paymentStatus: 'PAID' } },
      _sum: { price: true },
      _count: { id: true }
    })

    const totalRevenue = (revenueData._sum.price || 0) * (1 - seller.commissionRate / 100)

    const recentOrders = await prisma.orderItem.findMany({
      where: { sellerId: seller.id },
      take: 5,
      include: {
        order: {
          select: {
            orderId: true, status: true, createdAt: true,
            paymentMethod: true, paymentStatus: true,
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { order: { createdAt: 'desc' } }
    })

    sendResponse(res, 200, true, 'Dashboard data', {
      stats: {
        totalProducts, todayOrders, totalOrders,
        pendingOrders, lowStockProducts,
        totalRevenue: Math.round(totalRevenue),
        avgRating: seller.sellerRating,
        codPendingCount
      },
      recentOrders: recentOrders.map(item => ({
        id: item.id,
        orderId: item.order.orderId,
        customerName: item.order.user.name,
        amount: item.price * item.quantity,
        status: item.order.status,
        paymentMethod: item.order.paymentMethod,
        paymentStatus: item.order.paymentStatus,
        createdAt: item.order.createdAt
      }))
    })
  } catch (err) { next(err) }
}

export const getSellerProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await getOrCreateSeller(req.user!.id)
    const { page = '1', limit = '20', status } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    const where: any = { sellerId: seller.id }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    sendResponse(res, 200, true, 'Products fetched', products, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (err) { next(err) }
}

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await getOrCreateSeller(req.user!.id)
    const { title, description, price, mrp, stock, brand, category, images, specifications, isAssured } = req.body

    if (!title || !price || !mrp || !stock || !category) {
      throw new AppError('Title, price, mrp, stock and category are required', 400)
    }

    let categoryRecord = await prisma.category.findFirst({
      where: { name: { equals: category, mode: 'insensitive' } }
    })
    if (!categoryRecord) {
      categoryRecord = await prisma.category.create({
        data: {
          name: category,
          slug: category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
        }
      })
    }

    const discount = Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now()

    const product = await prisma.product.create({
      data: {
        title, slug,
        description: description || '',
        price: Number(price),
        mrp: Number(mrp),
        discount,
        stock: Number(stock),
        brand: brand || '',
        images: images || [],
        specifications: specifications || {},
        isAssured: isAssured || false,
        isActive: true,
        isApproved: true,
        sellerId: seller.id,
        categoryId: categoryRecord.id
      }
    })

    sendResponse(res, 201, true, 'Product created successfully', product)
  } catch (err) { next(err) }
}

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await getOrCreateSeller(req.user!.id)
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, sellerId: seller.id }
    })
    if (!product) throw new AppError('Product not found', 404)

    const { title, description, price, mrp, stock, brand, images, specifications, isAssured, isActive } = req.body
    const discount = price && mrp
      ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)
      : product.discount

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        title: title || product.title,
        description: description || product.description,
        price: price ? Number(price) : product.price,
        mrp: mrp ? Number(mrp) : product.mrp,
        discount,
        stock: stock !== undefined ? Number(stock) : product.stock,
        brand: brand || product.brand,
        images: images || product.images,
        specifications: specifications || product.specifications,
        isAssured: isAssured !== undefined ? isAssured : product.isAssured,
        isActive: isActive !== undefined ? isActive : product.isActive,
        isApproved: true,
      }
    })

    sendResponse(res, 200, true, 'Product updated successfully', updated)
  } catch (err) { next(err) }
}

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await getOrCreateSeller(req.user!.id)
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, sellerId: seller.id }
    })
    if (!product) throw new AppError('Product not found', 404)

    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false }
    })
    sendResponse(res, 200, true, 'Product deleted successfully')
  } catch (err) { next(err) }
}

export const getSellerOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await getOrCreateSeller(req.user!.id)
    const { status, page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    const orderItems = await prisma.orderItem.findMany({
      where: { sellerId: seller.id },
      select: { orderId: true },
      distinct: ['orderId']
    })
    const orderIds = orderItems.map((oi: any) => oi.orderId)

    const where: any = { id: { in: orderIds } }
    if (status && status !== 'ALL') where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          items: {
            where: { sellerId: seller.id },
            include: { product: { select: { title: true, images: true } } }
          }
        }
      }),
      prisma.order.count({ where })
    ])

    const formatted = orders.map((o: any) => ({
      id: o.id,
      orderId: o.orderId,
      customerName: o.user?.name || 'Customer',
      customerPhone: o.user?.phone || '',
      amount: o.totalAmount,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      trackingId: o.trackingId || '',
      deliveryPartner: o.deliveryPartner || '',
      createdAt: o.createdAt,
      city: (o.shippingAddress as any)?.city || '',
      state: (o.shippingAddress as any)?.state || '',
      shippingAddress: o.shippingAddress,
      items: o.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      }))
    }))

    sendResponse(res, 200, true, 'Seller orders fetched', formatted, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (err) { next(err) }
}

export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, trackingId, deliveryPartner } = req.body
    const seller = await getOrCreateSeller(req.user!.id)

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    })
    if (!order) throw new AppError('Order not found', 404)

    const sellerOwnsItem = order.items.some((item: any) => item.sellerId === seller.id)
    if (!sellerOwnsItem) throw new AppError('Unauthorized', 403)

    const validNext: Record<string, string[]> = {
      PENDING:          ['CONFIRMED', 'CANCELLED'],
      CONFIRMED:        ['PROCESSING', 'CANCELLED'],
      PROCESSING:       ['SHIPPED', 'CANCELLED'],
      SHIPPED:          ['OUT_FOR_DELIVERY', 'DELIVERED'],
      OUT_FOR_DELIVERY: ['DELIVERED']
    }

    if (!validNext[order.status]?.includes(status)) {
      throw new AppError(`Cannot change from ${order.status} to ${status}`, 400)
    }

    const updateData: any = { status }
    if (trackingId) updateData.trackingId = trackingId
    if (deliveryPartner) updateData.deliveryPartner = deliveryPartner

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
      updateData.paymentStatus = order.paymentMethod === 'COD' ? 'COD_PENDING_CONFIRMATION' : 'PAID'
    }

    if (status === 'CANCELLED') {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        })
      }
    }

    await prisma.order.update({ where: { id: order.id }, data: updateData })
    sendResponse(res, 200, true, `Order updated to ${status}`)
  } catch (err) { next(err) }
}

export const shipOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { trackingId, deliveryPartner } = req.body
    if (!trackingId) throw new AppError('Tracking ID required', 400)

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'SHIPPED', trackingId, deliveryPartner: deliveryPartner || 'Standard' }
    })
    sendResponse(res, 200, true, 'Order marked as shipped', order)
  } catch (err) { next(err) }
}

export const confirmCODReceived = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await getOrCreateSeller(req.user!.id)

    const order = await prisma.order.findFirst({
      where: { orderId: req.params.orderId },
      include: { items: true }
    })
    if (!order) throw new AppError('Order not found', 404)

    const sellerOwnsItem = order.items.some((item: any) => item.sellerId === seller.id)
    if (!sellerOwnsItem) throw new AppError('Unauthorized', 403)

    if (order.paymentMethod !== 'COD') throw new AppError('Yeh COD order nahi hai', 400)
    if (order.paymentStatus !== 'COD_PAID_BY_CUSTOMER') {
      throw new AppError('Customer ne abhi payment confirm nahi ki hai', 400)
    }

    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'PAID' } })
    sendResponse(res, 200, true, 'COD payment confirmed!')
  } catch (err) { next(err) }
}

export const getSellerPayments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await getOrCreateSeller(req.user!.id)

    const payments = await prisma.orderItem.findMany({
      where: { sellerId: seller.id, order: { paymentStatus: 'PAID' } },
      include: { order: { select: { orderId: true, createdAt: true, paymentMethod: true } } },
      orderBy: { order: { createdAt: 'desc' } }
    })

    const totalEarnings = payments.reduce((sum, item) => {
      return sum + item.price * item.quantity * (1 - seller.commissionRate / 100)
    }, 0)

    sendResponse(res, 200, true, 'Payments fetched', {
      payments,
      totalEarnings: Math.round(totalEarnings),
      commissionRate: seller.commissionRate
    })
  } catch (err) { next(err) }
}

export const updateSellerProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await prisma.seller.update({
      where: { userId: req.user!.id },
      data: req.body
    })
    sendResponse(res, 200, true, 'Profile updated', seller)
  } catch (err) { next(err) }
}