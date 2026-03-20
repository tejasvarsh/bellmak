'use client'
import { useState, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Users, ShoppingBag, Package, IndianRupee, TrendingUp,
  AlertCircle, Clock, Store, ArrowRight, RefreshCw,
  CheckCircle, Activity, CreditCard, Zap, Eye,
  Bell, BarChart2, ArrowUpRight, Star, Truck
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────
const fmt  = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)
const fmtN = (n: number) => new Intl.NumberFormat('en-IN').format(n)
const ago  = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ─── Status config ────────────────────────────────────────────
const S: Record<string, { dot: string; text: string; bg: string }> = {
  PENDING:          { dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50'  },
  CONFIRMED:        { dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50'    },
  PROCESSING:       { dot: 'bg-purple-400', text: 'text-purple-700', bg: 'bg-purple-50'  },
  SHIPPED:          { dot: 'bg-indigo-400', text: 'text-indigo-700', bg: 'bg-indigo-50'  },
  OUT_FOR_DELIVERY: { dot: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50'  },
  DELIVERED:        { dot: 'bg-green-400',  text: 'text-green-700',  bg: 'bg-green-50'   },
  CANCELLED:        { dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50'     },
}

// ─── Dummy data ───────────────────────────────────────────────
const DUMMY_STATS = {
  totalRevenue: 1284500, totalOrders: 247, totalUsers: 1893,
  totalProducts: 156, totalSellers: 48, pendingKYC: 5,
  pendingProducts: 12, todayOrders: 18, todayRevenue: 94500,
  deliveredOrders: 198, cancelledOrders: 12, pendingOrders: 37,
}
const DUMMY_ORDERS = [
  { id: '1', orderId: 'BLM-001', user: { name: 'Rahul Sharma' }, totalAmount: 89999,  status: 'PENDING',   paymentStatus: 'PENDING', createdAt: new Date(Date.now() - 300000).toISOString()  },
  { id: '2', orderId: 'BLM-002', user: { name: 'Priya Singh'  }, totalAmount: 24990,  status: 'SHIPPED',   paymentStatus: 'PAID',    createdAt: new Date(Date.now() - 900000).toISOString()  },
  { id: '3', orderId: 'BLM-003', user: { name: 'Amit Kumar'   }, totalAmount: 8995,   status: 'DELIVERED', paymentStatus: 'PAID',    createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '4', orderId: 'BLM-004', user: { name: 'Sneha Patel'  }, totalAmount: 5999,   status: 'CONFIRMED', paymentStatus: 'PAID',    createdAt: new Date(Date.now() - 600000).toISOString()  },
  { id: '5', orderId: 'BLM-005', user: { name: 'Vikram Rao'   }, totalAmount: 62990,  status: 'PROCESSING',paymentStatus: 'PAID',    createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '6', orderId: 'BLM-006', user: { name: 'Neha Gupta'   }, totalAmount: 3499,   status: 'PENDING',   paymentStatus: 'PENDING', createdAt: new Date(Date.now() - 120000).toISOString()  },
]

// ─── Mini bar chart (CSS only, no library) ───────────────────
const BarChart = memo(({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data, 1)
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-sm transition-all duration-500"
            style={{ height: `${Math.max((v / max) * 44, 4)}px`, background: color, opacity: i === data.length - 1 ? 1 : 0.5 }} />
          <span className="text-[8px] text-gray-400">{days[i]}</span>
        </div>
      ))}
    </div>
  )
})
BarChart.displayName = 'BarChart'

// ─── Stat card ────────────────────────────────────────────────
const StatCard = memo(({ label, value, sub, icon: Icon, gradient, trend, href, chart, chartColor }: any) => (
  <Link href={href ?? '#'}
    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group block">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 ${gradient} rounded-2xl flex items-center justify-center shadow-sm`}>
        <Icon size={18} className="text-white" />
      </div>
      {trend && (
        <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
          <TrendingUp size={8} /> {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-black text-gray-900 leading-none group-hover:text-[#F97316] transition-colors">{value}</p>
    <p className="text-xs font-semibold text-gray-400 mt-1">{label}</p>
    {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
    {chart && chartColor && (
      <div className="mt-3 pt-3 border-t border-gray-50">
        <BarChart data={chart} color={chartColor} />
      </div>
    )}
  </Link>
))
StatCard.displayName = 'StatCard'

// ─── Quick action card ────────────────────────────────────────
const ActionCard = memo(({ label, desc, href, gradient, icon: Icon, badge }: any) => (
  <Link href={href}
    className={`bg-gradient-to-br ${gradient} text-white rounded-2xl p-4 hover:opacity-90 hover:scale-[1.02] transition-all group relative overflow-hidden block`}>
    {badge > 0 && (
      <span className="absolute top-3 right-3 bg-white text-red-500 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">{badge}</span>
    )}
    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
      <Icon size={18} />
    </div>
    <p className="font-black text-sm">{label}</p>
    <p className="text-xs opacity-70 mt-0.5 flex items-center gap-1">{desc} <ArrowRight size={10} /></p>
  </Link>
))
ActionCard.displayName = 'ActionCard'

// ─── Order row ────────────────────────────────────────────────
const OrderRow = memo(({ o }: { o: any }) => {
  const s = S[o.status] ?? S.PENDING
  return (
    <tr className="hover:bg-gray-50/60 transition-colors">
      <td className="px-5 py-3">
        <Link href="/admin/orders" className="font-black text-xs text-[#1a1a2e] hover:text-[#F97316] transition-colors font-mono">
          #{o.orderId}
        </Link>
      </td>
      <td className="px-5 py-3 text-xs font-bold text-gray-700">{o.user?.name}</td>
      <td className="px-5 py-3 text-xs font-black text-gray-900">{fmt(o.totalAmount)}</td>
      <td className="px-5 py-3">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${s.bg} ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{o.status.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="px-5 py-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
          {o.paymentStatus === 'PAID' ? '✓ Paid' : '⏳ Unpaid'}
        </span>
      </td>
      <td className="px-5 py-3 text-[10px] text-gray-400">{ago(o.createdAt)}</td>
      <td className="px-5 py-3">
        <Link href="/admin/orders" className="text-[10px] font-bold text-[#F97316] hover:underline flex items-center gap-1">
          Manage <ArrowUpRight size={10} />
        </Link>
      </td>
    </tr>
  )
})
OrderRow.displayName = 'OrderRow'

// ─── Main ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [stats,   setStats]   = useState(DUMMY_STATS)
  const [orders,  setOrders]  = useState(DUMMY_ORDERS)
  const [loading, setLoading] = useState(false)
  const [lastSync,setLastSync]= useState(new Date())
  const [tick,    setTick]    = useState(0) // force re-render for "ago" timestamps

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [d] = await Promise.allSettled([api.get('/admin/dashboard')])
      if (d.status === 'fulfilled') {
        if (d.value.data?.data?.stats)        setStats(d.value.data.data.stats)
        if (d.value.data?.data?.recentOrders) setOrders(d.value.data.data.recentOrders)
      }
      setLastSync(new Date())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [])

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(() => { fetchAll(); setTick(t => t + 1) }, 60_000)
    return () => clearInterval(id)
  }, [fetchAll])

  // Refresh "ago" timestamps every 30s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const pendingOrders   = orders.filter(o => o.status === 'PENDING').length
  const weekRevenue     = [42000, 68000, 55000, 91000, 73000, 88000, stats.todayRevenue]
  const weekOrders      = [8, 14, 11, 19, 15, 17, stats.todayOrders]

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Here's what's happening on BELLMAK today.
            <span className="ml-2 text-[10px] text-gray-300">
              Last sync: {lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingOrders > 0 && (
            <Link href="/admin/orders"
              className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-black px-3 py-2 rounded-xl hover:bg-red-600 transition-colors">
              <Bell size={12} className="animate-pulse" /> {pendingOrders} New Orders
            </Link>
          )}
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Today snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Today's Revenue</p>
              <p className="text-3xl font-black mt-1">{fmt(stats.todayRevenue)}</p>
              <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                <Package size={10} /> {stats.todayOrders} orders today
              </p>
            </div>
            <div className="text-right">
              <BarChart data={weekRevenue} color="rgba(255,255,255,0.6)" />
              <p className="text-[9px] opacity-50 mt-1">Last 7 days</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] rounded-2xl p-5 text-white">
          <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Total Revenue</p>
          <p className="text-2xl font-black mt-2">{fmt(stats.totalRevenue)}</p>
          <p className="text-xs opacity-50 mt-1">{fmtN(stats.totalOrders)} total orders</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Health</p>
          <div className="mt-3 space-y-1.5">
            {[
              { label: 'Delivered', val: stats.deliveredOrders, color: 'bg-green-400'  },
              { label: 'Pending',   val: stats.pendingOrders,   color: 'bg-yellow-400' },
              { label: 'Cancelled', val: stats.cancelledOrders, color: 'bg-red-400'    },
            ].map(x => (
              <div key={x.label} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${x.color}`} />
                <span className="text-[10px] text-gray-500 flex-1">{x.label}</span>
                <span className="text-[10px] font-black text-gray-800">{x.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Users"    value={fmtN(stats.totalUsers)}    sub={`${stats.totalSellers} sellers`}           icon={Users}      gradient="bg-gradient-to-br from-purple-500 to-violet-600" trend="+23%" href="/admin/users"    chart={[120,145,132,168,155,172,stats.totalUsers%200]} chartColor="#8b5cf6" />
        <StatCard label="Total Products" value={fmtN(stats.totalProducts)} sub={`${stats.pendingProducts} pending review`} icon={ShoppingBag} gradient="bg-gradient-to-br from-[#F97316] to-[#EA580C]"   trend="+5%"  href="/admin/products" chart={[80,95,88,102,98,110,stats.totalProducts%200]} chartColor="#F97316" />
        <StatCard label="Total Orders"   value={fmtN(stats.totalOrders)}   sub={`${pendingOrders} need attention`}         icon={Package}    gradient="bg-gradient-to-br from-blue-500 to-blue-600"       trend="+8%"  href="/admin/orders"   chart={weekOrders} chartColor="#3b82f6" />
        <StatCard label="Active Sellers" value={fmtN(stats.totalSellers)}  sub={`${stats.pendingKYC} pending KYC`}         icon={Store}      gradient="bg-gradient-to-br from-green-500 to-emerald-600"  trend="+15%" href="/admin/sellers"  chart={[22,28,25,32,30,35,stats.totalSellers%50]} chartColor="#22c55e" />
      </div>

      {/* Alert banners */}
      {(stats.pendingKYC > 0 || stats.pendingProducts > 0 || pendingOrders > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pendingOrders > 0 && (
            <Link href="/admin/orders"
              className="flex items-center gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl hover:shadow-md transition-all group">
              <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock size={16} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-yellow-700">{pendingOrders} Orders Waiting</p>
                <p className="text-[10px] text-yellow-600 mt-0.5">Buyers are waiting — act now!</p>
              </div>
              <ArrowRight size={14} className="text-yellow-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          {stats.pendingProducts > 0 && (
            <Link href="/admin/products"
              className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl hover:shadow-md transition-all group">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-blue-700">{stats.pendingProducts} Products Pending</p>
                <p className="text-[10px] text-blue-600 mt-0.5">Review & approve seller listings</p>
              </div>
              <ArrowRight size={14} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          {stats.pendingKYC > 0 && (
            <Link href="/admin/sellers"
              className="flex items-center gap-3 p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl hover:shadow-md transition-all group">
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle size={16} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-orange-700">{stats.pendingKYC} KYC Pending</p>
                <p className="text-[10px] text-orange-600 mt-0.5">Sellers waiting for approval</p>
              </div>
              <ArrowRight size={14} className="text-orange-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">⚡ Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionCard label="Manage Orders"    desc="Track & update"       href="/admin/orders"    gradient="from-blue-500 to-blue-600"       icon={Package}    badge={pendingOrders} />
          <ActionCard label="Approve Products" desc="Review listings"      href="/admin/products"  gradient="from-[#F97316] to-[#EA580C]"     icon={ShoppingBag}badge={stats.pendingProducts} />
          <ActionCard label="KYC Approvals"    desc="Verify sellers"       href="/admin/sellers"   gradient="from-green-500 to-emerald-600"   icon={Store}      badge={stats.pendingKYC} />
          <ActionCard label="Create Coupon"    desc="Discounts & offers"   href="/admin/coupons"   gradient="from-purple-500 to-violet-600"   icon={Star}       badge={0} />
        </div>
      </div>

      {/* Live orders table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <Activity size={14} className="text-blue-500" />
            </div>
            <div>
              <h2 className="font-black text-gray-800 text-sm">Live Order Feed</h2>
              <p className="text-[10px] text-gray-400">Auto-refreshes every 60 seconds</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live
            </span>
          </div>
          <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-black text-[#F97316] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full transition-all">
            All Orders <ArrowUpRight size={11} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                {['Order ID', 'Customer', 'Amount', 'Status', 'Payment', 'Time', 'Action'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.slice(0, 8).map(o => <OrderRow key={o.id} o={o} />)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-6">
        {[
          { label: 'View All Orders',   href: '/admin/orders',    icon: Package,    color: 'text-blue-600 bg-blue-50 border-blue-100'    },
          { label: 'View All Products', href: '/admin/products',  icon: ShoppingBag,color: 'text-orange-600 bg-orange-50 border-orange-100' },
          { label: 'View All Sellers',  href: '/admin/sellers',   icon: Store,      color: 'text-green-600 bg-green-50 border-green-100'  },
          { label: 'View All Users',    href: '/admin/users',     icon: Users,      color: 'text-purple-600 bg-purple-50 border-purple-100'},
        ].map(x => (
          <Link key={x.href} href={x.href}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${x.color} hover:shadow-md transition-all group`}>
            <x.icon size={16} />
            <span className="text-xs font-bold flex-1">{x.label}</span>
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  )
}