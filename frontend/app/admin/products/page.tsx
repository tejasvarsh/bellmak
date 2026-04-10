'use client'
import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Search, ShoppingBag, RefreshCw, CheckCircle, XCircle,
  Star, Trash2, Loader2, Package, X, Eye, Shield
} from 'lucide-react'

// ─── Dummy Data ───────────────────────────────────────────────
const DUMMY: any[] = [
  { id:'1', title:'Samsung Galaxy S23 Ultra',   price:89999, mrp:124999, stock:15, isApproved:false, isFeatured:false, isAssured:false, images:[], seller:{businessName:'Tech Store'},   category:{name:'Mobile Phones'}, createdAt:new Date(Date.now()-3600000).toISOString(),   slug:'samsung-s23'      },
  { id:'2', title:'Sony WH-1000XM5 Headphones', price:24990, mrp:34990,  stock:8,  isApproved:true,  isFeatured:true,  isAssured:true,  images:[], seller:{businessName:'Audio World'},   category:{name:'Electronics'},   createdAt:new Date(Date.now()-86400000).toISOString(),  slug:'sony-xm5'         },
  { id:'3', title:'Nike Air Max 270',            price:8995,  mrp:12995,  stock:30, isApproved:true,  isFeatured:false, isAssured:false, images:[], seller:{businessName:'Sports Hub'},    category:{name:'Sports'},        createdAt:new Date(Date.now()-172800000).toISOString(), slug:'nike-airmax'       },
  { id:'4', title:'Philips Air Fryer HD9200',    price:5999,  mrp:8995,   stock:2,  isApproved:false, isFeatured:false, isAssured:false, images:[], seller:{businessName:'Home Mart'},     category:{name:'Home Kitchen'},  createdAt:new Date(Date.now()-7200000).toISOString(),   slug:'philips-airfryer'  },
  { id:'5', title:'Harry Potter Complete Box Set',price:2499, mrp:3999,   stock:50, isApproved:true,  isFeatured:true,  isAssured:true,  images:[], seller:{businessName:'Book World'},    category:{name:'Books'},         createdAt:new Date(Date.now()-259200000).toISOString(), slug:'hp-books'          },
]

const fmt  = (n: number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0}).format(n)
const fmtD = (d: string) => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})

// ─── Product Row ──────────────────────────────────────────────
const ProductRow = memo(({ p, actionId, onApprove, onFeature, onAssured, onDelete, selected, onSelect }: any) => {
  const busy = actionId === p.id
  const disc = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0

  return (
    <tr className="hover:bg-orange-50/20 transition-colors">
      <td className="px-4 py-3.5">
        <input type="checkbox" checked={selected} onChange={onSelect}
          className="w-4 h-4 accent-[#F97316] rounded cursor-pointer" />
      </td>

      {/* Product */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 overflow-hidden">
            {p.images?.[0]
              ? <img src={p.images[0]} className="w-full h-full object-contain p-1" alt={p.title} />
              : <Package size={18} className="text-gray-300" />}
          </div>
          <div className="max-w-[180px]">
            <p className="font-bold text-gray-800 text-xs line-clamp-2">{p.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{p.category?.name} · {fmtD(p.createdAt)}</p>
            {p.stock <= 5 && <p className="text-[9px] font-black text-red-500 mt-0.5">⚠ Low stock: {p.stock}</p>}
          </div>
        </div>
      </td>

      {/* Seller */}
      <td className="px-4 py-3.5">
        <p className="text-xs font-bold text-blue-600">{p.seller?.businessName}</p>
      </td>

      {/* Price */}
      <td className="px-4 py-3.5">
        <p className="text-sm font-black text-gray-900">{fmt(p.price)}</p>
        <p className="text-[10px] text-gray-400 line-through">{fmt(p.mrp)}</p>
        {disc > 0 && <p className="text-[9px] font-black text-green-600">{disc}% off</p>}
      </td>

      {/* Stock */}
      <td className="px-4 py-3.5">
        <span className={`text-sm font-black ${p.stock <= 5 ? 'text-red-500' : p.stock <= 15 ? 'text-orange-500' : 'text-gray-700'}`}>
          {p.stock}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {p.isApproved ? '✅ Approved' : '⏳ Pending'}
          </span>
          {p.isFeatured && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 w-fit">⭐ Featured</span>
          )}
          {p.isAssured && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 w-fit flex items-center gap-1">
              <Shield size={8} /> Assured
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href={`/products/${p.slug}`} target="_blank"
            className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-bold rounded-lg hover:bg-gray-100 transition-all">
            <Eye size={9} /> View
          </Link>

          {/* Approve / Reject */}
          {!p.isApproved
            ? <button onClick={() => onApprove(p.id, true)} disabled={busy}
                className="flex items-center gap-1 px-2 py-1.5 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold rounded-lg hover:bg-green-100 disabled:opacity-50 transition-all">
                {busy ? <Loader2 size={9} className="animate-spin" /> : <CheckCircle size={9} />} Approve
              </button>
            : <button onClick={() => onApprove(p.id, false)} disabled={busy}
                className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded-lg hover:bg-red-100 disabled:opacity-50 transition-all">
                {busy ? <Loader2 size={9} className="animate-spin" /> : <XCircle size={9} />} Reject
              </button>
          }

          {/* Feature */}
          <button onClick={() => onFeature(p.id)} disabled={busy}
            className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold rounded-lg border transition-all disabled:opacity-50 ${
              p.isFeatured
                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}>
            <Star size={9} /> {p.isFeatured ? 'Unfeature' : 'Feature'}
          </button>

          {/* ✅ BELLMAK Assured — ONLY ADMIN */}
          <button onClick={() => onAssured(p.id, p.isAssured)} disabled={busy}
            className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold rounded-lg border transition-all disabled:opacity-50 ${
              p.isAssured
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
            }`}>
            {busy ? <Loader2 size={9} className="animate-spin" /> : <Shield size={9} />}
            {p.isAssured ? 'Assured ✅' : 'Mark Assured'}
          </button>

          {/* Delete */}
          <button onClick={() => onDelete(p.id)} disabled={busy}
            className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold rounded-lg hover:bg-red-100 disabled:opacity-50 transition-all">
            {busy ? <Loader2 size={9} className="animate-spin" /> : <Trash2 size={9} />}
          </button>
        </div>
      </td>
    </tr>
  )
})
ProductRow.displayName = 'ProductRow'

// ─── Main Page ────────────────────────────────────────────────
export default function AdminProducts() {
  const [products,  setProducts]  = useState<any[]>(DUMMY)
  const [loading,   setLoading]   = useState(false)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('ALL')
  const [catFilter, setCatFilter] = useState('')
  const [actionId,  setActionId]  = useState<string | null>(null)
  const [selected,  setSelected]  = useState<Set<string>>(new Set())

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/products')
      if (res.data.data?.length) setProducts(res.data.data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const onApprove = useCallback(async (id: string, approved: boolean) => {
    setActionId(id)
    try {
      await api.put(`/admin/products/${id}/approve`, { approved })
      setProducts(p => p.map(x => x.id === id ? { ...x, isApproved: approved } : x))
      toast.success(approved ? '✅ Approved!' : '❌ Rejected!')
    } catch { toast.error('Failed!') }
    finally { setActionId(null) }
  }, [])

  const onFeature = useCallback(async (id: string) => {
    setActionId(id)
    try {
      await api.put(`/admin/products/${id}/feature`, {})
      setProducts(p => p.map(x => x.id === id ? { ...x, isFeatured: !x.isFeatured } : x))
      toast.success('⭐ Updated!')
    } catch { toast.error('Failed!') }
    finally { setActionId(null) }
  }, [])

  // ✅ NEW: Admin toggle isAssured
  const onAssured = useCallback(async (id: string, currentAssured: boolean) => {
    setActionId(id)
    try {
      await api.patch(`/admin/products/${id}`, { isAssured: !currentAssured })
      setProducts(p => p.map(x => x.id === id ? { ...x, isAssured: !currentAssured } : x))
      toast.success(!currentAssured ? '🛡️ BELLMAK Assured badge added!' : '🛡️ Assured badge removed!')
    } catch { toast.error('Failed!') }
    finally { setActionId(null) }
  }, [])

  const onDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this product permanently?')) return
    setActionId(id)
    try {
      await api.delete(`/admin/products/${id}`)
      setProducts(p => p.filter(x => x.id !== id))
      toast.success('🗑️ Deleted!')
    } catch { toast.error('Failed!') }
    finally { setActionId(null) }
  }, [])

  const bulkApprove = async () => {
    const ids = Array.from(selected)
    setLoading(true)
    try {
      await Promise.all(ids.map(id => api.put(`/admin/products/${id}/approve`, { approved: true })))
      setProducts(p => p.map(x => selected.has(x.id) ? { ...x, isApproved: true } : x))
      toast.success(`✅ ${ids.length} products approved!`)
      setSelected(new Set())
    } catch { toast.error('Bulk approve failed') }
    finally { setLoading(false) }
  }

  const counts = useMemo(() => ({
    ALL:       products.length,
    PENDING:   products.filter(p => !p.isApproved).length,
    APPROVED:  products.filter(p => p.isApproved).length,
    FEATURED:  products.filter(p => p.isFeatured).length,
    ASSURED:   products.filter(p => p.isAssured).length,
    LOW_STOCK: products.filter(p => p.stock <= 5).length,
  }), [products])

  const categories = useMemo(() =>
    [...new Set(products.map(p => p.category?.name).filter(Boolean))], [products])

  const filtered = useMemo(() => products
    .filter(p =>
      filter === 'ALL'      ? true :
      filter === 'PENDING'  ? !p.isApproved :
      filter === 'APPROVED' ? p.isApproved  :
      filter === 'FEATURED' ? p.isFeatured  :
      filter === 'ASSURED'  ? p.isAssured   :
      p.stock <= 5
    )
    .filter(p => !catFilter || p.category?.name === catFilter)
    .filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.seller?.businessName?.toLowerCase().includes(search.toLowerCase()))
  , [products, filter, catFilter, search])

  const TABS = [
    { key:'ALL',       label:'📦 All',          count: counts.ALL       },
    { key:'PENDING',   label:'⏳ Pending',       count: counts.PENDING   },
    { key:'APPROVED',  label:'✅ Approved',      count: counts.APPROVED  },
    { key:'FEATURED',  label:'⭐ Featured',      count: counts.FEATURED  },
    { key:'ASSURED',   label:'🛡️ Assured',       count: counts.ASSURED   },
    { key:'LOW_STOCK', label:'⚠️ Low Stock',     count: counts.LOW_STOCK },
  ]

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">🛍️ All Products</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {products.length} products · {counts.PENDING} pending · {counts.ASSURED} assured
          </p>
        </div>
        <button onClick={fetchProducts} disabled={loading}
          className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-all">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="bg-[#1a1a2e] rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-white text-xs font-bold">{selected.size} selected</span>
          <button onClick={bulkApprove}
            className="bg-green-500 text-white text-xs font-black px-4 py-1.5 rounded-xl hover:bg-green-600 transition-colors">
            ✅ Bulk Approve
          </button>
          <button onClick={() => setSelected(new Set())}
            className="text-gray-400 hover:text-white text-xs flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        </div>
      )}

      {/* Search + Category Filter */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm flex-1 min-w-[200px]">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Product name or seller..."
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400" />
          {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-400" /></button>}
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-600 outline-none shadow-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filter === tab.key
                ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${filter === tab.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ✅ BELLMAK Assured Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <Shield size={16} className="text-blue-500 flex-shrink-0" />
        <div>
          <p className="text-xs font-black text-blue-700">BELLMAK Assured — Admin Only Feature</p>
          <p className="text-[10px] text-blue-500 mt-0.5">
            Sirf aap (admin) hi kisi product ko "Assured" mark kar sakte ho. Seller ye nahi kar sakta.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="w-8 px-4 py-3">
                  <input type="checkbox"
                    checked={filtered.length > 0 && filtered.every(p => selected.has(p.id))}
                    onChange={() => {
                      filtered.every(p => selected.has(p.id))
                        ? setSelected(new Set())
                        : setSelected(new Set(filtered.map(p => p.id)))
                    }}
                    className="w-4 h-4 accent-[#F97316] rounded cursor-pointer" />
                </th>
                {['Product','Seller','Price','Stock','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <ProductRow key={p.id} p={p} actionId={actionId}
                  onApprove={onApprove}
                  onFeature={onFeature}
                  onAssured={onAssured}
                  onDelete={onDelete}
                  selected={selected.has(p.id)}
                  onSelect={() => setSelected(prev => {
                    const n = new Set(prev)
                    n.has(p.id) ? n.delete(p.id) : n.add(p.id)
                    return n
                  })}
                />
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBag size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="font-bold text-gray-400 text-sm">No products found</p>
            <button onClick={() => { setFilter('ALL'); setSearch(''); setCatFilter('') }}
              className="mt-2 text-xs font-bold text-[#F97316] hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}