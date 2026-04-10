'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore, useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  MapPin, CreditCard, ChevronRight, Check, Plus,
  Package, Truck, Shield, ChevronLeft, X
} from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand',
  'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal'
]

const PAYMENT_METHODS = [
  { id: 'COD',        icon: '💵', label: 'Cash on Delivery (COD)',  desc: 'Pay when your order arrives — no advance payment!', active: true  },
  { id: 'UPI',        icon: '📱', label: 'UPI',                     desc: 'GPay, PhonePe, Paytm',                              active: false },
  { id: 'CARD',       icon: '💳', label: 'Credit / Debit Card',     desc: 'Visa, Mastercard, RuPay',                           active: false },
  { id: 'NETBANKING', icon: '🏦', label: 'Net Banking',             desc: 'All major banks',                                   active: false },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, coupon, clearCart } = useCartStore()
  const { user, isLoggedIn } = useAuthStore()

  const [step,            setStep]            = useState<1 | 2>(1)
  const [loading,         setLoading]         = useState(false)
  const [addresses,       setAddresses]       = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<any>(null)
  const [paymentMethod,   setPaymentMethod]   = useState('COD')
  const [useCoins,        setUseCoins]        = useState(false)
  const [showForm,        setShowForm]        = useState(false)
  const [savingAddr,      setSavingAddr]      = useState(false)
  const [form, setForm] = useState({
    fullName: '', phone: '', addressLine1: '',
    addressLine2: '', city: '', state: '', pincode: '', label: 'HOME'
  })

  const subtotal         = getSubtotal()
  const deliveryCharge   = subtotal >= 499 ? 0 : 40
  const couponDiscount   = coupon?.discountAmount || 0
  const maxCoinsDiscount = Math.min((user?.bellmakCoins || 0) * 0.25, subtotal * 0.1)
  const coinsDiscount    = useCoins ? maxCoinsDiscount : 0
  const total            = subtotal - couponDiscount - coinsDiscount + deliveryCharge
  const totalItems       = items.reduce((s, i) => s + i.quantity, 0)

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    if (items.length === 0) { router.push('/cart'); return }
    fetchAddresses()
  }, [isLoggedIn, items.length])

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses')
      const addrs = res.data.data || []
      setAddresses(addrs)
      const def = addrs.find((a: any) => a.isDefault)
      if (def) setSelectedAddress(def)
      else if (addrs.length > 0) setSelectedAddress(addrs[0])
    } catch { setAddresses([]) }
  }

  const handleSaveAddress = async () => {
    const { fullName, phone, addressLine1, city, state, pincode } = form
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      toast.error('Please fill all required fields!'); return
    }
    if (!/^\d{10}$/.test(phone)) { toast.error('Enter a valid 10-digit phone number!'); return }
    if (!/^\d{6}$/.test(pincode)) { toast.error('Enter a valid 6-digit pincode!'); return }

    setSavingAddr(true)
    try {
      const res = await api.post('/addresses', form)
      const newAddr = res.data.data
      setAddresses(prev => [...prev, newAddr])
      setSelectedAddress(newAddr)
      setShowForm(false)
      setForm({ fullName:'', phone:'', addressLine1:'', addressLine2:'', city:'', state:'', pincode:'', label:'HOME' })
      toast.success('Address saved!')
    } catch {
      const newAddr = { ...form, id: 'local-' + Date.now() }
      setAddresses(prev => [...prev, newAddr])
      setSelectedAddress(newAddr)
      setShowForm(false)
      toast.success('Address saved!')
    } finally { setSavingAddr(false) }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Select a delivery address!'); return }
    if (items.length === 0) { toast.error('Cart is empty!'); return }

    setLoading(true)
    try {
      const shippingAddress = {
        name:         selectedAddress.fullName,
        fullName:     selectedAddress.fullName,
        line1:        selectedAddress.addressLine1,
        addressLine1: selectedAddress.addressLine1,
        line2:        selectedAddress.addressLine2 || '',
        addressLine2: selectedAddress.addressLine2 || '',
        city:         selectedAddress.city,
        state:        selectedAddress.state,
        pincode:      selectedAddress.pincode,
        phone:        selectedAddress.phone,
        label:        selectedAddress.label || 'HOME',
      }

      // ✅ FIX: paymentMethod state use karo, hardcoded 'COD' nahi
      await api.post('/orders', {
        items: items.map(i => ({
          productId: i.productId,
          quantity:  i.quantity,
          variant:   i.variant || null
        })),
        shippingAddress,
        paymentMethod,   // ✅ correct variable
        couponCode: coupon?.code || null,
        coinsUsed:  useCoins ? Math.floor(coinsDiscount / 0.25) : 0
      })

      clearCart()
      toast.success('Order placed successfully! 🎉')
      router.push('/account/orders')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to place order!')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">

      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => step === 2 ? setStep(1) : router.push('/cart')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="font-black text-gray-900 text-base">Checkout</h1>
          </div>
          <div className="flex items-center gap-2">
            {[{ n: 1, label: 'Address' }, { n: 2, label: 'Payment' }].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${step >= s.n ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {step > s.n ? <Check size={11} /> : <span>{s.n}</span>}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < 1 && <div className="w-6 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* LEFT */}
          <div className="lg:col-span-7 space-y-4">

            {/* STEP 1 — ADDRESS */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h2 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                      <MapPin size={14} className="text-white" />
                    </div>
                    Delivery Address
                  </h2>

                  {addresses.length > 0 && (
                    <div className="space-y-2.5 mb-4">
                      {addresses.map((addr: any) => (
                        <div key={addr.id} onClick={() => setSelectedAddress(addr)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedAddress?.id === addr.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          }`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                              selectedAddress?.id === addr.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                            }`}>
                              {selectedAddress?.id === addr.id && <Check size={11} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-black text-gray-900 text-sm">{addr.fullName}</span>
                                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">{addr.label}</span>
                                {addr.isDefault && <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">Default</span>}
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {addr.addressLine1}{addr.addressLine2 ? ', ' + addr.addressLine2 : ''},{' '}
                                {addr.city}, {addr.state} — {addr.pincode}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">📱 {addr.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showForm ? (
                    <button onClick={() => setShowForm(true)}
                      className="w-full border-2 border-dashed border-gray-200 hover:border-orange-500 text-gray-400 hover:text-orange-500 rounded-xl p-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2">
                      <Plus size={15} /> Add New Address
                    </button>
                  ) : (
                    <div className="border-2 border-orange-200 rounded-xl p-4 bg-orange-50/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-gray-800 text-sm">New Address</h3>
                        <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                          <X size={15} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <input placeholder="Full Name *" value={form.fullName}
                          onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                          className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white" />
                        <input placeholder="Phone *" value={form.phone} maxLength={10}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white" />
                        <select value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
                          <option value="HOME">🏠 HOME</option>
                          <option value="WORK">💼 WORK</option>
                          <option value="OTHER">📍 OTHER</option>
                        </select>
                        <input placeholder="Address Line 1 *" value={form.addressLine1}
                          onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))}
                          className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white" />
                        <input placeholder="Address Line 2 (Optional)" value={form.addressLine2}
                          onChange={e => setForm(f => ({ ...f, addressLine2: e.target.value }))}
                          className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white" />
                        <input placeholder="City *" value={form.city}
                          onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white" />
                        <input placeholder="Pincode *" value={form.pincode} maxLength={6}
                          onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))}
                          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white" />
                        <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                          className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
                          <option value="">Select State *</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <button onClick={handleSaveAddress} disabled={savingAddr}
                        className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-black hover:bg-orange-600 disabled:opacity-50">
                        {savingAddr ? 'Saving...' : '✅ Save Address'}
                      </button>
                    </div>
                  )}
                </div>

                {selectedAddress && (
                  <button onClick={() => setStep(2)}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2">
                    Continue to Payment <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}

            {/* STEP 2 — PAYMENT */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h2 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                      <CreditCard size={14} className="text-white" />
                    </div>
                    Payment Method
                  </h2>

                  <div className="space-y-2.5">
                    {PAYMENT_METHODS.map(m => (
                      <div key={m.id}
                        onClick={() => m.active && setPaymentMethod(m.id)}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          !m.active
                            ? 'border-gray-100 opacity-50 cursor-not-allowed'
                            : paymentMethod === m.id
                              ? 'border-orange-500 bg-orange-50 cursor-pointer'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200 cursor-pointer'
                        }`}>
                        <span className="text-xl flex-shrink-0">{m.icon}</span>
                        <div className="flex-1">
                          <p className="font-black text-gray-800 text-sm">{m.label}</p>
                          <p className="text-xs text-gray-400">{m.desc}</p>
                        </div>
                        {!m.active ? (
                          <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-black flex-shrink-0">Coming Soon</span>
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === m.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                          }`}>
                            {paymentMethod === m.id && <Check size={11} className="text-white" />}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bellmak Coins */}
                  {(user?.bellmakCoins || 0) > 0 && (
                    <div onClick={() => setUseCoins(c => !c)}
                      className={`mt-3 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                        useCoins ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}>
                      <span className="text-xl flex-shrink-0">🪙</span>
                      <div className="flex-1">
                        <p className="font-black text-gray-800 text-sm">Use BELLMAK Coins</p>
                        <p className="text-xs text-gray-400">{user?.bellmakCoins} coins = Save {fmt(maxCoinsDiscount)}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        useCoins ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                      }`}>
                        {useCoins && <Check size={11} className="text-white" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Address */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Delivering to</p>
                      <p className="font-bold text-gray-800 text-sm">{selectedAddress?.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {selectedAddress?.addressLine1}, {selectedAddress?.city}, {selectedAddress?.state} — {selectedAddress?.pincode}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setStep(1)} className="text-orange-500 text-xs font-black hover:underline flex-shrink-0">
                    Change
                  </button>
                </div>

                {/* Place Order Button */}
                <button onClick={handlePlaceOrder} disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-orange-200 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing Order...</>
                    : <><Package size={16} /> Place Order — {fmt(total)}</>
                  }
                </button>

                <p className="text-center text-xs text-gray-400">
                  🔒 Secure checkout · Easy 7-day returns · 100% genuine products
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <h3 className="font-black text-gray-900 text-base mb-4">Order Summary</h3>

              <div className="space-y-2.5 max-h-52 overflow-y-auto mb-4 pr-1">
                {items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex gap-3 items-center">
                    <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 flex-shrink-0 overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt={item.title} className="w-full h-full object-contain p-0.5" />
                        : <Package size={14} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-black text-gray-900 flex-shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-semibold text-gray-800">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({coupon?.code})</span>
                    <span className="font-bold">- {fmt(couponDiscount)}</span>
                  </div>
                )}
                {coinsDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>🪙 Coins</span>
                    <span className="font-bold">- {fmt(coinsDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className={deliveryCharge === 0 ? 'text-green-600 font-bold' : 'font-semibold text-gray-800'}>
                    {deliveryCharge === 0 ? '🎉 FREE' : fmt(deliveryCharge)}
                  </span>
                </div>
                <div className="flex justify-between font-black text-gray-900 text-base border-t border-gray-100 pt-2.5">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                {[
                  { icon: Shield,  label: 'Secure Pay' },
                  { icon: Truck,   label: 'Fast Ship'  },
                  { icon: Package, label: 'Easy Return' },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-xl">
                    <b.icon size={14} className="text-orange-500" />
                    <span className="text-[10px] font-bold text-gray-500">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}