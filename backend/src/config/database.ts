import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  allowExitOnIdle: false,
})

pool.on('error', (err) => {
  console.error('DB Pool error:', err.message)
})

// Startup pe turant connect karo
pool.query('SELECT 1').then(() => {
  console.log('✅ Supabase DB connected!')
}).catch(() => {
  // Retry kar lega automatically
})

// Har 3 min mein alive raho
setInterval(async () => {
  try { await pool.query('SELECT 1') } catch {}
}, 3 * 60 * 1000)

const adapter = new PrismaPg(pool)
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter } as any)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
export default prisma