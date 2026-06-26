'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { Plus, Edit, Trash2, Eye, Search, Package, TrendingUp, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SellerProducts() {
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    fetchProducts()
  }, [isLoggedIn])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/seller/products?limit=100')
      setProducts(res.data.data || [])
    } catch (err: any) {
      toast.error('Products load nahi hue')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Is product ko delete karna chahte ho?')) return
    try {
      await api.delete(`/seller/products/${id}`)
      setProducts(prev => prev.filter((p: any) => p.id !== id))
      toast.success('Product delete ho gaya!')
    } catch {
      toast.error('Delete nahi hua, dobara try karo')
    }
  }

  const handleToggleActive = async (product: any) => {
    try {
      await api.put(`/seller/products/${product.id}`, { isActive: !product.isActive })
      setProducts(prev => prev.map((p: any) =>
        p.id === product.id ? { ...p, isActive: !p.isActive } : p
      ))
      toast.success(product.isActive ? 'Product hidden kar diya' : 'Product live kar diya!')
    } catch {
      toast.error('Status update nahi hua')
    }
  }

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`

  const filtered = products.filter((p: any) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' && p.isActive) || (filter === 'inactive' && !p.isActive) || (filter === 'low' && p.stock <= 5)
    return matchSearch && matchFilter
  })

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    lowStock: products.filter(p => p.stock <= 5).length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">🛍️ My Products</h1>
            <p className="text-gray-500 text-sm mt-1">{products.length} products listed</p>
          </div>
          <Link
            href="/seller/products/new"
            className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-md"
          >
            <Plus size={18} />
            Add Product
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Package size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-800">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Products</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-800">{stats.active}</p>
                <p className="text-xs text-gray-500">Active / Live</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-800">{stats.lowStock}</p>
                <p className="text-xs text-gray-500">Low Stock</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 flex-1 w-full">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product search karo..."
              className="flex-1 outline-none text-sm text-gray-700"
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'inactive', label: 'Hidden' },
              { key: 'low', label: 'Low Stock' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === f.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 animate-pulse">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">📦</span>
              <p className="font-bold text-gray-600 text-lg">Koi product nahi mila</p>
              <p className="text-sm mt-1 mb-4">Abhi apna pehla product add karo</p>
              <Link
                href="/seller/products/new"
                className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
              >
                + Add Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((product: any) => (
                    <tr key={product.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                            <img
                              src={product.images?.[0] || 'https://placehold.co/56x56/f1f5f9/94a3b8?text=No+Img'}
                              alt={product.title}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm line-clamp-2 max-w-[220px]">{product.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{product.category?.name || 'Uncategorized'}</p>
                            {product.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800 text-sm">{fmt(product.price)}</p>
                        <p className="text-xs text-gray-400 line-through">{fmt(product.mrp)}</p>
                        <span className="text-xs text-green-600 font-bold">{product.discount}% off</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                          product.stock === 0
                            ? 'bg-red-100 text-red-600'
                            : product.stock <= 5
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-sm font-bold text-gray-700">{product.avgRating?.toFixed(1) || '0.0'}</span>
                          <span className="text-xs text-gray-400">({product.totalReviews || 0})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            product.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {product.isActive ? '🟢 Live' : '⚫ Hidden'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors"
                            title="View on site"
                          >
                            <Eye size={14} className="text-blue-600" />
                          </Link>
                          <Link
                            href={`/seller/products/edit/${product.id}`}
                            className="w-8 h-8 bg-orange-50 hover:bg-orange-100 rounded-lg flex items-center justify-center transition-colors"
                            title="Edit product"
                          >
                            <Edit size={14} className="text-orange-600" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors"
                            title="Delete product"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}