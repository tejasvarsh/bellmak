import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'

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
//import liveRoutes from './routes/live.routes'

import { errorHandler } from './middleware/errorHandler'

// ── Rate Limiters ─────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 10,                      // 10 attempts per IP in 15 min
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,     // 1 hour
  max: 30,                      // 30 requests per hour
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── App Setup ─────────────────────────────────────────
const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 5000

// ── WebSocket (same as before) ────────────────────────
const wss = new WebSocketServer({ server })
const rooms = new Map<string, Set<WebSocket>>()

// ... (WebSocket code same as before - no change needed) ...
wss.on('connection', (ws) => {
  let currentRoom = ''
  let userName = 'Viewer'

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      if (msg.type === 'join') {
        currentRoom = msg.streamId
        userName = msg.name || 'Viewer'
        if (!rooms.has(currentRoom)) rooms.set(currentRoom, new Set())
        rooms.get(currentRoom)!.add(ws)
        broadcastViewerCount(currentRoom)
        broadcast(currentRoom, { 
          type: 'chat', 
          name: 'System', 
          msg: `👋 ${userName} joined!`, 
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), 
          isSystem: true 
        }, ws)
      }
      if (msg.type === 'chat' && currentRoom) {
        broadcast(currentRoom, { 
          type: 'chat', 
          name: userName, 
          msg: msg.msg, 
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
        })
      }
    } catch {}
  })

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom)!.delete(ws)
      broadcastViewerCount(currentRoom)
      if (rooms.get(currentRoom)!.size === 0) rooms.delete(currentRoom)
    }
  })
})

function broadcast(roomId: string, data: any, excludeWs?: WebSocket) {
  const room = rooms.get(roomId)
  if (!room) return
  const msg = JSON.stringify(data)
  room.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(msg)
    }
  })
}

function broadcastViewerCount(roomId: string) {
  const count = rooms.get(roomId)?.size || 0
  const room = rooms.get(roomId)
  if (!room) return
  const msg = JSON.stringify({ type: 'viewers', count })
  room.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg)
  })
}

export { rooms, broadcast, broadcastViewerCount }

// ── Middleware ────────────────────────────────────────
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

// ── Rate Limiting on Auth Routes ─────────────────────
app.use('/api/auth/login', loginLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth/forgot-password', authLimiter)
app.use('/api/auth/send-otp', authLimiter)

// ── Health Check ──────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: '🛒 BELLMAK API is running!', version: '1.0.0' })
})

// ── Routes ────────────────────────────────────────────
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
//app.use('/api/live', liveRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api', miscRoutes)

// ── 404 & Error Handler ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

app.use(errorHandler)

// ── Start Server ──────────────────────────────────────
server.listen(PORT, () => {
  console.log(`✅ BELLMAK Server running on http://localhost:${PORT}`)
  console.log(`✅ WebSocket Server ready on ws://localhost:${PORT}`)
})

export default app