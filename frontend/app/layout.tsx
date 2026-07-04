import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import WelcomePopup from '@/components/layout/WelcomePopup'
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
        <main className="pb-16 md:pb-0">{children}</main>
        <MobileBottomNav />
        <WelcomePopup />
        <Toaster position="top-right" />
        <AdminSwitcher />
      </body>
    </html>
  )
}