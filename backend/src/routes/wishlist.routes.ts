import { Router } from 'express'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist
} from '../controllers/wishlist.controller'
import { protect } from '../middleware/auth'

const router = Router()

router.get('/', protect, getWishlist)
router.post('/add', protect, addToWishlist)
router.delete('/remove/:productId', protect, removeFromWishlist)
router.get('/check/:productId', protect, checkWishlist)

export default router