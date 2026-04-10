import { Router } from 'express'
import {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  returnOrder,
  trackOrder,
  confirmDelivery,
  confirmCODPayment
} from '../controllers/order.controller'
import { protect } from '../middleware/auth'

const router = Router()

router.post('/', protect, createOrder)
router.get('/', protect, getOrders)
router.get('/:orderId', protect, getOrder)
router.post('/:orderId/cancel', protect, cancelOrder)
router.post('/:orderId/return', protect, returnOrder)
router.get('/:orderId/track', protect, trackOrder)
router.post('/:orderId/confirm-delivery', protect, confirmDelivery)
router.post('/:orderId/confirm-cod-payment', protect, confirmCODPayment)

export default router