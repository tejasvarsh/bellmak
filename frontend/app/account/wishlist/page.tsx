'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Trash2, ShoppingCart, Heart, ArrowLeft, Package } from 'lucide-react'

interface WishlistItem {
  id: string
  productId: string
  title: string
  price: number
  originalPrice?: number
  images: string[]
  slug: string
}

export default function WishlistPage() {
  const { user, isLoggedIn } = useAuthStore()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Fetch wishlist
  useEffect(() => {
    if (!isLoggedIn) return
    const fetchWishlist = async () => {
      try {
        const res = await api.get('/wishlist')
        setItems(res.data.data || [])
      } catch (err) {
        console.error(err)
        toast.error('Wishlist load nahi ho paaya')
      } finally {
        setLoading(false)
      }
    }
    fetchWishlist()
  }, [isLoggedIn])

  const handleRemove = async (productId: string) => {
    setRemovingId(productId)
    try {
      await api.delete(`/wishlist/${productId}`)
      setItems(prev => prev.filter(item => item.productId !== productId))
      toast.success('Removed from wishlist')
    } catch (err) {
      toast.error('Failed to remove')
    } finally {
      setRemovingId(null)
    }
  }

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      await api.post('/cart', { productId: item.productId, quantity: 1 })
      toast.success(`${item.title} added to cart!`)
    } catch (err) {
      toast.error('Failed to add to cart')
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart size={60} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Please login first</h2>
          <Link href="/login" className="text-red-500 hover:underline">Go to Login →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="text-red-500" size={28} />
            <h1 className="text-3xl font-black text-gray-900">My Wishlist</h1>
            <span className="text-sm font-medium bg-white px-3 py-1 rounded-2xl border">{items.length} items</span>
          </div>
          <Link href="/account" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={18} /> Back to Account
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl py-20 text-center">
            <Package size={80} className="mx-auto text-gray-300 mb-6" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-8">You haven't saved any products yet</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-[#F97316] text-white font-bold px-8 py-4 rounded-2xl hover:bg-orange-600 transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.productId} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all">
                <div className="relative aspect-square">
                  <Image
                    src={item.images?.[0] || '/placeholder.jpg'}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <button
                    onClick={() => handleRemove(item.productId)}
                    disabled={removingId === item.productId}
                    className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-2xl shadow-md transition-all"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>

                <div className="p-4">
                  <Link href={`/products/${item.slug}`} className="block">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-[#F97316] transition-colors">
                      {item.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1.5 mt-3">
                    <span className="text-lg font-black text-gray-900">
                      ₹{(item.price ?? 0).toLocaleString('en-IN')}
                    </span>
                    {item.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{(item.originalPrice ?? 0).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className="mt-4 w-full bg-[#F97316] hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}