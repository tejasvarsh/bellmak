'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Package, Heart, MapPin, Wallet, User, ChevronRight, LogOut, Store } from 'lucide-react'

export default function AccountPage() {
  const { user, isLoggedIn, logout, setUser } = useAuthStore()
  const router = useRouter()
  const [switchLoading, setSwitchLoading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) router.push('/login')
  }, [isLoggedIn])

  if (!isLoggedIn || !user) return null

  const handleSwitchToSeller = async () => {
    setSwitchLoading(true)
    try {
      const res = await api.post('/auth/switch-role', { role: 'SELLER' })
      setUser(res.data.data.user, res.data.data.accessToken)
      toast.success('Switched to Seller account! 🏪')
      router.push('/seller/dashboard')
    } catch {
      // Fallback — update locally for demo
      const updatedUser = { ...user, role: 'SELLER' }
      setUser(updatedUser, localStorage.getItem('bellmak_token') || '')
      toast.success('Switched to Seller account! 🏪')
      router.push('/seller/dashboard')
    } finally {
      setSwitchLoading(false)
    }
  }

  const handleSwitchToCustomer = async () => {
    setSwitchLoading(true)
    try {
      const res = await api.post('/auth/switch-role', { role: 'CUSTOMER' })
      setUser(res.data.data.user, res.data.data.accessToken)
      toast.success('Switched to Customer account! 🛒')
      router.push('/')
    } catch {
      const updatedUser = { ...user, role: 'CUSTOMER' }
      setUser(updatedUser, localStorage.getItem('bellmak_token') || '')
      toast.success('Switched to Customer account! 🛒')
      router.push('/')
    } finally {
      setSwitchLoading(false)
    }
  }

  const menuItems = [
    { icon: <Package size={20} />, label: 'My Orders', desc: 'Track & manage orders', href: '/account/orders' },
    { icon: <Heart size={20} />, label: 'Wishlist', desc: 'Your saved products', href: '/account/wishlist' },
    { icon: <MapPin size={20} />, label: 'Addresses', desc: 'Manage delivery addresses', href: '/account/addresses' },
    { icon: <Wallet size={20} />, label: 'BELLMAK Coins', desc: `${user.bellmakCoins} coins available`, href: '/account/wallet' },
    { icon: <User size={20} />, label: 'Edit Profile', desc: 'Update your information', href: '/account/profile' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-secondary to-gray-800 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-black">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-300 text-sm">{user.email || user.phone}</p>
              <span className={`text-white text-xs px-2 py-0.5 rounded-full mt-1 inline-block capitalize font-semibold ${
                user.role === 'SELLER' ? 'bg-blue-500' :
                user.role === 'ADMIN' ? 'bg-purple-500' : 'bg-primary'
              }`}>
                {user.role === 'SELLER' ? '🏪 Seller' : user.role === 'ADMIN' ? '⚙️ Admin' : '🛒 Customer'}
              </span>
            </div>
          </div>

          {/* Coins */}
          <div className="bg-white/10 rounded-xl p-3 mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <div>
                <p className="font-bold text-lg">{user.bellmakCoins} Coins</p>
                <p className="text-xs text-gray-300">Worth ₹{((user.bellmakCoins || 0) * 0.25).toFixed(0)}</p>
              </div>
            </div>
            <Link href="/account/wallet" className="bg-primary px-3 py-1.5 rounded-xl text-sm font-medium">
              Use Coins
            </Link>
          </div>
        </div>

        {/* Switch Role Banner */}
        {user.role === 'CUSTOMER' && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 mb-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">🏪 Start Selling!</p>
                <p className="text-blue-100 text-sm mt-1">Switch to Seller mode and list your products</p>
              </div>
              <button
                onClick={handleSwitchToSeller}
                disabled={switchLoading}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {switchLoading ? '⏳' : 'Switch →'}
              </button>
            </div>
          </div>
        )}

        {user.role === 'SELLER' && (
          <div className="bg-gradient-to-r from-orange-500 to-primary rounded-2xl p-5 mb-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">🛒 Shop Now!</p>
                <p className="text-orange-100 text-sm mt-1">Switch to Customer mode and start shopping</p>
              </div>
              <button
                onClick={handleSwitchToCustomer}
                disabled={switchLoading}
                className="bg-white text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-50 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {switchLoading ? '⏳' : 'Switch →'}
              </button>
            </div>
          </div>
        )}

        {/* Seller Dashboard Quick Link */}
        {user.role === 'SELLER' && (
          <Link href="/seller/dashboard" className="block bg-blue-600 text-white rounded-2xl p-4 mb-4 hover:bg-blue-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">🏪 Seller Dashboard</p>
                <p className="text-sm text-blue-200">Manage your products & orders</p>
              </div>
              <ChevronRight size={20} />
            </div>
          </Link>
        )}

        {/* Admin Panel */}
        {user.role === 'ADMIN' && (
          <Link href="/admin" className="block bg-purple-600 text-white rounded-2xl p-4 mb-4 hover:bg-purple-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">⚙️ Admin Panel</p>
                <p className="text-sm text-purple-200">Manage platform</p>
              </div>
              <ChevronRight size={20} />
            </div>
          </Link>
        )}

        {/* Menu Items */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          {menuItems.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 p-4 hover:bg-orange-50 transition-colors ${
                i < menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="w-10 h-10 bg-orange-100 text-primary rounded-xl flex items-center justify-center">
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); router.push('/') }}
          className="w-full bg-white border-2 border-red-200 text-red-500 rounded-2xl p-4 font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  )
}