import { Router } from 'express'
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller'
import { protect, adminOnly } from '../middleware/auth'

const router = Router()

router.get('/', getCategories)
router.get('/:slug', getCategory)
router.post('/', protect, adminOnly, createCategory)
router.put('/:id', protect, adminOnly, updateCategory)
router.delete('/:id', protect, adminOnly, deleteCategory)

export default router