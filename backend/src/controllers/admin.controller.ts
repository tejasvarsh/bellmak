import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { sendResponse } from '../utils/helpers'

// @route GET /api/admin/dashboard
export const getAdminDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalUsers, totalSellers, totalProducts, totalOrders,
      pendingKYC, pendingProducts, todayOrders, deliveredOrders,
      cancelledOrders, pendingOrders
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.seller.count({ where: { isApproved: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.seller.count({ where: { kycStatus: 'SUBMITTED' } }),
      prisma.product.count({ where: { isApproved: false, isActive: true } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
    ])

    const [revenue, todayRevenue] = await Promise.all([
      prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: today } }, _sum: { totalAmount: true } })
    ])

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: { take: 1 }
      }
    })

    sendResponse(res, 200, true, 'Dashboard data', {
      stats: {
        totalUsers, totalSellers, totalProducts,
        totalOrders, pendingKYC, pendingProducts,
        totalRevenue: revenue._sum.totalAmount || 0,
        todayOrders, todayRevenue: todayRevenue._sum.totalAmount || 0,
        deliveredOrders, cancelledOrders, pendingOrders
      },
      recentOrders
    })
  } catch (err) { next(err) }
}

// @route GET /api/admin/users
export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, role, page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    const where: any = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true, name: true, email: true, phone: true,
          role: true, isActive: true, isVerified: true,
          bellmakCoins: true, createdAt: true,
          _count: { select: { orders: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    sendResponse(res, 200, true, 'Users fetched', users, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (err) { next(err) }
}

// @route PATCH /api/admin/users/:id/role
export const changeUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body
    const validRoles = ['CUSTOMER', 'SELLER', 'ADMIN']
    if (!validRoles.includes(role)) throw new AppError('Invalid role', 400)
    if (req.params.id === req.user!.id && role !== 'ADMIN') {
      throw new AppError('Aap apna admin role nahi hata sakte!', 403)
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    })

    if (role === 'SELLER') {
      const existing = await prisma.seller.findUnique({ where: { userId: user.id } })
      if (!existing) {
        await prisma.seller.create({
          data: { userId: user.id, businessName: user.name + "'s Store", kycStatus: 'APPROVED', isApproved: true }
        })
      }
    }

    sendResponse(res, 200, true, `${user.name} ka role ${role} ho gaya!`, user)
  } catch (err) { next(err) }
}

// @route PATCH /api/admin/users/:id/status
export const toggleUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { isActive } = req.body
    if (req.params.id === req.user!.id) throw new AppError('Aap khud ko deactivate nahi kar sakte!', 403)
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: { id: true, name: true, isActive: true }
    })
    sendResponse(res, 200, true, `User ${isActive ? 'activated' : 'deactivated'}`, user)
  } catch (err) { next(err) }
}

// @route PUT /api/admin/users/:id/ban
export const banUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) throw new AppError('User not found', 404)
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive }
    })
    sendResponse(res, 200, true, updated.isActive ? 'User unbanned' : 'User banned', { isActive: updated.isActive })
  } catch (err) { next(err) }
}

// @route PATCH /api/admin/users/:id
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body })
    sendResponse(res, 200, true, 'User updated', user)
  } catch (err) { next(err) }
}

// @route GET /api/admin/sellers
export const getAllSellers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { kycStatus, page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    const where: any = {}
    if (kycStatus) where.kycStatus = kycStatus

    const [sellers, total] = await Promise.all([
      prisma.seller.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          _count: { select: { products: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.seller.count({ where })
    ])

    sendResponse(res, 200, true, 'Sellers fetched', sellers, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (err) { next(err) }
}

// @route PUT /api/admin/sellers/:id/approve
export const approveSeller = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { approved } = req.body
    const seller = await prisma.seller.update({
      where: { id: req.params.id },
      data: { isApproved: approved, kycStatus: approved ? 'APPROVED' : 'REJECTED' }
    })
    sendResponse(res, 200, true, approved ? 'Seller approved' : 'Seller rejected', seller)
  } catch (err) { next(err) }
}

// @route GET /api/admin/products
export const getAllProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { approved, page = '1', limit = '50' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    const where: any = {}
    if (approved === 'false') where.isApproved = false
    if (approved === 'true') where.isApproved = true

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          seller: { select: { businessName: true } },
          category: { select: { name: true } }
        },
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

// @route PUT /api/admin/products/:id/approve
export const approveProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isApproved: req.body.approved }
    })
    sendResponse(res, 200, true, req.body.approved ? 'Product approved' : 'Product rejected', product)
  } catch (err) { next(err) }
}

// @route PUT /api/admin/products/:id/feature
export const featureProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) throw new AppError('Product not found', 404)
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { isFeatured: !product.isFeatured }
    })
    sendResponse(res, 200, true, 'Product featured status updated', updated)
  } catch (err) { next(err) }
}

// @route PATCH /api/admin/products/:id
export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body })
    sendResponse(res, 200, true, 'Product updated', product)
  } catch (err) { next(err) }
}

// @route DELETE /api/admin/products/:id
export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    sendResponse(res, 200, true, 'Product deleted')
  } catch (err) { next(err) }
}

// @route GET /api/admin/orders
export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20', search } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    const where: any = {}
    if (status && status !== 'ALL') where.status = status
    if (search) {
      where.OR = [
        { orderId: { contains: search as string, mode: 'insensitive' } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
        { user: { phone: { contains: search as string } } }
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          items: true
        }
      }),
      prisma.order.count({ where })
    ])

    sendResponse(res, 200, true, 'Orders fetched', orders, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (err) { next(err) }
}

// @route PATCH /api/admin/orders/:id/status
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body
    const validStatuses = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED']
    if (!validStatuses.includes(status)) throw new AppError('Invalid status', 400)

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    })
    if (!order) throw new AppError('Order not found', 404)

    const updateData: any = { status }
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

// @route GET /api/admin/banners
export const getBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } })
    sendResponse(res, 200, true, 'Banners fetched', banners)
  } catch (err) { next(err) }
}

// @route POST /api/admin/banners
export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banner = await prisma.banner.create({ data: req.body })
    sendResponse(res, 201, true, 'Banner created', banner)
  } catch (err) { next(err) }
}

// @route DELETE /api/admin/banners/:id
export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } })
    sendResponse(res, 200, true, 'Banner deleted')
  } catch (err) { next(err) }
}

// @route GET /api/admin/coupons
export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
    sendResponse(res, 200, true, 'Coupons fetched', coupons)
  } catch (err) { next(err) }
}

// @route POST /api/admin/coupons
export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await prisma.coupon.create({
      data: { ...req.body, code: req.body.code.toUpperCase() }
    })
    sendResponse(res, 201, true, 'Coupon created', coupon)
  } catch (err) { next(err) }
}