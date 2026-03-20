'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Shield, Eye, ChevronUp, X, User, Store, Crown, LogOut } from 'lucide-react'

export default function AdminSwitcher() {
  const { user, isLoggedIn, logout } = useAuthStore()
  const router = useRouter()
  const [mounted,  setMounted]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState<string | null>(null)
  const [users,    setUsers]    = useState<any[]>([])

  // ✅ KEY FIX: Wait for localStorage to load before checking role
  useEffect(() => { setMounted(true) }, [])

  // Don't render anything until mounted (fixes hydration bug)
  if (!mounted) return null
  // Not logged in or not admin — hide
  if (!isLoggedIn || user?.role !== 'ADMIN') return null

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data.data || [])
    } catch {}
  }

  const handleOpen = () => {
    setOpen(true)
    fetchUsers()
  }

  const switchView = (role: string) => {
    setOpen(false)
    if (role === 'ADMIN') {
      router.push('/admin')
      toast.success('Admin panel! 👑')
    } else if (role === 'SELLER') {
      router.push('/seller/dashboard')
      toast.success('Seller view! 🏪')
    } else {
      router.push('/')
      toast.success('Customer view! 🛒')
    }
  }

  const changeUserRole = async (userId: string, role: string, userName: string) => {
    if (!confirm(`"${userName}" ka role ${role} karna chahte ho?`)) return
    setLoading(userId)
    try {
      await api.patch(`/admin/users/${userId}/role`, { role })
      toast.success(`✅ ${userName} → ${role}`)
      fetchUsers()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed!')
    } finally {
      setLoading(null)
    }
  }

  const VIEWS = [
    { role: 'ADMIN',    icon: Crown, label: 'Admin Panel',   desc: 'Manage everything',    color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { role: 'SELLER',   icon: Store, label: 'Seller View',   desc: 'See seller dashboard', color: 'text-green-600 bg-green-50 border-green-200'   },
    { role: 'CUSTOMER', icon: User,  label: 'Customer View', desc: 'See customer side',    color: 'text-blue-600 bg-blue-50 border-blue-200'       },
  ]

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

        {/* Panel */}
        {open && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 overflow-hidden">

            {/* Header */}
            <div className="bg-[#1a1a2e] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-[#F97316]" />
                <span className="text-white font-black text-sm">Admin Control</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Current user */}
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 text-xs truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
              <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-black flex-shrink-0">
                👑 ADMIN
              </span>
            </div>

            {/* View switcher */}
            <div className="p-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Quick Navigation</p>
              <div className="space-y-1.5">
                {VIEWS.map(view => {
                  const Icon = view.icon
                  return (
                    <button key={view.role} onClick={() => switchView(view.role)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.01] ${view.color}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${view.color}`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm leading-none">{view.label}</p>
                        <p className="text-[10px] opacity-70 mt-0.5">{view.desc}</p>
                      </div>
                      <Eye size={13} className="opacity-50 flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* User role switcher */}
            {users.length > 0 && (
              <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Change User Roles
                </p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {users.filter(u => u.id !== user?.id).slice(0, 8).map((u: any) => (
                    <div key={u.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' :
                        u.role === 'SELLER' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{u.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{u.role}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {['CUSTOMER', 'SELLER', 'ADMIN'].map(role => (
                          <button key={role}
                            onClick={() => changeUserRole(u.id, role, u.name)}
                            disabled={u.role === role || loading === u.id}
                            title={role}
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-full transition-all ${
                              u.role === role
                                ? role === 'ADMIN' ? 'bg-purple-500 text-white' :
                                  role === 'SELLER' ? 'bg-green-500 text-white' :
                                  'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}>
                            {loading === u.id ? '...' :
                              role === 'CUSTOMER' ? 'C' :
                              role === 'SELLER' ? 'S' : 'A'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 mt-2 px-1">C = Customer · S = Seller · A = Admin</p>
              </div>
            )}

            {/* Logout */}
            <div className="px-3 pb-3">
              <button onClick={() => { logout(); router.push('/login'); setOpen(false) }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition border border-red-100">
                <LogOut size={13} /> Logout from Admin
              </button>
            </div>
          </div>
        )}

        {/* FAB Button */}
        <button onClick={open ? () => setOpen(false) : handleOpen}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl font-black text-sm transition-all duration-200 ${
            open ? 'bg-gray-800 text-white scale-95' : 'bg-[#1a1a2e] hover:bg-[#F97316] text-white hover:scale-105'
          }`}>
          <Shield size={16} />
          <span>Admin</span>
          <ChevronUp size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </>
  )
}