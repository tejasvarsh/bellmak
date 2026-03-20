'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Heart, User, Search, Menu, X, ChevronDown, Package, LogOut, Settings } from 'lucide-react'
import { useCartStore, useAuthStore } from '@/lib/store'

const SUGGESTIONS = [
  'Samsung Galaxy S23', 'iPhone 15 Pro', 'Nike Shoes', 'Sony Headphones',
  'LG Smart TV', 'Boat Earbuds', 'Laptop', 'Mixer Grinder', 'Smart Watch',
]

const CATEGORIES = [
  { name: 'Mobiles',     slug: 'mobiles',      emoji: '📱' },
  { name: 'Fashion',     slug: 'fashion',       emoji: '👗' },
  { name: 'Electronics', slug: 'electronics',   emoji: '💻' },
  { name: 'Home',        slug: 'home-kitchen',  emoji: '🏠' },
  { name: 'Beauty',      slug: 'beauty',        emoji: '💄' },
  { name: 'Sports',      slug: 'sports',        emoji: '⚽' },
  { name: 'Books',       slug: 'books',         emoji: '📚' },
  { name: 'Toys',        slug: 'toys',          emoji: '🧸' },
  { name: 'Grocery',     slug: 'grocery',       emoji: '🛒' },
  { name: 'Appliances',  slug: 'appliances',    emoji: '🔌' },
]

export default function Navbar() {
  const [query, setQuery]           = useState('')
  const [showSug, setShowSug]       = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted]       = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const [moreOpen, setMoreOpen]     = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const totalItems = useCartStore(s => s.getTotalItems())
  const { user, isLoggedIn, logout } = useAuthStore()

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 2)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) { setShowSug(false); router.push(`/search?q=${encodeURIComponent(query)}`) }
  }

  const filtered = SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 6)

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white transition-all duration-200 ${scrolled ? 'shadow-[0_1px_16px_rgba(0,0,0,0.07)]' : 'shadow-sm'}`}>

        {/* Main bar */}
        <div className="max-w-[1400px] mx-auto px-4 h-[54px] flex items-center gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-8 h-8 bg-[#F97316] rounded-xl flex items-center justify-center shadow-sm shadow-orange-200 group-hover:scale-105 transition-transform">
              <span className="text-base leading-none">🛒</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-black text-[18px] leading-none text-gray-900 tracking-tight">
                BELL<span className="text-[#F97316]">MAK</span>
              </p>
              <p className="text-[9px] text-gray-400 leading-none mt-0.5 font-medium tracking-wider">INDIA KA APNA BAZAAR</p>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block relative">
            <div className={`flex items-center h-9 rounded-xl border-2 overflow-hidden transition-all ${showSug ? 'border-[#F97316]' : 'border-gray-200 hover:border-[#F97316]/50'}`}>
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setShowSug(e.target.value.length > 0) }}
                onFocus={() => query.length > 0 && setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
                placeholder="Search products, brands and more..."
                className="flex-1 px-4 text-[13px] outline-none text-gray-800 placeholder-gray-400 bg-transparent h-full"
              />
              <button type="submit" className="h-full px-5 bg-[#F97316] hover:bg-[#EA580C] text-white transition-colors flex items-center flex-shrink-0">
                <Search size={15} />
              </button>
            </div>
            {showSug && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-xl mt-1 z-50 border border-gray-100 overflow-hidden">
                {filtered.map(s => (
                  <button key={s} type="button"
                    onMouseDown={() => { setQuery(s); setShowSug(false); router.push(`/search?q=${encodeURIComponent(s)}`) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors border-b border-gray-50 last:border-0 text-left">
                    <Search size={12} className="text-gray-300 flex-shrink-0" />{s}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Right side icons */}
          <div className="flex items-center gap-0.5 ml-auto md:ml-0">

            {/* Account */}
            <div className="relative group">
              <Link href={mounted && isLoggedIn ? '/account' : '/login'}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="relative">
                  <User size={18} className="text-gray-600" />
                  {mounted && isLoggedIn && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-[1.5px] border-white" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-[10px] text-gray-400 leading-none">{mounted && isLoggedIn ? 'Hello,' : 'Login'}</p>
                  <p className="text-xs font-bold text-gray-800 leading-tight">
                    {mounted && isLoggedIn ? (user?.name?.split(' ')[0] || 'Account') : 'Account'}
                  </p>
                </div>
                {mounted && isLoggedIn && <ChevronDown size={12} className="text-gray-400 hidden md:block" />}
              </Link>

              {mounted && isLoggedIn && (
                <div className="absolute right-0 top-full mt-1.5 bg-white shadow-2xl rounded-2xl w-56 py-2 hidden group-hover:block z-50 border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-3 bg-gradient-to-br from-orange-50 to-amber-50/50 rounded-t-2xl border-b border-orange-100/50 mb-1">
                    <p className="font-black text-gray-900 text-xs truncate">{user?.name}</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                    <div className="flex gap-1.5 mt-2">
                      <span className="text-[10px] bg-[#F97316]/10 text-[#F97316] px-2 py-0.5 rounded-full font-black">🪙 {user?.bellmakCoins}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{user?.role}</span>
                    </div>
                  </div>
                  {[
                    { icon: <User size={12} />, label: 'My Account', href: '/account' },
                    { icon: <Package size={12} />, label: 'My Orders', href: '/account/orders' },
                    { icon: <Heart size={12} />, label: 'Wishlist', href: '/account/wishlist' },
                  ].map(item => (
                    <Link key={item.href} href={item.href}
                      className="flex items-center gap-3 px-4 py-2 text-xs text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors">
                      <span className="text-gray-400">{item.icon}</span>{item.label}
                    </Link>
                  ))}
                  {user?.role === 'SELLER' && (
                    <>
                      <div className="mx-3 my-1 h-px bg-gray-100" />
                      <Link href="/seller/dashboard" className="flex items-center gap-3 px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-colors">
                        <Settings size={12} />Seller Dashboard
                      </Link>
                      <Link href="/live/seller" className="flex items-center gap-3 px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
                        <span>🔴</span>Go Live
                      </Link>
                    </>
                  )}
                  {user?.role === 'ADMIN' && (
                    <>
                      <div className="mx-3 my-1 h-px bg-gray-100" />
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-xs text-purple-600 hover:bg-purple-50 transition-colors">
                        <Settings size={12} />Admin Panel
                      </Link>
                    </>
                  )}
                  <div className="mx-3 my-1 h-px bg-gray-100" />
                  <button onClick={() => { logout(); router.push('/') }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors rounded-b-2xl">
                    <LogOut size={12} />Logout
                  </button>
                </div>
              )}
            </div>

            {/* LIVE */}
            {mounted && (!isLoggedIn || user?.role === 'CUSTOMER') && (
              <Link href="/live" className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-red-400 hover:bg-red-50 transition-all">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping flex-shrink-0" />
                <span className="text-xs font-black text-red-500">LIVE</span>
              </Link>
            )}
            {mounted && isLoggedIn && user?.role === 'SELLER' && (
              <Link href="/live/seller" className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-red-500 hover:bg-red-600 transition-all">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping flex-shrink-0" />
                <span className="text-xs font-black text-white">LIVE</span>
              </Link>
            )}

            {/* Wishlist */}
            <Link href="/account/wishlist" className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors">
              <Heart size={18} className="text-gray-600" />
            </Link>

            {/* Cart */}
            <Link href="/cart" className="flex items-center gap-1.5 h-9 px-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="relative">
                <ShoppingCart size={18} className="text-gray-600" />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F97316] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-black border-[1.5px] border-white">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-gray-700 hidden md:block">Cart</span>
            </Link>

            {/* More */}
            <div className="relative hidden md:block" ref={moreRef}>
              <button onClick={() => setMoreOpen(v => !v)}
                className="h-9 px-2.5 rounded-xl hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-[3.5px]">
                <span className="block w-4 h-[1.5px] bg-gray-600 rounded-full" />
                <span className="block w-4 h-[1.5px] bg-gray-600 rounded-full" />
                <span className="block w-4 h-[1.5px] bg-gray-600 rounded-full" />
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-white shadow-2xl rounded-2xl w-60 z-50 border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-50 bg-gray-50/80">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Quick Links</p>
                  </div>
                  {[
                    { e: '⚡', l: "Today's Deals", href: '/products?discount=20', badge: 'Hot' },
                    { e: '🎟️', l: 'Coupons & Offers', href: '/coupons', badge: 'New' },
                    { e: '🪙', l: 'Wallet & Coins', href: '/account/wallet', badge: null },
                    { e: '🪄', l: 'Sell on BELLMAK', href: '/sell', badge: null },
                    { e: '❓', l: 'Help Center', href: '/help', badge: null },
                    { e: '📞', l: 'Contact Us', href: '/contact', badge: null },
                    { e: '🔒', l: 'Privacy Policy', href: '/privacy-policy', badge: null },
                    { e: '📄', l: 'Terms', href: '/terms', badge: null },
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors font-medium border-b border-gray-50 last:border-0">
                      <span className="text-sm">{item.e}</span>
                      <span className="flex-1">{item.l}</span>
                      {item.badge && (
                        <span className="text-[9px] font-black bg-[#F97316] text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(true)} className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100">
              <Menu size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Category strip */}
        <div className="hidden md:block bg-[#1a1a2e] border-t border-white/5">
          <div className="max-w-[1400px] mx-auto px-4 flex items-center overflow-x-auto scrollbar-hide h-9">
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/category/${cat.slug}`}
                className="flex items-center gap-1.5 px-3.5 h-full text-[12px] font-semibold text-gray-400 hover:text-[#F97316] hover:bg-white/5 whitespace-nowrap transition-all flex-shrink-0 border-b-2 border-transparent hover:border-[#F97316]">
                <span className="text-sm">{cat.emoji}</span>{cat.name}
              </Link>
            ))}
            <Link href="/products?discount=20"
              className="ml-auto flex items-center gap-1 px-4 h-full text-[12px] font-black text-[#F97316] whitespace-nowrap hover:bg-white/5 transition-all flex-shrink-0">
              ⚡ Deals
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-2">
          <form onSubmit={handleSearch} className="flex h-9 rounded-xl border-2 border-gray-200 overflow-hidden focus-within:border-[#F97316] transition-colors">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..."
              className="flex-1 px-3 text-[13px] outline-none" />
            <button type="submit" className="px-4 bg-[#F97316] text-white flex items-center">
              <Search size={15} />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 overflow-y-auto shadow-2xl flex flex-col">
            <div className="bg-[#1a1a2e] px-4 py-4 flex items-center justify-between flex-shrink-0">
              <span className="text-white font-black text-lg">BELL<span className="text-[#F97316]">MAK</span></span>
              <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>
            {mounted && isLoggedIn ? (
              <div className="px-4 py-3 bg-orange-50 border-b">
                <p className="font-bold text-gray-800 text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <span className="text-xs bg-[#F97316]/10 text-[#F97316] px-2 py-0.5 rounded-full font-bold mt-1 inline-block">🪙 {user?.bellmakCoins}</span>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-b font-bold text-[#F97316] text-sm">
                <User size={16} /> Login / Register
              </Link>
            )}
            <div className="flex-1 overflow-y-auto px-3 pt-3 space-y-4">
              {mounted && isLoggedIn && user?.role === 'SELLER' ? (
                <Link href="/live/seller" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" />Go Live Now
                </Link>
              ) : (
                <Link href="/live" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 border-2 border-red-400 text-red-500 rounded-xl font-bold text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />Watch Live
                </Link>
              )}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Categories</p>
                <div className="grid grid-cols-2 gap-1">
                  {CATEGORIES.map(cat => (
                    <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] rounded-xl transition-colors font-medium">
                      <span>{cat.emoji}</span>{cat.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Quick Links</p>
                {[
                  { e: '⚡', l: "Today's Deals", href: '/products?discount=20' },
                  { e: '🎟️', l: 'Coupons', href: '/coupons' },
                  { e: '🪄', l: 'Sell on BELLMAK', href: '/sell' },
                  { e: '📞', l: 'Contact Us', href: '/contact' },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] rounded-xl transition-colors font-medium">
                    <span className="text-base">{item.e}</span>{item.l}
                  </Link>
                ))}
              </div>
            </div>
            {mounted && isLoggedIn && (
              <div className="px-3 py-3 border-t flex-shrink-0">
                <button onClick={() => { logout(); router.push('/'); setMobileOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl font-medium">
                  <LogOut size={14} />Logout
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
