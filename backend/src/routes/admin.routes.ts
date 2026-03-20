import { Router } from 'express'
import {
  getAdminDashboard,
  getAllUsers,
  banUser,
  updateUser,
  changeUserRole,
  toggleUserStatus,
  getAllSellers,
  approveSeller,
  getAllProducts,
  approveProduct,
  featureProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getBanners,
  createBanner,
  deleteBanner,
  createCoupon,
  getCoupons,
} from '../controllers/admin.controller'
import { protect, adminOnly } from '../middleware/auth'

const router = Router()

// ── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard',                  protect, adminOnly, getAdminDashboard)

// ── Users ─────────────────────────────────────────────────────
router.get('/users',                      protect, adminOnly, getAllUsers)
router.patch('/users/:id',                protect, adminOnly, updateUser)
router.put('/users/:id/ban',              protect, adminOnly, banUser)
router.patch('/users/:id/role',           protect, adminOnly, changeUserRole)    // NEW: role switcher
router.patch('/users/:id/status',         protect, adminOnly, toggleUserStatus)  // NEW: activate/deactivate

// ── Sellers ───────────────────────────────────────────────────
router.get('/sellers',                    protect, adminOnly, getAllSellers)
router.put('/sellers/:id/approve',        protect, adminOnly, approveSeller)

// ── Products ──────────────────────────────────────────────────
router.get('/products',                   protect, adminOnly, getAllProducts)
router.put('/products/:id/approve',       protect, adminOnly, approveProduct)
router.put('/products/:id/feature',       protect, adminOnly, featureProduct)
router.patch('/products/:id',             protect, adminOnly, updateProduct)
router.delete('/products/:id',            protect, adminOnly, deleteProduct)

// ── Orders ────────────────────────────────────────────────────
router.get('/orders',                     protect, adminOnly, getAllOrders)
router.patch('/orders/:id/status',        protect, adminOnly, updateOrderStatus)

// ── Banners ───────────────────────────────────────────────────
router.get('/banners',                    protect, adminOnly, getBanners)
router.post('/banners',                   protect, adminOnly, createBanner)
router.delete('/banners/:id',             protect, adminOnly, deleteBanner)

// ── Coupons ───────────────────────────────────────────────────
router.get('/coupons',                    protect, adminOnly, getCoupons)
router.post('/coupons',                   protect, adminOnly, createCoupon)

export default router