import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
    email?: string
  }
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) throw new AppError('Not authorized, no token', 401)

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    }
    next()
  } catch (err) {
    next(new AppError('Not authorized', 401))
  }
}

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new AppError('Admin access only', 403))
  }
  next()
}

export const sellerOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'SELLER' && req.user?.role !== 'ADMIN') {
    return next(new AppError('Seller access only', 403))
  }
  next()
}
