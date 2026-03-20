'use client'
import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Search, Users, RefreshCw, ShieldOff, ShieldCheck, Loader2, X, Mail, Phone } from 'lucide-react'

const ROLE: Record<string,{bg:string;text:string}> = {
  ADMIN:    {bg:'bg-purple-100',text:'text-purple-700'},
  SELLER:   {bg:'bg-blue-100',  text:'text-blue-700'  },
  CUSTOMER: {bg:'bg-gray-100',  text:'text-gray-600'  },
}

const DUMMY: any[] = [
  { id:'1', name:'Rahul Sharma', email:'rahul@gmail.com', phone:'9876543210', role:'CUSTOMER', bellmakCoins:150, isActive:true,  createdAt:'2024-01-01', _count:{orders:5}  },
  { id:'2', name:'Priya Singh',  email:'priya@gmail.com', phone:'9876543211', role:'SELLER',   bellmakCoins:320, isActive:true,  createdAt:'2024-01-05', _count:{orders:12} },
  { id:'3', name:'Admin User',   email:'admin@bellmak.com',phone:'0000000000',role:'ADMIN',    bellmakCoins:0,   isActive:true,  createdAt:'2024-01-01', _count:{orders:0}  },
  { id:'4', name:'Amit Kumar',   email:'amit@gmail.com', phone:'9876543212', role:'CUSTOMER', bellmakCoins:80,  isActive:false, createdAt:'2024-01-10', _count:{orders:3}  },
  { id:'5', name:'Sneha Patel',  email:'sneha@gmail.com', phone:'9876543213', role:'CUSTOMER', bellmakCoins:210, isActive:true,  createdAt:'2024-01-15', _count:{orders:8}  },
  { id:'6', name:'Vikram Rao',   email:'vikram@gmail.com',phone:'9876543214', role:'SELLER',   bellmakCoins:450, isActive:true,  createdAt:'2024-01-20', _count:{orders:25} },
]

const fmtD = (d:string) => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})

const UserRow = memo(({u,banId,onBan}:{u:any;banId:string|null;onBan:(id:string,active:boolean)=>void}) => {
  const busy    = banId === u.id
  const roleClr = ROLE[u.role] ?? ROLE.CUSTOMER
  return (
    <tr className="hover:bg-gray-50/60 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] text-white flex items-center justify-center font-black text-sm flex-shrink-0">
            {u.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">{u.name}</p>
            <a href={`mailto:${u.email}`} className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"><Mail size={9}/> {u.email}</a>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <a href={`tel:${u.phone}`} className="text-xs text-gray-500 hover:text-blue-500 flex items-center gap-1"><Phone size={10}/>{u.phone||'—'}</a>
      </td>
      <td className="px-5 py-4">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${roleClr.bg} ${roleClr.text}`}>{u.role}</span>
      </td>
      <td className="px-5 py-4 text-sm font-bold text-gray-700">{u._count?.orders??0}</td>
      <td className="px-5 py-4 text-xs text-gray-600 font-medium">🪙 {u.bellmakCoins}</td>
      <td className="px-5 py-4 text-[11px] text-gray-400">{fmtD(u.createdAt)}</td>
      <td className="px-5 py-4">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${u.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
          {u.isActive?'● Active':'✕ Banned'}
        </span>
      </td>
      <td className="px-5 py-4">
        {u.role!=='ADMIN'
          ? <button onClick={()=>onBan(u.id,u.isActive)} disabled={busy}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border disabled:opacity-50 transition-all ${u.isActive?'bg-red-50 text-red-600 border-red-200 hover:bg-red-100':'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}>
              {busy?<Loader2 size={12} className="animate-spin"/>:u.isActive?<><ShieldOff size={12}/> Ban</>:<><ShieldCheck size={12}/> Unban</>}
            </button>
          : <span className="text-[10px] text-gray-400 font-medium">🛡 Protected</span>
        }
      </td>
    </tr>
  )
})
UserRow.displayName = 'UserRow'

export default function AdminUsers() {
  const [users,   setUsers]   = useState<any[]>(DUMMY)
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('ALL')
  const [banId,   setBanId]   = useState<string|null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/admin/users'); if(res.data.data?.length) setUsers(res.data.data) }
    catch {} finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchUsers() }, [])

  const onBan = useCallback(async (id:string, isActive:boolean) => {
    setBanId(id)
    try {
      await api.put(`/admin/users/${id}/ban`,{})
      setUsers(p=>p.map(u=>u.id===id?{...u,isActive:!isActive}:u))
      toast.success(isActive?'🚫 User banned!':'✅ User unbanned!')
    } catch { toast.error('Failed!') } finally { setBanId(null) }
  }, [])

  const counts = useMemo(() => {
    const c:Record<string,number> = {ALL:users.length}
    ;['CUSTOMER','SELLER','ADMIN'].forEach(r=>{c[r]=users.filter(u=>u.role===r).length})
    c['BANNED'] = users.filter(u=>!u.isActive).length
    return c
  }, [users])

  const filtered = useMemo(() => users
    .filter(u => filter==='ALL'?true:filter==='BANNED'?!u.isActive:u.role===filter)
    .filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search))
  , [users, filter, search])

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">👥 All Users</h1>
          <p className="text-xs text-gray-400 mt-0.5">{users.length} registered users · {counts.BANNED} banned</p>
        </div>
        <button onClick={fetchUsers} disabled={loading}
          className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm">
          <RefreshCw size={12} className={loading?'animate-spin':''}/> Refresh
        </button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm flex-1 min-w-[200px]">
          <Search size={14} className="text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, email or phone..." className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"/>
          {search&&<button onClick={()=>setSearch('')}><X size={13} className="text-gray-400"/></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(counts).map(([k,v])=>(
            <button key={k} onClick={()=>setFilter(k)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${filter===k?'bg-[#1a1a2e] text-white border-[#1a1a2e]':'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {k==='ADMIN'?'🛡️':k==='SELLER'?'🏪':k==='CUSTOMER'?'👤':k==='BANNED'?'🚫':'👥'} {k}
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${filter===k?'bg-white/20':'bg-gray-100 text-gray-500'}`}>{v}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {['User','Phone','Role','Orders','Coins','Joined','Status','Action'].map(h=>(
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u=><UserRow key={u.id} u={u} banId={banId} onBan={onBan}/>)}
            </tbody>
          </table>
        </div>
        {filtered.length===0&&(
          <div className="text-center py-16"><Users size={40} className="mx-auto text-gray-200 mb-3"/><p className="font-bold text-gray-400 text-sm">No users found</p></div>
        )}
      </div>
    </div>
  )
}