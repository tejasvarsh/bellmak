'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const SORT_OPTIONS = [
  { label: 'Relevance',           value: ''          },
  { label: 'Price: Low to High',  value: 'price_asc' },
  { label: 'Price: High to Low',  value: 'price_desc'},
  { label: 'Newest First',        value: 'newest'    },
  { label: 'Top Rated',           value: 'rating'    },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''

  const [products, setProducts] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [total,    setTotal]    = useState(0)
  const [sort,     setSort]     = useState('')
  const [inputVal, setInputVal] = useState(query)

  const fetchResults = useCallback(async (q: string, s: string) => {
    if (!q.trim()) { setProducts([]); setLoading(false); return }
    setLoading(true)
    try {
      const res = await api.get('/products', { params: { search: q, sort: s, limit: 24 } })
      setProducts(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchResults(query, sort) }, [query, sort, fetchResults])
  useEffect(() => { setInputVal(query) }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputVal.trim()) router.push(`/search?q=${encodeURIComponent(inputVal)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="flex-1 flex items-center rounded-xl border border-gray-200 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-orange-50 overflow-hidden transition-all">
              <Search size={16} className="ml-4 text-gray-400 flex-shrink-0" />
              <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
                placeholder="Search for products, brands..."
                className="flex-1 px-3 py-3 text-sm outline-none bg-transparent" />
              {inputVal && (
                <button type="button" onClick={() => setInputVal('')} className="mr-2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="bg-[#F97316] hover:bg-[#EA580C] text-white font-black px-6 py-3 rounded-xl text-sm transition-all flex-shrink-0">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {query && (
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-gray-500">
              {loading ? 'Searching...' : `${total} results for `}
              {!loading && <span className="font-black text-gray-900">"{query}"</span>}
            </p>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-gray-400" />
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#F97316] bg-white">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {!query && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-black text-gray-900 mb-2">What are you looking for?</h2>
            <p className="text-gray-400 text-sm">Search for products, brands, categories and more</p>
          </div>
        )}

        {loading && query && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                  <div className="h-4 bg-gray-100 rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && query && products.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-xl font-black text-gray-900 mb-2">No results found</h2>
            <p className="text-gray-400 text-sm mb-6">Try a different search term or browse categories</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {['Mobiles', 'Fashion', 'Electronics', 'Home', 'Books'].map(cat => (
                <a key={cat} href={`/category/${cat.toLowerCase()}`}
                  className="px-4 py-2 bg-orange-50 text-[#F97316] rounded-full text-sm font-bold hover:bg-orange-100 transition-all">
                  {cat}
                </a>
              ))}
            </div>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}