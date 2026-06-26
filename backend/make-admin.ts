import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const email = "tejasvarshney72@gmail.com"
  let user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    await prisma.user.update({ where: { email }, data: { role: "ADMIN", isVerified: true } })
    console.log("✅ Tejas ko ADMIN bana diya!")
  } else {
    const password = await bcrypt.hash("Tejas@123", 12)
    await prisma.user.create({ data: { name: "Tejas Varshney", email, password, role: "ADMIN", isVerified: true } })
    console.log("✅ Naya ADMIN account banaya!")
  }
  console.log("Email:    tejasvarshney72@gmail.com")
  console.log("Password: Tejas@123")
}

main().catch(console.error).finally(() => prisma.$disconnect())