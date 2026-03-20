// ─────────────────────────────────────────────────────────────
// REPLACE your entire order.routes.ts with this
// File: backend/src/routes/order.routes.ts
// ─────────────────────────────────────────────────────────────
import { Router } from 'express'
import { sellerConfirmCODReceived } from '../controllers/order.controller'
import {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  returnOrder,
  trackOrder,
  confirmDelivery,        // NEW
  confirmCODPayment,      // NEW
} from '../controllers/order.controller'
import { protect } from '../middleware/auth'

const router = Router()

// Existing routes
router.post('/', protect, createOrder)
router.get('/', protect, getOrders)
router.get('/:orderId', protect, getOrder)
router.post('/:orderId/cancel', protect, cancelOrder)
router.post('/:orderId/return', protect, returnOrder)
router.get('/:orderId/track', protect, trackOrder)
router.post('/orders/:orderId/confirm-cod-received', protect, sellerConfirmCODReceived)

// ─── NEW COD routes ───────────────────────────────────────────
// Customer confirms delivery received
router.post('/:orderId/confirm-delivery', protect, confirmDelivery)
// Customer confirms COD cash given to delivery boy
router.post('/:orderId/confirm-cod-payment', protect, confirmCODPayment)

export default router