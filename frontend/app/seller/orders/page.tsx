'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Package, RefreshCw, Banknote, Clock, MapPin,
  ChevronRight, Search, X, Phone, Truck,
  CheckCircle, AlertCircle, ChevronDown
} from 'lucide-react'

// ─── Types & Config ───────────────────────────────────────────
const SC: Record<string, { color: string; label: string; icon: string }> = {
  PENDING:          { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending',          icon: '⏳' },
  CONFIRMED:        { color: 'bg-blue-100 text-blue-700 border-blue-200',       label: 'Confirmed',        icon: '✅' },
  PROCESSING:       { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Processing',       icon: '⚙️' },
  SHIPPED:          { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Shipped',          icon: '🚚' },
  OUT_FOR_DELIVERY: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Out for Delivery', icon: '📦' },
  DELIVERED:        { color: 'bg-green-100 text-green-700 border-green-200',    label: 'Delivered',        icon: '✅' },
  CANCELLED:        { color: 'bg-red-100 text-red-700 border-red-200',          label: 'Cancelled',        icon: '❌' },
}

// Next status flow
const NEXT: Record<string, { status: string; label: string; color: string }> = {
  PENDING:          { status: 'CONFIRMED',       label: '✅ Confirm Order',     color: 'bg-blue-600 hover:bg-blue-700 text-white'    },
  CONFIRMED:        { status: 'PROCESSING',       label: '⚙️ Start Processing',  color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  PROCESSING:       { status: 'SHIPPED',          label: '🚚 Mark Shipped',       color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  SHIPPED:          { status: 'OUT_FOR_DELIVERY', label: '📦 Out for Delivery',   color: 'bg-orange-500 hover:bg-orange-600 text-white' },
  OUT_FOR_DELIVERY: { status: 'DELIVERED',        label: '✅ Mark Delivered',     color: 'bg-green-600 hover:bg-green-700 text-white'   },
}

const TABS = ['ALL','PENDING','CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED']

const fmtPrice = (n: number) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', minimumFractionDigits:0 }).format(n)
const fmtDate  = (d: string) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })

// ─── Tracking Modal ───────────────────────────────────────────
function TrackingModal({ onClose, onConfirm, loading }: {
  onClose: () => void
  onConfirm: (trackingId: string, partner: string) => void
  loading: boolean
}) {
  const [trackingId, setTrackingId] = useState('')
  const [partner,    setPartner]    = useState('')

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck size={18} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-black text-gray-900">Mark as Shipped</h3>
              <p className="text-xs text-gray-400 mt-0.5">Tracking details add karo (optional)</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Tracking ID</label>
              <input
                value={trackingId}
                onChange={e => setTrackingId(e.target.value)}
                placeholder="e.g. BLU1234567890"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Delivery Partner</label>
              <select
                value={partner}
                onChange={e => setPartner(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
              >
                <option value="">Select partner...</option>
                {['Bluedart','Delhivery','DTDC','Shiprocket','Ekart','Amazon Logistics','Other'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(trackingId, partner)}
            disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Shipping...</>
              : <><Truck size={14} /> Confirm Ship</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Order Card ───────────────────────────────────────────────
function OrderCard({ order, onUpdate, updating, onConfirmCOD, confirmingCOD }: {
  order: any
  onUpdate: (id: string, status: string, trackingId?: string, partner?: string) => void
  updating: string | null
  onConfirmCOD: (orderId: string) => void
  confirmingCOD: string | null
}) {
  const [open,      setOpen]      = useState(false)
  const [showModal, setShowModal] = useState(false)

  const next       = NEXT[order.status]
  const isUpdating = updating === order.id
  const isCODConf  = confirmingCOD === order.orderId
  const sc         = SC[order.status] || SC.PENDING

  // Show COD confirm only when customer has confirmed cash payment
  const showCODConfirm = order.paymentMethod === 'COD' && order.paymentStatus === 'COD_PAID_BY_CUSTOMER'
  // Order is fully complete
  const isComplete = order.status === 'DELIVERED' && order.paymentStatus === 'PAID'

  const handleNextClick = () => {
    if (!next) return
    if (next.status === 'SHIPPED') setShowModal(true)
    else onUpdate(order.id, next.status)
  }

  return (
    <>
      {showModal && (
        <TrackingModal
          loading={isUpdating}
          onClose={() => setShowModal(false)}
          onConfirm={(trackingId, partner) => {
            onUpdate(order.id, 'SHIPPED', trackingId, partner)
            setShowModal(false)
          }}
        />
      )}

      <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
        showCODConfirm ? 'border-green-300 shadow-md shadow-green-100' :
        isComplete     ? 'border-blue-200 shadow-sm' :
                         'border-gray-100 shadow-sm hover:shadow-md'
      }`}>

        {/* ✅ COD Alert — Customer ne cash confirm kiya */}
        {showCODConfirm && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Banknote size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white">💰 Customer ne cash de diya!</p>
                <p className="text-green-100 text-xs mt-0.5">
                  {fmtPrice(order.amount)} — Kya aapko cash mila?
                </p>
              </div>
            </div>
            <button
              onClick={() => onConfirmCOD(order.orderId)}
              disabled={isCODConf}
              className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 text-xs font-black rounded-xl hover:bg-green-50 disabled:opacity-60 transition-colors flex-shrink-0"
            >
              {isCODConf
                ? <><div className="w-3 h-3 border-2 border-green-300 border-t-green-700 rounded-full animate-spin" /> Confirming...</>
                : <><CheckCircle size={13} /> Haan, Cash Mila!</>
              }
            </button>
          </div>
        )}

        {/* Complete badge */}
        {isComplete && (
          <div className="bg-blue-50 border-b border-blue-100 px-5 py-2 flex items-center gap-2">
            <CheckCircle size={13} className="text-blue-500" />
            <p className="text-xs font-bold text-blue-700">Order Complete — Payment Received ✅</p>
          </div>
        )}

        {/* Awaiting customer COD confirmation */}
        {order.paymentMethod === 'COD' && order.paymentStatus === 'COD_PENDING_CONFIRMATION' && (
          <div className="bg-orange-50 border-b border-orange-100 px-5 py-2 flex items-center gap-2">
            <AlertCircle size={13} className="text-orange-500" />
            <p className="text-xs font-bold text-orange-700">⏳ Customer se cash confirmation ka wait kar rahe hain</p>
          </div>
        )}

        {/* ── Card Header ── */}
        <div
          className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => setOpen(!open)}
        >
          {/* Icon */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${sc.color.split(' ')[0]}`}>
            {sc.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-black text-gray-900 text-sm">#{order.orderId}</p>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.color}`}>
                {sc.label}
              </span>
              {order.paymentMethod === 'COD' && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  order.paymentStatus === 'PAID'                   ? 'bg-green-100 text-green-700' :
                  order.paymentStatus === 'COD_PAID_BY_CUSTOMER'   ? 'bg-blue-100 text-blue-700'   :
                  order.paymentStatus === 'COD_PENDING_CONFIRMATION'? 'bg-orange-100 text-orange-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {order.paymentStatus === 'PAID'                    ? '✅ Paid'            :
                   order.paymentStatus === 'COD_PAID_BY_CUSTOMER'    ? '🔔 Cash Confirm Karo' :
                   order.paymentStatus === 'COD_PENDING_CONFIRMATION' ? '⏳ Awaiting Customer' :
                   '💵 COD'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1"><Clock size={9} /> {fmtDate(order.createdAt)}</span>
              <span>·</span>
              <span className="font-semibold text-gray-600 truncate">{order.customerName}</span>
            </p>
          </div>

          {/* Amount + chevron */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <p className="font-black text-gray-900">{fmtPrice(order.amount)}</p>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* ── Expanded Details ── */}
        {open && (
          <div className="border-t border-gray-100 divide-y divide-gray-50">

            {/* Items */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">🛒 Order Items</p>
              <div className="space-y-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image
                        ? <img src={item.image} className="w-full h-full object-contain p-1" alt={item.title} />
                        : <Package size={18} className="text-gray-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Qty: <strong className="text-gray-600">{item.quantity}</strong>
                        <span className="mx-1">×</span>
                        {fmtPrice(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-black text-gray-900 flex-shrink-0">
                      {fmtPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery + Payment Info */}
            <div className="grid grid-cols-2 gap-3 px-5 py-4">
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <MapPin size={9} /> Delivery
                </p>
                <p className="text-xs font-bold text-gray-800 truncate">
                  {(order.shippingAddress as any)?.fullName || order.customerName}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  {(order.shippingAddress as any)?.addressLine1 || order.city}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {order.city}{order.state ? `, ${order.state}` : ''}
                </p>
                {order.customerPhone && (
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                    <Phone size={9} /> {order.customerPhone}
                  </p>
                )}
              </div>

              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">💳 Payment</p>
                <p className="text-xs font-bold text-gray-700">{order.paymentMethod}</p>
                <p className={`text-[11px] font-bold mt-1 ${
                  order.paymentStatus === 'PAID'                    ? 'text-green-600' :
                  order.paymentStatus === 'COD_PAID_BY_CUSTOMER'    ? 'text-blue-600'  :
                  order.paymentStatus === 'COD_PENDING_CONFIRMATION' ? 'text-orange-500' :
                  'text-gray-400'
                }`}>
                  {order.paymentStatus === 'PAID'                    ? '✅ Paid'              :
                   order.paymentStatus === 'COD_PAID_BY_CUSTOMER'    ? '🔔 Customer Confirmed' :
                   order.paymentStatus === 'COD_PENDING_CONFIRMATION' ? '⏳ Awaiting Customer'  :
                   '⏳ Pending'}
                </p>
                {order.trackingId && (
                  <p className="text-[11px] text-indigo-600 font-bold mt-1.5 flex items-center gap-1">
                    <Truck size={9} /> {order.trackingId}
                  </p>
                )}
                {order.deliveryPartner && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{order.deliveryPartner}</p>
                )}
              </div>
            </div>

            {/* ✅ Action Buttons */}
            {!isComplete && order.status !== 'CANCELLED' && (
              <div className="px-5 py-4 bg-gray-50/50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">⚡ Actions</p>
                <div className="flex items-center gap-2 flex-wrap">

                  {/* Next Status Button */}
                  {next && !showCODConfirm && (
                    <button
                      onClick={handleNextClick}
                      disabled={isUpdating}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-60 ${next.color}`}
                    >
                      {isUpdating
                        ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                        : <>{next.label} <ChevronRight size={12} /></>
                      }
                    </button>
                  )}

                  {/* COD Confirm Button (in expanded too) */}
                  {showCODConfirm && (
                    <button
                      onClick={() => onConfirmCOD(order.orderId)}
                      disabled={isCODConf}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-xl disabled:opacity-60 transition-colors"
                    >
                      {isCODConf
                        ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirming...</>
                        : <><CheckCircle size={13} /> Cash Mila Confirm Karo</>
                      }
                    </button>
                  )}

                  {/* Cancel — only for pending/confirmed */}
                  {['PENDING', 'CONFIRMED'].includes(order.status) && (
                    <button
                      onClick={() => onUpdate(order.id, 'CANCELLED')}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 disabled:opacity-60 transition-colors"
                    >
                      ❌ Cancel Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <MapPin size={10} />
            {order.city}{order.state ? `, ${order.state}` : ''}
            {order.paymentMethod === 'COD' && (
              <span className="ml-1 font-bold text-orange-500">💵 COD</span>
            )}
          </p>

          <div className="flex items-center gap-2">
            {isComplete && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-black rounded-xl border border-green-200">
                <CheckCircle size={11} /> Complete
              </span>
            )}
            {/* Quick action in footer — don't expand for fast action */}
            {next && !open && !showCODConfirm && !isComplete && order.status !== 'CANCELLED' && (
              <button
                onClick={handleNextClick}
                disabled={isUpdating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black disabled:opacity-60 transition-all ${next.color}`}
              >
                {isUpdating
                  ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : next.label
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function SellerOrders() {
  const { isLoggedIn }                       = useAuthStore()
  const router                               = useRouter()
  const [orders,        setOrders]           = useState<any[]>([])
  const [loading,       setLoading]          = useState(true)
  const [filter,        setFilter]           = useState('ALL')
  const [search,        setSearch]           = useState('')
  const [updatingId,    setUpdatingId]       = useState<string | null>(null)
  const [confirmingCOD, setConfirmingCOD]    = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    fetchOrders()
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/orders')
      setOrders(res.data.data || [])
    } catch {
      toast.error('Orders load nahi hue')
    } finally { setLoading(false) }
  }, [])

  // ✅ Update order status (PENDING→CONFIRMED→PROCESSING→SHIPPED→OUT_FOR_DELIVERY→DELIVERED)
  const handleUpdate = useCallback(async (
    id: string, status: string, trackingId?: string, deliveryPartner?: string
  ) => {
    setUpdatingId(id)
    try {
      await api.patch(`/seller/orders/${id}/status`, { status, trackingId, deliveryPartner })
      setOrders(prev => prev.map((o: any) => o.id !== id ? o : {
        ...o,
        status,
        ...(trackingId      && { trackingId }),
        ...(deliveryPartner && { deliveryPartner }),
        ...(status === 'DELIVERED' && {
          paymentStatus: o.paymentMethod === 'COD' ? 'COD_PENDING_CONFIRMATION' : 'PAID'
        })
      }))
      toast.success(`✅ Order → ${status.replace(/_/g, ' ')}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Status update failed')
    } finally { setUpdatingId(null) }
  }, [])

  // ✅ Seller confirms: "Cash mila mujhe"
  const handleConfirmCOD = useCallback(async (orderId: string) => {
    setConfirmingCOD(orderId)
    try {
      await api.post(`/seller/orders/${orderId}/confirm-cod-received`)
      setOrders(prev => prev.map((o: any) =>
        o.orderId === orderId ? { ...o, paymentStatus: 'PAID' } : o
      ))
      toast.success('💰 COD Payment confirmed! Order complete ✅')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'COD confirm failed')
    } finally { setConfirmingCOD(null) }
  }, [])

  // Counts per tab
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length }
    TABS.slice(1).forEach(s => { c[s] = orders.filter((o: any) => o.status === s).length })
    return c
  }, [orders])

  // COD pending count for banner
  const codPending = useMemo(() =>
    orders.filter((o: any) => o.paymentStatus === 'COD_PAID_BY_CUSTOMER').length
  , [orders])

  // Filtered orders
  const filtered = useMemo(() => orders.filter((o: any) => {
    if (filter !== 'ALL' && o.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return o.orderId?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q)
  }), [orders, filter, search])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900">📦 My Orders</h1>
            <p className="text-sm text-gray-400 mt-0.5">{orders.length} total orders</p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-60 shadow-sm transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* ── COD Alert Banner ── */}
        {codPending > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 mb-5 text-white shadow-lg shadow-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Banknote size={20} />
              </div>
              <div className="flex-1">
                <p className="font-black">💰 {codPending} COD Payment{codPending > 1 ? 's' : ''} Confirm Karna Hai!</p>
                <p className="text-green-100 text-xs mt-0.5">Customer ne cash diya — neeche order card mein confirm karo</p>
              </div>
              <ChevronDown size={18} className="text-white/70 animate-bounce" />
            </div>
          </div>
        )}

        {/* ── Search ── */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-2.5 flex items-center gap-2 mb-4 shadow-sm">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Order ID ya customer name search karo..."
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={13} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filter === tab
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {tab === 'ALL' ? '📦 All' : `${SC[tab]?.icon || ''} ${SC[tab]?.label || tab}`}
              {(counts[tab] || 0) > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  filter === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Orders List ── */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Package size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="font-bold text-gray-400 text-lg">Koi order nahi mila</p>
            {(filter !== 'ALL' || search) && (
              <button
                onClick={() => { setFilter('ALL'); setSearch('') }}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order: any) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdate={handleUpdate}
                updating={updatingId}
                onConfirmCOD={handleConfirmCOD}
                confirmingCOD={confirmingCOD}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}