'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Package, ShoppingBag, Radio, Video,
  TrendingUp, Star, Clock, Eye, Trash2, AlertCircle,
  Plus, BarChart2, Wallet, HeadphonesIcon, Settings,
  LogOut, Menu, X, Users, ArrowUpRight, Zap, Play,
  CheckCircle2, AlertTriangle, IndianRupee, ChevronRight,
  Banknote, Bell, RefreshCw
} from 'lucide-react'

interface Recording {
  id: string
  title: string
  status: string
  viewerCount: number
  startedAt: string
  endedAt?: string
}

export default function SellerDashboard() {
  const { user, isLoggedIn, logout } = useAuthStore()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'live'>('overview')
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [liveStreams, setLiveStreams] = useState<Recording[]>([])
  const [loadingRec, setLoadingRec] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    codPendingCount: 0,  // NEW
    avgRating: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    if (!isLoggedIn) { router.push('/login'); return }
    if (user?.role !== 'SELLER') { router.push('/'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dashRes, recRes] = await Promise.all([
        api.get('/seller/dashboard').catch(() => ({ data: { data: {} } })),
        api.get('/live/recordings?mine=true').catch(() => ({ data: { data: [] } })),
      ])

      if (dashRes.data.data?.stats) setStats(dashRes.data.data.stats)
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
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await api.delete(`/live/${id}`)
      setRecordings(prev => prev.filter(r => r.id !== id))
      setConfirmDelete(null)
      toast.success('Recording deleted!')
    } catch {
      toast.error('Delete failed!')
    } finally {
      setDeleting(null)
    }
  }

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'Live'
    const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000)
    const m = Math.floor(diff / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}h ${m % 60}m`
    return `${m}m`
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', section: 'overview' as const },
    { icon: Radio, label: 'Live Management', section: 'live' as const },
  ]

  const quickLinks = [
    { icon: Package, label: 'Products', href: '/seller/products', color: 'text-blue-600 bg-blue-50' },
    { icon: ShoppingBag, label: 'Orders', href: '/seller/orders', color: 'text-purple-600 bg-purple-50' },
    { icon: BarChart2, label: 'Analytics', href: '/seller/analytics', color: 'text-green-600 bg-green-50' },
    { icon: Wallet, label: 'Earnings', href: '/seller/earnings', color: 'text-yellow-600 bg-yellow-50' },
    { icon: HeadphonesIcon, label: 'Support', href: '/seller/support', color: 'text-red-600 bg-red-50' },
    { icon: Settings, label: 'Settings', href: '/seller/settings', color: 'text-gray-600 bg-gray-100' },
  ]

  const statCards = [
    { label: 'Total Products', value: stats.totalProducts,  icon: Package,       color: 'bg-blue-50 text-blue-600',   prefix: '' },
    { label: 'Total Orders',   value: stats.totalOrders,    icon: ShoppingBag,   color: 'bg-purple-50 text-purple-600',prefix: '' },
    { label: 'Revenue',        value: stats.totalRevenue,   icon: IndianRupee,   color: 'bg-orange-50 text-primary',   prefix: '₹' },
    { label: 'Pending Orders', value: stats.pendingOrders,  icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-600',prefix: '' },
  ]

  const STATUS_COLOR: Record<string, string> = {
    PENDING:    'bg-yellow-100 text-yellow-700',
    CONFIRMED:  'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED:    'bg-indigo-100 text-indigo-700',
    DELIVERED:  'bg-green-100 text-green-700',
    CANCELLED:  'bg-red-100 text-red-700',
  }

  const PAYMENT_COLOR: Record<string, string> = {
    PAID:                   'bg-green-100 text-green-700',
    PENDING:                'bg-yellow-100 text-yellow-700',
    COD_PAID_BY_CUSTOMER:   'bg-blue-100 text-blue-700',
    COD_PENDING_CONFIRMATION:'bg-purple-100 text-purple-700',
  }

  const PAYMENT_LABEL: Record<string, string> = {
    PAID:                    '✅ Paid',
    PENDING:                 '⏳ COD Pending',
    COD_PAID_BY_CUSTOMER:    '🔔 Cash Confirm Karo',
    COD_PENDING_CONFIRMATION:'⏳ Customer Confirm Kare',
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>

        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-base">🛒</span>
            </div>
            <div>
              <div className="font-black text-base leading-none text-gray-900">BELL<span className="text-primary">MAK</span></div>
              <div className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">Seller Hub</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 mb-3">Navigation</p>
          {navItems.map(item => (
            <button key={item.section} onClick={() => { setActiveSection(item.section); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeSection === item.section ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <item.icon size={17} />
              {item.label}
            </button>
          ))}

          <div className="pt-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 mb-3">Quick Links</p>
            {quickLinks.map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all relative">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${item.color}`}>
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
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            <ArrowUpRight size={17} /> View Store
          </Link>
          <button onClick={() => { logout(); router.push('/') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Menu size={20} className="text-gray-700" />
            </button>
            <div>
              <h1 className="font-black text-gray-900 text-base leading-none">
                {activeSection === 'overview' ? 'Dashboard' : 'Live Management'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                Welcome back, {user?.name?.split(' ')[0] || 'Seller'}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} disabled={loading}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {activeSection === 'live' ? (
              <Link href="/live/seller" className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-black rounded-xl transition-colors shadow-sm shadow-red-500/30">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" /> Go Live
              </Link>
            ) : (
              <Link href="/seller/products/new" className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-black rounded-xl transition-colors shadow-sm">
                <Plus size={15} /> Add Product
              </Link>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">

          {activeSection === 'overview' && (
            <div className="space-y-5">

              {/* ── COD ALERT BANNER ─────────────────────────── */}
              {stats.codPendingCount > 0 && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Banknote size={20} />
                      </div>
                      <div>
                        <p className="font-black text-sm">
                          💰 {stats.codPendingCount} COD Payment{stats.codPendingCount > 1 ? 's' : ''} Confirm Karna Hai!
                        </p>
                        <p className="text-green-100 text-xs mt-0.5">
                          Customers ne cash diya — aapko confirm karna hai ki cash mila.
                        </p>
                      </div>
                    </div>
                    <Link href="/seller/orders"
                      className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 font-black text-xs rounded-xl hover:bg-green-50 transition flex-shrink-0">
                      Orders Dekho <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              )}

              {/* ── Low stock alert ───────────────────────────── */}
              {stats.lowStockProducts > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center gap-3">
                  <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-yellow-700 flex-1">
                    {stats.lowStockProducts} product{stats.lowStockProducts > 1 ? 's' : ''} ka stock 5 se kam hai!
                  </p>
                  <Link href="/seller/products" className="text-xs font-black text-yellow-700 hover:underline flex-shrink-0">
                    Fix Now →
                  </Link>
                </div>
              )}

              {/* ── Stat Cards ────────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                  <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                        <card.icon size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-green-500 mt-1" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">
                      {card.prefix}{typeof card.value === 'number' ? card.value.toLocaleString('en-IN') : card.value}
                    </div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Recent Orders ─────────────────────────────── */}
              {recentOrders.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-gray-900 text-base">Recent Orders</h2>
                    <Link href="/seller/orders" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      View All <ChevronRight size={13} />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {recentOrders.map((order: any) => (
                      <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                        <div className="w-9 h-9 bg-[#2874f0]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package size={15} className="text-[#2874f0]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-gray-800">#{order.orderId}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                              {order.status}
                            </span>
                            {/* COD payment status badge */}
                            {order.paymentMethod === 'COD' && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PAYMENT_COLOR[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                                {PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{order.customerName} · {formatDate(order.createdAt)}</p>
                        </div>
                        <p className="text-sm font-black text-gray-900 flex-shrink-0">
                          {fmt(order.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-gray-900 text-base mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {quickLinks.map(item => (
                    <Link key={item.href} href={item.href}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-all group border border-gray-100 hover:border-gray-200 relative">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                        <item.icon size={18} />
                      </div>
                      <span className="text-xs font-bold text-gray-600 text-center leading-tight">{item.label}</span>
                      {item.label === 'Orders' && stats.codPendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                          {stats.codPendingCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Go Live CTA */}
              <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    <span className="text-xs font-black uppercase tracking-widest opacity-90">Live Streaming</span>
                  </div>
                  <h3 className="text-xl font-black mb-1">Start Selling Live!</h3>
                  <p className="text-sm opacity-80 mb-4">Go live and sell to thousands of customers in real-time.</p>
                  <div className="flex items-center gap-3">
                    <Link href="/live/seller"
                      className="flex items-center gap-2 px-4 py-2.5 bg-white text-red-500 font-black text-sm rounded-xl hover:bg-white/90 transition-colors">
                      <Radio size={15} /> Go Live Now
                    </Link>
                    <button onClick={() => setActiveSection('live')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/30 transition-colors">
                      <Video size={15} /> Manage Streams
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Live Section — same as before */}
          {activeSection === 'live' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Streams',    value: recordings.length + liveStreams.length, icon: Radio, color: 'bg-red-50 text-red-500'   },
                  { label: 'Currently Live',   value: liveStreams.length,                     icon: Zap,   color: 'bg-orange-50 text-orange-500' },
                  { label: 'Total Recordings', value: recordings.length,                      icon: Video, color: 'bg-blue-50 text-blue-500'   },
                  { label: 'Total Viewers',    value: [...recordings, ...liveStreams].reduce((a, b) => a + (b.viewerCount || 0), 0), icon: Users, color: 'bg-green-50 text-green-500' },
                ].map(card => (
                  <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                      <card.icon size={18} />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{card.value}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">{card.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-gray-900 text-base mb-1">Start a New Stream</h2>
                    <p className="text-sm text-gray-500">Go live and showcase your products</p>
                  </div>
                  <Link href="/live/seller"
                    className="flex items-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-black text-sm rounded-xl transition-colors shadow-sm shadow-red-500/30 flex-shrink-0">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" /> Go Live Now
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-gray-900 text-base">All Recordings</h2>
                  <span className="text-xs font-bold text-gray-400">{recordings.length} total</span>
                </div>
                {loadingRec ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                ) : recordings.length === 0 ? (
                  <div className="text-center py-12">
                    <Video size={24} className="text-gray-400 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-700 mb-1">No recordings yet</h3>
                    <Link href="/live/seller" className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 transition-colors mt-2">
                      <Radio size={15} /> Start First Stream
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recordings.map(rec => (
                      <div key={rec.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-4 p-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Video size={18} className="text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{rec.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span className="flex items-center gap-1"><Clock size={11} /> {formatDuration(rec.startedAt, rec.endedAt)}</span>
                              <span className="flex items-center gap-1"><Eye size={11} /> {rec.viewerCount} viewers</span>
                              <span>{formatDate(rec.startedAt)}</span>
                            </div>
                          </div>
                          <button onClick={() => setConfirmDelete(confirmDelete === rec.id ? null : rec.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {confirmDelete === rec.id && (
                          <div className="px-4 pb-4">
                            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                              <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                              <p className="text-sm text-red-700 flex-1 font-medium">Delete this recording permanently?</p>
                              <button onClick={() => handleDelete(rec.id)} disabled={deleting === rec.id}
                                className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex-shrink-0">
                                {deleting === rec.id ? 'Deleting...' : 'Delete'}
                              </button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0">
                                Cancel
                              </button>
                            </div>
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