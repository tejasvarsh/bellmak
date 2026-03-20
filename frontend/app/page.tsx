'use client'
import { useEffect, useState, useRef, memo } from 'react'
import Link from 'next/link'
import HeroCarousel from '@/components/home/HeroCarousel'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'
import {
  ArrowRight, ArrowUpRight, Zap, Star, Shield,
  Truck, RefreshCw, Award, ChevronLeft, ChevronRight,
  Play, TrendingUp, Crown, Radio, Flame, Tag, Clock,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// DUMMY DATA
// ─────────────────────────────────────────────────────────────
const DUMMY: any[] = [
  { id:'1',  title:'Samsung Galaxy S23 Ultra 5G',     price:89999,  mrp:124999, discount:28, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=S23'],    avgRating:4.5, totalReviews:2341, slug:'samsung-s23',      stock:10 },
  { id:'2',  title:'Apple iPhone 15 Pro Max 256GB',   price:134900, mrp:159900, discount:16, images:['https://placehold.co/280x280/f9fafb/374151?text=iPhone'],  avgRating:4.8, totalReviews:4567, slug:'iphone-15',        stock:5  },
  { id:'3',  title:'Sony WH-1000XM5 Headphones',     price:24990,  mrp:34990,  discount:29, images:['https://placehold.co/280x280/fdf4ff/a855f7?text=Sony'],    avgRating:4.6, totalReviews:1230, slug:'sony-xm5',         stock:20 },
  { id:'4',  title:'Nike Air Max 270 Running Shoes',  price:8995,   mrp:12995,  discount:31, images:['https://placehold.co/280x280/fefce8/eab308?text=Nike'],    avgRating:4.3, totalReviews:890,  slug:'nike-airmax',      stock:15 },
  { id:'5',  title:'LG 55" 4K OLED Smart WebOS TV',  price:49990,  mrp:79990,  discount:38, images:['https://placehold.co/280x280/f0fdf4/22c55e?text=LG+TV'],   avgRating:4.4, totalReviews:1670, slug:'lg-tv',            stock:8  },
  { id:'6',  title:'Prestige Iris 750W Mixer Grinder',price:2499,   mrp:4500,   discount:44, images:['https://placehold.co/280x280/fff1f2/f43f5e?text=Prestige'],avgRating:4.2, totalReviews:780,  slug:'prestige-mixer',   stock:30 },
  { id:'7',  title:'boAt Rockerz 450 Headphone',     price:1299,   mrp:2990,   discount:57, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=boAt'],    avgRating:4.1, totalReviews:3200, slug:'boat-rockerz',     stock:50 },
  { id:'8',  title:'Philips Air Fryer HD9200 4.1L',  price:5999,   mrp:8995,   discount:33, images:['https://placehold.co/280x280/f0fdf4/16a34a?text=Philips'], avgRating:4.4, totalReviews:1100, slug:'philips-airfryer', stock:12 },
  { id:'9',  title:'Harry Potter Complete Box Set',  price:2499,   mrp:3999,   discount:38, images:['https://placehold.co/280x280/fff7ed/f97316?text=HP'],      avgRating:4.9, totalReviews:5670, slug:'hp-books',         stock:25 },
  { id:'10', title:'Lakme 9To5 Mousse Foundation',   price:699,    mrp:950,    discount:26, images:['https://placehold.co/280x280/fdf2f8/ec4899?text=Lakme'],   avgRating:4.1, totalReviews:2340, slug:'lakme',            stock:100},
  { id:'11', title:'Fastrack Reflex 3.0 Smart Watch',price:3995,   mrp:5995,   discount:33, images:['https://placehold.co/280x280/f1f5f9/475569?text=Watch'],   avgRating:4.0, totalReviews:980,  slug:'fastrack',         stock:40 },
  { id:'12', title:'Puma RS-X Bold Running Shoes',   price:6999,   mrp:9999,   discount:30, images:['https://placehold.co/280x280/fff0f3/be123c?text=Puma'],    avgRating:4.3, totalReviews:560,  slug:'puma-rsx',         stock:18 },
  { id:'13', title:'Dell Inspiron 15 Laptop i5',     price:52990,  mrp:72990,  discount:27, images:['https://placehold.co/280x280/eff6ff/1d4ed8?text=Dell'],    avgRating:4.3, totalReviews:1340, slug:'dell-laptop',      stock:7  },
  { id:'14', title:'Mamaearth Face Wash Combo',      price:399,    mrp:698,    discount:43, images:['https://placehold.co/280x280/fdf4ff/7c3aed?text=Mama'],    avgRating:4.4, totalReviews:4230, slug:'mamaearth',        stock:200},
  { id:'15', title:'Adidas Ultraboost 22 Running',   price:9995,   mrp:16995,  discount:41, images:['https://placehold.co/280x280/fefce8/ca8a04?text=Adidas'],  avgRating:4.5, totalReviews:780,  slug:'adidas-ultraboost',stock:22 },
  { id:'16', title:'Whirlpool 265L Double Door Fridge',price:24990, mrp:35000,  discount:29, images:['https://placehold.co/280x280/ecfdf5/047857?text=Fridge'],  avgRating:4.2, totalReviews:890,  slug:'whirlpool-fridge', stock:4  },
]

// ─────────────────────────────────────────────────────────────
// TICKER
// ─────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  '⚡ MEGA SALE — Electronics Up to 70% Off',
  '🎁 First Order? Use Code WELCOME10 for 10% Off',
  '🚚 Free Delivery on Orders Above ₹499',
  '🪙 Earn BELLMAK Coins on Every Purchase',
  '🔥 New Arrivals Daily — Fashion & Lifestyle',
  '📱 Samsung Galaxy S23 — Lowest Price Guaranteed',
  '⭐ Trusted by 50,000+ Customers Across India',
]

// memo → only renders once, never re-renders
const Ticker = memo(function Ticker() {
  return (
    <div className="bg-[#1a1a2e] overflow-hidden py-1.5 border-b border-white/5">
      <div className="flex animate-[ticker_35s_linear_infinite] whitespace-nowrap w-max">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
          <span key={i} className="text-[11px] font-bold text-gray-300 px-8 flex-shrink-0">
            {t}<span className="text-[#F97316] mx-5">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────
// COUNTDOWN — isolated component, ONLY this re-renders every second
// NOT the whole page!
// ─────────────────────────────────────────────────────────────
const Countdown = memo(function Countdown() {
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
    <div className="flex items-center gap-1">
      {[pad(t.h), pad(t.m), pad(t.s)].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-red-600 text-white font-black text-sm px-2 py-0.5 rounded-md min-w-[30px] text-center tabular-nums">{v}</span>
          {i < 2 && <span className="text-red-400 font-black text-sm">:</span>}
        </span>
      ))}
    </div>
  )
})

// ─────────────────────────────────────────────────────────────
// PRODUCT SHELF
// ─────────────────────────────────────────────────────────────
const ProductShelf = memo(function ProductShelf({
  products, loading, count = 8
}: {
  products: any[]; loading: boolean; count?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (d: 'l' | 'r') =>
    ref.current?.scrollBy({ left: d === 'r' ? 280 : -280, behavior: 'smooth' })

  return (
    <div className="relative group/shelf">
      <button onClick={() => scroll('l')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 bg-white shadow-xl rounded-full flex items-center justify-center border border-gray-100 opacity-0 group-hover/shelf:opacity-100 transition-all hover:scale-110 hover:border-[#F97316]">
        <ChevronLeft size={16} className="text-gray-700" />
      </button>

      <div ref={ref} className="flex overflow-x-auto scrollbar-hide">
        {loading
          ? [...Array(count)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[168px] border-r border-gray-100 last:border-0 animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-2.5 bg-gray-100 rounded w-4/5" />
                <div className="h-3 bg-gray-100 rounded w-2/5" />
              </div>
            </div>
          ))
          : products.slice(0, count).map(p => (
            <div key={p.id} className="flex-shrink-0 w-[168px] border-r border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
              <ProductCard product={p} />
            </div>
          ))
        }
        {!loading && (
          <Link href="/products"
            className="flex-shrink-0 w-[90px] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-50 to-white hover:from-orange-100 transition-all p-4 text-center group/va">
            <div className="w-10 h-10 rounded-full bg-[#F97316]/10 flex items-center justify-center group-hover/va:bg-[#F97316] transition-all">
              <ArrowRight size={16} className="text-[#F97316] group-hover/va:text-white transition-colors" />
            </div>
            <span className="text-[10px] font-black text-[#F97316] leading-tight">View All</span>
          </Link>
        )}
      </div>

      <button onClick={() => scroll('r')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 bg-white shadow-xl rounded-full flex items-center justify-center border border-gray-100 opacity-0 group-hover/shelf:opacity-100 transition-all hover:scale-110 hover:border-[#F97316]">
        <ChevronRight size={16} className="text-gray-700" />
      </button>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────
const SectionHeader = memo(function SectionHeader({
  icon, label, title, href, badge, timer,
}: {
  icon: React.ReactNode; label: string; title: string; href: string; badge?: string; timer?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#F97316] rounded-xl flex items-center justify-center shadow-sm shadow-orange-100">
          {icon}
        </div>
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none">{label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="font-black text-gray-900 text-[15px] leading-none">{title}</h2>
            {badge && <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">{badge}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {timer && (
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-red-400" />
            <Countdown />
          </div>
        )}
        <Link href={href} className="flex items-center gap-1 text-xs font-black text-[#F97316] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full transition-all">
          See All <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────
// DEAL BOX
// ─────────────────────────────────────────────────────────────
const DealBox = memo(function DealBox({
  title, sub, href, products, color, emoji,
}: {
  title: string; sub: string; href: string; products: any[]; color: string; emoji: string
}) {
  const items = products.slice(0, 4)
  while (items.length < 4) items.push(null)

  return (
    <Link href={href}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col">
      <div className={`${color} px-4 pt-4 pb-3`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-black text-gray-900 text-sm leading-tight">{title}</p>
            <p className="text-xs text-gray-600 mt-0.5 font-medium">{sub}</p>
          </div>
          <span className="text-2xl">{emoji}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-[1px] bg-gray-100 flex-1">
        {items.map((p, i) => (
          <div key={i} className="bg-white aspect-square overflow-hidden flex items-center justify-center p-2 group-hover:bg-gray-50/50 transition-colors">
            {p ? (
              <div className="w-full h-full relative">
                <img src={p.images?.[0]} alt={p.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                {p.discount > 0 && (
                  <span className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded">
                    -{p.discount}%
                  </span>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center">
                <span className="text-2xl opacity-20">📦</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-gray-50">
        <span className="text-xs font-black text-[#F97316]">Shop Now</span>
        <ArrowRight size={12} className="text-[#F97316] group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
})

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name:'For You',     slug:'featured',     emoji:'✨' },
  { name:'Mobiles',     slug:'mobiles',      emoji:'📱' },
  { name:'Fashion',     slug:'fashion',      emoji:'👗' },
  { name:'Electronics', slug:'electronics',  emoji:'💻' },
  { name:'Home',        slug:'home-kitchen', emoji:'🏠' },
  { name:'Beauty',      slug:'beauty',       emoji:'💄' },
  { name:'Sports',      slug:'sports',       emoji:'⚽' },
  { name:'Books',       slug:'books',        emoji:'📚' },
  { name:'Grocery',     slug:'grocery',      emoji:'🛒' },
  { name:'Toys',        slug:'toys',         emoji:'🧸' },
  { name:'Appliances',  slug:'appliances',   emoji:'🔌' },
  { name:'Furniture',   slug:'furniture',    emoji:'🪑' },
]

const CategoryStrip = memo(function CategoryStrip() {
  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-2">
        <div className="flex items-start overflow-x-auto scrollbar-hide py-3 gap-1">
          {CATEGORIES.map(cat => (
            <Link key={cat.slug}
              href={cat.slug === 'featured' ? '/products' : `/category/${cat.slug}`}
              className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-orange-50 transition-all flex-shrink-0 group">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 border-gray-100 bg-gray-50 group-hover:border-[#F97316]/50 group-hover:bg-orange-50 transition-all">
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
  )
})

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    // Show dummy instantly — no blank screen
    setFeatured(DUMMY)
    setTrending([...DUMMY].reverse())
    setLoading(false)

    // Then fetch real data in background
    Promise.all([
      api.get('/products/featured').catch(() => null),
      api.get('/products/trending').catch(() => null),
    ]).then(([f, t]) => {
      if (f?.data?.data?.length) setFeatured(f.data.data)
      if (t?.data?.data?.length) setTrending(t.data.data)
    })
  }, [])

  const elec    = DUMMY.filter((_, i) => i < 4)
  const fashion = DUMMY.filter((_, i) => i >= 3 && i < 7)
  const home    = DUMMY.filter((_, i) => i >= 5 && i < 9)
  const beauty  = DUMMY.filter((_, i) => i >= 8 && i < 12)

  return (
    <>
      <Ticker />

      <div className="min-h-screen bg-[#f0f2f5]">
        <HeroCarousel />
        <CategoryStrip />

        <div className="max-w-[1440px] mx-auto px-3 py-4 space-y-4">

          {/* Flash Deals + Deal Boxes */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600 to-orange-500">
              <div className="flex items-center gap-3">
                <Flame size={18} className="text-white animate-pulse" />
                <span className="font-black text-white text-sm uppercase tracking-wide">Flash Deals</span>
                <span className="w-px h-4 bg-white/30" />
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-xs">Ends in:</span>
                  {/* Countdown is isolated — only IT re-renders every second */}
                  <Countdown />
                </div>
              </div>
              <Link href="/products?discount=20" className="text-white/90 hover:text-white text-xs font-black flex items-center gap-1">
                All Deals <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-gray-100">
              <DealBox title="Electronics Up to 70% off" sub="Mobiles, Laptops & more" href="/category/electronics" products={elec}    color="bg-blue-50"   emoji="💻" />
              <DealBox title="Fashion Min. 50% off"       sub="Top brands & trends"    href="/category/fashion"     products={fashion} color="bg-pink-50"   emoji="👗" />
              <DealBox title="Home Essentials from ₹199" sub="Kitchen, decor & more"  href="/category/home-kitchen"products={home}    color="bg-green-50"  emoji="🏠" />
              <DealBox title="Beauty & Skincare Deals"   sub="Genuine products only"  href="/category/beauty"      products={beauty}  color="bg-purple-50" emoji="💄" />
            </div>
          </div>

          {/* Promo Banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/products?discount=30"
              className="relative overflow-hidden rounded-2xl h-32 flex items-center px-6 group"
              style={{ background:'linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)' }}>
              <div className="absolute right-0 top-0 bottom-0 w-40 flex items-center justify-center text-7xl opacity-15 select-none group-hover:scale-110 transition-transform duration-500">📱</div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-[#F97316] uppercase tracking-widest mb-1">Today Only</p>
                <h3 className="text-xl font-black text-white leading-tight">Mobiles<br /><span className="text-[#F97316]">Up to 40% off</span></h3>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Zap size={10} className="text-yellow-400" /> Limited time offer</p>
              </div>
            </Link>
            <Link href="/sell"
              className="relative overflow-hidden rounded-2xl h-32 flex items-center px-6 group bg-gradient-to-br from-[#F97316] to-[#EA580C]">
              <div className="absolute right-0 top-0 bottom-0 w-40 flex items-center justify-center text-7xl opacity-20 select-none group-hover:scale-110 transition-transform duration-500">🚀</div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Zero Investment</p>
                <h3 className="text-xl font-black text-white leading-tight">Start Selling<br />on BELLMAK</h3>
                <p className="text-xs text-white/80 mt-1 flex items-center gap-1"><Crown size={10} className="text-yellow-300" /> ₹0 Registration Fee</p>
              </div>
            </Link>
          </div>

          {/* Featured Products */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <SectionHeader
              icon={<Star size={15} className="text-white fill-white" />}
              label="Handpicked for You"
              title="Featured Products"
              href="/products"
              badge="HOT"
            />
            <ProductShelf products={featured} loading={loading} count={10} />
          </div>

          {/* More Categories */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Tag size={15} className="text-[#F97316]" />
              <h2 className="font-black text-gray-900 text-sm">More Deals Across Categories</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-gray-100">
              <DealBox title="Books & Stationery"  sub="Starting ₹49"      href="/category/books"    products={DUMMY.slice(8,12)}  color="bg-yellow-50"  emoji="📚" />
              <DealBox title="Sports & Fitness"    sub="Top brands on sale" href="/category/sports"   products={DUMMY.slice(3,7)}   color="bg-orange-50"  emoji="⚽" />
              <DealBox title="Toys & Games"        sub="For kids of all ages"href="/category/toys"   products={DUMMY.slice(6,10)}  color="bg-cyan-50"    emoji="🧸" />
              <DealBox title="Appliances"          sub="Up to 55% off"      href="/category/appliances"products={DUMMY.slice(4,8)} color="bg-indigo-50"  emoji="🔌" />
            </div>
          </div>

          {/* Trending Now */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <SectionHeader
              icon={<TrendingUp size={15} className="text-white" />}
              label="Most Bought Today"
              title="Trending Now 🔥"
              href="/products?sort=popular"
            />
            <div className="grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-2 border-r border-gray-100 p-4 space-y-2">
                {(trending.length ? trending : DUMMY).slice(0, 5).map((p, i) => {
                  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣']
                  return (
                    <Link key={p.id} href={`/products/${p.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                      <span className="text-lg w-8 text-center flex-shrink-0">{medals[i]}</span>
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 line-clamp-1">{p.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-sm font-black text-gray-900">₹{p.price.toLocaleString('en-IN')}</span>
                          {p.discount > 0 && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">{p.discount}% off</span>}
                        </div>
                      </div>
                      <ArrowUpRight size={13} className="text-gray-300 group-hover:text-[#F97316] transition-colors flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
              <div className="md:col-span-3 grid grid-cols-4 divide-x divide-y divide-gray-100">
                {(trending.length ? trending : DUMMY).slice(5, 9).map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </div>

          {/* Budget Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Tag size={14} className="text-[#F97316]" /> Shop by Budget
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label:'Under ₹499',   href:'/products?maxPrice=499',  color:'bg-green-50 border-green-200 text-green-700',    emoji:'💸' },
                { label:'Under ₹999',   href:'/products?maxPrice=999',  color:'bg-blue-50 border-blue-200 text-blue-700',       emoji:'🛍️' },
                { label:'Under ₹2,999', href:'/products?maxPrice=2999', color:'bg-purple-50 border-purple-200 text-purple-700', emoji:'🎁' },
                { label:'Premium 5K+',  href:'/products?minPrice=5000', color:'bg-amber-50 border-amber-200 text-amber-700',    emoji:'⭐' },
              ].map(b => (
                <Link key={b.label} href={b.href}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${b.color} hover:shadow-sm transition-all font-bold text-sm`}>
                  <span className="text-lg">{b.emoji}</span>{b.label}
                </Link>
              ))}
            </div>
          </div>

          {/* New Arrivals */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <SectionHeader
              icon={<Zap size={15} className="text-white fill-white" />}
              label="Just Landed"
              title="New Arrivals ✨"
              href="/products?sort=newest"
            />
            <ProductShelf products={[...DUMMY].reverse()} loading={loading} count={10} />
          </div>

          {/* Live Shopping */}
          <div className="rounded-2xl overflow-hidden relative bg-gradient-to-r from-red-600 via-red-500 to-[#F97316]">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage:'radial-gradient(circle at 80% 50%, white 0%, transparent 50%)' }} />
            <div className="relative z-10 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Radio size={24} className="text-white animate-pulse" />
                </div>
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="flex items-center gap-1.5 bg-white/20 text-[10px] font-black px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> LIVE NOW
                    </span>
                    <span className="text-[10px] text-red-100">3 streams active</span>
                  </div>
                  <h3 className="text-xl font-black leading-tight">Live Shopping Events</h3>
                  <p className="text-red-100 text-xs mt-0.5">Watch. Discover. Buy — Exclusive live-only prices!</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link href="/live" className="flex items-center gap-2 bg-white text-red-600 font-black text-sm px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg">
                  <Play size={14} fill="currentColor" /> Watch Live
                </Link>
                <Link href="/live/seller" className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all">
                  Go Live
                </Link>
              </div>
            </div>
          </div>

          {/* Trust Strip */}
          <div className="bg-white rounded-2xl shadow-sm px-5 py-4 border border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { Icon:Truck,     title:'Free Delivery',   desc:'On orders ₹499+',    g:'from-orange-400 to-[#F97316]'  },
                { Icon:RefreshCw, title:'Easy Returns',    desc:'7-day no questions',  g:'from-green-400 to-emerald-600' },
                { Icon:Shield,    title:'Secure Payments', desc:'Bank-grade 256-bit',  g:'from-blue-400 to-blue-600'     },
                { Icon:Award,     title:'Genuine Products',desc:'100% verified',       g:'from-purple-400 to-violet-600' },
              ].map(({ Icon, title, desc, g }) => (
                <div key={title} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-orange-100 hover:bg-orange-50/30 transition-all group">
                  <div className={`w-10 h-10 bg-gradient-to-br ${g} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon size={17} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-gray-800 text-xs">{title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sell CTA */}
          <div className="rounded-2xl overflow-hidden relative bg-[#1a1a2e] border border-white/5">
            <div className="absolute inset-0" style={{ backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(249,115,22,0.07) 0%, transparent 60%)' }} />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F97316]/30 to-transparent" />
            <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-[10px] font-black px-3 py-1 rounded-full mb-4">
                  <Crown size={11} /> BECOME A SELLER
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                  Grow Your Business.<br />
                  <span className="text-[#F97316]">Zero Investment.</span>
                </h3>
                <p className="text-gray-500 text-sm">Register free. List products. Get orders from 50,000+ buyers.</p>
                <div className="flex items-center gap-6 mt-4">
                  {[{v:'₹0',l:'Registration'},{v:'0%',l:'Commission (First 100)'},{v:'24/7',l:'Seller Support'}].map(s => (
                    <div key={s.l}>
                      <p className="text-lg font-black text-[#F97316]">{s.v}</p>
                      <p className="text-[9px] text-gray-500">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <Link href="/sell" className="flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-sm px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02]">
                  Start Selling Free <ArrowRight size={14} />
                </Link>
                <Link href="/seller/dashboard" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all text-center">
                  My Seller Dashboard
                </Link>
              </div>
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
      `}</style>
    </>
  )
}