import { Router } from 'express'
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful
} from '../controllers/review.controller'
import { protect } from '../middleware/auth'

const router = Router()

router.get('/product/:productId', getReviews)
router.post('/', protect, createReview)
router.put('/:id', protect, updateReview)
router.delete('/:id', protect, deleteReview)
router.post('/:id/helpful', protect, markHelpful)

export default router