'use client'
import { memo, useState } from 'react'
import Link from 'next/link'
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
  const [imgErr,    setImgErr]    = useState(false)
  const [cartAnim,  setCartAnim]  = useState(false)
  const [wishAnim,  setWishAnim]  = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const addToCart   = useCartStore(s => s.addItem)

  // ✅ FIX: get items array, check manually — don't call function inside selector
  const wishItems   = useWishlistStore(s => s.items)
  const addWishlist = useWishlistStore(s => s.addItem)
  const removeWish  = useWishlistStore(s => s.removeItem)

  // Check wishlist from the items array directly
  const isWishlisted = Array.isArray(wishItems)
    ? wishItems.some((item: any) =>
        typeof item === 'string' ? item === product.id : item?.productId === product.id || item?.id === product.id
      )
    : false

  const discount = product.discount ??
    (product.mrp && product.mrp > product.price
      ? Math.round((1 - product.price / product.mrp) * 100)
      : 0)

  const inStock  = (product.stock ?? 1) > 0
  const imgSrc   = (!imgErr && product.images?.[0]) || 'https://placehold.co/280x280/f0f2f5/adb5bd?text=No+Image'

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!inStock) return
    addToCart({
      productId: product.id,
      title:     product.title,
      price:     product.price,
      mrp:       product.mrp ?? product.price,
      image:     product.images?.[0] ?? '',
      quantity:  1,
    })
    setCartAnim(true)
    setTimeout(() => setCartAnim(false), 1000)
    toast.success('Added to cart!', { duration: 1500, icon: '🛒' })
  }

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isWishlisted) {
      removeWish(product.id)
      toast('Removed from wishlist', { icon: '💔', duration: 1200 })
    } else {
      addWishlist(product.id)
      toast.success('Added to wishlist!', { icon: '❤️', duration: 1200 })
    }
    setWishAnim(true)
    setTimeout(() => setWishAnim(false), 400)
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col bg-white hover:shadow-md transition-all duration-200 h-full"
      style={{ textDecoration: 'none' }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">

        {!imgLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        <img
          src={imgSrc}
          alt={product.title}
          onError={() => setImgErr(true)}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">
            -{discount}%
          </span>
        )}

        {product.isAssured && (
          <span className="absolute bottom-2 left-2 bg-[#F97316]/90 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none">
            ✓ ASSURED
          </span>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-[10px] font-black text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist btn */}
        <button
          onClick={handleWish}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200 border border-gray-100 opacity-0 group-hover:opacity-100 ${
            wishAnim ? 'scale-125' : 'hover:scale-110'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={13}
            className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'}
          />
        </button>

        {/* Cart btn */}
        {inStock && (
          <button
            onClick={handleCart}
            className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-2 text-[11px] font-black text-white translate-y-full group-hover:translate-y-0 transition-transform duration-200 ${
              cartAnim ? 'bg-green-500' : 'bg-[#F97316] hover:bg-[#EA580C]'
            }`}
            aria-label="Add to cart"
          >
            <ShoppingCart size={11} />
            {cartAnim ? 'Added! ✓' : 'Add to Cart'}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 px-2.5 py-2.5">

        <p className="text-[11.5px] font-semibold text-gray-800 leading-snug line-clamp-2 mb-1.5 flex-1 group-hover:text-[#F97316] transition-colors">
          {product.title}
        </p>

        {(product.avgRating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
              <Star size={7} className="fill-white" />
              {product.avgRating?.toFixed(1)}
            </span>
            {(product.totalReviews ?? 0) > 0 && (
              <span className="text-[9px] text-gray-400">
                ({product.totalReviews?.toLocaleString('en-IN')})
              </span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm font-black text-gray-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-[10px] text-gray-400 line-through">
              ₹{product.mrp.toLocaleString('en-IN')}
            </span>
          )}
          {discount > 0 && (
            <span className="text-[10px] text-green-600 font-bold">
              {discount}% off
            </span>
          )}
        </div>

        {inStock && (product.stock ?? 99) <= 5 && (
          <p className="text-[9px] text-orange-500 font-bold mt-1">
            Only {product.stock} left!
          </p>
        )}
      </div>
    </Link>
  )
})

export default ProductCard