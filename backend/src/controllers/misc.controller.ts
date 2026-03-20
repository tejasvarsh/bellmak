import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { sendResponse } from '../utils/helpers'

// @route GET /api/banners
export const getBanners = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })
    sendResponse(res, 200, true, 'Banners fetched', banners)
  } catch (err) {
    next(err)
  }
}

// @route GET /api/coupons/validate/:code
export const validateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: req.params.code.toUpperCase(),
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })

    if (!coupon) {
      return sendResponse(res, 404, false, 'Invalid or expired coupon')
    }

    sendResponse(res, 200, true, 'Valid coupon', {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue
    })
  } catch (err) {
    next(err)
  }
}

// @route GET /api/pincode/:pincode
export const checkPincode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pincode } = req.params

    // Simulate pincode check
    // In production: integrate with delivery partner API
    const isServiceable = pincode.length === 6

    const deliveryDays = ['110', '400', '560', '600', '500'].some(
      p => pincode.startsWith(p)
    ) ? 2 : 5

    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays)

    sendResponse(res, 200, true, 'Pincode checked', {
      pincode,
      isServiceable,
      deliveryDays,
      deliveryDate,
      message: isServiceable
        ? `Delivery by ${deliveryDate.toDateString()}`
        : 'Delivery not available at this location'
    })
  } catch (err) {
    next(err)
  }
}

// @route POST /api/newsletter
export const subscribeNewsletter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body
    if (!email) {
      return sendResponse(res, 400, false, 'Email required')
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email }
    })

    sendResponse(res, 200, true, 'Subscribed successfully!')
  } catch (err) {
    next(err)
  }
}

// @route POST /api/contact
export const contactForm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, subject, message } = req.body
    if (!name || !email || !message) {
      return sendResponse(res, 400, false, 'Name, email and message required')
    }

    // In production: send email via Nodemailer
    console.log('Contact form submission:', { name, email, subject, message })

    sendResponse(res, 200, true, 'Message received! We will contact you soon.')
  } catch (err) {
    next(err)
  }
}