'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Package, MapPin, ChevronRight, Clock, CheckCircle,
  Truck, XCircle, AlertCircle, RefreshCw, Banknote, IndianRupee
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PENDING:          'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMED:        'bg-blue-100 text-blue-700 border-blue-200',
  PROCESSING:       'bg-purple-100 text-purple-700 border-purple-200',
  SHIPPED:          'bg-indigo-100 text-indigo-700 border-indigo-200',
  DELIVERED:        'bg-green-100 text-green-700 border-green-200',
  CANCELLED:        'bg-red-100 text-red-700 border-red-200',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700 border-orange-200',
}

const STATUS_ICONS: Record<string, any> = {
  PENDING:    AlertCircle,
  CONFIRMED:  CheckCircle,
  PROCESSING: RefreshCw,
  SHIPPED:    Truck,
  DELIVERED:  CheckCircle,
  CANCELLED:  XCircle,
}

// Seller order ke next possible status
const NEXT_STATUS: Record<string, string> = {
  PENDING:    'CONFIRMED',
  CONFIRMED:  'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED:    'DELIVERED',
}

const NEXT_STATUS_LABEL: Record<string, string> = {
  PENDING:    '✅ Confirm Order',
  CONFIRMED:  '⚙️ Start Processing',
  PROCESSING: '🚚 Mark Shipped',
  SHIPPED:    '📦 Mark Delivered',
}

const DUMMY_ORDERS = [
  {
    id: 'db-uuid-1',
    orderId: 'BLM-2024-XY123',
    customerName: 'Rahul Sharma',
    amount: 89999, status: 'DELIVERED', paymentMethod: 'COD',
    paymentStatus: 'COD_PAID_BY_CUSTOMER',
    createdAt: '2024-01-15', city: 'Mumbai', state: 'Maharashtra',
    items: [{ id: '1', title: 'Samsung Galaxy S23', quantity: 1, price: 89999, image: '' }]
  },
  {
    id: 'db-uuid-2',
    orderId: 'BLM-2024-AB456',
    customerName: 'Priya Singh',
    amount: 24990, status: 'SHIPPED', paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    createdAt: '2024-01-20', city: 'Delhi', state: 'Delhi',
    items: [{ id: '2', title: 'Sony Headphones', quantity: 1, price: 24990, image: '' }]
  },
  {
    id: 'db-uuid-3',
    orderId: 'BLM-2024-CD789',
    customerName: 'Amit Kumar',
    amount: 8995, status: 'PENDING', paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    createdAt: '2024-01-22', city: 'Bangalore', state: 'Karnataka',
    items: [{ id: '3', title: 'Nike Air Max', quantity: 1, price: 8995, image: '' }]
  },
]

export default function SellerOrders() {
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmingCOD, setConfirmingCOD] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/orders')
      setOrders(res.data.data || [])
    } catch {
      setOrders(DUMMY_ORDERS)
    } finally {
      setLoading(false)
    }
  }

  // Status update — uses order.id (UUID) for patch
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      await api.patch(`/seller/orders/${orderId}/status`, { status: newStatus })
      setOrders(prev => prev.map((o: any) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ))
      toast.success(`Order marked as ${newStatus}!`)
    } catch {
      toast.error('Failed to update status!')
    } finally {
      setUpdatingId(null)
    }
  }

  // ✅ BUG FIX: order.orderId use karo (BLM-xxx), not order.id (UUID)
  const handleConfirmCODReceived = async (orderBLMId: string) => {
    setConfirmingCOD(orderBLMId)
    try {
      await api.post(`/seller/orders/${orderBLMId}/confirm-cod-received`)
      setOrders(prev => prev.map((o: any) =>
        o.orderId === orderBLMId ? { ...o, paymentStatus: 'PAID' } : o
      ))
      toast.success('COD payment confirmed! Cash received ✅')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to confirm COD!')
    } finally {
      setConfirmingCOD(null)
    }
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0
  }).format(price)

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  const STATUS_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

  const filtered = filter === 'ALL'
    ? orders
    : orders.filter((o: any) => o.status === filter)

  const counts: Record<string, number> = { ALL: orders.length }
  STATUS_TABS.slice(1).forEach(s => {
    counts[s] = orders.filter((o: any) => o.status === s).length
  })

  const codPendingCount = orders.filter(
    (o: any) => o.paymentStatus === 'COD_PAID_BY_CUSTOMER'
  ).length

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">📦 Seller Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">{orders.length} total orders</p>
          </div>
          <button onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* COD Alert Banner */}
        {codPendingCount > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 mb-6 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Banknote size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm">
                  💰 {codPendingCount} COD Payment{codPendingCount > 1 ? 's' : ''} Confirm Karna Baki Hai!
                </p>
                <p className="text-green-100 text-xs mt-0.5">
                  Customer ne cash dene ki confirmation di hai — scroll down karke confirm karo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_TABS.map(status => (
            <button key={status} onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                filter === status
                  ? 'bg-[#2874f0] text-white border-[#2874f0] shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#2874f0] hover:text-[#2874f0]'
              }`}>
              {status}
              {counts[status] > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  filter === status ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{counts[status]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-gray-600 text-lg">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order: any) => {
              const StatusIcon = STATUS_ICONS[order.status] || Package
              const isUpdating = updatingId === order.id
              // ✅ FIX: orderId use karo COD confirm ke liye
              const isConfirmingThisCOD = confirmingCOD === order.orderId
              const nextStatus = NEXT_STATUS[order.status]

              const showCODConfirm =
                order.paymentMethod === 'COD' &&
                order.paymentStatus === 'COD_PAID_BY_CUSTOMER'

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* ✅ COD Confirm Alert — green banner at top of card */}
                  {showCODConfirm && (
                    <div className="bg-green-50 border-b border-green-200 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Banknote size={16} className="text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-black text-green-700">
                            💰 Customer ne cash dene ki confirmation di!
                          </p>
                          <p className="text-[10px] text-green-600 mt-0.5">
                            Amount: <span className="font-black">{formatPrice(order.amount)}</span> — Kya aapko cash mila?
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConfirmCODReceived(order.orderId)}
                        disabled={isConfirmingThisCOD}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-xl transition disabled:opacity-60 flex-shrink-0">
                        {isConfirmingThisCOD
                          ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirming...</>
                          : <>✅ Haan, Cash Mila!</>
                        }
                      </button>
                    </div>
                  )}

                  {/* Payment complete badge */}
                  {order.paymentStatus === 'PAID' && order.status === 'DELIVERED' && (
                    <div className="bg-blue-50 border-b border-blue-100 px-5 py-2 flex items-center gap-2">
                      <CheckCircle size={13} className="text-blue-500" />
                      <p className="text-xs font-bold text-blue-700">COD Payment Received ✅ — Order Complete</p>
                    </div>
                  )}

                  {/* Order Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2874f0]/10 rounded-xl flex items-center justify-center">
                        <Package size={18} className="text-[#2874f0]" />
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-sm">#{order.orderId}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} /> {formatDate(order.createdAt)}
                          <span className="mx-1">·</span>
                          <span className="font-bold text-gray-600">{order.customerName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        <StatusIcon size={11} />
                        {order.status}
                      </span>
                      <span className="font-black text-gray-800 text-sm">{formatPrice(order.amount)}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-5 py-3 space-y-2">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.image
                            ? <img src={item.image} className="w-full h-full object-contain p-1" alt={item.title} />
                            : <Package size={20} className="text-gray-300" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Qty: <span className="font-bold text-gray-600">{item.quantity}</span>
                            <span className="mx-1">×</span>
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={11} />
                        {order.city}{order.state ? `, ${order.state}` : ''}
                      </p>
                      {order.paymentMethod === 'COD' && (
                        <span className={`text-[10px] font-bold mt-0.5 inline-block ${
                          order.paymentStatus === 'PAID' ? 'text-green-600' :
                          order.paymentStatus === 'COD_PAID_BY_CUSTOMER' ? 'text-blue-600' :
                          'text-orange-500'
                        }`}>
                          💵 COD —{' '}
                          {order.paymentStatus === 'PAID' ? 'Payment Complete ✅' :
                           order.paymentStatus === 'COD_PAID_BY_CUSTOMER' ? 'Customer Confirmed 🔔' :
                           order.paymentStatus === 'COD_PENDING_CONFIRMATION' ? 'Awaiting Customer' :
                           'Pending'}
                        </span>
                      )}
                    </div>
                    {/* Next status button — hide when COD confirm needed */}
                    {nextStatus && !showCODConfirm && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, nextStatus)}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2874f0] hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all disabled:opacity-60">
                        {isUpdating
                          ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                          : <>{NEXT_STATUS_LABEL[order.status]} <ChevronRight size={13} /></>
                        }
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}