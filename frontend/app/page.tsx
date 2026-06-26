'use client'
import { useEffect, useState, useRef, memo, useCallback } from 'react'
import Link from 'next/link'
import HeroCarousel from '@/components/home/HeroCarousel'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'
import {
  ArrowRight, ArrowUpRight, Zap, Star, Shield, Truck,
  RefreshCw, Award, ChevronLeft, ChevronRight, Play,
  TrendingUp, Crown, Radio, Flame, Clock, Sparkles, Percent
} from 'lucide-react'

const CATEGORIES = [
  { name:'For You',     slug:'featured',     emoji:'✨', color:'from-orange-400 to-amber-400'   },
  { name:'Mobiles',     slug:'mobiles',      emoji:'📱', color:'from-blue-400 to-blue-600'      },
  { name:'Fashion',     slug:'fashion',      emoji:'👗', color:'from-pink-400 to-rose-500'      },
  { name:'Electronics', slug:'electronics',  emoji:'💻', color:'from-purple-400 to-violet-600'  },
  { name:'Home',        slug:'home-kitchen', emoji:'🏠', color:'from-green-400 to-emerald-500'  },
  { name:'Beauty',      slug:'beauty',       emoji:'💄', color:'from-rose-400 to-pink-600'      },
  { name:'Sports',      slug:'sports',       emoji:'⚽', color:'from-orange-400 to-red-500'     },
  { name:'Books',       slug:'books',        emoji:'📚', color:'from-amber-400 to-yellow-500'   },
  { name:'Grocery',     slug:'grocery',      emoji:'🛒', color:'from-lime-400 to-green-500'     },
  { name:'Toys',        slug:'toys',         emoji:'🧸', color:'from-yellow-400 to-amber-500'   },
  { name:'Appliances',  slug:'appliances',   emoji:'🔌', color:'from-cyan-400 to-blue-500'      },
  { name:'Furniture',   slug:'furniture',    emoji:'🪑', color:'from-stone-400 to-stone-600'    },
]

const TICKER_ITEMS = [
  '⚡ MEGA SALE — Electronics Up to 70% Off',
  '🎁 First Order? Use Code BELLMAK10 for 10% Off',
  '🚚 Free Delivery on Orders Above ₹499',
  '🪙 Earn BELLMAK Coins on Every Purchase',
  '🔥 New Arrivals Daily — Fashion & Lifestyle',
  '⭐ Trusted by Customers Across India',
]

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`

const Ticker = memo(() => (
  <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] overflow-hidden py-2 border-b border-white/5">
    <div className="flex animate-[ticker_40s_linear_infinite] whitespace-nowrap w-max">
      {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
        <span key={i} className="text-[11px] font-bold text-gray-300 px-8 flex-shrink-0">
          {t}<span className="text-[#F97316] mx-6">✦</span>
        </span>
      ))}
    </div>
  </div>
))
Ticker.displayName = 'Ticker'

const Countdown = memo(() => {
  const [t, setT] = useState({ h: 5, m: 59, s: 47 })
  useEffect(() => {
    const id = setInterval(() => setT(p => {
      let { h, m, s } = p
      if (--s < 0) { s = 59; if (--m < 0) { m = 59; h = Math.max(0, h - 1) } }
      return { h, m, s }
    }), 1000)
    return () => clearInterval(id)
  }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className="flex items-center gap-0.5">
      {[pad(t.h), pad(t.m), pad(t.s)].map((v, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className="bg-white/20 text-white font-black text-xs px-1.5 py-0.5 rounded min-w-[24px] text-center tabular-nums">{v}</span>
          {i < 2 && <span className="text-white/60 font-black text-xs">:</span>}
        </span>
      ))}
    </div>
  )
})
Countdown.displayName = 'Countdown'

const ProductShelf = memo(({ products, loading, count = 8 }: {
  products: any[]; loading: boolean; count?: number
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = useCallback((d: 'l' | 'r') =>
    ref.current?.scrollBy({ left: d === 'r' ? 300 : -300, behavior: 'smooth' }), [])
  return (
    <div className="relative group/shelf">
      <button onClick={() => scroll('l')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-xl rounded-full flex items-center justify-center border border-gray-100 opacity-0 group-hover/shelf:opacity-100 hover:scale-110 hover:border-[#F97316] transition-all duration-200">
        <ChevronLeft size={15} className="text-gray-700" />
      </button>
      <div ref={ref} className="flex overflow-x-auto scrollbar-hide">
        {loading
          ? [...Array(count)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[170px] border-r border-gray-100 last:border-0 animate-pulse">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50" />
              <div className="p-3 space-y-2">
                <div className="h-2.5 bg-gray-100 rounded-full w-4/5" />
                <div className="h-3 bg-gray-100 rounded-full w-2/5" />
              </div>
            </div>
          ))
          : products.length === 0
          ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-4xl mb-3">📦</span>
              <p className="text-sm font-bold">No products yet</p>
            </div>
          )
          : products.slice(0, count).map(p => (
            <div key={p.id} className="flex-shrink-0 w-[170px] border-r border-gray-100 last:border-0 hover:bg-orange-50/30 transition-colors">
              <ProductCard product={p} />
            </div>
          ))
        }
        {!loading && products.length > 0 && (
          <Link href="/products"
            className="flex-shrink-0 w-[90px] flex flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 transition-all group/va border-l border-orange-100">
            <div className="w-11 h-11 rounded-2xl bg-[#F97316] flex items-center justify-center group-hover/va:scale-110 transition-transform shadow-md shadow-orange-200">
              <ArrowRight size={17} className="text-white" />
            </div>
            <span className="text-[10px] font-black text-[#F97316] text-center leading-tight px-2">View All</span>
          </Link>
        )}
      </div>
      <button onClick={() => scroll('r')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-xl rounded-full flex items-center justify-center border border-gray-100 opacity-0 group-hover/shelf:opacity-100 hover:scale-110 hover:border-[#F97316] transition-all duration-200">
        <ChevronRight size={15} className="text-gray-700" />
      </button>
    </div>
  )
})
ProductShelf.displayName = 'ProductShelf'

const SectionHeader = memo(({ icon, label, title, href, badge, timer }: {
  icon: React.ReactNode; label: string; title: string
  href: string; badge?: string; timer?: boolean
}) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-gradient-to-br from-[#F97316] to-orange-600 rounded-2xl flex items-center justify-center shadow-md shadow-orange-200">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.18em] leading-none">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <h2 className="font-black text-gray-900 text-base leading-none">{title}</h2>
          {badge && <span className="text-[9px] font-black bg-gradient-to-r from-red-500 to-rose-500 text-white px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {timer && (
        <div className="flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-xl">
          <Clock size={10} className="text-white" />
          <Countdown />
        </div>
      )}
      <Link href={href}
        className="flex items-center gap-1.5 text-xs font-black text-[#F97316] bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-all border border-orange-100">
        See All <ArrowUpRight size={12} />
      </Link>
    </div>
  </div>
))
SectionHeader.displayName = 'SectionHeader'

const DealBox = memo(({ title, sub, href, color, emoji }: {
  title: string; sub: string; href: string; color: string; emoji: string
}) => (
  <Link href={href}
    className="bg-white overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group flex flex-col border-r border-b border-gray-100 last:border-r-0">
    <div className={`${color} px-4 pt-4 pb-3`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-black text-gray-900 text-sm leading-tight">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">{sub}</p>
        </div>
        <span className="text-3xl group-hover:scale-125 transition-transform duration-300">{emoji}</span>
      </div>
    </div>
    <div className="flex-1 flex items-center justify-center py-8">
      <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{emoji}</span>
    </div>
    <div className="px-4 py-2.5 flex items-center justify-between bg-gray-50/80 border-t border-gray-100">
      <span className="text-xs font-black text-[#F97316]">Shop Now</span>
      <ArrowRight size={13} className="text-[#F97316] group-hover:translate-x-1.5 transition-transform" />
    </div>
  </Link>
))
DealBox.displayName = 'DealBox'

const CategoryStrip = memo(() => (
  <div className="bg-white border-b border-gray-100 shadow-sm">
    <div className="max-w-[1440px] mx-auto px-3">
      <div className="flex items-start overflow-x-auto scrollbar-hide py-4 gap-2">
        {CATEGORIES.map(cat => (
          <Link key={cat.slug}
            href={cat.slug === 'featured' ? '/products' : `/category/${cat.slug}`}
            className="flex flex-col items-center gap-2 px-3 py-1 flex-shrink-0 group">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-200`}>
              {cat.emoji}
            </div>
            <span className="text-[10px] font-bold whitespace-nowrap text-gray-600 group-hover:text-[#F97316] transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  </div>
))
CategoryStrip.displayName = 'CategoryStrip'

export default function HomePage() {
  const [featured,    setFeatured]    = useState<any[]>([])
  const [trending,    setTrending]    = useState<any[]>([])
  const [newArrivals, setNewArrivals] = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/products/featured').catch(() => null),
      api.get('/products/trending').catch(() => null),
      api.get('/products', { params: { sort: 'createdAt', limit: 12 } }).catch(() => null),
    ]).then(([f, t, n]) => {
      if (f?.data?.data?.length)  setFeatured(f.data.data)
      if (t?.data?.data?.length)  setTrending(t.data.data)
      if (n?.data?.data?.length)  setNewArrivals(n.data.data)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Ticker />
      <div className="min-h-screen bg-[#f0f2f5]">
        <HeroCarousel />
        <CategoryStrip />

        <div className="max-w-[1440px] mx-auto px-3 py-5 space-y-5">

          {/* Flash Deals */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-orange-500 px-5 py-4">
              <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
              <div className="relative flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Flame size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-red-200 uppercase tracking-widest">Limited Time</p>
                    <h2 className="font-black text-white text-lg leading-none">Flash Deals</h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-red-200 text-xs font-bold hidden sm:block">Ends in:</p>
                  <Countdown />
                  <Link href="/products?discount=20"
                    className="flex items-center gap-1.5 bg-white text-red-600 font-black text-xs px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
                    All Deals <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4">
              <DealBox title="Electronics Up to 70% off" sub="Mobiles, Laptops & more" href="/category/electronics" color="bg-blue-50"   emoji="💻" />
              <DealBox title="Fashion Min. 50% off"       sub="Top brands & trends"    href="/category/fashion"     color="bg-pink-50"   emoji="👗" />
              <DealBox title="Home from ₹199"            sub="Kitchen, decor & more"  href="/category/home-kitchen"color="bg-green-50"  emoji="🏠" />
              <DealBox title="Beauty & Skincare"         sub="Genuine products only"  href="/category/beauty"      color="bg-purple-50" emoji="💄" />
            </div>
          </div>

          {/* Featured Products */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
            <SectionHeader
              icon={<Star size={16} className="text-white fill-white" />}
              label="Handpicked For You"
              title="Featured Products"
              href="/products"
              badge="HOT 🔥"
            />
            <ProductShelf products={featured} loading={loading} count={10} />
          </div>

          {/* Promo Banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/products?discount=30"
              className="md:col-span-2 relative overflow-hidden rounded-3xl h-40 flex items-center px-8 group"
              style={{ background:'linear-gradient(135deg,#1a1a2e 0%,#0f3460 60%,#1a1a4e 100%)' }}>
              <div className="absolute right-0 top-0 bottom-0 w-48 flex items-center justify-center">
                <span className="text-[110px] opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 select-none">📱</span>
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 bg-[#F97316]/20 border border-[#F97316]/30 text-[#F97316] text-[10px] font-black px-3 py-1 rounded-full mb-3">
                  <Zap size={9} fill="currentColor" /> TODAY ONLY
                </div>
                <h3 className="text-2xl font-black text-white leading-tight mb-1">
                  Mobiles <span className="text-[#F97316]">Up to 40% Off</span>
                </h3>
                <p className="text-gray-400 text-xs flex items-center gap-1.5">
                  <Clock size={10} /> Limited stock available
                </p>
              </div>
            </Link>
            <div className="flex flex-col gap-4">
              <Link href="/sell"
                className="relative overflow-hidden rounded-3xl flex-1 flex items-center px-6 group bg-gradient-to-r from-[#F97316] to-orange-500 min-h-[72px]">
                <div className="absolute right-4 text-5xl opacity-20 group-hover:scale-110 transition-transform select-none">🚀</div>
                <div className="relative z-10">
                  <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Zero Investment</p>
                  <h3 className="font-black text-white text-base leading-tight">Start Selling</h3>
                </div>
              </Link>
              <Link href="/live"
                className="relative overflow-hidden rounded-3xl flex-1 flex items-center px-6 group bg-gradient-to-r from-red-600 to-rose-500 min-h-[72px]">
                <div className="absolute right-4 text-5xl opacity-20 group-hover:scale-110 transition-transform select-none">🎥</div>
                <div className="relative z-10 flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  <div>
                    <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Live Now</p>
                    <h3 className="font-black text-white text-base leading-tight">Watch Live</h3>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* New Arrivals — sorted by createdAt desc */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
            <SectionHeader
              icon={<Sparkles size={16} className="text-white" />}
              label="Just Landed"
              title="New Arrivals ✨"
              href="/products?sort=createdAt"
            />
            <ProductShelf products={newArrivals} loading={loading} count={10} />
          </div>

          {/* Budget + Trending */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Percent size={13} className="text-[#F97316]" />
                <h2 className="font-black text-gray-900 text-sm">Shop by Budget</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label:'Under ₹499',   href:'/products?maxPrice=499',  bg:'bg-green-50',  text:'text-green-700',  emoji:'💸' },
                  { label:'Under ₹999',   href:'/products?maxPrice=999',  bg:'bg-blue-50',   text:'text-blue-700',   emoji:'🛍️' },
                  { label:'Under ₹2,999', href:'/products?maxPrice=2999', bg:'bg-purple-50', text:'text-purple-700', emoji:'🎁' },
                  { label:'Premium 5K+',  href:'/products?minPrice=5000', bg:'bg-amber-50',  text:'text-amber-700',  emoji:'⭐' },
                ].map(b => (
                  <Link key={b.label} href={b.href}
                    className={`flex items-center gap-2 px-3 py-3 rounded-2xl ${b.bg} hover:shadow-sm transition-all group`}>
                    <span className="text-xl group-hover:scale-110 transition-transform flex-shrink-0">{b.emoji}</span>
                    <p className={`font-black text-xs ${b.text} leading-tight`}>{b.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trending Now */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-sm shadow-red-200">
                    <TrendingUp size={14} className="text-white" />
                  </div>
                  <h2 className="font-black text-gray-900 text-sm">Trending Now 🔥</h2>
                </div>
                <Link href="/products?sort=popular"
                  className="text-xs font-black text-[#F97316] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl flex items-center gap-1 border border-orange-100">
                  See All <ArrowUpRight size={11} />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                      <div className="w-7 h-4 bg-gray-100 rounded" />
                      <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/4" />
                      </div>
                    </div>
                  ))
                ) : trending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <span className="text-3xl mb-2">📈</span>
                    <p className="text-sm">No trending products yet</p>
                  </div>
                ) : trending.slice(0, 5).map((p, i) => {
                  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣']
                  const img = p.images?.[0] || 'https://placehold.co/40x40/f1f5f9/94a3b8?text=No+Img'
                  return (
                    <Link key={p.id} href={`/products/${p.slug}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50/40 transition-colors group">
                      <span className="text-base w-7 text-center flex-shrink-0">{medals[i]}</span>
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                        <img
                          src={img}
                          alt={p.title}
                          className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/f1f5f9/94a3b8?text=?' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-[#F97316] transition-colors">{p.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-black text-gray-900">{fmt(p.price)}</span>
                          {p.discount > 0 && (
                            <span className="text-[10px] text-green-600 font-black bg-green-50 px-1.5 py-0.5 rounded-lg">{p.discount}% off</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[11px] font-bold text-gray-500">{p.avgRating?.toFixed(1)}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Live Shopping */}
          <div className="rounded-3xl overflow-hidden relative bg-gradient-to-r from-red-600 via-red-500 to-[#F97316] shadow-lg shadow-red-200">
            <div className="relative z-10 p-5 md:p-7 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20 p-3">
                  <Radio size={22} className="text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-xl md:text-2xl font-black leading-tight">Live Shopping Events</h3>
                  <p className="text-red-100 text-xs mt-0.5">Watch. Discover. Buy — Exclusive live-only prices!</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link href="/live"
                  className="flex items-center gap-2 bg-white text-red-600 font-black text-sm px-6 py-3 rounded-2xl hover:scale-105 transition-transform shadow-lg">
                  <Play size={14} fill="currentColor" /> Watch Live
                </Link>
                <Link href="/live/seller"
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/20 text-white font-bold text-sm px-5 py-3 rounded-2xl transition-all">
                  Go Live
                </Link>
              </div>
            </div>
          </div>

          {/* Trust Strip */}
          <div className="bg-white rounded-3xl shadow-sm px-5 py-5 border border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon:Truck,     title:'Free Delivery',   desc:'On orders ₹499+',   g:'from-orange-400 to-[#F97316]',  s:'shadow-orange-100' },
                { icon:RefreshCw, title:'Easy Returns',    desc:'7-day no questions', g:'from-green-400 to-emerald-600', s:'shadow-green-100'  },
                { icon:Shield,    title:'Secure Payments', desc:'256-bit encryption', g:'from-blue-400 to-blue-600',     s:'shadow-blue-100'   },
                { icon:Award,     title:'100% Genuine',    desc:'Verified sellers',   g:'from-purple-400 to-violet-600', s:'shadow-purple-100' },
              ].map(({ icon:Icon, title, desc, g, s }) => (
                <div key={title} className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-orange-100 hover:bg-orange-50/30 transition-all group cursor-default">
                  <div className={`w-11 h-11 bg-gradient-to-br ${g} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${s} group-hover:scale-110 transition-transform`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-gray-800 text-sm">{title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sell CTA */}
          <div className="rounded-3xl overflow-hidden bg-[#1a1a2e] border border-white/5">
            <div className="relative p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F97316] to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl shadow-lg shadow-orange-500/20">
                  🚀
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-[9px] font-black px-2.5 py-1 rounded-full mb-1.5">
                    <Crown size={8} /> BECOME A SELLER
                  </div>
                  <h3 className="text-base md:text-lg font-black text-white leading-tight">
                    Grow Your Business. <span className="text-[#F97316]">Zero Investment.</span>
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">Register free · List products · Customers across India</p>
                </div>
              </div>
              <Link href="/sell"
                className="flex items-center gap-2 bg-gradient-to-r from-[#F97316] to-orange-500 text-white font-black text-sm px-5 py-2.5 rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-orange-500/20 whitespace-nowrap">
                Start Free <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>
        <div className="h-6" />
      </div>

      <style jsx global>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}