'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Tag, Plus, Trash2, Loader2, Copy, RefreshCw, X,
  ToggleLeft, ToggleRight, Search, Zap, Clock,
  CheckCircle, XCircle, TrendingUp, Filter
} from 'lucide-react'

const fmt    = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)
const fmtD   = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const isExp  = (d?: string) => d ? new Date(d) < new Date() : false

const EMPTY = { code: '', discountType: 'PERCENT', discountValue: '', minOrderValue: '', maxUses: '', expiresAt: '' }

export default function AdminCoupons() {
  const { user } = useAuthStore()
  const [coupons,   setCoupons]   = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [actionId,  setActionId]  = useState<string | null>(null)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<'all' | 'active' | 'inactive' | 'expired'>('all')
  const [form,      setForm]      = useState(EMPTY)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/coupons')
      setCoupons(res.data.data || [])
    } catch { toast.error('Failed to load coupons') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCoupons() }, [])

  const handleToggle = async (id: string, isActive: boolean) => {
    setActionId(id)
    try {
      await api.put(`/admin/coupons/${id}/toggle`, {})
      setCoupons(p => p.map(c => c.id === id ? { ...c, isActive: !isActive } : c))
      toast.success(isActive ? '⏸ Deactivated' : '✅ Activated')
    } catch { toast.error('Failed!') }
    finally { setActionId(null) }
  }

  const handleDelete = async (id: string) => {
    setActionId(id)
    try {
      await api.delete(`/admin/coupons/${id}`)
      setCoupons(p => p.filter(c => c.id !== id))
      setConfirmDel(null)
      toast.success('🗑️ Deleted!')
    } catch { toast.error('Failed!') }
    finally { setActionId(null) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code || !form.discountValue) { toast.error('Code & value required'); return }
    setSaving(true)
    try {
      const payload = {
        code:           form.code.toUpperCase(),
        discountType:   form.discountType,
        discountValue:  Number(form.discountValue),
        minOrderValue:  Number(form.minOrderValue) || 0,
        maxUses:        Number(form.maxUses) || null,
        expiresAt:      form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        isActive:       true,
      }
      const res = await api.post('/admin/coupons', payload)
      setCoupons(p => [res.data.data, ...p])
      toast.success('🎉 Coupon created!')
      setForm(EMPTY)
      setShowForm(false)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed!')
    } finally { setSaving(false) }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`📋 Copied: ${code}`)
  }

  // Smart filtering
  const filtered = useMemo(() => {
    return coupons.filter(c => {
      const matchSearch = !search || c.code.toLowerCase().includes(search.toLowerCase())
      const exp = isExp(c.expiresAt)
      if (filter === 'active')   return matchSearch && c.isActive && !exp
      if (filter === 'inactive') return matchSearch && !c.isActive
      if (filter === 'expired')  return matchSearch && exp
      return matchSearch
    })
  }, [coupons, search, filter])

  const stats = useMemo(() => ({
    active:   coupons.filter(c => c.isActive && !isExp(c.expiresAt)).length,
    inactive: coupons.filter(c => !c.isActive).length,
    expired:  coupons.filter(c => isExp(c.expiresAt)).length,
    totalUses: coupons.reduce((s, c) => s + (c.usedCount || 0), 0),
  }), [coupons])

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Tag size={20} className="text-[#F97316]" /> Coupons & Offers
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{coupons.length} total · {stats.active} active · {stats.expired} expired</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCoupons} disabled={loading}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-black px-4 py-2.5 rounded-xl shadow-sm shadow-orange-200 transition-colors">
            <Plus size={15} /> New Coupon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active',     value: stats.active,    icon: CheckCircle, color: 'bg-green-50 text-green-600 border-green-100',   tab: 'active'   as const },
          { label: 'Inactive',   value: stats.inactive,  icon: ToggleLeft,  color: 'bg-gray-50 text-gray-600 border-gray-200',      tab: 'inactive' as const },
          { label: 'Expired',    value: stats.expired,   icon: Clock,       color: 'bg-red-50 text-red-600 border-red-100',         tab: 'expired'  as const },
          { label: 'Total Uses', value: stats.totalUses, icon: TrendingUp,  color: 'bg-blue-50 text-blue-600 border-blue-100',      tab: 'all'      as const },
        ].map(s => (
          <button key={s.label} onClick={() => setFilter(f => f === s.tab ? 'all' : s.tab)}
            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all hover:shadow-sm ${s.color} ${filter === s.tab ? 'ring-2 ring-offset-1 ring-[#F97316]' : ''}`}>
            <div className="text-left">
              <p className="text-xs font-bold opacity-70">{s.label}</p>
              <p className="text-2xl font-black mt-0.5">{s.value}</p>
            </div>
            <s.icon size={20} className="opacity-60" />
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search coupon code..."
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400" />
          {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-400" /></button>}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-0.5">
          {(['all', 'active', 'inactive', 'expired'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all capitalize ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Coupon List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <Tag size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-black text-gray-400">No coupons found</p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#F97316] text-white font-black text-sm rounded-xl hover:bg-orange-600 transition-colors">
            <Plus size={14} /> Create First Coupon
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const exp     = isExp(c.expiresAt)
            const usePct  = c.maxUses ? Math.min(Math.round((c.usedCount / c.maxUses) * 100), 100) : 0
            const busy    = actionId === c.id
            const status  = exp ? 'expired' : c.isActive ? 'active' : 'inactive'

            return (
              <div key={c.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                status === 'active' ? 'border-gray-100' :
                status === 'expired' ? 'border-red-100 opacity-70' : 'border-gray-100 opacity-60'
              }`}>
                {/* Delete confirm bar */}
                {confirmDel === c.id && (
                  <div className="bg-red-50 border-b border-red-100 px-5 py-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-red-700">Delete "{c.code}" permanently?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDel(null)}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg">
                        Cancel
                      </button>
                      <button onClick={() => handleDelete(c.id)} disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-black rounded-lg hover:bg-red-600 disabled:opacity-50">
                        {busy ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    status === 'active' ? 'bg-orange-50' : 'bg-gray-100'
                  }`}>
                    <Tag size={18} className={status === 'active' ? 'text-[#F97316]' : 'text-gray-400'} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button onClick={() => copyCode(c.code)}
                        className="font-black text-lg text-gray-900 font-mono hover:text-[#F97316] transition-colors flex items-center gap-1.5 group">
                        {c.code}
                        <Copy size={12} className="text-gray-300 group-hover:text-[#F97316] transition-colors" />
                      </button>

                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        status === 'active'   ? 'bg-green-100 text-green-700' :
                        status === 'expired'  ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {status === 'active' ? '✅ Active' : status === 'expired' ? '⏰ Expired' : '⏸ Inactive'}
                      </span>

                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-50 text-[#F97316]">
                        {c.discountType === 'PERCENT' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400 mb-2">
                      <span>Min order: {fmt(c.minOrderValue || 0)}</span>
                      <span>Used: <strong className="text-gray-600">{c.usedCount || 0}</strong>{c.maxUses ? `/${c.maxUses}` : ''}</span>
                      {c.expiresAt && (
                        <span className={exp ? 'text-red-500 font-bold' : ''}>
                          {exp ? 'Expired' : 'Expires'}: {fmtD(c.expiresAt)}
                        </span>
                      )}
                    </div>

                    {/* Usage bar */}
                    {c.maxUses > 0 && (
                      <div className="flex items-center gap-2 max-w-xs">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${usePct > 80 ? 'bg-red-500' : 'bg-[#F97316]'}`}
                            style={{ width: `${usePct}%` }} />
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold">{usePct}% used</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggle(c.id, c.isActive)} disabled={busy || exp}
                      title={c.isActive ? 'Deactivate' : 'Activate'}
                      className={`p-2 rounded-xl border transition-all disabled:opacity-40 ${
                        c.isActive
                          ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                      }`}>
                      {busy ? <Loader2 size={14} className="animate-spin" /> :
                       c.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    <button onClick={() => setConfirmDel(confirmDel === c.id ? null : c.id)} disabled={busy}
                      className="p-2 rounded-xl bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-40">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Zap size={15} className="text-[#F97316]" />
                </div>
                <h2 className="font-black text-gray-900">Create Coupon</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-gray-600 mb-1.5 block">Code *</label>
                  <input value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                    placeholder="SAVE20"
                    className="w-full border-2 border-gray-100 focus:border-[#F97316] rounded-xl px-3 py-2.5 text-sm outline-none font-mono font-black tracking-wider transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-600 mb-1.5 block">Type</label>
                  <select value={form.discountType}
                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                    className="w-full border-2 border-gray-100 focus:border-[#F97316] rounded-xl px-3 py-2.5 text-sm outline-none bg-white transition-colors">
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-gray-600 mb-1.5 block">
                    Value * {form.discountType === 'PERCENT' ? '(%)' : '(₹)'}
                  </label>
                  <input type="number" value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                    placeholder={form.discountType === 'PERCENT' ? '10' : '100'}
                    min="1" max={form.discountType === 'PERCENT' ? '100' : undefined}
                    className="w-full border-2 border-gray-100 focus:border-[#F97316] rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-600 mb-1.5 block">Min Order (₹)</label>
                  <input type="number" value={form.minOrderValue}
                    onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
                    placeholder="499"
                    className="w-full border-2 border-gray-100 focus:border-[#F97316] rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-gray-600 mb-1.5 block">Max Uses</label>
                  <input type="number" value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Unlimited"
                    className="w-full border-2 border-gray-100 focus:border-[#F97316] rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-600 mb-1.5 block">Expires On</label>
                  <input type="date" value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border-2 border-gray-100 focus:border-[#F97316] rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
                </div>
              </div>

              {/* Preview */}
              {form.code && form.discountValue && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-3">
                  <Tag size={16} className="text-[#F97316] flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black text-gray-800">
                      Preview: <span className="font-mono text-[#F97316]">{form.code}</span> —
                      {form.discountType === 'PERCENT' ? ` ${form.discountValue}% off` : ` ₹${form.discountValue} off`}
                      {form.minOrderValue ? ` on orders above ₹${form.minOrderValue}` : ''}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-200">
                  {saving
                    ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
                    : <><Plus size={14} /> Create Coupon</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}