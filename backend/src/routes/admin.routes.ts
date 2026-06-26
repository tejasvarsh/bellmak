import { Router } from 'express'
import {
  getAdminDashboard,
  getAllUsers, updateUser, banUser, changeUserRole, toggleUserStatus,
  getAllSellers, approveSeller,
  getAllProducts, approveProduct, featureProduct, updateProduct, deleteProduct,
  getAllOrders, updateOrderStatus,
  getBanners, createBanner, deleteBanner,
  getCoupons, createCoupon, toggleCoupon, deleteCoupon
} from '../controllers/admin.controller'
import { protect, adminOnly } from '../middleware/auth'

const router = Router()

router.get('/dashboard',                protect, adminOnly, getAdminDashboard)
router.get('/users',                    protect, adminOnly, getAllUsers)
router.patch('/users/:id',              protect, adminOnly, updateUser)
router.put('/users/:id/ban',            protect, adminOnly, banUser)
router.patch('/users/:id/role',         protect, adminOnly, changeUserRole)
router.patch('/users/:id/status',       protect, adminOnly, toggleUserStatus)
router.get('/sellers',                  protect, adminOnly, getAllSellers)
router.put('/sellers/:id/approve',      protect, adminOnly, approveSeller)
router.get('/products',                 protect, adminOnly, getAllProducts)
router.put('/products/:id/approve',     protect, adminOnly, approveProduct)
router.put('/products/:id/feature',     protect, adminOnly, featureProduct)
router.patch('/products/:id',           protect, adminOnly, updateProduct)
router.delete('/products/:id',          protect, adminOnly, deleteProduct)
router.get('/orders',                   protect, adminOnly, getAllOrders)
router.patch('/orders/:id/status',      protect, adminOnly, updateOrderStatus)
router.get('/banners',                  protect, adminOnly, getBanners)
router.post('/banners',                 protect, adminOnly, createBanner)
router.delete('/banners/:id',           protect, adminOnly, deleteBanner)
router.get('/coupons',                  protect, adminOnly, getCoupons)
router.post('/coupons',                 protect, adminOnly, createCoupon)
router.put('/coupons/:id/toggle',       protect, adminOnly, toggleCoupon)
router.delete('/coupons/:id',           protect, adminOnly, deleteCoupon)

export default router