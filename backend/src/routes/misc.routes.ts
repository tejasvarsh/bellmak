import { Router } from 'express'
import {
  getBanners,
  validateCoupon,
  checkPincode,
  subscribeNewsletter,
  contactForm
} from '../controllers/misc.controller'

const router = Router()

router.get('/banners', getBanners)
router.get('/coupons/validate/:code', validateCoupon)
router.get('/pincode/:pincode', checkPincode)
router.post('/newsletter', subscribeNewsletter)
router.post('/contact', contactForm)

export default router