'use client'
import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Search, Store, RefreshCw, CheckCircle, XCircle, Loader2, X, Mail, Phone, Package, Star, ShoppingBag, TrendingUp, Eye } from 'lucide-react'

const KYC: Record<string,{bg:string;text:string;label:string}> = {
  PENDING:   {bg:'bg-gray-100',   text:'text-gray-600',   label:'Not Submitted'},
  SUBMITTED: {bg:'bg-yellow-100', text:'text-yellow-700', label:'Under Review' },
  APPROVED:  {bg:'bg-green-100',  text:'text-green-700',  label:'✓ Verified'   },
  REJECTED:  {bg:'bg-red-100',    text:'text-red-700',    label:'✕ Rejected'   },
}

const DUMMY: any[] = [
  { id:'1', businessName:'Tech Store India',  kycStatus:'SUBMITTED', isApproved:false, sellerRating:0,   totalSales:0,   commissionRate:10, createdAt:new Date(Date.now()-86400000).toISOString(),   user:{name:'Rahul Sharma', email:'rahul@gmail.com', phone:'9876543210'}, _count:{products:5}  },
  { id:'2', businessName:'Audio World',       kycStatus:'APPROVED',  isApproved:true,  sellerRating:4.5, totalSales:120, commissionRate:10, createdAt:new Date(Date.now()-604800000).toISOString(),  user:{name:'Priya Singh',  email:'priya@gmail.com', phone:'9876543211'}, _count:{products:18} },
  { id:'3', businessName:'Fashion Hub',       kycStatus:'PENDING',   isApproved:false, sellerRating:0,   totalSales:0,   commissionRate:10, createdAt:new Date(Date.now()-172800000).toISOString(),  user:{name:'Amit Kumar',   email:'amit@gmail.com',  phone:'9876543212'}, _count:{products:0}  },
  { id:'4', businessName:'Book World',        kycStatus:'REJECTED',  isApproved:false, sellerRating:0,   totalSales:0,   commissionRate:10, createdAt:new Date(Date.now()-259200000).toISOString(),  user:{name:'Sneha Patel',  email:'sneha@gmail.com', phone:'9876543213'}, _count:{products:2}  },
  { id:'5', businessName:'Sports Planet',     kycStatus:'APPROVED',  isApproved:true,  sellerRating:3.8, totalSales:67,  commissionRate:10, createdAt:new Date(Date.now()-1209600000).toISOString(), user:{name:'Vikram Rao',   email:'vikram@gmail.com',phone:'9876543214'}, _count:{products:24} },
]

const fmt  = (n:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0}).format(n)
const fmtD = (d:string) => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})

const SellerCard = memo(({s,actionId,onApprove}:any) => {
  const busy = actionId === s.id
  const kyc  = KYC[s.kycStatus] ?? KYC.PENDING
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl flex items-center justify-center flex-shrink-0">
              <Store size={22} className="text-white"/>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-gray-900">{s.businessName}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kyc.bg} ${kyc.text}`}>{kyc.label}</span>
                {s.isApproved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Active Seller</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">{s.user?.name}</p>
              <div className="flex flex-wrap gap-3 mt-1.5">
                <a href={`mailto:${s.user?.email}`} className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline"><Mail size={10}/>{s.user?.email}</a>
                <a href={`tel:${s.user?.phone}`} className="flex items-center gap-1 text-[11px] text-gray-500"><Phone size={10}/>{s.user?.phone}</a>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="text-[11px] text-gray-400 flex items-center gap-1"><Package size={10}/> {s._count?.products??0} products</span>
                {s.sellerRating>0&&<span className="text-[11px] text-gray-400 flex items-center gap-1"><Star size={10}/> {s.sellerRating}</span>}
                {s.totalSales>0&&<span className="text-[11px] text-gray-400 flex items-center gap-1"><ShoppingBag size={10}/> {s.totalSales} sales</span>}
                <span className="text-[11px] text-gray-400">📅 {fmtD(s.createdAt)}</span>
                <span className="text-[11px] text-gray-400">💸 {s.commissionRate}% commission</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <Link href="/admin/products" className="flex items-center gap-1 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-100 transition-all">
              <Eye size={12}/> Products
            </Link>
            {!s.isApproved && s.kycStatus!=='REJECTED' ? (
              <>
                <button onClick={()=>onApprove(s.id,true)} disabled={busy}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-black rounded-xl disabled:opacity-50 transition-colors shadow-sm">
                  {busy?<Loader2 size={12} className="animate-spin"/>:<CheckCircle size={13}/>} Approve
                </button>
                <button onClick={()=>onApprove(s.id,false)} disabled={busy}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 border border-red-200 text-xs font-black rounded-xl hover:bg-red-100 disabled:opacity-50 transition-all">
                  {busy?<Loader2 size={12} className="animate-spin"/>:<XCircle size={13}/>} Reject
                </button>
              </>
            ) : s.isApproved ? (
              <>
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
                  <CheckCircle size={13}/> Approved
                </span>
                <button onClick={()=>onApprove(s.id,false)} disabled={busy}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-all">
                  <XCircle size={13}/> Revoke
                </button>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                  <XCircle size={13}/> Rejected
                </span>
                <button onClick={()=>onApprove(s.id,true)} disabled={busy}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-xl hover:bg-green-100 disabled:opacity-50 transition-all">
                  <CheckCircle size={13}/> Re-approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
SellerCard.displayName = 'SellerCard'

export default function AdminSellers() {
  const [sellers,  setSellers]  = useState<any[]>(DUMMY)
  const [loading,  setLoading]  = useState(false)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('ALL')
  const [actionId, setActionId] = useState<string|null>(null)

  const fetchSellers = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/admin/sellers'); if(res.data.data?.length) setSellers(res.data.data) }
    catch {} finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchSellers() }, [])

  const onApprove = useCallback(async (id:string, approved:boolean) => {
    setActionId(id)
    try {
      await api.put(`/admin/sellers/${id}/approve`, {approved})
      setSellers(p=>p.map(s=>s.id===id?{...s,isApproved:approved,kycStatus:approved?'APPROVED':'REJECTED'}:s))
      toast.success(approved?'✅ Seller approved!':'❌ Seller rejected!')
    } catch { toast.error('Failed!') } finally { setActionId(null) }
  }, [])

  const counts = useMemo(() => ({
    ALL:      sellers.length,
    PENDING:  sellers.filter(s=>s.kycStatus==='SUBMITTED'||s.kycStatus==='PENDING').length,
    APPROVED: sellers.filter(s=>s.isApproved).length,
    REJECTED: sellers.filter(s=>s.kycStatus==='REJECTED').length,
  }), [sellers])

  const filtered = useMemo(() => sellers
    .filter(s => filter==='ALL'||(filter==='PENDING'?(s.kycStatus==='SUBMITTED'||s.kycStatus==='PENDING'):filter==='APPROVED'?s.isApproved:s.kycStatus==='REJECTED'))
    .filter(s => !search || s.businessName?.toLowerCase().includes(search.toLowerCase()) || s.user?.name?.toLowerCase().includes(search.toLowerCase()) || s.user?.email?.toLowerCase().includes(search.toLowerCase()))
  , [sellers, filter, search])

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">🏪 All Sellers</h1>
          <p className="text-xs text-gray-400 mt-0.5">{sellers.length} sellers · {counts.PENDING} pending KYC</p>
        </div>
        <button onClick={fetchSellers} disabled={loading}
          className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm">
          <RefreshCw size={12} className={loading?'animate-spin':''}/> Refresh
        </button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm flex-1 min-w-[200px]">
          <Search size={14} className="text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search seller, name, email..." className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"/>
          {search&&<button onClick={()=>setSearch('')}><X size={13} className="text-gray-400"/></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(counts).map(([k,v])=>(
            <button key={k} onClick={()=>setFilter(k)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${filter===k?'bg-[#1a1a2e] text-white border-[#1a1a2e]':'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {k==='PENDING'?'⏳':k==='APPROVED'?'✅':k==='REJECTED'?'❌':'🏪'} {k}
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${filter===k?'bg-white/20':'bg-gray-100 text-gray-500'}`}>{v}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length===0
        ? <div className="text-center py-16 bg-white rounded-2xl border border-gray-100"><Store size={40} className="mx-auto text-gray-200 mb-3"/><p className="font-bold text-gray-400 text-sm">No sellers found</p></div>
        : <div className="space-y-3">{filtered.map(s=><SellerCard key={s.id} s={s} actionId={actionId} onApprove={onApprove}/>)}</div>
      }
    </div>
  )
}