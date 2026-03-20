'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useWishlistStore, useCartStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { Heart, ShoppingCart, Trash2, ArrowLeft, ShoppingBag, Star } from 'lucide-react'
import Link from 'next/link'

export default function WishlistPage() {
  const { isLoggedIn } = useAuthStore()
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const { addItem } = useCartStore()
  const router = useRouter()
  const [removing, setRemoving] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => { if (!isLoggedIn) router.push('/login') }, [])

  const handleAddToCart = (item: any) => {
    addItem({ id: item.id, name: item.name, price: item.price, image: item.image, slug: item.slug, stock: 99 })
    toast.success('Added to cart!')
  }

  const handleRemove = (id: string) => {
    setRemoving(id)
    setTimeout(() => { removeItem(id); setRemoving(null); toast.success('Removed from wishlist') }, 300)
  }

  const handleMoveAllToCart = () => {
    items.forEach(item => addItem({ id: item.id, name: item.name, price: item.price, image: item.image, slug: item.slug, stock: 99 }))
    toast.success(`${items.length} items added to cart!`)
  }

  const handleClearAll = () => { clearWishlist(); setShowClearConfirm(false); toast.success('Wishlist cleared') }

  const discountPct = (item: any) => item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#2874f0] mb-5 transition-colors">
          <ArrowLeft size={16} /> Back to Account
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Heart className="text-red-500 fill-red-500" size={20} /> My Wishlist
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
          </div>
          {items.length > 0 && (
            <div className="flex gap-2">
              <button onClick={handleMoveAllToCart}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#fb641b] text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-colors">
                <ShoppingCart size={15} /> Add All to Cart
              </button>
              <button onClick={() => setShowClearConfirm(true)}
                className="px-3 py-2.5 border border-red-200 text-red-500 font-bold text-sm rounded-xl hover:bg-red-50 transition-colors">
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Clear Confirm */}
        {showClearConfirm && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <p className="flex-1 text-sm text-red-700 font-medium">Remove all {items.length} items from wishlist?</p>
            <button onClick={handleClearAll} className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600">Yes, Clear</button>
            <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 bg-white text-gray-600 text-sm font-bold rounded-xl border border-gray-200 hover:bg-gray-50">Cancel</button>
          </div>
        )}

        {/* Empty */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-red-200" />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-400 mb-6">Save items you love to buy them later</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#2874f0] text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
              <ShoppingBag size={16} /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map(item => {
              const disc = discountPct(item)
              return (
                <div key={item.id}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${removing === item.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                  {/* Image */}
                  <Link href={`/products/${item.slug}`}>
                    <div className="relative aspect-square bg-gray-50 overflow-hidden group">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>}
                      {disc > 0 && <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{disc}% OFF</span>}
                      <button onClick={e => { e.preventDefault(); handleRemove(item.id) }}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400 opacity-0 group-hover:opacity-100">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Link>

                  <div className="p-3">
                    <Link href={`/products/${item.slug}`}>
                      <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug hover:text-[#2874f0] transition-colors mb-1">{item.name}</h3>
                    </Link>
                    {item.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="flex items-center gap-0.5 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {item.rating} <Star size={8} className="fill-white" />
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-sm font-black text-gray-900">₹{item.price.toLocaleString('en-IN')}</span>
                      {item.originalPrice && <span className="text-[10px] text-gray-400 line-through">₹{item.originalPrice.toLocaleString('en-IN')}</span>}
                    </div>
                    <button onClick={() => handleAddToCart(item)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#2874f0] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
                      <ShoppingCart size={13} /> Add to Cart
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
