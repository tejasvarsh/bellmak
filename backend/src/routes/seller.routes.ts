import { Router } from 'express'
import {
  registerSeller,
  getSellerDashboard,
  getSellerProducts,
  createProduct, updateProduct, deleteProduct,
  getSellerOrders, updateOrderStatus, shipOrder,
  confirmCODReceived,
  getSellerPayments,
  updateSellerProfile
} from '../controllers/seller.controller'
import { protect, sellerOnly } from '../middleware/auth'

const router = Router()

router.post('/register',                              protect,             registerSeller)
router.get('/dashboard',                              protect, sellerOnly, getSellerDashboard)

router.get('/products',                               protect, sellerOnly, getSellerProducts)
router.post('/products',                              protect, sellerOnly, createProduct)
router.put('/products/:id',                           protect, sellerOnly, updateProduct)
router.delete('/products/:id',                        protect, sellerOnly, deleteProduct)

router.get('/orders',                                 protect, sellerOnly, getSellerOrders)
router.patch('/orders/:id/status',                    protect, sellerOnly, updateOrderStatus)
router.put('/orders/:id/ship',                        protect, sellerOnly, shipOrder)
router.post('/orders/:orderId/confirm-cod-received',  protect, sellerOnly, confirmCODReceived)

router.get('/payments',                               protect, sellerOnly, getSellerPayments)
router.put('/profile',                                protect, sellerOnly, updateSellerProfile)

export default router