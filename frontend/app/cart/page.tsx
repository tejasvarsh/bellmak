'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Minus, ShoppingBag, Tag, ArrowRight, ShoppingCart, Zap, X, Check } from 'lucide-react'
import { useCartStore, useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, coupon, setCoupon, getSubtotal, clearCart } = useCartStore()
  const { isLoggedIn } = useAuthStore()
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const subtotal = getSubtotal()
  const deliveryCharge = subtotal >= 499 ? 0 : 40
  const couponDiscount = coupon?.discountAmount || 0
  const total = subtotal - couponDiscount + deliveryCharge
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const savings = couponDiscount + (subtotal >= 499 && subtotal > 0 ? 40 : 0)

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const res = await api.post('/cart/apply-coupon', { code: couponCode, orderAmount: subtotal })
      setCoupon({ code: couponCode, discountAmount: res.data.data.discountAmount })
      toast.success(`Coupon applied! You save ${fmt(res.data.data.discountAmount)} 🎉`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon!')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemove = (id: string) => {
    setRemovingId(id)
    setTimeout(() => {
      removeItem(id)
      setRemovingId(null)
      toast.success('Item removed')
    }, 300)
  }

  const handleCheckout = () => {
    if (!isLoggedIn) { toast.error('Please login first!'); router.push('/login'); return }
    router.push('/checkout')
  }

  // ── EMPTY STATE ──
  if (items.length === 0) return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-28 h-28 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-primary/30">
          <ShoppingCart size={44} className="text-primary/40" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Cart is Empty!</h2>
        <p className="text-gray-400 mb-8 text-sm">Looks like you haven't added anything yet. Start shopping!</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
          <ShoppingBag size={18} /> Start Shopping
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f9fb]">

      {/* ── HEADER BAR ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-black text-gray-900 text-base flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            My Cart
            <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full">{totalItems}</span>
          </h1>
          <button onClick={() => { clearCart(); toast.success('Cart cleared') }}
            className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1">
            <X size={13} /> Clear All
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">

        {/* Free delivery progress */}
        {subtotal < 499 && (
          <div className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <span className="text-lg flex-shrink-0">🚚</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-700">Add <span className="text-primary">{fmt(499 - subtotal)}</span> more for FREE delivery!</span>
                <span className="text-xs text-gray-400">{fmt(subtotal)} / {fmt(499)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min((subtotal / 499) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        )}
        {subtotal >= 499 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
            <Check size={16} className="text-green-500 flex-shrink-0" />
            <span className="text-xs font-bold text-green-700">🎉 You've unlocked FREE delivery!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── LEFT: Items ── */}
          <div className="lg:col-span-7 space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${removingId === item.productId ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <Link href={`/products/${item.slug || item.productId}`} className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name || item.title} className="w-full h-full object-contain p-1" />
                      ) : (
                        <ShoppingBag size={24} className="text-gray-300" />
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.slug || item.productId}`}>
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-2 hover:text-primary transition-colors leading-snug">
                        {item.name || item.title}
                      </h3>
                    </Link>

                    {/* Price row */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-black text-gray-900 text-base">{fmt(item.price)}</span>
                      {item.mrp > item.price && (
                        <>
                          <span className="text-xs text-gray-400 line-through">{fmt(item.mrp)}</span>
                          <span className="text-xs font-bold text-green-600">
                            {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off
                          </span>
                        </>
                      )}
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity */}
                      <div className="flex items-center gap-1 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Line total */}
                        <span className="text-sm font-black text-primary">{fmt(item.price * item.quantity)}</span>
                        {/* Remove */}
                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* ── COUPON ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <Tag size={15} className="text-primary" /> Apply Coupon
              </h3>

              {coupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="font-black text-green-700 text-sm">{coupon.code}</p>
                      <p className="text-xs text-green-600">You save {fmt(coupon.discountAmount)}</p>
                    </div>
                  </div>
                  <button onClick={() => { setCoupon(null); setCouponCode('') }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors font-medium"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="px-4 py-2.5 bg-primary text-white font-black text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['BELLMAK10', 'SAVE200', 'FREESHIP'].map(code => (
                      <button key={code} onClick={() => setCouponCode(code)}
                        className="text-xs bg-orange-50 text-primary border border-primary/20 px-2.5 py-1 rounded-full hover:bg-orange-100 font-bold transition-colors">
                        {code}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT: Summary ── */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">

              <h3 className="font-black text-gray-900 text-base mb-4">Order Summary</h3>

              {/* Items preview */}
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {items.slice(0, 4).map(item => (
                  <div key={item.productId} className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <ShoppingBag size={14} className="text-gray-300" />
                    )}
                  </div>
                ))}
                {items.length > 4 && (
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-black text-gray-500">
                    +{items.length - 4}
                  </div>
                )}
              </div>

              {/* Price breakdown */}
              <div className="space-y-2.5 text-sm pb-3 border-b border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-semibold text-gray-800">{fmt(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1"><Tag size={12} /> Coupon ({coupon?.code})</span>
                    <span className="font-bold">- {fmt(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className={deliveryCharge === 0 ? 'text-green-600 font-bold' : 'font-semibold text-gray-800'}>
                    {deliveryCharge === 0 ? '🎉 FREE' : fmt(deliveryCharge)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="font-black text-gray-900 text-base">Total</span>
                <span className="font-black text-gray-900 text-xl">{fmt(total)}</span>
              </div>

              {savings > 0 && (
                <div className="py-2.5 flex items-center gap-2">
                  <span className="text-xs font-black text-green-600">🎉 You're saving {fmt(savings)} on this order!</span>
                </div>
              )}

              {/* CTA */}
              <button onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3.5 rounded-2xl font-black mt-3 transition-all shadow-lg shadow-primary/25 text-sm">
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              <button onClick={() => router.push('/')}
                className="w-full text-center text-primary text-sm font-bold mt-3 py-2 hover:bg-orange-50 rounded-xl transition-colors">
                Continue Shopping
              </button>

              {/* Trust */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
                {['🔒 Secure', '↩️ Easy Return', '🚚 Fast Delivery'].map(t => (
                  <span key={t} className="text-[10px] font-bold text-gray-400">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
