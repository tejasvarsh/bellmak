'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Package, Truck, CheckCircle2, Clock, ChevronRight,
  MapPin, Phone, Copy, ArrowLeft, RotateCcw, Star, XCircle
} from 'lucide-react'

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:          { label: 'Order Placed',     color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200',  icon: Clock        },
  CONFIRMED:        { label: 'Confirmed',        color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',      icon: CheckCircle2 },
  PROCESSING:       { label: 'Processing',       color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200',  icon: Package      },
  SHIPPED:          { label: 'Shipped',          color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200',  icon: Truck        },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200',  icon: Truck        },
  DELIVERED:        { label: 'Delivered',        color: 'text-green-600',  bg: 'bg-green-50 border-green-200',    icon: CheckCircle2 },
  CANCELLED:        { label: 'Cancelled',        color: 'text-red-600',    bg: 'bg-red-50 border-red-200',        icon: XCircle      },
  RETURN_REQUESTED: { label: 'Return Requested', color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200',      icon: RotateCcw    },
}

// ✅ Helper: Read address from any format
// Checkout saves both line1+name AND addressLine1+fullName
// This helper reads whichever is present
const getAddrField = (addr: any, ...keys: string[]) => {
  for (const key of keys) {
    if (addr?.[key]) return addr[key]
  }
  return ''
}

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()

  const [order,              setOrder]              = useState<any>(null)
  const [loading,            setLoading]            = useState(true)
  const [cancelling,         setCancelling]         = useState(false)
  const [confirmingDelivery, setConfirmingDelivery] = useState(false)
  const [confirmingCOD,      setConfirmingCOD]      = useState(false)
  const [showCancelModal,    setShowCancelModal]    = useState(false)
  const [cancelReason,       setCancelReason]       = useState('')

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`)
      setOrder(res.data.data)
    } catch {
      toast.error('Order not found!')
      router.push('/account/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelivery = async () => {
    setConfirmingDelivery(true)
    try {
      await api.post(`/orders/${orderId}/confirm-delivery`)
      toast.success('Delivery confirmed! 🎉')
      fetchOrder()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to confirm delivery')
    } finally {
      setConfirmingDelivery(false)
    }
  }

  const handleConfirmCODPayment = async () => {
    setConfirmingCOD(true)
    try {
      await api.post(`/orders/${orderId}/confirm-cod-payment`)
      toast.success('COD payment confirmed! Seller ko notify kar diya ✅')
      fetchOrder()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to confirm payment')
    } finally {
      setConfirmingCOD(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please select a reason'); return }
    setCancelling(true)
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: cancelReason })
      toast.success('Order cancelled!')
      setShowCancelModal(false)
      fetchOrder()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Cannot cancel this order')
    } finally {
      setCancelling(false)
    }
  }

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId as string)
    toast.success('Order ID copied!')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!order) return null

  const statusInfo = STATUS_INFO[order.status] || STATUS_INFO.PENDING
  const StatusIcon = statusInfo.icon
  const currentStep = STATUS_STEPS.indexOf(order.status)
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status)
  const canConfirmDelivery = ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status)
  const isCOD = order.paymentMethod === 'COD'
  const canConfirmCOD = isCOD && order.status === 'DELIVERED' && order.paymentStatus === 'COD_PENDING_CONFIRMATION'

  // ✅ FIX: Handle both address formats
  const addr = order.shippingAddress || order.address || {}
  const addrName    = getAddrField(addr, 'name', 'fullName')
  const addrLine1   = getAddrField(addr, 'line1', 'addressLine1')
  const addrLine2   = getAddrField(addr, 'line2', 'addressLine2')
  const addrCity    = getAddrField(addr, 'city')
  const addrState   = getAddrField(addr, 'state')
  const addrPincode = getAddrField(addr, 'pincode')
  const addrPhone   = getAddrField(addr, 'phone')

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Back */}
        <Link href="/account/orders"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary mb-5 transition-colors">
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-black text-gray-900 text-lg">Order Details</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 font-mono">#{order.orderId}</span>
                <button onClick={copyOrderId} className="text-gray-300 hover:text-primary transition-colors">
                  <Copy size={12} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold ${statusInfo.bg} ${statusInfo.color}`}>
              <StatusIcon size={14} />
              {statusInfo.label}
            </div>
          </div>
        </div>

        {/* ── COD ACTION CARD 1: Confirm Delivery ── */}
        {canConfirmDelivery && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white mb-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm">Order Mila? Confirm Karo!</p>
                <p className="text-blue-100 text-xs mt-0.5">
                  Delivery boy ne aapko order deliver kar diya? Button dabao — seller ko pata chalega.
                </p>
                <button onClick={handleConfirmDelivery} disabled={confirmingDelivery}
                  className="mt-3 flex items-center gap-2 bg-white text-blue-600 font-black text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition disabled:opacity-60">
                  {confirmingDelivery
                    ? <><div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /> Confirming...</>
                    : <>✅ Haan, Order Mila! Confirm Karo</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── COD ACTION CARD 2: Confirm Payment ── */}
        {canConfirmCOD && (
          <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-4 text-white mb-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💵</span>
              </div>
              <div className="flex-1">
                <p className="font-black text-sm">COD Payment Confirm Karo</p>
                <p className="text-purple-100 text-xs mt-0.5">
                  Kya aapne delivery boy ko{' '}
                  <span className="font-black text-white">
                    ₹{(order.totalAmount || order.total)?.toLocaleString('en-IN')}
                  </span>{' '}
                  cash de diya?
                </p>
                <button onClick={handleConfirmCODPayment} disabled={confirmingCOD}
                  className="mt-3 flex items-center gap-2 bg-white text-purple-600 font-black text-sm px-5 py-2.5 rounded-xl hover:bg-purple-50 transition disabled:opacity-60">
                  {confirmingCOD
                    ? <><div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /> Confirming...</>
                    : <>💵 Haan, Cash De Diya! ✅</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COD waiting for seller */}
        {order.paymentStatus === 'COD_PAID_BY_CUSTOMER' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-black text-blue-800 text-sm">Payment Confirmation Seller Ko Bheji Gayi</p>
              <p className="text-blue-600 text-xs mt-0.5">Seller jab verify karega tab order complete ho jayega.</p>
            </div>
          </div>
        )}

        {/* Order complete */}
        {order.paymentStatus === 'PAID' && order.status === 'DELIVERED' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-black text-green-800 text-sm">Order Complete! Payment Received ✅</p>
              <p className="text-green-600 text-xs mt-0.5">BELLMAK pe shopping karne ke liye shukriya!</p>
            </div>
          </div>
        )}

        {/* Tracking */}
        {!['CANCELLED','RETURN_REQUESTED'].includes(order.status) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h2 className="font-black text-gray-900 text-sm mb-5">Order Tracking</h2>
            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100">
                <div className="h-full bg-primary transition-all duration-500"
                  style={{ width: currentStep >= 0 ? `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }} />
              </div>
              <div className="flex justify-between relative">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep
                  const curr = i === currentStep
                  const info = STATUS_INFO[step]
                  const Icon = info.icon
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 ${
                        done ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-300'
                      } ${curr ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                        <Icon size={14} />
                      </div>
                      <span className={`text-[10px] font-bold text-center leading-tight ${done ? 'text-gray-700' : 'text-gray-300'}`}>
                        {info.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            {order.trackingId && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-center gap-3">
                <Truck size={16} className="text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-700">Tracking ID</p>
                  <p className="text-xs text-blue-600 font-mono">{order.trackingId}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cancelled */}
        {order.status === 'CANCELLED' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <XCircle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="font-black text-red-800 text-sm">Order Cancelled</p>
              {order.cancelReason && <p className="text-red-600 text-xs mt-0.5">Reason: {order.cancelReason}</p>}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h2 className="font-black text-gray-900 text-sm mb-4">Items Ordered ({order.items?.length || 0})</h2>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-gray-100 flex-shrink-0 overflow-hidden">
                  {item.image || item.product?.images?.[0]
                    ? <img src={item.image || item.product?.images?.[0]} alt={item.title} className="w-full h-full object-contain p-1" />
                    : <Package size={20} className="text-gray-300" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product?.slug || '#'}`}>
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 hover:text-primary transition-colors">
                      {item.title || item.product?.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">Qty: <span className="font-bold text-gray-600">{item.quantity}</span></p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400">₹{item.price.toLocaleString('en-IN')} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Address + Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
              <MapPin size={15} className="text-primary" /> Delivery Address
            </h2>
            {addrName ? (
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-bold text-gray-800">{addrName}</p>
                <p className="text-xs leading-relaxed">{addrLine1}</p>
                {addrLine2 && <p className="text-xs">{addrLine2}</p>}
                <p className="text-xs">{addrCity}, {addrState} — {addrPincode}</p>
                {addrPhone && (
                  <p className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <Phone size={11} /> {addrPhone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Address not available</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-black text-gray-900 text-sm mb-3">Payment Summary</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-700">₹{(order.subtotal)?.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-semibold text-green-600">-₹{order.discount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className={`font-semibold ${order.deliveryCharge === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                  {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-black text-gray-900">Total</span>
                <span className="font-black text-gray-900 text-lg">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                  {isCOD ? '💵 Cash on Delivery' : '💳 ' + order.paymentMethod}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                  order.paymentStatus === 'COD_PAID_BY_CUSTOMER' ? 'bg-blue-100 text-blue-700' :
                  order.paymentStatus === 'COD_PENDING_CONFIRMATION' ? 'bg-purple-100 text-purple-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.paymentStatus === 'COD_PENDING_CONFIRMATION' && '⏳ Confirm Payment'}
                  {order.paymentStatus === 'COD_PAID_BY_CUSTOMER' && '✅ Customer Confirmed'}
                  {order.paymentStatus === 'PAID' && '✅ PAID'}
                  {order.paymentStatus === 'PENDING' && '⏳ COD Pending'}
                  {!['PAID','COD_PAID_BY_CUSTOMER','COD_PENDING_CONFIRMATION','PENDING'].includes(order.paymentStatus) && order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {canCancel && (
            <button onClick={() => setShowCancelModal(true)}
              className="px-5 py-3 border-2 border-red-400 text-red-500 font-bold text-sm rounded-xl hover:bg-red-50 transition-colors">
              Cancel Order
            </button>
          )}
          {order.status === 'DELIVERED' && (
            <Link href={`/products/${order.items?.[0]?.product?.slug || ''}#reviews`}
              className="px-5 py-3 border-2 border-yellow-400 text-yellow-600 font-bold text-sm rounded-xl hover:bg-yellow-50 transition-colors flex items-center gap-2">
              <Star size={15} /> Write Review
            </Link>
          )}
          <Link href="/account/orders"
            className="px-5 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors">
            All Orders
          </Link>
        </div>

      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-black text-gray-800 text-lg mb-1">Cancel Order?</h3>
            <p className="text-sm text-gray-500 mb-4">Please tell us why you want to cancel.</p>
            <div className="space-y-2 mb-4">
              {['Changed my mind', 'Found better price elsewhere', 'Ordered by mistake', 'Delivery time too long', 'Other reason'].map(reason => (
                <button key={reason} onClick={() => setCancelReason(reason)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                    cancelReason === reason ? 'border-red-400 bg-red-50 text-red-700 font-bold' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                Keep Order
              </button>
              <button onClick={handleCancel} disabled={!cancelReason || cancelling}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-black transition disabled:opacity-60">
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}