import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

dotenv.config()

import authRoutes from './routes/auth.routes'
import productRoutes from './routes/product.routes'
import categoryRoutes from './routes/category.routes'
import cartRoutes from './routes/cart.routes'
import orderRoutes from './routes/order.routes'
import reviewRoutes from './routes/review.routes'
import wishlistRoutes from './routes/wishlist.routes'
import addressRoutes from './routes/address.routes'
import sellerRoutes from './routes/seller.routes'
import adminRoutes from './routes/admin.routes'
import uploadRoutes from './routes/upload.routes'
import miscRoutes from './routes/misc.routes'
import liveRoutes from './routes/live.routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(morgan('dev'))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))
app.use(cookieParser())

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🛒 BELLMAK API is running!',
    version: '1.0.0'
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/seller', sellerRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/live', liveRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api', miscRoutes)

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`✅ BELLMAK Server running on http://localhost:${PORT}`)
})

export default app