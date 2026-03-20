import { Router } from 'express'
import {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} from '../controllers/cart.controller'
import { protect } from '../middleware/auth'

const router = Router()

router.get('/', protect, getCart)
router.post('/add', protect, addToCart)
router.put('/update', protect, updateCart)
router.delete('/remove/:productId', protect, removeFromCart)
router.delete('/clear', protect, clearCart)
router.post('/apply-coupon', protect, applyCoupon)
router.delete('/remove-coupon', protect, removeCoupon)

export default router
