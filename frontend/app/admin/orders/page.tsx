'use client'
import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Search, Package, RefreshCw, Loader2, ChevronDown,
  MapPin, CreditCard, Clock, CheckCircle, Truck,
  X, Phone, User, ShoppingBag, ArrowUpRight,
  Filter, Download, ChevronRight
} from 'lucide-react'

// ─── Config ───────────────────────────────────────────────────
const STEPS = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED']
const SC: Record<string, any> = {
  PENDING:          { bg:'bg-yellow-50', text:'text-yellow-700', border:'border-yellow-200', dot:'bg-yellow-400',  icon:'⏳', label:'Pending'          },
  CONFIRMED:        { bg:'bg-blue-50',   text:'text-blue-700',   border:'border-blue-200',   dot:'bg-blue-400',    icon:'✓',  label:'Confirmed'        },
  PROCESSING:       { bg:'bg-purple-50', text:'text-purple-700', border:'border-purple-200', dot:'bg-purple-400',  icon:'⚙',  label:'Processing'       },
  SHIPPED:          { bg:'bg-indigo-50', text:'text-indigo-700', border:'border-indigo-200', dot:'bg-indigo-400',  icon:'🚚', label:'Shipped'          },
  OUT_FOR_DELIVERY: { bg:'bg-orange-50', text:'text-orange-700', border:'border-orange-200', dot:'bg-orange-400',  icon:'📦', label:'Out for Delivery' },
  DELIVERED:        { bg:'bg-green-50',  text:'text-green-700',  border:'border-green-200',  dot:'bg-green-400',   icon:'✅', label:'Delivered'        },
  CANCELLED:        { bg:'bg-red-50',    text:'text-red-700',    border:'border-red-200',    dot:'bg-red-400',     icon:'✕',  label:'Cancelled'        },
}

const DUMMY: any[] = [
  { id:'1', orderId:'BLM-2024-XY123', status:'PENDING',   totalAmount:89999,  paymentMethod:'COD',  paymentStatus:'PENDING',  createdAt:new Date(Date.now()-300000).toISOString(),  user:{name:'Rahul Sharma', email:'rahul@gmail.com', phone:'9876543210'}, shippingAddress:{fullName:'Rahul Sharma', phone:'9876543210', addressLine1:'123 MG Road', city:'Mumbai', state:'Maharashtra', pincode:'400001'}, items:[{id:'1',title:'Samsung Galaxy S23 Ultra',quantity:1,price:89999,image:''}] },
  { id:'2', orderId:'BLM-2024-AB456', status:'SHIPPED',   totalAmount:24990,  paymentMethod:'UPI',  paymentStatus:'PAID',     createdAt:new Date(Date.now()-900000).toISOString(),  user:{name:'Priya Singh',  email:'priya@gmail.com', phone:'9876543211'}, shippingAddress:{fullName:'Priya Singh',  phone:'9876543211', addressLine1:'456 Linking Road', city:'Delhi', state:'Delhi', pincode:'110001'}, items:[{id:'2',title:'Sony WH-1000XM5',quantity:1,price:24990,image:''}] },
  { id:'3', orderId:'BLM-2024-CD789', status:'DELIVERED', totalAmount:8995,   paymentMethod:'CARD', paymentStatus:'PAID',     createdAt:new Date(Date.now()-86400000).toISOString(), user:{name:'Amit Kumar',  email:'amit@gmail.com',  phone:'9876543212'}, shippingAddress:{fullName:'Amit Kumar',  phone:'9876543212', addressLine1:'789 Park St', city:'Bangalore', state:'Karnataka', pincode:'560001'}, items:[{id:'3',title:'Nike Air Max 270',quantity:1,price:8995,image:''}] },
  { id:'4', orderId:'BLM-2024-EF012', status:'CONFIRMED', totalAmount:5999,   paymentMethod:'UPI',  paymentStatus:'PAID',     createdAt:new Date(Date.now()-600000).toISOString(),  user:{name:'Sneha Patel', email:'sneha@gmail.com', phone:'9876543213'}, shippingAddress:{fullName:'Sneha Patel', phone:'9876543213', addressLine1:'321 Lake View', city:'Pune', state:'Maharashtra', pincode:'411001'}, items:[{id:'4',title:'Philips Air Fryer',quantity:1,price:5999,image:''}] },
  { id:'5', orderId:'BLM-2024-GH345', status:'CANCELLED', totalAmount:62990,  paymentMethod:'CARD', paymentStatus:'REFUNDED', createdAt:new Date(Date.now()-172800000).toISOString(),user:{name:'Vikram Rao',  email:'vikram@gmail.com',phone:'9876543214'}, shippingAddress:{fullName:'Vikram Rao',  phone:'9876543214', addressLine1:'654 Hill Top', city:'Chennai', state:'Tamil Nadu', pincode:'600001'}, items:[{id:'5',title:'Dell Inspiron Laptop',quantity:1,price:62990,image:''}] },
  { id:'6', orderId:'BLM-2024-IJ678', status:'PROCESSING',totalAmount:3499,   paymentMethod:'UPI',  paymentStatus:'PAID',     createdAt:new Date(Date.now()-1800000).toISOString(), user:{name:'Neha Gupta',  email:'neha@gmail.com',  phone:'9876543215'}, shippingAddress:{fullName:'Neha Gupta',  phone:'9876543215', addressLine1:'987 Green Park', city:'Jaipur', state:'Rajasthan', pincode:'302001'}, items:[{id:'6',title:'Harry Potter Box Set',quantity:1,price:3499,image:''}] },
]

const fmt  = (n:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0}).format(n)
const fmtDT= (d:string) => new Date(d).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})
const ago  = (d:string) => {
  const s = Math.floor((Date.now()-new Date(d).getTime())/1000)
  if(s<60) return `${s}s ago`; if(s<3600) return `${Math.floor(s/60)}m ago`
  if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`
}

// ─── Status Badge ─────────────────────────────────────────────
const SBadge = memo(({status}:{status:string}) => {
  const c = SC[status] ?? SC.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label}
    </span>
  )
})
SBadge.displayName = 'SBadge'

// ─── Timeline ─────────────────────────────────────────────────
const Timeline = memo(({status}:{status:string}) => {
  if (status === 'CANCELLED') return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
      ✕ This order was cancelled
    </div>
  )
  const curr = STEPS.indexOf(status)
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {STEPS.map((step, i) => {
        const done = i <= curr; const active = i === curr
        const c = SC[step]
        return (
          <div key={step} className="flex flex-col items-center flex-1 min-w-[60px] relative">
            {i > 0 && (
              <div className="absolute top-3 right-1/2 h-0.5 w-full"
                style={{ background: i <= curr ? '#F97316' : '#e5e7eb' }} />
            )}
            <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
              active ? 'bg-[#F97316] border-[#F97316] shadow-md shadow-orange-200 scale-110'
              : done  ? 'bg-green-500 border-green-500'
              :         'bg-white border-gray-200'
            }`}>
              {done && !active
                ? <span className="text-white text-[10px]">✓</span>
                : active
                  ? <span className="text-white text-[10px]">{c.icon}</span>
                  : <span className="w-2 h-2 rounded-full bg-gray-200" />
              }
            </div>
            <p className={`text-[8px] font-bold mt-1 text-center leading-tight ${active?'text-[#F97316]':done?'text-green-600':'text-gray-300'}`}>
              {step.replace(/_/g,' ')}
            </p>
          </div>
        )
      })}
    </div>
  )
})
Timeline.displayName = 'Timeline'

// ─── Order Card ───────────────────────────────────────────────
const OrderCard = memo(({order, expanded, onToggle, onUpdate, updating, selected, onSelect}:any) => {
  const busy   = updating === order.id
  const next   = STEPS.filter((_,i) => i > STEPS.indexOf(order.status))
  const canAct = order.status !== 'DELIVERED' && order.status !== 'CANCELLED'

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all ${selected?'border-[#F97316] ring-2 ring-orange-100':'border-gray-100 shadow-sm'}`}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50/50" onClick={onToggle}>
        <input type="checkbox" checked={selected} onChange={onSelect}
          className="w-4 h-4 accent-[#F97316] rounded cursor-pointer flex-shrink-0"
          onClick={e => e.stopPropagation()} />

        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${SC[order.status]?.bg}`}>
          <span className="text-sm">{SC[order.status]?.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black text-gray-900 text-xs font-mono">#{order.orderId}</p>
            <SBadge status={order.status} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.paymentStatus==='PAID'?'bg-green-50 text-green-700':order.paymentStatus==='REFUNDED'?'bg-blue-50 text-blue-700':'bg-yellow-50 text-yellow-700'}`}>
              {order.paymentStatus==='PAID'?'✓ Paid':order.paymentStatus==='REFUNDED'?'↩ Refunded':'⏳ Unpaid'}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
            <span className="flex items-center gap-0.5"><User size={9}/> {order.user?.name}</span>
            <span className="flex items-center gap-0.5"><CreditCard size={9}/> {order.paymentMethod}</span>
            <span className="flex items-center gap-0.5"><Clock size={9}/> {ago(order.createdAt)}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="font-black text-sm text-gray-900">{fmt(order.totalAmount)}</p>
          <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${expanded?'rotate-180':''}`} />
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">

          {/* Timeline */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">📍 Live Tracking</p>
            <Timeline status={order.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Items */}
            <div className="md:col-span-1 space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">🛍 Items</p>
              {order.items?.map((item:any) => (
                <div key={item.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-white rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
                    {item.image ? <img src={item.image} className="w-full h-full object-contain p-0.5 rounded-lg" alt={item.title} />
                      : <ShoppingBag size={13} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-400">Qty:{item.quantity} × {fmt(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Address */}
            {order.shippingAddress && (
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin size={9}/> Delivery Address</p>
                <p className="text-xs font-bold text-gray-800">{order.shippingAddress.fullName}</p>
                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={9}/> {order.shippingAddress.phone}</p>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                  {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                </p>
              </div>
            )}

            {/* Payment */}
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><CreditCard size={9}/> Payment</p>
              <div className="flex justify-between"><span className="text-[10px] text-gray-500">Method</span><span className="text-[10px] font-bold text-gray-800">{order.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-gray-500">Status</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${order.paymentStatus==='PAID'?'bg-green-100 text-green-700':order.paymentStatus==='REFUNDED'?'bg-blue-100 text-blue-700':'bg-yellow-100 text-yellow-700'}`}>{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5"><span className="text-[10px] font-bold text-gray-600">Total</span><span className="text-sm font-black text-gray-900">{fmt(order.totalAmount)}</span></div>
              <p className="text-[9px] text-gray-400">{fmtDT(order.createdAt)}</p>
            </div>
          </div>

          {/* Status update */}
          {canAct && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Update →</p>
              {next.map(s => {
                const c = SC[s]
                return (
                  <button key={s} onClick={() => onUpdate(order.id, s)} disabled={busy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border-2 transition-all disabled:opacity-50 hover:shadow-sm ${c.bg} ${c.text} ${c.border}`}>
                    {busy ? <Loader2 size={10} className="animate-spin"/> : <span>{c.icon}</span>}
                    {c.label}
                  </button>
                )
              })}
              <button onClick={() => onUpdate(order.id,'CANCELLED')} disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border-2 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 disabled:opacity-50 transition-all">
                {busy ? <Loader2 size={10} className="animate-spin"/> : '✕'} Cancel Order
              </button>
            </div>
          )}

          {order.status === 'DELIVERED' && (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-100 rounded-xl text-xs font-bold text-green-600">
              ✅ Delivered successfully. No further action needed.
            </div>
          )}
        </div>
      )}
    </div>
  )
})
OrderCard.displayName = 'OrderCard'

// ─── Page ─────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders,      setOrders]      = useState<any[]>(DUMMY)
  const [loading,     setLoading]     = useState(false)
  const [filter,      setFilter]      = useState('ALL')
  const [search,      setSearch]      = useState('')
  const [expandedId,  setExpandedId]  = useState<string|null>(null)
  const [updatingId,  setUpdatingId]  = useState<string|null>(null)
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [lastSync,    setLastSync]    = useState(new Date())
  const [bulkStatus,  setBulkStatus]  = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/orders')
      if (res.data.data?.length) setOrders(res.data.data)
      setLastSync(new Date())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchOrders() }, [])
  useEffect(() => {
    const id = setInterval(fetchOrders, 30_000)
    return () => clearInterval(id)
  }, [fetchOrders])

  const handleUpdate = useCallback(async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus })
      setOrders(p => p.map(o => o.id===orderId ? {...o, status:newStatus} : o))
      toast.success(`✅ Order → ${newStatus.replace(/_/g,' ')}`)
    } catch { toast.error('Failed to update status') }
    finally { setUpdatingId(null) }
  }, [])

  const handleBulkUpdate = useCallback(async () => {
    if (!bulkStatus || selected.size === 0) return
    const ids = Array.from(selected)
    setLoading(true)
    try {
      await Promise.all(ids.map(id => api.patch(`/admin/orders/${id}/status`, { status: bulkStatus })))
      setOrders(p => p.map(o => selected.has(o.id) ? {...o, status: bulkStatus} : o))
      toast.success(`✅ ${ids.length} orders updated to ${bulkStatus}`)
      setSelected(new Set())
      setBulkStatus('')
    } catch { toast.error('Bulk update failed') }
    finally { setLoading(false) }
  }, [bulkStatus, selected])

  const counts = useMemo(() => {
    const c: Record<string,number> = { ALL: orders.length }
    Object.keys(SC).forEach(s => { c[s] = orders.filter(o => o.status===s).length })
    return c
  }, [orders])

  const filtered = useMemo(() => orders.filter(o => {
    if (filter !== 'ALL' && o.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return o.orderId?.toLowerCase().includes(q) || o.user?.name?.toLowerCase().includes(q) || o.user?.phone?.includes(search)
  }), [orders, filter, search])

  const allSelected = filtered.length > 0 && filtered.every(o => selected.has(o.id))
  const toggleAll   = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map(o => o.id)))
  }

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">📦 All Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {filtered.length} orders · synced {lastSync.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
            {loading && <span className="ml-2 text-[#F97316]">● syncing</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={fetchOrders} disabled={loading}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-all">
            <RefreshCw size={12} className={loading?'animate-spin':''} /> Refresh
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-[#1a1a2e] rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-white text-xs font-bold">{selected.size} selected</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
            className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-xl outline-none border border-white/20">
            <option value="">Set status...</option>
            {Object.keys(SC).map(s => <option key={s} value={s}>{SC[s].label}</option>)}
          </select>
          <button onClick={handleBulkUpdate} disabled={!bulkStatus || loading}
            className="bg-[#F97316] text-white text-xs font-black px-4 py-1.5 rounded-xl hover:bg-[#EA580C] disabled:opacity-50 transition-colors">
            Apply to {selected.size} orders
          </button>
          <button onClick={() => setSelected(new Set())} className="text-gray-400 hover:text-white text-xs">
            <X size={14} /> Clear
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-2 shadow-sm">
        <Search size={14} className="text-gray-400 flex-shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by Order ID, customer name or phone..."
          className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400" />
        {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-400 hover:text-gray-600" /></button>}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL',...Object.keys(SC)].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filter===s ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {s === 'ALL' ? '📦 All' : `${SC[s].icon} ${SC[s].label}`}
            {(counts[s]??0) > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${filter===s?'bg-white/20':'bg-gray-100 text-gray-500'}`}>{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Package size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="font-bold text-gray-400">No orders found</p>
          <button onClick={() => {setFilter('ALL'); setSearch('')}} className="mt-3 text-xs font-bold text-[#F97316] hover:underline">Clear filters</button>
        </div>
      ) : (
        <>
          {/* Select all */}
          <div className="flex items-center gap-2 px-1">
            <input type="checkbox" checked={allSelected} onChange={toggleAll}
              className="w-4 h-4 accent-[#F97316] rounded cursor-pointer" />
            <span className="text-xs text-gray-500 font-medium">Select all {filtered.length} orders</span>
          </div>
          <div className="space-y-3">
            {filtered.map(o => (
              <OrderCard key={o.id} order={o}
                expanded={expandedId === o.id}
                onToggle={() => setExpandedId(expandedId===o.id ? null : o.id)}
                onUpdate={handleUpdate}
                updating={updatingId}
                selected={selected.has(o.id)}
                onSelect={() => setSelected(prev => {
                  const n = new Set(prev)
                  n.has(o.id) ? n.delete(o.id) : n.add(o.id)
                  return n
                })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}