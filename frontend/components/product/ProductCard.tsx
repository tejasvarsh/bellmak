'use client'
import { memo, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useCartStore, useWishlistStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface Product {
  id: string
  title: string
  price: number
  mrp?: number
  discount?: number
  images: string[]
  avgRating?: number
  totalReviews?: number
  slug: string
  stock?: number
  isAssured?: boolean
}

const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [cartAnimating, setCartAnimating] = useState(false)
  const [wishAnimating, setWishAnimating] = useState(false)

  const addToCart = useCartStore((s) => s.addItem)
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()

  const isInWishlist = wishlistItems.some((item: any) => 
    item?.productId === product.id || item?.id === product.id
  )

  const discount = product.discount ?? (product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0)

  const inStock = (product.stock ?? 1) > 0

  // Reliable image source with fallback
  const imageSrc = product.images?.[0] 
    ? product.images[0] 
    : 'https://placehold.co/400x400/f0f2f5/9ca3af?text=No+Image'

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setWishAnimating(true)

    if (isInWishlist) {
      removeFromWishlist(product.id)
      toast('Removed from wishlist', { icon: '💔', duration: 1200 })
    } else {
      addToWishlist(product.id)
      toast.success('Added to wishlist!', { icon: '❤️', duration: 1200 })
    }

    setTimeout(() => setWishAnimating(false), 400)
  }, [isInWishlist, product.id, addToWishlist, removeFromWishlist])

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!inStock) return

    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      mrp: product.mrp ?? product.price,
      image: product.images?.[0] ?? '',
      quantity: 1,
    })

    setCartAnimating(true)
    setTimeout(() => setCartAnimating(false), 800)
    toast.success('Added to cart!', { duration: 1500, icon: '🛒' })
  }, [product, addToCart, inStock])

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-2xl transition-all duration-300 h-full"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className={`object-contain p-4 transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          priority={false}
        />

        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-2xl shadow-md">
            -{discount}%
          </div>
        )}

        {product.isAssured && (
          <div className="absolute bottom-3 left-3 bg-[#F97316] text-white text-[9px] font-black px-2.5 py-0.5 rounded-xl">
            ✓ ASSURED
          </div>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-white text-red-600 text-xs font-black px-4 py-2 rounded-2xl">Out of Stock</span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 w-9 h-9 bg-white shadow-lg rounded-2xl flex items-center justify-center border border-gray-100 transition-all duration-200 hover:scale-110 ${wishAnimating ? 'scale-125' : ''}`}
        >
          <Heart size={18} className={isInWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
        </button>

        {/* Add to Cart */}
        {inStock && (
          <button
            onClick={handleAddToCart}
            className={`absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center gap-2 text-sm font-black text-white transition-all duration-300 ${cartAnimating ? 'bg-green-500' : 'bg-[#F97316] hover:bg-orange-600'}`}
          >
            <ShoppingCart size={16} />
            {cartAnimating ? 'Added ✓' : 'Add to Cart'}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col">
        <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight group-hover:text-[#F97316] transition-colors flex-1">
          {product.title}
        </h3>

        {product.avgRating && product.avgRating > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex items-center bg-green-600 text-white text-[10px] font-black px-1.5 py-px rounded">
              <Star size={10} className="fill-white" />
              {product.avgRating.toFixed(1)}
            </div>
            {product.totalReviews && (
              <span className="text-xs text-gray-400">({product.totalReviews})</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-baseline gap-2">
          <span className="text-lg font-black text-gray-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{product.mrp.toLocaleString('en-IN')}
            </span>
          )}
          {discount > 0 && (
            <span className="text-xs font-bold text-green-600">({discount}% off)</span>
          )}
        </div>
      </div>
    </Link>
  )
})

export default ProductCard