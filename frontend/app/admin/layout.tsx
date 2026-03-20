'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import {
  LayoutDashboard, Package, ShoppingBag, Store,
  Users, Tag, Settings, Bell, Menu, X,
  ChevronRight, LogOut, BarChart2, Shield
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',  href: '/admin',           icon: LayoutDashboard, badge: null    },
  { label: 'Orders',     href: '/admin/orders',    icon: Package,         badge: 'orders' },
  { label: 'Products',   href: '/admin/products',  icon: ShoppingBag,     badge: 'products' },
  { label: 'Sellers',    href: '/admin/sellers',   icon: Store,           badge: 'sellers' },
  { label: 'Users',      href: '/admin/users',     icon: Users,           badge: null    },
  { label: 'Coupons',    href: '/admin/coupons',   icon: Tag,             badge: null    },
  { label: 'Analytics',  href: '/admin/analytics', icon: BarChart2,       badge: null    },
  { label: 'Settings',   href: '/admin/settings',  icon: Settings,        badge: null    },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname              = usePathname()
  const router                = useRouter()
  const { user, isLoggedIn, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted,     setMounted]     = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isLoggedIn)            { router.push('/login'); return }
    if (user?.role !== 'ADMIN') { router.push('/');     return }
  }, [mounted, isLoggedIn, user])

  if (!mounted || !isLoggedIn || user?.role !== 'ADMIN') return null

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-60 bg-[#1a1a2e] z-40 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/8 flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#F97316] rounded-xl flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none">BELLMAK</p>
              <p className="text-[#F97316] text-[9px] font-bold leading-none mt-0.5">ADMIN PANEL</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV.map(item => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                  active
                    ? 'bg-[#F97316] text-white shadow-lg shadow-orange-500/20'
                    : 'text-gray-400 hover:bg-white/8 hover:text-white'
                }`}>
                <item.icon size={16} className={active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={13} className="text-white/60" />}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-white/8 p-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#F97316] rounded-xl flex items-center justify-center font-black text-white text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{user?.name}</p>
              <p className="text-gray-500 text-[10px] truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white text-[11px] font-bold rounded-xl transition-all">
              View Site
            </Link>
            <button onClick={() => { logout(); router.push('/login') }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 text-[11px] font-bold rounded-xl transition-all">
              <LogOut size={11} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile topbar */}
        <header className="lg:hidden bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#F97316] rounded-lg flex items-center justify-center">
              <Shield size={12} className="text-white" />
            </div>
            <p className="font-black text-gray-800 text-sm">Admin Panel</p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}