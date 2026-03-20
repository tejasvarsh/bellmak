'use client'
import { useState, useEffect, useCallback, memo } from 'react'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Tag, Plus, Trash2, Loader2, Copy, ToggleLeft, ToggleRight, RefreshCw, X } from 'lucide-react'

const DUMMY: any[] = [
  { id:'1', code:'WELCOME10', type:'PERCENTAGE', value:10, minOrder:499,  maxUses:1000, usedCount:234, isActive:true,  expiresAt:new Date(Date.now()+30*86400000).toISOString(), description:'10% off on first order' },
  { id:'2', code:'FLAT100',   type:'FLAT',       value:100,minOrder:999,  maxUses:500,  usedCount:89,  isActive:true,  expiresAt:new Date(Date.now()+15*86400000).toISOString(), description:'₹100 flat discount' },
  { id:'3', code:'SUMMER30',  type:'PERCENTAGE', value:30, minOrder:1999, maxUses:200,  usedCount:198, isActive:false, expiresAt:new Date(Date.now()-86400000).toISOString(),  description:'Summer sale 30% off' },
  { id:'4', code:'FREESHIP',  type:'FLAT',       value:59, minOrder:299,  maxUses:2000, usedCount:1234,isActive:true,  expiresAt:new Date(Date.now()+60*86400000).toISOString(), description:'Free shipping coupon' },
]

const fmt = (n:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0}).format(n)
const fmtD= (d:string) => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
const isExp = (d:string) => new Date(d) < new Date()

const EMPTY_FORM = { code:'', type:'PERCENTAGE', value:'', minOrder:'', maxUses:'', expiresAt:'', description:'' }

export default function AdminCoupons() {
  const [coupons,  setCoupons]  = useState<any[]>(DUMMY)
  const [loading,  setLoading]  = useState(false)
  const [actionId, setActionId] = useState<string|null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/admin/coupons'); if(res.data.data?.length) setCoupons(res.data.data) }
    catch {} finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchCoupons() }, [])

  const handleToggle = async (id:string, isActive:boolean) => {
    setActionId(id)
    try {
      await api.put(`/admin/coupons/${id}/toggle`, {})
      setCoupons(p => p.map(c => c.id===id ? {...c, isActive:!isActive} : c))
      toast.success(isActive ? '⏸ Coupon deactivated' : '✅ Coupon activated')
    } catch { toast.error('Failed!') } finally { setActionId(null) }
  }

  const handleDelete = async (id:string) => {
    if(!confirm('Delete this coupon?')) return
    setActionId(id)
    try {
      await api.delete(`/admin/coupons/${id}`)
      setCoupons(p => p.filter(c => c.id !== id))
      toast.success('🗑️ Coupon deleted')
    } catch { toast.error('Failed!') } finally { setActionId(null) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code || !form.value || !form.expiresAt) { toast.error('Fill all required fields'); return }
    setSaving(true)
    try {
      const res = await api.post('/admin/coupons', {
        ...form,
        value:    Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxUses:  Number(form.maxUses)  || 1000,
      })
      setCoupons(p => [res.data.data ?? { id: Date.now().toString(), ...form, value:Number(form.value), usedCount:0, isActive:true }, ...p])
      toast.success('🎉 Coupon created!')
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch { toast.error('Failed to create coupon') } finally { setSaving(false) }
  }

  const copyCode = (code:string) => {
    navigator.clipboard.writeText(code)
    toast.success(`📋 Copied: ${code}`)
  }

  const active   = coupons.filter(c => c.isActive && !isExp(c.expiresAt)).length
  const inactive = coupons.filter(c => !c.isActive).length
  const expired  = coupons.filter(c => isExp(c.expiresAt)).length

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">🎟️ Coupons & Offers</h1>
          <p className="text-xs text-gray-400 mt-0.5">{coupons.length} coupons · {active} active · {expired} expired</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCoupons} disabled={loading}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm">
            <RefreshCw size={12} className={loading?'animate-spin':''}/> Refresh
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-black px-4 py-2 rounded-xl shadow-sm shadow-orange-200 transition-colors">
            <Plus size={14}/> Create Coupon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Active',   value:active,   color:'bg-green-50 text-green-700 border-green-200'  },
          { label:'Inactive', value:inactive, color:'bg-gray-50 text-gray-600 border-gray-200'     },
          { label:'Expired',  value:expired,  color:'bg-red-50 text-red-600 border-red-200'        },
        ].map(x => (
          <div key={x.label} className={`flex items-center justify-between p-4 rounded-2xl border-2 ${x.color}`}>
            <span className="text-sm font-bold">{x.label}</span>
            <span className="text-2xl font-black">{x.value}</span>
          </div>
        ))}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-black text-gray-800">Create New Coupon</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Code *</label>
                  <input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))}
                    placeholder="SALE20" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316] font-mono font-bold"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316] bg-white">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Value * ({form.type==='PERCENTAGE'?'%':'₹'})</label>
                  <input type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))}
                    placeholder={form.type==='PERCENTAGE'?'10':'100'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316]"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Min Order (₹)</label>
                  <input type="number" value={form.minOrder} onChange={e=>setForm(f=>({...f,minOrder:e.target.value}))}
                    placeholder="499" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316]"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Max Uses</label>
                  <input type="number" value={form.maxUses} onChange={e=>setForm(f=>({...f,maxUses:e.target.value}))}
                    placeholder="1000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316]"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Expires On *</label>
                  <input type="date" value={form.expiresAt} onChange={e=>setForm(f=>({...f,expiresAt:e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316]"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Description</label>
                <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  placeholder="e.g. 10% off on first order" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316]"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving?<><Loader2 size={14} className="animate-spin"/> Creating...</>:<><Plus size={14}/> Create Coupon</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon list */}
      <div className="space-y-3">
        {coupons.map(c => {
          const exp     = isExp(c.expiresAt)
          const usePct  = c.maxUses ? Math.round((c.usedCount/c.maxUses)*100) : 0
          const busy    = actionId === c.id
          return (
            <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${!c.isActive||exp?'opacity-60':'border-gray-100 hover:shadow-md'}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#F97316]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Tag size={18} className="text-[#F97316]"/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={()=>copyCode(c.code)}
                        className="font-black text-lg text-gray-900 font-mono hover:text-[#F97316] transition-colors flex items-center gap-1.5">
                        {c.code} <Copy size={13} className="text-gray-400"/>
                      </button>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive&&!exp?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                        {exp?'Expired':c.isActive?'Active':'Inactive'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316]">
                        {c.type==='PERCENTAGE'?`${c.value}% OFF`:`₹${c.value} OFF`}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      <span className="text-[10px] text-gray-400">Min order: {fmt(c.minOrder)}</span>
                      <span className="text-[10px] text-gray-400">Used: {c.usedCount}/{c.maxUses}</span>
                      <span className={`text-[10px] font-medium ${exp?'text-red-500':'text-gray-400'}`}>Expires: {fmtD(c.expiresAt)}</span>
                    </div>
                    {/* Usage bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                        <div className="h-full bg-[#F97316] rounded-full transition-all" style={{width:`${usePct}%`}}/>
                      </div>
                      <span className="text-[9px] text-gray-400">{usePct}% used</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleToggle(c.id, c.isActive)} disabled={busy||exp}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all disabled:opacity-50 ${c.isActive?'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100':'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}>
                    {busy?<Loader2 size={12} className="animate-spin"/>:c.isActive?<ToggleRight size={14}/>:<ToggleLeft size={14}/>}
                    {c.isActive?'Deactivate':'Activate'}
                  </button>
                  <button onClick={() => handleDelete(c.id)} disabled={busy}
                    className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-all">
                    {busy?<Loader2 size={12} className="animate-spin"/>:<Trash2 size={12}/>}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}