'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Search, Package, CreditCard, RefreshCw, User, ShoppingBag, Truck, Shield, MessageSquare } from 'lucide-react'

const FAQS = [
  {
    category: 'Orders',
    icon: Package,
    color: 'bg-orange-50 text-[#F97316]',
    questions: [
      { q: 'How do I track my order?', a: 'Go to My Account → My Orders. Click on your order to see the real-time tracking status and estimated delivery date.' },
      { q: 'Can I cancel my order?', a: 'You can cancel your order before it is shipped. Go to My Orders, select the order, and click "Cancel Order". Once shipped, you will need to initiate a return after delivery.' },
      { q: 'What if I received the wrong item?', a: 'We\'re sorry! Go to My Orders → select the order → "Report an Issue". Choose "Wrong Item Received" and we\'ll arrange a free replacement or full refund.' },
      { q: 'How long does delivery take?', a: 'Standard delivery takes 3–7 business days depending on your location. Metro cities usually receive orders within 2–3 days.' },
    ]
  },
  {
    category: 'Payments',
    icon: CreditCard,
    color: 'bg-blue-50 text-blue-500',
    questions: [
      { q: 'What payment methods do you accept?', a: 'We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Cash on Delivery (COD).' },
      { q: 'Is it safe to pay on BELLMAK?', a: 'Yes! All payments are processed through Razorpay with bank-grade 256-bit SSL encryption. We never store your card details on our servers.' },
      { q: 'My payment failed but money was deducted?', a: 'Don\'t worry. If your payment failed but money was deducted, it will be automatically refunded to your account within 5–7 business days. Contact us at support@bellmak.in if it takes longer.' },
      { q: 'Can I pay using BELLMAK Coins?', a: 'Yes! You can use your earned BELLMAK Coins to get discounts on eligible orders. Go to checkout and select "Use Coins" to apply them.' },
    ]
  },
  {
    category: 'Returns & Refunds',
    icon: RefreshCw,
    color: 'bg-green-50 text-green-500',
    questions: [
      { q: 'What is the return policy?', a: 'We offer a 7-day return policy on most products. The item must be in its original condition, unused, and in original packaging. Some categories like personal care and digital products are non-returnable.' },
      { q: 'How do I return a product?', a: 'Go to My Orders → select the order → click "Return Item". Fill in the reason, and we\'ll schedule a free pickup from your address within 1–2 business days.' },
      { q: 'When will I get my refund?', a: 'Once we receive and inspect the returned item, refunds are processed within 2–3 business days. The amount will reflect in your original payment method within 5–7 business days after that.' },
      { q: 'Can I exchange a product instead of returning?', a: 'Yes, for size or color issues, you can request an exchange instead of a refund. Select "Exchange" instead of "Return" in your order details.' },
    ]
  },
  {
    category: 'Account',
    icon: User,
    color: 'bg-purple-50 text-purple-500',
    questions: [
      { q: 'How do I change my password?', a: 'Go to My Account → Profile → Change Password. Enter your current password and then your new password twice to confirm.' },
      { q: 'I forgot my password, what do I do?', a: 'On the login page, click "Forgot Password". Enter your registered email and we\'ll send an OTP to reset your password.' },
      { q: 'How do I update my delivery address?', a: 'Go to My Account → Profile → Addresses. You can add, edit, or delete delivery addresses from there.' },
      { q: 'Can I delete my BELLMAK account?', a: 'Yes. Email us at support@bellmak.in with subject "Account Deletion Request". We\'ll process it within 7 business days. Note that this is irreversible.' },
    ]
  },
  {
    category: 'Selling',
    icon: ShoppingBag,
    color: 'bg-yellow-50 text-yellow-600',
    questions: [
      { q: 'How do I become a seller on BELLMAK?', a: 'Click "Sell on BELLMAK" in the top menu, fill in your details, complete KYC verification, and start listing products. The entire process takes less than 30 minutes.' },
      { q: 'Is there a fee to register as a seller?', a: 'No! Registration is completely free. We charge a small commission only when you make a sale.' },
      { q: 'How do I get paid as a seller?', a: 'Earnings are transferred directly to your registered bank account within 7 business days of order delivery.' },
      { q: 'What products can I sell on BELLMAK?', a: 'You can sell most legal products in categories like Electronics, Fashion, Home & Kitchen, Books, Beauty, Sports, and more. Prohibited items include weapons, adult content, counterfeit goods, and regulated substances.' },
    ]
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="font-bold text-gray-800 text-sm">{q}</span>
        <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-4 pr-6">{a}</p>
      )}
    </div>
  )
}

export default function HelpPage() {
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('Orders')

  const filtered = FAQS.find(f => f.category === active)?.questions.filter(
    q => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-[#1a1a2e] py-14 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #F97316 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            ❓ Help Center
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">How can we help?</h1>
          <div className="max-w-md mx-auto relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for answers..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-sm outline-none border border-white/10 focus:border-[#F97316] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="space-y-1.5">
            {FAQS.map(({ category, icon: Icon, color }) => (
              <button key={category}
                onClick={() => { setActive(category); setSearch('') }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${active === category ? 'bg-[#F97316] text-white shadow-md shadow-orange-100' : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-[#F97316] border border-gray-100'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${active === category ? 'bg-white/20' : color}`}>
                  <Icon size={14} className={active === category ? 'text-white' : ''} />
                </div>
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 px-6 divide-y divide-gray-50">
              {filtered.length > 0 ? filtered.map(({ q, a }) => (
                <FaqItem key={q} q={q} a={a} />
              )) : (
                <div className="py-12 text-center">
                  <p className="text-gray-400 text-sm">No results found for "{search}"</p>
                  <button onClick={() => setSearch('')} className="text-[#F97316] text-sm font-bold mt-2 hover:underline">Clear search</button>
                </div>
              )}
            </div>

            {/* Still need help */}
            <div className="mt-6 bg-[#1a1a2e] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={22} className="text-[#F97316]" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">Still need help?</p>
                  <p className="text-gray-400 text-xs mt-0.5">Our support team replies within 24–48 hours</p>
                </div>
              </div>
              <Link href="/contact"
                className="flex-shrink-0 bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-sm px-6 py-3 rounded-xl transition-all">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}