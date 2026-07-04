'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3x3, Package, Heart, ShoppingCart, User } from 'lucide-react'
import { useCartStore, useAuthStore } from '@/lib/store'
import { useEffect, useState } from 'react'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const totalItems = useCartStore(s => s.getTotalItems())
  const { isLoggedIn } = useAuthStore()

  useEffect(() => setMounted(true), [])

  const items = [
    { label: 'Home',     icon: Home,         href: '/' },
    { label: 'Category', icon: Grid3x3,      href: '/categories' },
    { label: 'Orders',   icon: Package,      href: isLoggedIn ? '/account/orders' : '/login' },
    { label: 'Wishlist', icon: Heart,        href: '/account/wishlist' },
    { label: 'Cart',     icon: ShoppingCart, href: '/cart', badge: mounted ? totalItems : 0 },
    { label: 'Account',  icon: User,         href: isLoggedIn ? '/account' : '/login' },
  ]

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-6 h-[58px]">
        {items.map(item => {
          const active = isActive(item.href)
          return (
            <Link key={item.label} href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 relative active:scale-95 transition-transform">
              <div className="relative">
                <item.icon
                  size={20}
                  className={active ? 'text-[#F97316]' : 'text-gray-500'}
                  fill={active ? 'currentColor' : 'none'}
                  strokeWidth={active ? 1.5 : 2}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#F97316] text-white text-[8px] rounded-full min-w-[14px] h-[14px] flex items-center justify-center font-black px-0.5 border border-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-bold ${active ? 'text-[#F97316]' : 'text-gray-500'}`}>
                {item.label}
              </span>
              {active && <span className="absolute -top-[1px] w-8 h-[2px] bg-[#F97316] rounded-full" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}