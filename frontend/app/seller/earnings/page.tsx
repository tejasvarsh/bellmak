'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, IndianRupee, TrendingUp,
  TrendingDown, ShoppingBag, Clock, CheckCircle,
  AlertCircle, Banknote, ArrowUpRight, Zap, Trophy,
  Target, Calendar, Package, ChevronRight
} from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 0
}).format(n)

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
})

// ─── Performance Score Calculator ───────────────────────────
function calcScore(stats: any): { score: number; grade: string; color: string; msg: string } {
  if (!stats) return { score: 0, grade: 'F', color: 'text-gray-400', msg: 'No data' }
  let score = 0
  if (stats.deliveryRate >= 90) score += 40
  else if (stats.deliveryRate >= 70) score += 25
  else score += 10
  if (stats.cancelRate <= 5) score += 30
  else if (stats.cancelRate <= 15) score += 15
  else score += 5
  if (stats.avgRating >= 4.5) score += 20
  else if (stats.avgRating >= 3.5) score += 12
  else score += 5
  if (stats.totalOrders >= 50) score += 10
  else if (stats.totalOrders >= 10) score += 6
  else score += 2

  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D'
  const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'
  const msg   = score >= 90 ? 'Outstanding Seller! 🏆' : score >= 80 ? 'Great Performance! ⭐' : score >= 60 ? 'Good, keep going 💪' : 'Needs improvement 📈'
  return { score, grade, color, msg }
}

export default function SellerEarningsPage() {
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [mounted,   setMounted]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [orders,    setOrders]    = useState<any[]>([])
  const [dashStats, setDashStats] = useState<any>(null)
  const [period,    setPeriod]    = useState<'week' | 'month' | 'all'>('month')

  useEffect(() => {
    setMounted(true)
    if (!isLoggedIn) { router.push('/login'); return }
    if (user?.role !== 'SELLER' && user?.role !== 'ADMIN') { router.push('/'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dashRes, ordersRes] = await Promise.all([
        api.get('/seller/dashboard').catch(() => null),
        api.get('/seller/orders?limit=200').catch(() => null),
      ])
      if (dashRes?.data?.data?.stats) setDashStats(dashRes.data.data.stats)
      if (ordersRes?.data?.data) setOrders(ordersRes.data.data)
    } finally { setLoading(false) }
  }

  // ─── Filter by period ───────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const now = new Date()
    return orders.filter(o => {
      const d = new Date(o.createdAt)
      if (period === 'week')  return (now.getTime() - d.getTime()) <= 7 * 86400000
      if (period === 'month') return (now.getTime() - d.getTime()) <= 30 * 86400000
      return true
    })
  }, [orders, period])

  // ─── Smart Analytics ────────────────────────────────────────
  const analytics = useMemo(() => {
    const delivered  = filteredOrders.filter(o => o.status === 'DELIVERED')
    const cancelled  = filteredOrders.filter(o => o.status === 'CANCELLED')
    const pending    = filteredOrders.filter(o => ['PENDING','CONFIRMED','PROCESSING'].includes(o.status))
    const shipped    = filteredOrders.filter(o => ['SHIPPED','OUT_FOR_DELIVERY'].includes(o.status))
    const codPending = filteredOrders.filter(o => o.paymentStatus === 'COD_PAID_BY_CUSTOMER')

    const commission    = dashStats?.commissionRate || 10
    const grossRevenue  = delivered.reduce((s, o) => s + (o.amount || 0), 0)
    const commissionAmt = Math.round(grossRevenue * commission / 100)
    const netEarnings   = grossRevenue - commissionAmt

    const pendingRevenue = pending.reduce((s, o) => s + (o.amount || 0), 0)
    const inTransitRev   = shipped.reduce((s, o) => s + (o.amount || 0), 0)

    const avgOrderValue  = delivered.length > 0 ? Math.round(grossRevenue / delivered.length) : 0
    const deliveryRate   = filteredOrders.length > 0 ? Math.round((delivered.length / filteredOrders.length) * 100) : 0
    const cancelRate     = filteredOrders.length > 0 ? Math.round((cancelled.length / filteredOrders.length) * 100) : 0

    // Daily earnings for mini chart
    const dailyMap: Record<string, number> = {}
    delivered.forEach(o => {
      const day = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      dailyMap[day] = (dailyMap[day] || 0) + (o.amount || 0)
    })
    const dailyData = Object.entries(dailyMap).slice(-7)
    const maxDaily  = Math.max(...dailyData.map(d => d[1]), 1)

    return {
      grossRevenue, netEarnings, commissionAmt, commission,
      pendingRevenue, inTransitRev, avgOrderValue,
      deliveryRate, cancelRate,
      totalOrders: filteredOrders.length,
      deliveredCount: delivered.length,
      cancelledCount: cancelled.length,
      pendingCount: pending.length,
      shippedCount: shipped.length,
      codPendingCount: codPending.length,
      codPendingOrders: codPending,
      avgRating: dashStats?.avgRating || 0,
      dailyData, maxDaily,
      recentDelivered: delivered.slice(0, 8),
    }
  }, [filteredOrders, dashStats])

  const perf = useMemo(() => calcScore({
    deliveryRate: analytics.deliveryRate,
    cancelRate:   analytics.cancelRate,
    avgRating:    analytics.avgRating,
    totalOrders:  analytics.totalOrders,
  }), [analytics])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#f4f5f7]">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/seller/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="font-black text-gray-900 leading-none">💰 Earnings</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">Revenue & payouts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Period Switcher */}
            <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
              {(['week', 'month', 'all'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {p === 'week' ? '7D' : p === 'month' ? '30D' : 'All'}
                </button>
              ))}
            </div>
            <button onClick={fetchData} disabled={loading}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <RefreshCw size={15} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <>
            {/* ── COD Alert ── */}
            {analytics.codPendingCount > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg shadow-green-200">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Banknote size={20} />
                    </div>
                    <div>
                      <p className="font-black">💰 {analytics.codPendingCount} COD Payment confirm karo!</p>
                      <p className="text-green-100 text-xs mt-0.5">
                        {fmt(analytics.codPendingOrders.reduce((s: number, o: any) => s + o.amount, 0))} pending confirmation
                      </p>
                    </div>
                  </div>
                  <Link href="/seller/orders"
                    className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 font-black text-xs rounded-xl hover:bg-green-50 transition-colors flex-shrink-0">
                    Confirm Now <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            )}

            {/* ── Hero Revenue Card ── */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
              <div className="absolute -bottom-6 right-20 w-24 h-24 bg-orange-500/10 rounded-full" />

              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Net Earnings</p>
                    <p className="text-4xl font-black text-white">{fmt(analytics.netEarnings)}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Gross: {fmt(analytics.grossRevenue)} — Commission: {fmt(analytics.commissionAmt)} ({analytics.commission}%)
                    </p>
                  </div>
                  <div className={`text-right ${perf.color}`}>
                    <p className="text-4xl font-black">{perf.grade}</p>
                    <p className="text-xs font-bold opacity-80">Score: {perf.score}/100</p>
                  </div>
                </div>

                {/* Mini bar chart */}
                {analytics.dailyData.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Daily Revenue</p>
                    <div className="flex items-end gap-1.5 h-12">
                      {analytics.dailyData.map(([day, val]) => (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                          <div className="w-full bg-orange-500 rounded-sm transition-all group-hover:bg-orange-400"
                            style={{ height: `${Math.max((val / analytics.maxDaily) * 100, 4)}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      {analytics.dailyData.map(([day]) => (
                        <span key={day} className="text-[8px] text-gray-500 flex-1 text-center">{day}</span>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.dailyData.length === 0 && (
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3">
                    <Zap size={14} className="text-orange-400" />
                    <p className="text-xs text-gray-400">Start selling to see your revenue chart!</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── 4 Stat Cards ── */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Pending Revenue',
                  value: fmt(analytics.pendingRevenue),
                  sub: `${analytics.pendingCount} orders`,
                  icon: Clock, color: 'bg-yellow-50 text-yellow-600',
                  badge: analytics.pendingCount > 0 ? 'Action needed' : null,
                  badgeColor: 'bg-yellow-100 text-yellow-700'
                },
                {
                  label: 'In Transit',
                  value: fmt(analytics.inTransitRev),
                  sub: `${analytics.shippedCount} orders`,
                  icon: Package, color: 'bg-blue-50 text-blue-600',
                  badge: null, badgeColor: ''
                },
                {
                  label: 'Avg Order Value',
                  value: fmt(analytics.avgOrderValue),
                  sub: `${analytics.deliveredCount} delivered`,
                  icon: TrendingUp, color: 'bg-green-50 text-green-600',
                  badge: null, badgeColor: ''
                },
                {
                  label: 'Total Orders',
                  value: analytics.totalOrders.toString(),
                  sub: `${period === 'week' ? 'Last 7 days' : period === 'month' ? 'Last 30 days' : 'All time'}`,
                  icon: ShoppingBag, color: 'bg-purple-50 text-purple-600',
                  badge: null, badgeColor: ''
                },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                      <card.icon size={16} />
                    </div>
                    {card.badge && (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-black text-gray-900">{card.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">{card.label}</p>
                  <p className="text-[9px] text-gray-300 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Performance Score ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Trophy size={14} className="text-yellow-500" />
                  </div>
                  Performance Score
                </h2>
                <span className={`text-2xl font-black ${perf.color}`}>{perf.score}/100</span>
              </div>

              <p className={`text-sm font-black mb-4 ${perf.color}`}>{perf.msg}</p>

              {/* Score breakdown */}
              <div className="space-y-3">
                {[
                  {
                    label: 'Delivery Rate',
                    value: analytics.deliveryRate,
                    max: 100,
                    suffix: '%',
                    color: analytics.deliveryRate >= 90 ? 'bg-green-500' : analytics.deliveryRate >= 70 ? 'bg-yellow-500' : 'bg-red-500',
                    target: '90%+ for max points'
                  },
                  {
                    label: 'Cancel Rate',
                    value: analytics.cancelRate,
                    max: 30,
                    suffix: '%',
                    color: analytics.cancelRate <= 5 ? 'bg-green-500' : analytics.cancelRate <= 15 ? 'bg-yellow-500' : 'bg-red-500',
                    target: 'Below 5% ideal'
                  },
                  {
                    label: 'Seller Rating',
                    value: analytics.avgRating * 20,
                    max: 100,
                    suffix: '',
                    color: analytics.avgRating >= 4 ? 'bg-green-500' : analytics.avgRating >= 3 ? 'bg-yellow-500' : 'bg-red-500',
                    target: `${analytics.avgRating > 0 ? analytics.avgRating.toFixed(1) : 'No'} rating`
                  },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-600">{m.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{m.target}</span>
                        <span className="text-xs font-black text-gray-900">
                          {m.label === 'Seller Rating' ? (analytics.avgRating > 0 ? analytics.avgRating.toFixed(1) + '★' : 'N/A') : `${analytics[m.label === 'Delivery Rate' ? 'deliveryRate' : 'cancelRate']}%`}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Earnings Breakdown ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                  <IndianRupee size={14} className="text-orange-500" />
                </div>
                Earnings Breakdown
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Gross Revenue',      value: analytics.grossRevenue,  color: 'text-gray-900',   prefix: '+' },
                  { label: `Commission (${analytics.commission}%)`, value: analytics.commissionAmt, color: 'text-red-500', prefix: '-' },
                  { label: 'Net Earnings',       value: analytics.netEarnings,   color: 'text-green-600',  prefix: '=', bold: true },
                ].map(row => (
                  <div key={row.label} className={`flex items-center justify-between py-2.5 ${row.bold ? 'border-t border-gray-100 mt-1' : ''}`}>
                    <span className={`text-sm ${row.bold ? 'font-black text-gray-900' : 'font-medium text-gray-600'}`}>
                      {row.label}
                    </span>
                    <span className={`font-black text-sm ${row.color}`}>
                      {row.prefix}{fmt(row.value)}
                    </span>
                  </div>
                ))}
              </div>

              {analytics.pendingRevenue > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="text-yellow-600 flex-shrink-0" />
                  <p className="text-xs font-bold text-yellow-700">
                    {fmt(analytics.pendingRevenue)} additional revenue in {analytics.pendingCount} pending orders
                  </p>
                </div>
              )}
            </div>

            {/* ── Recent Paid Orders ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle size={14} className="text-green-600" />
                  </div>
                  Recent Earnings
                </h2>
                <Link href="/seller/orders"
                  className="text-xs font-black text-orange-500 flex items-center gap-1 hover:underline">
                  All Orders <ArrowUpRight size={12} />
                </Link>
              </div>

              {analytics.recentDelivered.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">💸</div>
                  <p className="font-bold text-gray-400">No delivered orders yet</p>
                  <p className="text-xs text-gray-300 mt-1">Start selling to see earnings here!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {analytics.recentDelivered.map((order: any) => (
                    <div key={order.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                      <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={15} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-800">#{order.orderId}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar size={8} /> {fmtDate(order.createdAt)}
                          <span className="mx-1">·</span>
                          {order.customerName}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-green-600">
                          +{fmt(order.amount * (1 - (dashStats?.commissionRate || 10) / 100))}
                        </p>
                        <p className="text-[9px] text-gray-400">net earnings</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Smart Tips ── */}
            {(analytics.cancelRate > 10 || analytics.deliveryRate < 80 || analytics.pendingCount > 5) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Target size={14} className="text-blue-600" />
                  </div>
                  Smart Tips to Earn More
                </h2>
                <div className="space-y-2">
                  {analytics.cancelRate > 10 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                      <TrendingDown size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-red-700">High cancel rate ({analytics.cancelRate}%)</p>
                        <p className="text-[10px] text-red-500 mt-0.5">Keep accurate stock levels & confirm orders quickly</p>
                      </div>
                    </div>
                  )}
                  {analytics.pendingCount > 5 && (
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                      <Clock size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-yellow-700">{analytics.pendingCount} orders pending action</p>
                        <p className="text-[10px] text-yellow-500 mt-0.5">Process orders fast for better ratings & repeat buyers</p>
                      </div>
                    </div>
                  )}
                  {analytics.deliveryRate < 80 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <TrendingUp size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-blue-700">Low delivery rate ({analytics.deliveryRate}%)</p>
                        <p className="text-[10px] text-blue-500 mt-0.5">Ship faster & use reliable delivery partners</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}