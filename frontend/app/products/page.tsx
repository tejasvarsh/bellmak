'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'
import { SlidersHorizontal, ChevronDown, Search, X } from 'lucide-react'

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
]

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    sort: 'createdAt',
    minPrice: '',
    maxPrice: '',
    category: searchParams.get('category') || '',
    inStock: false,
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [filters, page])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params: any = {
        sort: filters.sort,
        page,
        limit: 20,
      }
      if (filters.minPrice) params.minPrice = filters.minPrice
      if (filters.maxPrice) params.maxPrice = filters.maxPrice
      if (filters.category) params.category = filters.category
      if (filters.inStock) params.inStock = 'true'

      const res = await api.get('/products', { params })
      setProducts(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
      setTotalPages(res.data.pagination?.totalPages || 1)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({ sort: 'createdAt', minPrice: '', maxPrice: '', category: '', inStock: false })
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-gray-900">All Products</h1>
            <p className="text-sm text-gray-500">{total} products found</p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-orange-400 transition-colors">
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {/* Filters Bar */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Sort By</label>
              <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                className="border-2 border-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Min Price</label>
              <input type="number" value={filters.minPrice}
                onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                placeholder="₹0"
                className="border-2 border-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 w-28" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Max Price</label>
              <input type="number" value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                placeholder="₹99999"
                className="border-2 border-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 w-28" />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input type="checkbox" id="inStock" checked={filters.inStock}
                onChange={e => setFilters(f => ({ ...f, inStock: e.target.checked }))}
                className="w-4 h-4 accent-orange-500" />
              <label htmlFor="inStock" className="text-sm font-bold text-gray-700">In Stock Only</label>
            </div>
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 border-2 border-red-100 rounded-xl hover:bg-red-50 transition-colors pb-2">
              <X size={14} /> Clear
            </button>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-0 border border-gray-200 bg-white rounded-sm">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="p-3 border border-gray-100">
                <div className="aspect-square bg-gray-100 rounded-lg skeleton mb-3" />
                <div className="h-3 bg-gray-100 rounded skeleton mb-2" />
                <div className="h-3 bg-gray-100 rounded skeleton w-2/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">Try changing filters</p>
            <button onClick={clearFilters} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 divide-x divide-y divide-gray-200 border border-gray-200 bg-white">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40 hover:border-orange-400 transition-colors">
                  ← Prev
                </button>
                <span className="text-sm text-gray-600 font-bold">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40 hover:border-orange-400 transition-colors">
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