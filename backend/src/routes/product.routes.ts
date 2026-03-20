import { Router } from 'express'
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getDeals,
  getTrending,
  searchProducts
} from '../controllers/product.controller'
import { protect, sellerOnly } from '../middleware/auth'

const router = Router()

router.get('/', getProducts)
router.get('/featured', getFeaturedProducts)
router.get('/deals', getDeals)
router.get('/trending', getTrending)
router.get('/search', searchProducts)
router.get('/:slug', getProduct)
router.post('/', protect, sellerOnly, createProduct)
router.put('/:id', protect, sellerOnly, updateProduct)
router.delete('/:id', protect, sellerOnly, deleteProduct)

export default router