'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useCartStore, useAuthStore, useWishlistStore } from '@/lib/store'
import toast from 'react-hot-toast'
import {
  ShoppingCart, Heart, Star, Shield, Truck, RefreshCw,
  ChevronRight, Minus, Plus, Share2, Check, Package,
  Zap, BadgeCheck, ThumbsUp, MessageSquare
} from 'lucide-react'

// ── FORMAT CURRENCY ───────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

// ── STAR DISPLAY ──────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  )
}

// ── SKELETON ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white rounded-2xl p-4 animate-pulse">
            <div className="aspect-square bg-gray-100 rounded-xl mb-3" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="w-14 h-14 bg-gray-100 rounded-lg" />)}
            </div>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-100 rounded w-1/4" />
              <div className="h-6 bg-gray-100 rounded w-full" />
              <div className="h-6 bg-gray-100 rounded w-3/4" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-12 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl p-4 animate-pulse h-40" />
            <div className="bg-orange-100 rounded-2xl p-4 animate-pulse h-28" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── REVIEW FORM ───────────────────────────────────────────────────────────────
function ReviewForm({ productId, onSubmit }: { productId: string; onSubmit: () => void }) {
  const { isLoggedIn } = useAuthStore()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!isLoggedIn) { toast.error('Please login to submit a review!'); return }
    if (rating === 0) { toast.error('Please select a rating!'); return }
    if (comment.trim().length < 10) { toast.error('Review must be at least 10 characters!'); return }
    setSubmitting(true)
    try {
      await api.post(`/reviews`, { productId, rating, comment })
      toast.success('Review submitted! 🎉')
      setRating(0)
      setComment('')
      onSubmit()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit review!')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-5 text-center">
        <MessageSquare size={28} className="text-[#F97316] mx-auto mb-2" />
        <p className="font-bold text-gray-800 text-sm mb-1">Want to share your experience?</p>
        <p className="text-xs text-gray-500 mb-3">Login to write a review</p>
        <Link href="/login" className="inline-block bg-[#F97316] text-white px-6 py-2 rounded-xl text-sm font-black hover:bg-[#EA580C] transition-colors">
          Login to Review
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
      <h4 className="font-black text-gray-800 text-sm mb-4">Write a Review</h4>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(s)}
            className="transition-transform hover:scale-125"
          >
            <Star
              size={28}
              className={s <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-xs font-bold text-gray-500 ml-2">
            {['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'][rating]}
          </span>
        )}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value.slice(0, 500))}
        placeholder="Share your experience with this product..."
        rows={3}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#F97316] resize-none bg-white transition-colors mb-3"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{comment.length}/500</span>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-[#F97316] text-white px-5 py-2 rounded-xl text-sm font-black hover:bg-[#EA580C] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {submitting
            ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
            : 'Submit Review'
          }
        </button>
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { addItem } = useCartStore()
  const { user, isLoggedIn } = useAuthStore()
  const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingCart, setAddingCart] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description')
  const [pincode, setPincode] = useState('')
  const [deliveryMsg, setDeliveryMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [checkingPin, setCheckingPin] = useState(false)
  const [imgZoom, setImgZoom] = useState(false)

  useEffect(() => { fetchProduct() }, [slug])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/products/${slug}`)
      setProduct(res.data.data)
    } catch {
      toast.error('Product not found!')
      router.push('/products')
    } finally {
      setLoading(false)
    }
  }

  // ── CART (fixed — uses correct store fields) ──────────────────────────────
  const handleAddToCart = () => {
    if (!product || product.stock === 0) { toast.error('Out of stock!'); return }
    setAddingCart(true)
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      mrp: product.mrp || product.price,
      image: product.images?.[0] || '',
      quantity,
    })
    setCartSuccess(true)
    toast.success(`${quantity} item${quantity > 1 ? 's' : ''} added to cart! 🛒`, {
      style: { borderRadius: '12px', fontSize: '13px' }
    })
    setTimeout(() => { setAddingCart(false); setCartSuccess(false) }, 1500)
  }

  const handleBuyNow = () => {
    if (!product || product.stock === 0) { toast.error('Out of stock!'); return }
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      mrp: product.mrp || product.price,
      image: product.images?.[0] || '',
      quantity,
    })
    router.push('/checkout')
  }

  // ── WISHLIST (fixed — store accepts only string ID) ────────────────────────
  const wishlisted = product ? isInWishlist(product.id) : false
  const toggleWishlist = () => {
    if (!product) return
    if (wishlisted) {
      removeWishlist(product.id)
      toast.success('Removed from wishlist')
    } else {
      addWishlist(product.id)
      toast.success('Added to wishlist ❤️')
    }
  }

  // ── DELIVERY CHECK ────────────────────────────────────────────────────────
  const checkDelivery = async () => {
    if (pincode.length !== 6) { toast.error('Enter a valid 6-digit pincode'); return }
    setCheckingPin(true)
    setDeliveryMsg(null)
    await new Promise(r => setTimeout(r, 800))
    const valid = parseInt(pincode[0]) >= 1
    setDeliveryMsg(
      valid
        ? { type: 'success', text: `✅ Delivery to ${pincode} in 3-5 business days` }
        : { type: 'error', text: `❌ Delivery not available to ${pincode}` }
    )
    setCheckingPin(false)
  }

  // ── SHARE ────────────────────────────────────────────────────────────────
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  // ── DERIVED VALUES ────────────────────────────────────────────────────────
  const discount = product && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0
  const savings = product ? Math.max(0, (product.mrp || product.price) - product.price) : 0
  const coinsEarned = product ? Math.floor(product.price * 0.01) : 0

  if (loading) return <Skeleton />
  if (!product) return null

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* ── BREADCRUMB ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 flex-wrap">
          <Link href="/" className="hover:text-[#F97316] transition-colors">Home</Link>
          <ChevronRight size={11} />
          <Link href="/products" className="hover:text-[#F97316] transition-colors">Products</Link>
          {product.category && (
            <>
              <ChevronRight size={11} />
              <Link href={`/category/${product.category.slug}`} className="hover:text-[#F97316] transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={11} />
          <span className="text-gray-700 font-semibold truncate max-w-[200px]">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ════════════════════════════════════════
              LEFT — Image Gallery
          ════════════════════════════════════════ */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-20">

              {/* Main Image */}
              <div
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3 cursor-zoom-in"
                onClick={() => setImgZoom(true)}
              >
                <img
                  src={product.images?.[selectedImage] || 'https://via.placeholder.com/500x500/f8fafc/cbd5e1?text=No+Image'}
                  alt={product.title}
                  className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x500/f8fafc/cbd5e1?text=No+Image' }}
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {discount > 0 && (
                    <span className="bg-[#F97316] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                      {discount}% OFF
                    </span>
                  )}
                  {product.isAssured && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      <BadgeCheck size={10} /> Assured
                    </span>
                  )}
                </div>

                {/* Wishlist */}
                <button
                  onClick={e => { e.stopPropagation(); toggleWishlist() }}
                  className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm border ${
                    wishlisted
                      ? 'bg-red-500 border-red-400 scale-110'
                      : 'bg-white border-gray-200 hover:border-red-300 hover:scale-110'
                  }`}
                >
                  <Heart size={16} className={wishlisted ? 'fill-white text-white' : 'text-gray-400'} />
                </button>

                {/* Out of Stock */}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <span className="bg-red-500 text-white font-black text-sm px-4 py-2 rounded-xl shadow">
                      Out of Stock
                    </span>
                  </div>
                )}

                <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm">
                  Click to zoom
                </div>
              </div>

              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {product.images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all hover:scale-105 ${
                        selectedImage === i
                          ? 'border-[#F97316] shadow-sm shadow-orange-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all font-semibold"
              >
                <Share2 size={14} /> Share this product
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════
              MIDDLE — Product Info
          ════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-4">

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              {product.brand && (
                <p className="text-xs font-black text-[#F97316] uppercase tracking-wider mb-1.5">{product.brand}</p>
              )}
              <h1 className="text-lg font-black text-gray-900 leading-snug mb-3">{product.title}</h1>

              {/* Rating + Stock */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {product.avgRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-black px-2 py-1 rounded-lg">
                      <Star size={10} fill="currentColor" />
                      {product.avgRating?.toFixed(1)}
                    </div>
                    <span className="text-xs text-gray-400">({product.totalReviews?.toLocaleString() || 0})</span>
                  </div>
                )}
                {product.stock > 0 ? (
                  <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                    <Check size={11} /> In Stock ({product.stock} left)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">Out of Stock</span>
                )}
              </div>

              {/* Price */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-3xl font-black text-gray-900">{fmt(product.price)}</span>
                  {product.mrp > product.price && (
                    <span className="text-base text-gray-400 line-through font-medium">{fmt(product.mrp)}</span>
                  )}
                  {discount > 0 && (
                    <span className="text-sm font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                      {discount}% off
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-xs text-green-600 font-bold mt-1.5">You save {fmt(savings)}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-bold text-gray-700">Qty:</span>
                <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-black text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {quantity >= product.stock && product.stock > 0 && (
                  <span className="text-xs text-[#F97316] font-bold">Max qty!</span>
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || addingCart}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 border-2 ${
                    cartSuccess
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-[#F97316] text-[#F97316] hover:bg-orange-50'
                  }`}
                >
                  {cartSuccess ? <><Check size={16} /> Added!</> : <><ShoppingCart size={16} /> Add to Cart</>}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-black rounded-xl transition-all disabled:opacity-50 text-sm shadow-lg shadow-orange-200"
                >
                  <Zap size={16} /> Buy Now
                </button>
              </div>

              {product.stock > 0 && product.stock <= 5 && (
                <p className="text-center text-xs text-red-500 font-bold mt-2 animate-pulse">
                  ⚠️ Only {product.stock} left — Order soon!
                </p>
              )}
            </div>

            {/* Delivery Check */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Truck size={14} className="text-[#F97316]" />
                </div>
                Check Delivery
              </h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={pincode}
                  onChange={e => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setDeliveryMsg(null) }}
                  onKeyDown={e => e.key === 'Enter' && checkDelivery()}
                  placeholder="Enter 6-digit pincode"
                  className="flex-1 px-3 py-2.5 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#F97316] transition-colors"
                />
                <button
                  onClick={checkDelivery}
                  disabled={checkingPin || pincode.length !== 6}
                  className="px-4 py-2.5 bg-[#F97316] text-white font-black text-sm rounded-xl hover:bg-[#EA580C] transition-colors disabled:opacity-50"
                >
                  {checkingPin
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Check'
                  }
                </button>
              </div>
              {deliveryMsg && (
                <p className={`text-xs font-semibold px-3 py-2 rounded-xl ${
                  deliveryMsg.type === 'success' ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'
                }`}>
                  {deliveryMsg.text}
                </p>
              )}
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Shield, label: 'Secure Payment', sub: '100% safe', bg: 'bg-blue-50 text-blue-500' },
                  { icon: RefreshCw, label: 'Easy Returns', sub: '7-day policy', bg: 'bg-green-50 text-green-500' },
                  { icon: Package, label: 'Fast Delivery', sub: '3-5 days', bg: 'bg-orange-50 text-[#F97316]' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center text-center gap-1.5 p-2">
                    <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center`}>
                      <item.icon size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 leading-tight">{item.label}</span>
                    <span className="text-[10px] text-gray-400">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════
              RIGHT — Sidebar
          ════════════════════════════════════════ */}
          <div className="lg:col-span-3 space-y-4">

            {/* Seller Info */}
            {product.seller && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Sold By</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-base">
                      {product.seller.businessName?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-sm leading-tight">{product.seller.businessName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Stars rating={4.5} size={11} />
                      <span className="text-[10px] text-gray-400">Trusted</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[{ label: 'On Time', value: '98%' }, { label: 'Response', value: 'Fast' }].map(s => (
                    <div key={s.label} className="text-center bg-gray-50 rounded-xl py-2">
                      <p className="font-black text-gray-800 text-sm">{s.value}</p>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/seller/${product.seller.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-semibold transition-colors"
                >
                  View Store <ChevronRight size={13} />
                </Link>
              </div>
            )}

            {/* Coins Card */}
            <div className="bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl p-4 text-white overflow-hidden relative">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
              <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🪙</span>
                  <span className="font-black text-sm">BELLMAK Coins</span>
                </div>
                <p className="text-xs opacity-80 mb-2">Earn on every purchase!</p>
                <p className="text-3xl font-black">+{coinsEarned}</p>
                <p className="text-xs opacity-75">coins on this order</p>
                {user && (
                  <div className="mt-3 bg-white/20 rounded-xl px-3 py-2">
                    <p className="text-xs font-bold">Your balance: 🪙 {user.bellmakCoins}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Offers */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Available Offers</p>
              <div className="space-y-2.5">
                {[
                  { icon: '💳', text: '5% cashback on HDFC Credit Card' },
                  { icon: '📦', text: 'Free delivery on orders above ₹499' },
                  { icon: '🪙', text: `Earn ${coinsEarned} coins on this purchase` },
                ].map((offer, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0 mt-0.5">{offer.icon}</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{offer.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            TABS — Description / Specs / Reviews
        ════════════════════════════════════════ */}
        <div className="mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
            {[
              { key: 'description', label: 'Description' },
              { key: 'specs', label: 'Specifications' },
              { key: 'reviews', label: `Reviews (${product.totalReviews || 0})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'border-[#F97316] text-[#F97316]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* Description */}
            {activeTab === 'description' && (
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {product.description || (
                  <div className="text-center py-8 text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No description available.</p>
                  </div>
                )}
              </div>
            )}

            {/* Specs */}
            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(product.specifications?.length > 0
                  ? product.specifications.map((s: any) => ({ label: s.key, value: s.value }))
                  : [
                      { label: 'Brand', value: product.brand || 'N/A' },
                      { label: 'Category', value: product.category?.name || 'N/A' },
                      { label: 'Stock', value: `${product.stock} units` },
                      { label: 'Assured', value: product.isAssured ? '✓ BELLMAK Assured' : 'Standard' },
                      { label: 'Return Policy', value: '7-day easy return' },
                      { label: 'Delivery', value: 'Free above ₹499' },
                    ]
                ).map((spec: any, i: number) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white border border-gray-50'}`}>
                    <span className="text-xs font-black text-gray-500 w-28 flex-shrink-0">{spec.label}</span>
                    <span className="text-xs text-gray-800 font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Summary */}
                {product.avgRating > 0 && (
                  <div className="flex items-center gap-8 p-5 bg-gray-50 rounded-2xl">
                    <div className="text-center flex-shrink-0">
                      <p className="text-5xl font-black text-gray-900">{product.avgRating?.toFixed(1)}</p>
                      <Stars rating={product.avgRating} size={16} />
                      <p className="text-xs text-gray-400 mt-1">{product.totalReviews} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(star => {
                        const pct = star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : star === 2 ? 3 : 2
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-3">{star}</span>
                            <Star size={10} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-yellow-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Review Form */}
                <ReviewForm productId={product.id} onSubmit={fetchProduct} />

                {/* Reviews List */}
                {!product.reviews || product.reviews.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-3">⭐</div>
                    <h3 className="font-bold text-gray-700 mb-1">No reviews yet</h3>
                    <p className="text-sm text-gray-400">Be the first to share your experience!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {product.reviews.map((review: any) => (
                      <div key={review.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-black">
                                {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{review.user?.name || 'Anonymous'}</p>
                              <p className="text-[10px] text-gray-400">
                                {review.createdAt
                                  ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : ''
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-black px-2 py-0.5 rounded-lg flex-shrink-0">
                            <Star size={9} fill="currentColor" /> {review.rating}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2">
                          <ThumbsUp size={12} /> Helpful
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── IMAGE ZOOM MODAL ─────────────────────────────────────────────── */}
      {imgZoom && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setImgZoom(false)}
        >
          <img
            src={product.images?.[selectedImage] || ''}
            alt={product.title}
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
          <button
            onClick={() => setImgZoom(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors text-lg"
          >
            ✕
          </button>
          {product.images?.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {product.images.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setSelectedImage(i) }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${selectedImage === i ? 'bg-white scale-125' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MOBILE STICKY BAR ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl px-4 py-3 flex gap-3 lg:hidden z-40">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addingCart}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm border-2 transition-all disabled:opacity-50 ${
            cartSuccess ? 'bg-green-500 border-green-500 text-white' : 'border-[#F97316] text-[#F97316]'
          }`}
        >
          {cartSuccess ? <><Check size={15} /> Added!</> : <><ShoppingCart size={15} /> Add to Cart</>}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={product.stock === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-black rounded-xl transition-all disabled:opacity-50 text-sm"
        >
          <Zap size={15} /> Buy Now
        </button>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  )
}
