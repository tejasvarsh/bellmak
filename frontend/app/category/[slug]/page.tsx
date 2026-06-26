'use client'
import { useEffect, useState, use, useMemo, useCallback } from 'react'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'
import Link from 'next/link'
import { SlidersHorizontal, RefreshCw, PackageOpen } from 'lucide-react'

const CATEGORY_META: Record<string, { name: string; emoji: string; desc: string }> = {
  'mobiles':      { name: 'Mobiles & Smartphones',  emoji: '📱', desc: 'Latest smartphones from top brands'        },
  'fashion':      { name: 'Fashion & Clothing',     emoji: '👗', desc: 'Trending styles for men, women & kids'     },
  'electronics':  { name: 'Electronics',            emoji: '💻', desc: 'Laptops, TVs, Audio & more'               },
  'home-kitchen': { name: 'Home & Kitchen',         emoji: '🏠', desc: 'Everything for your home'                 },
  'beauty':       { name: 'Beauty & Personal Care', emoji: '💄', desc: 'Skincare, haircare, makeup & more'         },
  'sports':       { name: 'Sports & Fitness',       emoji: '⚽', desc: 'Gear up for your active lifestyle'        },
  'books':        { name: 'Books & Stationery',     emoji: '📚', desc: 'Bestsellers, textbooks & more'            },
  'toys':         { name: 'Toys & Games',           emoji: '🧸', desc: 'Fun for kids of all ages'                 },
  'grocery':      { name: 'Grocery & Essentials',   emoji: '🛒', desc: 'Daily essentials delivered fast'          },
  'appliances':   { name: 'Appliances',             emoji: '🔌', desc: 'Home & kitchen appliances from top brands'},
  'furniture':    { name: 'Furniture',              emoji: '🪑', desc: 'Modern furniture for every room'          },
  'automotive':   { name: 'Automotive',             emoji: '🚗', desc: 'Car & bike accessories'                   },
}

const SORT_OPTIONS = [
  { label: 'Popularity',         value: 'popular'    },
  { label: 'Price: Low to High', value: 'price_asc'  },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest First',       value: 'createdAt'  },
  { label: 'Top Rated',          value: 'rating'     },
]

const PRICE_FILTERS = [
  { label: 'All',          val: '',      min: '',     max: ''      },
  { label: 'Under ₹500',  val: '500',   min: '',     max: '500'   },
  { label: 'Under ₹1000', val: '1000',  min: '',     max: '1000'  },
  { label: 'Under ₹5000', val: '5000',  min: '',     max: '5000'  },
  { label: 'Under ₹10K',  val: '10000', min: '',     max: '10000' },
  { label: 'Above ₹10K',  val: '10k+',  min: '10000',max: ''      },
]

const ITEMS_PER_PAGE = 20

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const meta = CATEGORY_META[slug] ?? {
    name:  slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    emoji: '🛍️',
    desc:  'Browse all products in this category',
  }

  const [allProducts, setAllProducts] = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [sort,        setSort]        = useState('popular')
  const [priceFilter, setPriceFilter] = useState('')
  const [page,        setPage]        = useState(1)

  // Fetch on slug change — send exact slug to backend
  useEffect(() => {
    setLoading(true)
    setAllProducts([])
    setPage(1)

    api.get('/products', { params: { category: slug, limit: 200, sort: 'popular' } })
      .then(res => {
        const data = res.data?.data || []
        setAllProducts(data)
      })
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false))
  }, [slug])

  // Filter + sort locally — zero extra API calls
  const displayProducts = useMemo(() => {
    let out = [...allProducts]

    const pf = PRICE_FILTERS.find(f => f.val === priceFilter)
    if (pf?.min) out = out.filter(p => p.price >= Number(pf.min))
    if (pf?.max) out = out.filter(p => p.price <= Number(pf.max))

    if      (sort === 'price_asc')  out.sort((a, b) => a.price      - b.price)
    else if (sort === 'price_desc') out.sort((a, b) => b.price      - a.price)
    else if (sort === 'rating')     out.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    else if (sort === 'createdAt')  out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    else                            out.sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0))

    return out
  }, [allProducts, priceFilter, sort])

  const totalPages   = Math.ceil(displayProducts.length / ITEMS_PER_PAGE)
  const visibleProds = displayProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const resetFilters = useCallback(() => {
    setPriceFilter('')
    setSort('popular')
    setPage(1)
  }, [])

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      {/* Header */}
      <div className="bg-[#1a1a2e]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Link href="/" className="hover:text-[#F97316] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#F97316] transition-colors">All Products</Link>
            <span>/</span>
            <span className="text-gray-300">{meta.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl border border-white/10 flex-shrink-0">
              {meta.emoji}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">{meta.name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{meta.desc}</p>
              <div className="flex items-center gap-3 mt-1.5">
                {loading ? (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <RefreshCw size={11} className="animate-spin" /> Loading...
                  </span>
                ) : (
                  <span className="text-[#F97316] text-xs font-bold">
                    {displayProducts.length} products
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-3 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget:</span>
            {PRICE_FILTERS.map(f => (
              <button
                key={f.val}
                onClick={() => { setPriceFilter(f.val); setPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  priceFilter === f.val
                    ? 'bg-[#F97316] text-white shadow-sm shadow-orange-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-[#F97316]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-gray-400" />
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#F97316] bg-white cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                  <div className="h-3 bg-gray-100 rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleProds.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center">
            <PackageOpen size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-gray-700 mb-2">
              {allProducts.length === 0
                ? 'Koi product nahi hai abhi'
                : 'Koi product filter se match nahi kiya'}
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              {allProducts.length === 0
                ? 'Seller dashboard se is category mein products add karo'
                : 'Filter hatao ya doosra price range try karo'}
            </p>
            {allProducts.length > 0 && (
              <button
                onClick={resetFilters}
                className="bg-[#F97316] text-white font-black text-sm px-6 py-3 rounded-xl hover:bg-orange-600 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {visibleProds.map(p => <ProductCard key={p.id} product={p} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-40 transition-all"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const n = page <= 4 ? i + 1 : page - 3 + i
                  if (n < 1 || n > totalPages) return null
                  return (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-9 h-9 text-xs font-bold rounded-xl border transition-all ${
                        n === page
                          ? 'bg-[#F97316] text-white border-[#F97316]'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-[#F97316] hover:text-[#F97316]'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-40 transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}