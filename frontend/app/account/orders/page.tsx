'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { Package, ChevronRight, Banknote, Truck, CheckCircle, RotateCcw } from 'lucide-react'

// ─── Config ──────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING:          'bg-yellow-100 text-yellow-700',
  CONFIRMED:        'bg-blue-100 text-blue-700',
  PROCESSING:       'bg-purple-100 text-purple-700',
  SHIPPED:          'bg-indigo-100 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED:        'bg-green-100 text-green-700',
  CANCELLED:        'bg-red-100 text-red-700',
  RETURN_REQUESTED: 'bg-pink-100 text-pink-700',
}

const STATUS_ICONS: Record<string, string> = {
  PENDING:          '⏳',
  CONFIRMED:        '✅',
  PROCESSING:       '⚙️',
  SHIPPED:          '🚚',
  OUT_FOR_DELIVERY: '📦',
  DELIVERED:        '✅',
  CANCELLED:        '❌',
  RETURN_REQUESTED: '↩️',
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 0
}).format(n)

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
})

// ─── Main Page ───────────────────────────────────────────────
export default function OrdersPage() {
  const [orders,           setOrders]           = useState<any[]>([])
  const [loading,          setLoading]          = useState(true)
  const [confirmingDel,    setConfirmingDel]    = useState<string | null>(null)
  const [confirmingCOD,    setConfirmingCOD]    = useState<string | null>(null)
  const [cancellingId,     setCancellingId]     = useState<string | null>(null)
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/orders')
      setOrders(res.data.data || [])
    } catch {
      setOrders(DUMMY_ORDERS as any)
    } finally { setLoading(false) }
  }

  // ✅ Customer confirms: "Mujhe order mil gaya"
  const handleConfirmDelivery = async (orderId: string) => {
    setConfirmingDel(orderId)
    try {
      await api.post(`/orders/${orderId}/confirm-delivery`)
      setOrders(prev => prev.map((o: any) =>
        o.orderId === orderId
          ? { ...o, status: 'DELIVERED', paymentStatus: o.paymentMethod === 'COD' ? 'COD_PENDING_CONFIRMATION' : 'PAID' }
          : o
      ))
      toast.success('Delivery confirmed! 🎉')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to confirm delivery')
    } finally { setConfirmingDel(null) }
  }

  // ✅ Customer confirms: "Maine cash de diya"
  const handleConfirmCOD = async (orderId: string) => {
    setConfirmingCOD(orderId)
    try {
      await api.post(`/orders/${orderId}/confirm-cod-payment`)
      setOrders(prev => prev.map((o: any) =>
        o.orderId === orderId ? { ...o, paymentStatus: 'COD_PAID_BY_CUSTOMER' } : o
      ))
      toast.success('Cash payment confirmed! Seller ko notify kar diya ✅')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to confirm payment')
    } finally { setConfirmingCOD(null) }
  }

  // ✅ Cancel order
  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId)
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: 'Customer cancelled' })
      setOrders(prev => prev.map((o: any) =>
        o.orderId === orderId ? { ...o, status: 'CANCELLED' } : o
      ))
      toast.success('Order cancelled')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Cannot cancel this order')
    } finally { setCancellingId(null) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )

  if (orders.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Package size={80} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet!</h2>
        <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
        <Link href="/" className="bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
          Shop Now
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Package className="text-orange-500" /> My Orders
          <span className="text-sm font-normal text-gray-400 ml-1">({orders.length})</span>
        </h1>

        <div className="space-y-4">
          {orders.map((order: any) => {

            const isDelConf  = confirmingDel  === order.orderId
            const isCODConf  = confirmingCOD  === order.orderId
            const isCancelling = cancellingId === order.orderId

            // Show "Confirm Delivery" button
            const showConfirmDelivery =
              ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status)

            // Show "Cash De Diya" button — COD + Delivered + pending
            const showCODConfirm =
              order.paymentMethod === 'COD' &&
              order.status === 'DELIVERED' &&
              order.paymentStatus === 'COD_PENDING_CONFIRMATION'

            // Show cancel button
            const showCancel =
              ['PENDING', 'CONFIRMED'].includes(order.status)

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

                {/* ✅ COD Cash Confirm Alert */}
                {showCODConfirm && (
                  <div className="bg-green-50 border-b border-green-200 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Banknote size={16} className="text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black text-green-800">💰 Cash Payment Confirm Karo!</p>
                        <p className="text-[11px] text-green-600 mt-0.5">
                          Kya aapne delivery boy ko cash de diya? — {fmt(order.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfirmCOD(order.orderId)}
                      disabled={isCODConf}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-xl disabled:opacity-60 flex-shrink-0">
                      {isCODConf
                        ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirming...</>
                        : '✅ Haan, Cash De Diya!'}
                    </button>
                  </div>
                )}

                {/* COD Payment confirmed badge */}
                {order.paymentMethod === 'COD' && order.paymentStatus === 'COD_PAID_BY_CUSTOMER' && (
                  <div className="bg-blue-50 border-b border-blue-100 px-5 py-2 flex items-center gap-2">
                    <CheckCircle size={13} className="text-blue-500" />
                    <p className="text-xs font-bold text-blue-700">Cash Payment Confirmed — Seller verify kar raha hai 🔔</p>
                  </div>
                )}

                {/* Order fully complete */}
                {order.paymentStatus === 'PAID' && order.status === 'DELIVERED' && (
                  <div className="bg-green-50 border-b border-green-100 px-5 py-2 flex items-center gap-2">
                    <CheckCircle size={13} className="text-green-500" />
                    <p className="text-xs font-bold text-green-700">✅ Order Complete — Thank you for shopping!</p>
                  </div>
                )}

                {/* Order Header */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-gray-800">#{order.orderId}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{fmtDate(order.createdAt)}</p>
                      {/* Payment method badge */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {order.paymentMethod === 'COD' ? '💵 COD' : `💳 ${order.paymentMethod}`}
                        </span>
                        {order.paymentStatus === 'PAID' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✅ Paid</span>
                        )}
                        {order.paymentStatus === 'PENDING' && order.paymentMethod !== 'COD' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⏳ Payment Pending</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_ICONS[order.status]} {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Items */}
                  {order.items?.slice(0, 2).map((item: any) => (
                    <div key={item.id} className="flex gap-3 mb-3">
                      <img
                        src={item.image || item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                        alt={item.title}
                        className="w-14 h-14 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.title}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold text-gray-900">{fmt(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 2 && (
                    <p className="text-xs text-gray-400 mb-3">+{order.items.length - 2} more items</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-bold text-gray-900">{fmt(order.totalAmount)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">

                      {/* ✅ Confirm Delivery Button */}
                      {showConfirmDelivery && (
                        <button
                          onClick={() => handleConfirmDelivery(order.orderId)}
                          disabled={isDelConf}
                          className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl disabled:opacity-60 transition-colors">
                          {isDelConf
                            ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirming...</>
                            : <><Truck size={12} /> Order Mila? Confirm Karo</>}
                        </button>
                      )}

                      {/* Cancel Button */}
                      {showCancel && (
                        <button
                          onClick={() => handleCancel(order.orderId)}
                          disabled={isCancelling}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 disabled:opacity-60 transition-colors">
                          {isCancelling ? 'Cancelling...' : '❌ Cancel'}
                        </button>
                      )}

                      {/* Return Button */}
                      {order.status === 'DELIVERED' && order.paymentStatus === 'PAID' && (
                        <Link href={`/account/orders/${order.orderId}`}
                          className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-500 px-3 py-2 rounded-xl border border-gray-200 hover:border-red-200 transition-colors">
                          <RotateCcw size={11} /> Return
                        </Link>
                      )}

                      <Link href={`/account/orders/${order.orderId}`}
                        className="flex items-center gap-1 text-orange-500 text-sm font-semibold hover:underline px-2 py-2">
                        Details <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const DUMMY_ORDERS = [
  {
    id: '1', orderId: 'BLM-2024-XY123', status: 'DELIVERED',
    paymentMethod: 'COD', paymentStatus: 'COD_PENDING_CONFIRMATION',
    createdAt: '2024-01-15', totalAmount: 89999,
    items: [{ id:'1', title:'Samsung Galaxy S23 Ultra', quantity:1, price:89999, image:'' }]
  },
  {
    id: '2', orderId: 'BLM-2024-AB456', status: 'SHIPPED',
    paymentMethod: 'COD', paymentStatus: 'PENDING',
    createdAt: '2024-01-20', totalAmount: 24990,
    items: [{ id:'2', title:'Sony WH-1000XM5 Headphones', quantity:1, price:24990, image:'' }]
  }
]