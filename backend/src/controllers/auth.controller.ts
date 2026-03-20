import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { sendResponse } from '../utils/helpers'

// Generate Tokens — 7 days access, 30 days refresh
const generateTokens = (id: string, role: string, email?: string) => {
  const accessToken = jwt.sign(
    { id, role, email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
  const refreshToken = jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '30d' }
  )
  return { accessToken, refreshToken }
}

// @route POST /api/auth/register
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, password, role } = req.body

    if (!name || !password || (!email && !phone)) {
      throw new AppError('Name, password and email or phone required', 400)
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {}
        ]
      }
    })
    if (existing) throw new AppError('User already exists', 409)

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        role: role === 'SELLER' ? 'SELLER' : 'CUSTOMER'
      },
      select: {
        id: true, name: true, email: true,
        phone: true, role: true, bellmakCoins: true, createdAt: true
      }
    })

    if (role === 'SELLER') {
      await prisma.seller.create({
        data: {
          userId: user.id,
          businessName: name + "'s Store",
          kycStatus: 'APPROVED',
          isApproved: true
        }
      })
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })

    sendResponse(res, 201, true, 'Registration successful', { user, accessToken })
  } catch (err) {
    next(err)
  }
}

// @route POST /api/auth/login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailOrPhone, password } = req.body

    if (!emailOrPhone || !password) {
      throw new AppError('Email/Phone and password required', 400)
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phone: emailOrPhone }
        ]
      }
    })

    if (!user || !user.password) {
      throw new AppError('Invalid credentials', 401)
    }

    if (!user.isActive) {
      throw new AppError('Account is banned. Contact support.', 403)
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new AppError('Invalid credentials', 401)

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email || undefined)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })

    sendResponse(res, 200, true, 'Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        bellmakCoins: user.bellmakCoins
      },
      accessToken
    })
  } catch (err) {
    next(err)
  }
}

// @route POST /api/auth/logout
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } })
    }
    res.clearCookie('refreshToken')
    sendResponse(res, 200, true, 'Logged out successfully')
  } catch (err) {
    next(err)
  }
}

// @route GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, avatar: true, bellmakCoins: true,
        isVerified: true, createdAt: true,
        _count: { select: { orders: true, wishlist: true } }
      }
    })

    if (!user) throw new AppError('User not found', 404)
    sendResponse(res, 200, true, 'User fetched', user)
  } catch (err) {
    next(err)
  }
}

// @route POST /api/auth/refresh-token
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) throw new AppError('No refresh token', 401)

    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401)
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any
    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.id, stored.user.role)

    await prisma.refreshToken.delete({ where: { token } })
    await prisma.refreshToken.create({
      data: {
        userId: decoded.id,
        token: newRefresh,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })

    sendResponse(res, 200, true, 'Token refreshed', { accessToken })
  } catch (err) {
    next(err)
  }
}

// @route POST /api/auth/send-otp
export const sendOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body
    if (!phone) throw new AppError('Phone number required', 400)

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log(`OTP for ${phone}: ${otp}`)

    await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, name: 'User', role: 'CUSTOMER' }
    })

    sendResponse(res, 200, true, 'OTP sent successfully',
      process.env.NODE_ENV === 'development' ? { otp } : {}
    )
  } catch (err) {
    next(err)
  }
}

// @route POST /api/auth/verify-otp
export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body
    if (!phone || !otp) throw new AppError('Phone and OTP required', 400)

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) throw new AppError('User not found', 404)

    const { accessToken, refreshToken } = generateTokens(user.id, user.role)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })

    sendResponse(res, 200, true, 'OTP verified', {
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      accessToken
    })
  } catch (err) {
    next(err)
  }
}

// @route POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body
    if (!email) throw new AppError('Email required', 400)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new AppError('No account with this email', 404)

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log(`Reset OTP for ${email}: ${otp}`)

    sendResponse(res, 200, true, 'Reset OTP sent to email',
      process.env.NODE_ENV === 'development' ? { otp } : {}
    )
  } catch (err) {
    next(err)
  }
}

// @route POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body
    if (!email || !otp || !newPassword) {
      throw new AppError('Email, OTP and new password required', 400)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })

    sendResponse(res, 200, true, 'Password reset successful')
  } catch (err) {
    next(err)
  }
}

// @route POST /api/auth/switch-role
export const switchRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body
    const userId = req.user!.id

    if (!['CUSTOMER', 'SELLER'].includes(role)) {
      throw new AppError('Invalid role!', 400)
    }

    if (role === 'SELLER') {
      const existingSeller = await prisma.seller.findUnique({ where: { userId } })
      if (!existingSeller) {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        await prisma.seller.create({
          data: {
            userId,
            businessName: user!.name + "'s Store",
            kycStatus: 'APPROVED',
            isApproved: true
          }
        })
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    })

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email || undefined)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })

    sendResponse(res, 200, true, 'Role switched successfully', {
      user: {
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, role: user.role, bellmakCoins: user.bellmakCoins
      },
      accessToken
    })
  } catch (err) {
    next(err)
  }
}

// ============================================================
// 🆕 NAYE ENDPOINTS
// ============================================================

// @route PUT /api/auth/profile
// @desc  Name aur phone update karo
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body
    const userId = req.user!.id

    if (!name && !phone) {
      throw new AppError('Name ya phone dono mein se kuch toh do', 400)
    }

    // Phone already kisi aur ka toh nahi?
    if (phone) {
      const existing = await prisma.user.findFirst({
        where: { phone, NOT: { id: userId } }
      })
      if (existing) throw new AppError('Ye phone number already use ho raha hai', 409)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone })
      },
      select: {
        id: true, name: true, email: true,
        phone: true, role: true, avatar: true, bellmakCoins: true
      }
    })

    sendResponse(res, 200, true, 'Profile updated successfully', user)
  } catch (err) {
    next(err)
  }
}

// @route PUT /api/auth/change-password
// @desc  Password change karo (old password verify karke)
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user!.id

    if (!currentPassword || !newPassword) {
      throw new AppError('Current aur new password dono chahiye', 400)
    }

    if (newPassword.length < 6) {
      throw new AppError('New password kam se kam 6 characters ka hona chahiye', 400)
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.password) {
      throw new AppError('User not found', 404)
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) throw new AppError('Current password galat hai', 401)

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    // Sare refresh tokens delete karo — security ke liye
    await prisma.refreshToken.deleteMany({ where: { userId } })
    res.clearCookie('refreshToken')

    sendResponse(res, 200, true, 'Password changed successfully. Please login again.')
  } catch (err) {
    next(err)
  }
}

// @route GET /api/auth/coins/history
// @desc  BellMAK Coins transaction history
export const getCoinsHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { bellmakCoins: true, name: true }
    })

    if (!user) throw new AppError('User not found', 404)

    // Orders se coins activity derive karo
    const orders = await prisma.order.findMany({
      where: { userId },
      select: {
        orderId: true,
        coinsUsed: true,
        coinsDiscount: true,
        totalAmount: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Transactions build karo orders se
    const transactions: any[] = []

    orders.forEach(order => {
      // Coins use kiye toh spent transaction
      if (order.coinsUsed > 0) {
        transactions.push({
          id: `spent-${order.orderId}`,
          type: 'SPENT',
          amount: order.coinsUsed,
          description: `Coins used on order #${order.orderId}`,
          orderId: order.orderId,
          createdAt: order.createdAt
        })
      }

      // Delivered order pe coins earned (1% of totalAmount as coins)
      if (order.status === 'DELIVERED') {
        const earned = Math.floor(order.totalAmount * 0.01)
        if (earned > 0) {
          transactions.push({
            id: `earned-${order.orderId}`,
            type: 'EARNED',
            amount: earned,
            description: `Coins earned on order #${order.orderId}`,
            orderId: order.orderId,
            createdAt: order.createdAt
          })
        }
      }
    })

    // Date ke hisaab se sort karo
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    sendResponse(res, 200, true, 'Coins history fetched', {
      currentBalance: user.bellmakCoins,
      coinValue: user.bellmakCoins * 0.25, // 1 coin = ₹0.25
      transactions
    })
  } catch (err) {
    next(err)
  }
}