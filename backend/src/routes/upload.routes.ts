import { Router } from 'express'
import { uploadImage, uploadMultipleImages, deleteImage } from '../controllers/upload.controller'
import { protect, sellerOnly } from '../middleware/auth'

const router = Router()

router.post('/single', protect, sellerOnly, uploadImage)
router.post('/multiple', protect, sellerOnly, uploadMultipleImages)
router.delete('/delete', protect, sellerOnly, deleteImage)

export default router