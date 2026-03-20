import { Router } from 'express'
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  sendOTP,
  verifyOTP,
  switchRole,
  updateProfile,
  changePassword,
  getCoinsHistory
} from '../controllers/auth.controller'
import { protect } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.post('/send-otp', sendOTP)
router.post('/verify-otp', verifyOTP)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/refresh-token', refreshToken)
router.get('/me', protect, getMe)
router.post('/switch-role', protect, switchRole)

// 🆕 Naye routes
router.put('/profile', protect, updateProfile)
router.put('/change-password', protect, changePassword)
router.get('/coins/history', protect, getCoinsHistory)

export default router