'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Package, ShoppingBag, Radio, Video,
  Clock, Eye, Trash2, AlertCircle, Plus, BarChart2,
  Wallet, HeadphonesIcon, Settings, LogOut, Menu, X,
  Users, ArrowUpRight, Zap, IndianRupee, ChevronRight,
  Banknote, RefreshCw, AlertTriangle, TrendingUp,
  CheckCircle, Star, Bell
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────
interface Stats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  lowStockProducts: number
  codPendingCount: number
  avgRating: number
  todayOrders?: number
}

interface Recording {
  id: string
  title: string
  status: string
  viewerCount: number
  startedAt: string
  endedAt?: string
}

// ─── Config ───────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  CONFIRMED:  'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED:    'bg-indigo-100 text-indigo-700',
  DELIVERED:  'bg-green-100 text-green-700',
  CANCELLED:  'bg-red-100 text-red-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
}

const PAYMENT_LABEL: Record<string, string> = {
  PAID:                    '✅ Paid',
  PENDING:                 '⏳ Pending',
  COD_PAID_BY_CUSTOMER:    '🔔 Confirm Karo',
  COD_PENDING_CONFIRMATION:'⏳ Customer Confirm Kare',
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 0
}).format(n)

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
})

const fmtDuration = (start: string, end?: string) => {
  if (!end) return 'Live'
  const s = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  const m = Math.floor(s / 60), h = Math.floor(m / 60)
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`
}

// ─── Sidebar Nav Items ────────────────────────────────────────
type Section = 'overview' | 'live'

const NAV: { icon: any; label: string; section: Section }[] = [
  { icon: LayoutDashboard, label: 'Overview',        section: 'overview' },
  { icon: Radio,           label: 'Live Management', section: 'live'     },
]

const QUICK_LINKS = [
  { icon: Package,        label: 'Products',  href: '/seller/products',  color: 'text-blue-600 bg-blue-50'    },
  { icon: ShoppingBag,    label: 'Orders',    href: '/seller/orders',    color: 'text-purple-600 bg-purple-50' },
  { icon: BarChart2,      label: 'Analytics', href: '/seller/analytics', color: 'text-green-600 bg-green-50'   },
  { icon: Wallet,         label: 'Earnings',  href: '/seller/earnings',  color: 'text-yellow-600 bg-yellow-50' },
  { icon: HeadphonesIcon, label: 'Support',   href: '/seller/support',   color: 'text-red-600 bg-red-50'       },
  { icon: Settings,       label: 'Settings',  href: '/seller/settings',  color: 'text-gray-600 bg-gray-100'    },
]

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, prefix = '', suffix = '', trend }: {
  label: string; value: number; icon: any
  color: string; prefix?: string; suffix?: string; trend?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp size={9} /> {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900">
        {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
      </p>
      <p className="text-xs font-semibold text-gray-400 mt-1">{label}</p>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function SellerDashboard() {
  const { user, isLoggedIn, logout } = useAuthStore()
  const router = useRouter()

  const [mounted,       setMounted]       = useState(false)
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [section,       setSection]       = useState<Section>('overview')
  const [loading,       setLoading]       = useState(false)
  const [recordings,    setRecordings]    = useState<Recording[]>([])
  const [liveStreams,   setLiveStreams]    = useState<Recording[]>([])
  const [loadingRec,    setLoadingRec]    = useState(true)
  const [deleting,      setDeleting]      = useState<string | null>(null)
  const [confirmDel,    setConfirmDel]    = useState<string | null>(null)
  const [recentOrders,  setRecentOrders]  = useState<any[]>([])
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0, totalOrders: 0, totalRevenue: 0,
    pendingOrders: 0, lowStockProducts: 0, codPendingCount: 0, avgRating: 0,
  })

  useEffect(() => {
    setMounted(true)
    if (!isLoggedIn) { router.push('/login'); return }
    if (user?.role !== 'SELLER' && user?.role !== 'ADMIN') { router.push('/'); return }
    fetchData()
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, recRes] = await Promise.all([
        api.get('/seller/dashboard').catch(() => ({ data: { data: {} } })),
        api.get('/live/recordings?mine=true').catch(() => ({ data: { data: [] } })),
      ])
      if (dashRes.data.data?.stats)        setStats(dashRes.data.data.stats)
      if (dashRes.data.data?.recentOrders) setRecentOrders(dashRes.data.data.recentOrders)
      const all = recRes.data.data || []
      setRecordings(all.filter((r: Recording) => r.status === 'ENDED'))
      setLiveStreams(all.filter((r: Recording) => r.status === 'LIVE'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingRec(false)
      setLoading(false)
    }
  }, [])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await api.delete(`/live/${id}`)
      setRecordings(prev => prev.filter(r => r.id !== id))
      setConfirmDel(null)
      toast.success('Recording deleted!')
    } catch { toast.error('Delete failed!') }
    finally { setDeleting(null) }
  }

  if (!mounted) return null

  const statCards = [
    { label: 'Total Products', value: stats.totalProducts,  icon: Package,       color: 'bg-blue-50 text-blue-600',    prefix: '',  trend: undefined },
    { label: 'Total Orders',   value: stats.totalOrders,    icon: ShoppingBag,   color: 'bg-purple-50 text-purple-600', prefix: '',  trend: undefined },
    { label: 'Revenue Earned', value: stats.totalRevenue,   icon: IndianRupee,   color: 'bg-orange-50 text-orange-500', prefix: '₹', trend: undefined },
    { label: 'Pending Orders', value: stats.pendingOrders,  icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-600', prefix: '',  trend: undefined },
  ]

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex">

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-lg shadow-sm shadow-orange-200">
              🛒
            </div>
            <div>
              <p className="font-black text-gray-900 leading-none">
                BELL<span className="text-orange-500">MAK</span>
              </p>
              <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Seller Hub</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-black flex-shrink-0 shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-sm truncate leading-none">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate mt-0.5">{user?.email}</p>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>{user?.role}</span>
            </div>
            {stats.codPendingCount > 0 && (
              <div className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">
                {stats.codPendingCount}
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-2">Dashboard</p>
          {NAV.map(item => (
            <button
              key={item.section}
              onClick={() => { setSection(item.section); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                section === item.section
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}

          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-2 mt-3">Manage</p>
          {QUICK_LINKS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all relative"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                <item.icon size={13} />
              </div>
              {item.label}
              {item.label === 'Orders' && stats.codPendingCount > 0 && (
                <span className="absolute right-3 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {stats.codPendingCount}
                </span>
              )}
            </Link>
          ))}

          {/* Admin Panel link */}
          {user?.role === 'ADMIN' && (
            <>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-2 mt-3">Admin</p>
              <Link href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all">
                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
          <Link href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            <ArrowUpRight size={16} /> View Store
          </Link>
          <button
            onClick={() => { logout(); router.push('/') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
              <Menu size={18} className="text-gray-700" />
            </button>
            <div>
              <h1 className="font-black text-gray-900 leading-none">
                {section === 'overview' ? '📊 Dashboard' : '📡 Live Management'}
              </h1>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Welcome back, {user?.name?.split(' ')[0] || 'Seller'}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {section === 'live' ? (
              <Link href="/live/seller"
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl shadow-sm shadow-red-200 transition-colors">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" /> Go Live
              </Link>
            ) : (
              <Link href="/seller/products/new"
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl shadow-sm shadow-orange-200 transition-colors">
                <Plus size={14} /> Add Product
              </Link>
            )}
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">

          {/* ══ OVERVIEW SECTION ══ */}
          {section === 'overview' && (
            <div className="space-y-5 max-w-6xl">

              {/* COD Alert */}
              {stats.codPendingCount > 0 && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg shadow-green-200">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Banknote size={20} />
                      </div>
                      <div>
                        <p className="font-black">
                          💰 {stats.codPendingCount} COD Payment{stats.codPendingCount > 1 ? 's' : ''} Confirm Karna Hai!
                        </p>
                        <p className="text-green-100 text-xs mt-0.5">
                          Customers ne cash diya — confirm karo ki cash mila
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/seller/orders"
                      className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 font-black text-xs rounded-xl hover:bg-green-50 transition-colors flex-shrink-0"
                    >
                      Orders Dekho <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Low Stock Alert */}
              {stats.lowStockProducts > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={15} className="text-yellow-600" />
                  </div>
                  <p className="text-sm font-bold text-yellow-700 flex-1">
                    ⚠️ {stats.lowStockProducts} product{stats.lowStockProducts > 1 ? 's' : ''} ka stock 5 se kam hai!
                  </p>
                  <Link href="/seller/products"
                    className="text-xs font-black text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-xl transition-colors flex-shrink-0">
                    Fix Now →
                  </Link>
                </div>
              )}

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(card => <StatCard key={card.label} {...card} />)}
              </div>

              {/* Middle Row — Recent Orders + Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Recent Orders — 2/3 width */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                        <ShoppingBag size={14} className="text-purple-600" />
                      </div>
                      <h2 className="font-black text-gray-900">Recent Orders</h2>
                    </div>
                    <Link href="/seller/orders"
                      className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:underline">
                      View All <ChevronRight size={13} />
                    </Link>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-10">
                        <ShoppingBag size={32} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-sm font-bold text-gray-400">No orders yet</p>
                      </div>
                    ) : recentOrders.map((order: any) => (
                      <div key={order.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-gray-800">#{order.orderId}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                              {order.status?.replace(/_/g,' ')}
                            </span>
                            {order.paymentMethod === 'COD' && order.paymentStatus && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.paymentStatus === 'PAID'                    ? 'bg-green-100 text-green-700' :
                                order.paymentStatus === 'COD_PAID_BY_CUSTOMER'   ? 'bg-blue-100 text-blue-700'   :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {order.customerName} · {fmtDate(order.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm font-black text-gray-900 flex-shrink-0">{fmt(order.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats — 1/3 width */}
                <div className="space-y-4">

                  {/* Rating Card */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-yellow-50 rounded-lg flex items-center justify-center">
                          <Star size={14} className="text-yellow-500" />
                        </div>
                        <p className="font-black text-gray-900 text-sm">Seller Rating</p>
                      </div>
                    </div>
                    <p className="text-3xl font-black text-gray-900">
                      {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                    </p>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={12}
                          className={i <= Math.round(stats.avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Based on all reviews</p>
                  </div>

                  {/* Today's Activity */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                        <Zap size={14} className="text-green-500" />
                      </div>
                      <p className="font-black text-gray-900 text-sm">Today</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">New Orders</p>
                        <p className="text-sm font-black text-gray-900">{stats.todayOrders ?? 0}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">Pending Action</p>
                        <p className="text-sm font-black text-orange-500">{stats.pendingOrders}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">COD Confirm</p>
                        <p className={`text-sm font-black ${stats.codPendingCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {stats.codPendingCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Zap size={14} className="text-orange-500" />
                  </div>
                  <h2 className="font-black text-gray-900">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {QUICK_LINKS.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-all group border border-gray-100 hover:border-gray-200 relative"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                        <item.icon size={18} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">{item.label}</span>
                      {item.label === 'Orders' && stats.codPendingCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                          {stats.codPendingCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Go Live Banner */}
              <div className="bg-gradient-to-br from-red-500 via-red-500 to-orange-500 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-red-200">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-6 right-16 w-24 h-24 bg-white/5 rounded-full" />
                <div className="relative flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <span className="text-xs font-black uppercase tracking-widest opacity-90">Live Streaming</span>
                    </div>
                    <h3 className="text-xl font-black mb-1">Start Selling Live!</h3>
                    <p className="text-sm text-red-100">Go live aur real-time mein products sell karo</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href="/live/seller"
                      className="flex items-center gap-2 px-5 py-3 bg-white text-red-600 font-black text-sm rounded-xl hover:bg-red-50 transition-colors shadow-sm"
                    >
                      <Radio size={15} /> Go Live Now
                    </Link>
                    <button
                      onClick={() => setSection('live')}
                      className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 text-white font-bold text-sm rounded-xl transition-colors"
                    >
                      <Video size={15} /> Manage
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ══ LIVE SECTION ══ */}
          {section === 'live' && (
            <div className="space-y-5 max-w-5xl">

              {/* Live Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Streams',    value: recordings.length + liveStreams.length, icon: Radio, color: 'bg-red-50 text-red-500'       },
                  { label: 'Currently Live',   value: liveStreams.length,                     icon: Zap,   color: 'bg-orange-50 text-orange-500'  },
                  { label: 'Total Recordings', value: recordings.length,                      icon: Video, color: 'bg-blue-50 text-blue-500'      },
                  { label: 'Total Viewers',    value: [...recordings,...liveStreams].reduce((a,b) => a+(b.viewerCount||0), 0), icon: Users, color: 'bg-green-50 text-green-500' },
                ].map(card => <StatCard key={card.label} {...card} />)}
              </div>

              {/* Go Live Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-black text-gray-900 mb-1">Start a New Stream</h2>
                  <p className="text-sm text-gray-500">Products showcase karo live customers ke saath</p>
                </div>
                <Link
                  href="/live/seller"
                  className="flex items-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-black text-sm rounded-xl transition-colors shadow-sm shadow-red-200 flex-shrink-0"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" /> Go Live Now
                </Link>
              </div>

              {/* Recordings */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Video size={14} className="text-blue-500" />
                    </div>
                    <h2 className="font-black text-gray-900">All Recordings</h2>
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    {recordings.length} total
                  </span>
                </div>

                {loadingRec ? (
                  <div className="p-5 space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : recordings.length === 0 ? (
                  <div className="text-center py-14">
                    <Video size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="font-bold text-gray-400">No recordings yet</p>
                    <Link
                      href="/live/seller"
                      className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 transition-colors"
                    >
                      <Radio size={14} /> Start First Stream
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recordings.map(rec => (
                      <div key={rec.id} className="overflow-hidden">
                        <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Video size={18} className="text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{rec.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> {fmtDuration(rec.startedAt, rec.endedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye size={10} /> {rec.viewerCount} viewers
                              </span>
                              <span>{fmtDate(rec.startedAt)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setConfirmDel(confirmDel === rec.id ? null : rec.id)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {confirmDel === rec.id && (
                          <div className="mx-5 mb-4 flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700 flex-1 font-medium">Permanently delete?</p>
                            <button
                              onClick={() => handleDelete(rec.id)}
                              disabled={deleting === rec.id}
                              className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 disabled:opacity-50 flex-shrink-0"
                            >
                              {deleting === rec.id ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                              onClick={() => setConfirmDel(null)}
                              className="px-3 py-1.5 bg-white text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 border border-gray-200 flex-shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}