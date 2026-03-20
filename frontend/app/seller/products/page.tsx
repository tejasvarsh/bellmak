'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SellerProducts() {
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await api.get('/seller/products')
      setProducts(res.data.data || [])
    } catch {
      setProducts(DUMMY_PRODUCTS as any)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/seller/products/${id}`)
      setProducts(products.filter((p: any) => p.id !== id))
      toast.success('Product deleted!')
    } catch {
      toast.error('Failed to delete!')
    }
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0
  }).format(price)

  const filtered = (products as any[]).filter((p: any) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

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
            className="bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Add Product
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex items-center gap-3">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your products..."
            className="flex-1 outline-none text-sm text-gray-700"
          />
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] || 'https://via.placeholder.com/50'}
                          alt={product.title}
                          className="w-12 h-12 rounded-xl object-contain bg-gray-50 p-1"
                        />
                        <div>
                          <p className="font-medium text-gray-800 text-sm line-clamp-1 max-w-[200px]">{product.title}</p>
                          <p className="text-xs text-gray-500">{product.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 text-sm">{formatPrice(product.price)}</p>
                      <p className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${product.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                        ⭐ {product.avgRating || '0.0'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/seller/products/edit/${product.id}`}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🛍️</p>
                <p className="font-semibold text-gray-700">No products found</p>
                <Link href="/seller/products/new" className="text-primary text-sm mt-2 inline-block hover:underline">
                  Add your first product →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const DUMMY_PRODUCTS = [
  { id: '1', title: 'Samsung Galaxy S23 Ultra 5G', price: 89999, mrp: 124999, stock: 15, avgRating: 4.6, isActive: true, images: ['https://via.placeholder.com/50?text=S23'], category: { name: 'Mobiles' }, slug: 'samsung-galaxy-s23' },
  { id: '2', title: 'Sony WH-1000XM5 Headphones', price: 24990, mrp: 34990, stock: 8, avgRating: 4.5, isActive: true, images: ['https://via.placeholder.com/50?text=Sony'], category: { name: 'Electronics' }, slug: 'sony-headphones' },
  { id: '3', title: 'Nike Air Max 270', price: 8995, mrp: 12995, stock: 3, avgRating: 4.3, isActive: false, images: ['https://via.placeholder.com/50?text=Nike'], category: { name: 'Fashion' }, slug: 'nike-airmax' },
]