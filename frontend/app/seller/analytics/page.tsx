'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import Link from 'next/link'
import {
  TrendingUp, Package, ShoppingBag, IndianRupee,
  Star, ArrowLeft, RefreshCw, BarChart2, Users,
  ArrowUpRight, ArrowDownRight, Calendar, Zap
} from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 0
}).format(n)

function StatCard({ label, value, icon: Icon, color, prefix = '', suffix = '', change }: {
  label: string; value: number; icon: any
  color: string; prefix?: string; suffix?: string; change?: number
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${
            change >= 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
          }`}>
            {change >= 0
              ? <ArrowUpRight size={9} />
              : <ArrowDownRight size={9} />}
            {Math.abs(change)}%
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

export default function SellerAnalyticsPage() {
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [mounted,  setMounted]  = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [stats,    setStats]    = useState<any>(null)
  const [orders,   setOrders]   = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    if (!isLoggedIn) { router.push('/login'); return }
    if (user?.role !== 'SELLER' && user?.role !== 'ADMIN') { router.push('/'); return }
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [dashRes, ordersRes, productsRes] = await Promise.all([
        api.get('/seller/dashboard').catch(() => null),
        api.get('/seller/orders?limit=100').catch(() => null),
        api.get('/seller/products?limit=100').catch(() => null),
      ])
      if (dashRes?.data?.data?.stats) setStats(dashRes.data.data.stats)
      if (ordersRes?.data?.data) setOrders(ordersRes.data.data)
      if (productsRes?.data?.data) setProducts(productsRes.data.data)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  // Calculate analytics from orders
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED')
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED')
  const pendingOrders   = orders.filter(o => ['PENDING','CONFIRMED','PROCESSING'].includes(o.status))
  const shippedOrders   = orders.filter(o => ['SHIPPED','OUT_FOR_DELIVERY'].includes(o.status))

  const totalRevenue    = deliveredOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
  const avgOrderValue   = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0
  const cancelRate      = orders.length > 0 ? Math.round((cancelledOrders.length / orders.length) * 100) : 0
  const deliveryRate    = orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0

  // Top products by order count
  const productOrderMap: Record<string, number> = {}
  orders.forEach(o => {
    o.items?.forEach((item: any) => {
      productOrderMap[item.title] = (productOrderMap[item.title] || 0) + item.quantity
    })
  })
  const topProducts = Object.entries(productOrderMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Orders by status
  const statusData = [
    { label: 'Delivered',       count: deliveredOrders.length, color: 'bg-green-500',  pct: orders.length > 0 ? (deliveredOrders.length/orders.length)*100 : 0 },
    { label: 'Pending',         count: pendingOrders.length,   color: 'bg-yellow-500', pct: orders.length > 0 ? (pendingOrders.length/orders.length)*100 : 0   },
    { label: 'Shipped',         count: shippedOrders.length,   color: 'bg-blue-500',   pct: orders.length > 0 ? (shippedOrders.length/orders.length)*100 : 0   },
    { label: 'Cancelled',       count: cancelledOrders.length, color: 'bg-red-500',    pct: orders.length > 0 ? (cancelledOrders.length/orders.length)*100 : 0 },
  ]

  // Stock analysis
  const outOfStock  = products.filter(p => p.stock === 0)
  const lowStock    = products.filter(p => p.stock > 0 && p.stock <= 5)
  const goodStock   = products.filter(p => p.stock > 5)

  return (
    <div className="min-h-screen bg-[#f4f5f7]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/seller/dashboard"
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="font-black text-gray-900 leading-none">📊 Analytics</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">Business insights</p>
            </div>
          </div>
          <button onClick={fetchAnalytics} disabled={loading}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw size={15} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Revenue"    value={totalRevenue}             icon={IndianRupee} color="bg-orange-50 text-orange-500" prefix="₹" />
              <StatCard label="Total Orders"     value={orders.length}            icon={ShoppingBag} color="bg-purple-50 text-purple-600" />
              <StatCard label="Delivered Orders" value={deliveredOrders.length}   icon={Package}     color="bg-green-50 text-green-600"   />
              <StatCard label="Total Products"   value={products.length}          icon={BarChart2}   color="bg-blue-50 text-blue-600"     />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Avg Order Value"  value={Math.round(avgOrderValue)} icon={TrendingUp}  color="bg-indigo-50 text-indigo-600" prefix="₹" />
              <StatCard label="Delivery Rate"    value={deliveryRate}              icon={Zap}         color="bg-teal-50 text-teal-600"     suffix="%" />
              <StatCard label="Cancel Rate"      value={cancelRate}                icon={ArrowDownRight} color="bg-red-50 text-red-500"   suffix="%" />
              <StatCard label="Seller Rating"    value={stats?.avgRating || 0}     icon={Star}        color="bg-yellow-50 text-yellow-500" suffix="★" />
            </div>

            {/* Order Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                    <ShoppingBag size={14} className="text-purple-600" />
                  </div>
                  Order Breakdown
                </h2>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {statusData.map(s => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-600">{s.label}</span>
                          <span className="text-xs font-black text-gray-900">{s.count} ({Math.round(s.pct)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${s.color} rounded-full transition-all duration-500`}
                            style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock Analysis */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Package size={14} className="text-blue-600" />
                  </div>
                  Stock Analysis
                </h2>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No products yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: 'Good Stock (6+)', count: goodStock.length,  color: 'bg-green-500',  pct: (goodStock.length/products.length)*100  },
                      { label: 'Low Stock (1-5)', count: lowStock.length,   color: 'bg-yellow-500', pct: (lowStock.length/products.length)*100   },
                      { label: 'Out of Stock',    count: outOfStock.length, color: 'bg-red-500',    pct: (outOfStock.length/products.length)*100 },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-600">{s.label}</span>
                          <span className="text-xs font-black text-gray-900">{s.count} ({Math.round(s.pct)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${s.color} rounded-full transition-all duration-500`}
                            style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    {outOfStock.length > 0 && (
                      <Link href="/seller/products"
                        className="flex items-center gap-2 mt-3 text-xs font-black text-red-500 hover:underline">
                        Fix out of stock products <ArrowUpRight size={12} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={14} className="text-orange-500" />
                </div>
                Top Selling Products
              </h2>
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No sales data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map(([title, count], i) => {
                    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣']
                    const maxCount = topProducts[0][1]
                    return (
                      <div key={title} className="flex items-center gap-3">
                        <span className="text-base w-6 flex-shrink-0">{medals[i]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-gray-800 truncate">{title}</p>
                            <span className="text-xs font-black text-gray-900 flex-shrink-0 ml-2">{count} sold</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${(count/maxCount)*100}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                  <IndianRupee size={14} className="text-green-600" />
                </div>
                Payment Methods
              </h2>
              {orders.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">No payment data yet</p>
                </div>
              ) : (() => {
                const methods: Record<string, number> = {}
                orders.forEach(o => {
                  methods[o.paymentMethod] = (methods[o.paymentMethod] || 0) + 1
                })
                const colors: Record<string, string> = {
                  COD: 'bg-orange-500', UPI: 'bg-blue-500',
                  CARD: 'bg-purple-500', NETBANKING: 'bg-green-500'
                }
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(methods).map(([method, count]) => (
                      <div key={method} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                        <div className={`w-8 h-8 ${colors[method] || 'bg-gray-500'} rounded-lg mx-auto mb-2 flex items-center justify-center`}>
                          <IndianRupee size={14} className="text-white" />
                        </div>
                        <p className="font-black text-gray-900 text-lg">{count}</p>
                        <p className="text-[10px] font-bold text-gray-500">{method}</p>
                        <p className="text-[10px] text-gray-400">{Math.round((count/orders.length)*100)}%</p>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}