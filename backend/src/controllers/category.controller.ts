import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { sendResponse } from '../utils/helpers'

// @route GET /api/categories
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          select: {
            id: true, name: true,
            slug: true, icon: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
    sendResponse(res, 200, true, 'Categories fetched', categories)
  } catch (err) {
    next(err)
  }
}

// @route GET /api/categories/:slug
export const getCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug as string },
      include: {
        children: { where: { isActive: true } },
        _count: { select: { products: true } }
      }
    })
    if (!category) throw new AppError('Category not found', 404)
    sendResponse(res, 200, true, 'Category fetched', category)
  } catch (err) {
    next(err)
  }
}

// @route POST /api/categories
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, slug, parentId, image, icon, commissionRate } = req.body
    if (!name || !slug) throw new AppError('Name and slug required', 400)

    const category = await prisma.category.create({
      data: {
        name, slug,
        parentId: parentId || null,
        image, icon,
        commissionRate: commissionRate || 10
      }
    })
    sendResponse(res, 201, true, 'Category created', category)
  } catch (err) {
    next(err)
  }
}

// @route PUT /api/categories/:id
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id as string },
data: req.body
    })
    sendResponse(res, 200, true, 'Category updated', category)
  } catch (err) {
    next(err)
  }
}

// @route DELETE /api/categories/:id
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.category.update({
      where: { id: req.params.id as string },
data: { isActive: false }
    })
    sendResponse(res, 200, true, 'Category deleted')
  } catch (err) {
    next(err)
  }
}