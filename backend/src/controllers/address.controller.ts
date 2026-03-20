import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { sendResponse } from '../utils/helpers'

// @route GET /api/addresses
export const getAddresses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    })
    sendResponse(res, 200, true, 'Addresses fetched', addresses)
  } catch (err) {
    next(err)
  }
}

// @route POST /api/addresses
export const addAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const count = await prisma.address.count({
      where: { userId: req.user!.id }
    })
    if (count >= 5) throw new AppError('Maximum 5 addresses allowed', 400)

    const {
      fullName, phone, addressLine1, addressLine2,
      city, state, pincode, label, isDefault
    } = req.body

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      throw new AppError('All required fields must be filled', 400)
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false }
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user!.id,
        fullName, phone, addressLine1,
        addressLine2: addressLine2 || null,
        city, state, pincode,
        label: label || 'HOME',
        isDefault: isDefault || count === 0
      }
    })

    sendResponse(res, 201, true, 'Address added', address)
  } catch (err) {
    next(err)
  }
}

// @route PUT /api/addresses/:id
export const updateAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    })
    if (!address) throw new AppError('Address not found', 404)

    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: req.body
    })

    sendResponse(res, 200, true, 'Address updated', updated)
  } catch (err) {
    next(err)
  }
}

// @route DELETE /api/addresses/:id
export const deleteAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    })
    if (!address) throw new AppError('Address not found', 404)

    await prisma.address.delete({ where: { id: req.params.id } })
    sendResponse(res, 200, true, 'Address deleted')
  } catch (err) {
    next(err)
  }
}

// @route PUT /api/addresses/:id/default
export const setDefaultAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    })
    if (!address) throw new AppError('Address not found', 404)

    // Unset all defaults
    await prisma.address.updateMany({
      where: { userId: req.user!.id },
      data: { isDefault: false }
    })

    // Set new default
    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: { isDefault: true }
    })

    sendResponse(res, 200, true, 'Default address updated', updated)
  } catch (err) {
    next(err)
  }
}