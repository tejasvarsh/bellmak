import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Toaster } from 'react-hot-toast'
import AdminSwitcher from '@/components/AdminSwitcher'

export const metadata: Metadata = {
  title: 'BELLMAK - India Ka Apna Bazaar',
  description: 'Shop millions of products at best prices. Free delivery above ₹499.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Toaster position="top-right" />
        <AdminSwitcher />
      </body>
    </html>
  )
}