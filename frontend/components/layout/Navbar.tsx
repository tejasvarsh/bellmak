'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, Heart, User, Search, Menu, X,
  Package, LogOut, Settings, ChevronRight,
  Zap, Home, Smartphone, Shirt, Tv, Dumbbell,
  BookOpen, Baby, ShoppingBag, Plug, Sparkles,
  Radio, Shield, Store, Wallet, HelpCircle,
  Phone, FileText, Lock, Tag
} from 'lucide-react'
import { useCartStore, useAuthStore } from '@/lib/store'

// ─── Data ────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Samsung Galaxy S23', 'iPhone 15 Pro', 'Nike Shoes', 'Sony Headphones',
  'LG Smart TV', 'Boat Earbuds', 'Laptop', 'Mixer Grinder', 'Smart Watch',
]

const CATEGORIES = [
  { name: 'Mobiles',     slug: 'mobiles',     emoji: '📱', icon: Smartphone, color: 'text-blue-500 bg-blue-50'    },
  { name: 'Fashion',     slug: 'fashion',     emoji: '👗', icon: Shirt,      color: 'text-pink-500 bg-pink-50'    },
  { name: 'Electronics', slug: 'electronics', emoji: '💻', icon: Tv,         color: 'text-purple-500 bg-purple-50' },
  { name: 'Home',        slug: 'home-kitchen',emoji: '🏠', icon: Home,       color: 'text-green-500 bg-green-50'  },
  { name: 'Beauty',      slug: 'beauty',      emoji: '💄', icon: Sparkles,   color: 'text-rose-500 bg-rose-50'    },
  { name: 'Sports',      slug: 'sports',      emoji: '⚽', icon: Dumbbell,   color: 'text-orange-500 bg-orange-50' },
  { name: 'Books',       slug: 'books',       emoji: '📚', icon: BookOpen,   color: 'text-amber-500 bg-amber-50'  },
  { name: 'Toys',        slug: 'toys',        emoji: '🧸', icon: Baby,       color: 'text-yellow-500 bg-yellow-50' },
  { name: 'Grocery',     slug: 'grocery',     emoji: '🛒', icon: ShoppingBag,color: 'text-lime-600 bg-lime-50'    },
  { name: 'Appliances',  slug: 'appliances',  emoji: '🔌', icon: Plug,       color: 'text-cyan-500 bg-cyan-50'    },
]

// ─── Hooks ────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Sub Components ───────────────────────────────────────────
function NavIcon({ href, icon: Icon, badge, label, onClick }: {
  href?: string; icon: any; badge?: number; label?: string; onClick?: () => void
}) {
  const cls = "relative flex items-center gap-1.5 h-10 px-2.5 rounded-2xl hover:bg-gray-100/80 active:scale-95 transition-all duration-150 group"
  const content = (
    <>
      <div className="relative">
        <Icon size={19} className="text-gray-600 group-hover:text-gray-900 transition-colors" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -right-2.5 bg-[#F97316] text-white text-[9px] rounded-full min-w-[16px] h-4 flex items-center justify-center font-black px-1 border-2 border-white shadow-sm">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      {label && <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 hidden lg:block transition-colors">{label}</span>}
    </>
  )
  if (onClick) return <button onClick={onClick} className={cls}>{content}</button>
  return <Link href={href!} className={cls}>{content}</Link>
}

// ─── Main Navbar ──────────────────────────────────────────────
export default function Navbar() {
  const [query,       setQuery]       = useState('')
  const [focused,     setFocused]     = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [mounted,     setMounted]     = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const [catOpen,     setCatOpen]     = useState(false)
  const [userOpen,    setUserOpen]    = useState(false)
  const debouncedQ    = useDebounce(query, 150)
  const searchRef     = useRef<HTMLInputElement>(null)
  const catRef        = useRef<HTMLDivElement>(null)
  const userRef       = useRef<HTMLDivElement>(null)
  const router        = useRouter()
  const totalItems    = useCartStore(s => s.getTotalItems())
  const { user, isLoggedIn, logout } = useAuthStore()

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current  && !catRef.current.contains(e.target as Node))  setCatOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false) }, [router])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setFocused(false)
      searchRef.current?.blur()
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }, [query, router])

  const handleSuggestionClick = useCallback((s: string) => {
    setQuery(s)
    setFocused(false)
    router.push(`/search?q=${encodeURIComponent(s)}`)
  }, [router])

  const filteredSuggestions = SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(debouncedQ.toLowerCase())
  ).slice(0, 6)

  const showSuggestions = focused && debouncedQ.length > 0 && filteredSuggestions.length > 0

  const isSeller = mounted && isLoggedIn && (user?.role === 'SELLER' || user?.role === 'ADMIN')
  const isAdmin  = mounted && isLoggedIn && user?.role === 'ADMIN'

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          DESKTOP + TABLET NAVBAR
      ═══════════════════════════════════════════════════ */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.08)]'
          : 'bg-white shadow-sm'
      }`}>

        {/* Top accent line */}
        <div className="h-[3px] bg-gradient-to-r from-[#F97316] via-orange-400 to-amber-400" />

        {/* ── Main Bar ── */}
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-[58px] flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative w-9 h-9 bg-gradient-to-br from-[#F97316] to-orange-600 rounded-2xl flex items-center justify-center shadow-md shadow-orange-200 group-hover:scale-105 group-hover:rotate-3 transition-all duration-200">
              <span className="text-lg leading-none">🛒</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-black text-[19px] leading-none text-gray-900 tracking-tight">
                BELL<span className="text-[#F97316]">MAK</span>
              </p>
              <p className="text-[8.5px] text-gray-400 leading-none mt-0.5 font-bold tracking-[0.15em] uppercase">
                India Ka Apna Bazaar
              </p>
            </div>
          </Link>

          {/* Categories Mega Dropdown */}
          <div className="hidden md:block relative flex-shrink-0" ref={catRef}>
            <button
              onClick={() => setCatOpen(v => !v)}
              className={`flex items-center gap-2 h-9 px-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                catOpen
                  ? 'border-[#F97316] bg-orange-50 text-[#F97316]'
                  : 'border-gray-200 text-gray-700 hover:border-[#F97316]/50 hover:text-[#F97316]'
              }`}
            >
              <Menu size={15} />
              <span>Categories</span>
              <ChevronRight size={13} className={`transition-transform duration-200 ${catOpen ? 'rotate-90' : ''}`} />
            </button>

            {catOpen && (
              <div className="absolute left-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 w-[520px] z-50 overflow-hidden">
                <div className="p-2">
                  <div className="px-3 py-2 mb-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shop by Category</p>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {CATEGORIES.map(cat => (
                      <Link
                        key={cat.slug}
                        href={`/category/${cat.slug}`}
                        onClick={() => setCatOpen(false)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-orange-50 transition-all group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                          <cat.icon size={18} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 group-hover:text-[#F97316] text-center leading-tight">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-2 p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-white font-black text-sm">⚡ Today's Deals</p>
                      <p className="text-orange-100 text-xs">Up to 80% off</p>
                    </div>
                    <Link href="/products?discount=20" onClick={() => setCatOpen(false)}
                      className="bg-white text-orange-500 text-xs font-black px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors">
                      Shop Now →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block relative">
            <div className={`flex items-center h-10 rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
              focused
                ? 'border-[#F97316] shadow-[0_0_0_4px_rgba(249,115,22,0.1)]'
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="pl-4 pr-2 flex-shrink-0">
                <Search size={15} className={`transition-colors ${focused ? 'text-[#F97316]' : 'text-gray-400'}`} />
              </div>
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                placeholder="Search products, brands and more..."
                className="flex-1 text-[13px] outline-none text-gray-800 placeholder-gray-400 bg-transparent h-full"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}
                  className="pr-2 text-gray-300 hover:text-gray-500 transition-colors">
                  <X size={14} />
                </button>
              )}
              <button type="submit"
                className="h-full px-5 bg-gradient-to-r from-[#F97316] to-orange-500 hover:from-[#EA580C] hover:to-orange-600 text-white transition-all flex items-center gap-1.5 font-bold text-xs flex-shrink-0">
                <Search size={14} />
                <span className="hidden lg:block">Search</span>
              </button>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-2xl mt-1.5 z-50 border border-gray-100 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/80">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Suggestions</p>
                </div>
                {filteredSuggestions.map((s, i) => (
                  <button key={s} type="button"
                    onMouseDown={() => handleSuggestionClick(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors border-b border-gray-50 last:border-0 text-left group"
                  >
                    <div className="w-6 h-6 bg-gray-100 group-hover:bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                      <Search size={11} className="text-gray-400 group-hover:text-[#F97316]" />
                    </div>
                    <span className="flex-1">{s}</span>
                    <ChevronRight size={12} className="text-gray-300 group-hover:text-[#F97316]" />
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* ── Right Action Icons ── */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">

            {/* LIVE Button */}
            {mounted && (
              isSeller ? (
                <Link href="/live/seller"
                  className="hidden md:flex items-center gap-2 h-9 px-3.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-2xl transition-all active:scale-95 shadow-sm shadow-red-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  <span className="text-xs font-black">LIVE</span>
                </Link>
              ) : (
                <Link href="/live"
                  className="hidden md:flex items-center gap-2 h-9 px-3.5 border-2 border-red-400 hover:bg-red-50 text-red-500 rounded-2xl transition-all active:scale-95">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-xs font-black">LIVE</span>
                </Link>
              )
            )}

            {/* Wishlist */}
            <NavIcon href="/account/wishlist" icon={Heart} />

            {/* My Orders — only when logged in */}
            {mounted && isLoggedIn && (
              <NavIcon href="/account/orders" icon={Package} label="Orders" />
            )}

            {/* Cart */}
            <NavIcon href="/cart" icon={ShoppingCart} badge={mounted ? totalItems : 0} label="Cart" />

            {/* User Account */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  if (!mounted || !isLoggedIn) { router.push('/login'); return }
                  setUserOpen(v => !v)
                }}
                className={`flex items-center gap-2 h-10 px-3 rounded-2xl transition-all active:scale-95 ${
                  userOpen ? 'bg-orange-50' : 'hover:bg-gray-100/80'
                }`}
              >
                {mounted && isLoggedIn ? (
                  <>
                    <div className="w-7 h-7 bg-gradient-to-br from-[#F97316] to-orange-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-[10px] text-gray-400 leading-none">Hello,</p>
                      <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[80px]">
                        {user?.name?.split(' ')[0]}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-7 h-7 bg-gray-100 rounded-xl flex items-center justify-center">
                      <User size={15} className="text-gray-500" />
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-[10px] text-gray-400 leading-none">Welcome</p>
                      <p className="text-xs font-bold text-gray-800 leading-tight">Login</p>
                    </div>
                  </>
                )}
              </button>

              {/* User Dropdown */}
              {mounted && isLoggedIn && userOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white shadow-2xl rounded-3xl w-64 z-50 border border-gray-100 overflow-hidden">
                  {/* User Header */}
                  <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-500">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white truncate">{user?.name}</p>
                        <p className="text-[11px] text-orange-100 truncate">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-black">
                            🪙 {user?.bellmakCoins} coins
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            user?.role === 'ADMIN'  ? 'bg-purple-500 text-white' :
                            user?.role === 'SELLER' ? 'bg-blue-500 text-white'   :
                            'bg-white/20 text-white'
                          }`}>{user?.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    {[
                      { icon: User,    label: 'My Account',  href: '/account',          color: 'text-gray-600' },
                      { icon: Package, label: 'My Orders',   href: '/account/orders',   color: 'text-gray-600' },
                      { icon: Heart,   label: 'Wishlist',    href: '/account/wishlist', color: 'text-gray-600' },
                      { icon: Wallet,  label: 'Wallet',      href: '/account/wallet',   color: 'text-gray-600' },
                    ].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] rounded-xl transition-colors group">
                        <div className="w-7 h-7 bg-gray-100 group-hover:bg-orange-100 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                          <item.icon size={13} className="text-gray-500 group-hover:text-[#F97316]" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                        <ChevronRight size={13} className="ml-auto text-gray-300 group-hover:text-[#F97316]" />
                      </Link>
                    ))}

                    {isSeller && (
                      <>
                        <div className="my-1.5 mx-2 h-px bg-gray-100" />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-1">Seller</p>
                        <Link href="/seller/dashboard" onClick={() => setUserOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition-colors group">
                          <div className="w-7 h-7 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Store size={13} className="text-blue-500" />
                          </div>
                          <span className="font-medium">Seller Dashboard</span>
                        </Link>
                        <Link href="/live/seller" onClick={() => setUserOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors group">
                          <div className="w-7 h-7 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Radio size={13} className="text-red-500" />
                          </div>
                          <span className="font-medium">Go Live</span>
                          <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <div className="my-1.5 mx-2 h-px bg-gray-100" />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-1">Admin</p>
                        <Link href="/admin" onClick={() => setUserOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-purple-600 hover:bg-purple-50 rounded-xl transition-colors group">
                          <div className="w-7 h-7 bg-purple-50 group-hover:bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shield size={13} className="text-purple-500" />
                          </div>
                          <span className="font-medium">Admin Panel</span>
                        </Link>
                      </>
                    )}

                    <div className="my-1.5 mx-2 h-px bg-gray-100" />
                    <button
                      onClick={() => { logout(); router.push('/'); setUserOpen(false) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors group"
                    >
                      <div className="w-7 h-7 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <LogOut size={13} className="text-red-500" />
                      </div>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Menu size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* ── Category Strip (Desktop) ── */}
        <div className="hidden md:block bg-[#1a1a2e]">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center overflow-x-auto scrollbar-hide h-9 gap-1">
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/category/${cat.slug}`}
                className="flex items-center gap-1.5 px-3 h-full text-[12px] font-semibold text-gray-400 hover:text-[#F97316] hover:bg-white/5 whitespace-nowrap transition-all flex-shrink-0 border-b-2 border-transparent hover:border-[#F97316] rounded-t-sm">
                <span className="text-sm">{cat.emoji}</span>{cat.name}
              </Link>
            ))}
            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <Link href="/products?discount=20"
                className="flex items-center gap-1.5 px-4 h-7 bg-gradient-to-r from-[#F97316] to-orange-400 text-white text-[11px] font-black rounded-full hover:from-orange-600 hover:to-orange-500 transition-all">
                <Zap size={11} /> Deals
              </Link>
              <Link href="/sell"
                className="flex items-center gap-1.5 px-3 h-7 border border-gray-600 text-gray-400 text-[11px] font-bold rounded-full hover:border-[#F97316] hover:text-[#F97316] transition-all">
                Sell
              </Link>
            </div>
          </div>
        </div>

        {/* ── Mobile Search ── */}
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-2.5">
          <form onSubmit={handleSearch}
            className="flex h-10 rounded-2xl border-2 border-gray-200 overflow-hidden focus-within:border-[#F97316] focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] transition-all">
            <div className="pl-3 flex items-center">
              <Search size={15} className="text-gray-400" />
            </div>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search anything..."
              className="flex-1 px-3 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="px-2">
                <X size={14} className="text-gray-400" />
              </button>
            )}
            <button type="submit" className="px-4 bg-gradient-to-r from-[#F97316] to-orange-500 text-white flex items-center">
              <Search size={15} />
            </button>
          </form>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          MOBILE DRAWER
      ═══════════════════════════════════════════════════ */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-[300px] bg-white z-50 flex flex-col shadow-2xl overflow-hidden">

            {/* Drawer Header */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] px-5 py-5 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-black text-xl">
                  BELL<span className="text-[#F97316]">MAK</span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {mounted && isLoggedIn ? (
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#F97316] to-orange-600 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{user?.name}</p>
                    <p className="text-[11px] text-gray-300 truncate">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 p-3 bg-[#F97316] text-white rounded-2xl font-bold text-sm">
                  <User size={18} /> Login / Register
                </Link>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">

              {/* Quick Actions */}
              <div className="p-4 border-b border-gray-100">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Package, label: 'Orders',  href: '/account/orders',   color: 'text-purple-600 bg-purple-50' },
                    { icon: Heart,   label: 'Wishlist', href: '/account/wishlist', color: 'text-pink-600 bg-pink-50'    },
                    { icon: Wallet,  label: 'Wallet',   href: '/account/wallet',   color: 'text-yellow-600 bg-yellow-50'},
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 hover:bg-orange-50 rounded-2xl transition-colors group">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                        <item.icon size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 group-hover:text-[#F97316]">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Live CTA */}
              <div className="px-4 py-3 border-b border-gray-100">
                {isSeller ? (
                  <Link href="/live/seller" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl font-bold text-sm shadow-sm shadow-red-200">
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping flex-shrink-0" />
                    Go Live Now
                    <ChevronRight size={16} className="ml-auto" />
                  </Link>
                ) : (
                  <Link href="/live" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 border-2 border-red-400 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-50 transition-colors">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping flex-shrink-0" />
                    Watch Live
                    <ChevronRight size={16} className="ml-auto" />
                  </Link>
                )}
              </div>

              {/* Categories */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Categories</p>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={() => setMobileOpen(false)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-orange-50 transition-colors group">
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="text-[9px] font-bold text-gray-500 group-hover:text-[#F97316] text-center leading-tight">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quick Links</p>
                {[
                  { icon: Zap,      label: "Today's Deals",  href: '/products?discount=20', color: 'text-orange-500 bg-orange-50' },
                  { icon: Tag,      label: 'Coupons',        href: '/coupons',              color: 'text-green-500 bg-green-50'   },
                  { icon: Store,    label: 'Sell on Bellmak',href: '/sell',                 color: 'text-blue-500 bg-blue-50'     },
                  { icon: HelpCircle,label: 'Help Center',   href: '/help',                 color: 'text-purple-500 bg-purple-50' },
                  { icon: Phone,    label: 'Contact Us',     href: '/contact',              color: 'text-pink-500 bg-pink-50'     },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-2 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] rounded-xl transition-colors group">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <item.icon size={13} />
                    </div>
                    <span className="font-medium">{item.label}</span>
                    <ChevronRight size={13} className="ml-auto text-gray-300 group-hover:text-[#F97316]" />
                  </Link>
                ))}
              </div>

              {/* Seller/Admin */}
              {isSeller && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Seller Tools</p>
                  <Link href="/seller/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-2 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Store size={13} className="text-blue-500" />
                    </div>
                    <span className="font-medium">Seller Dashboard</span>
                  </Link>
                </div>
              )}
              {isAdmin && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Admin</p>
                  <Link href="/admin" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-2 py-2.5 text-sm text-purple-600 hover:bg-purple-50 rounded-xl transition-colors">
                    <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield size={13} className="text-purple-500" />
                    </div>
                    <span className="font-medium">Admin Panel</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Logout */}
            {mounted && isLoggedIn && (
              <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => { logout(); router.push('/'); setMobileOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-colors border-2 border-red-100"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}