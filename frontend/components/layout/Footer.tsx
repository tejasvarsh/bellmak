'use client'
import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Mail, Send, ChevronRight, Shield, Truck, RefreshCw, Award } from 'lucide-react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) { toast.error('Enter a valid email!'); return }
    setLoading(true)
    try {
      await api.post('/misc/newsletter', { email })
      setSubscribed(true)
      toast.success('Subscribed! 🎉')
    } catch {
      setSubscribed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="bg-[#1a1a2e] text-gray-300">
      <div className="border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-around flex-wrap gap-3">
            {[
              { icon: Truck,     label: 'Free Delivery',   sub: 'Above ₹499' },
              { icon: RefreshCw, label: 'Easy Returns',    sub: '7-Day Policy' },
              { icon: Shield,    label: 'Secure Payment',  sub: '100% Safe' },
              { icon: Award,     label: 'Assured Quality', sub: 'Genuine Products' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-7 h-7 bg-[#F97316]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-[#F97316]" />
                </div>
                <div>
                  <p className="text-xs font-black text-white leading-none">{label}</p>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 group">
              <div className="w-7 h-7 bg-[#F97316] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-sm">🛒</span>
              </div>
              <span className="font-black text-lg text-white">BELL<span className="text-[#F97316]">MAK</span></span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed mb-3 max-w-[180px]">
              India's trusted marketplace. Millions of products, best prices.
            </p>
            <p className="text-[10px] text-gray-600">Social media coming soon 🚀</p>
          </div>

          <div>
            <p className="text-xs font-black text-white uppercase tracking-wider mb-3">Shop</p>
            <div className="space-y-1.5">
              {[
                { label: 'All Products',   href: '/products' },
                { label: "Today's Deals",  href: '/products?discount=20' },
                { label: 'Electronics',    href: '/category/electronics' },
                { label: 'Fashion',        href: '/category/fashion' },
                { label: 'Home & Kitchen', href: '/category/home-kitchen' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#F97316] transition-colors">
                  <ChevronRight size={10} className="opacity-40" />{item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black text-white uppercase tracking-wider mb-3">Account</p>
            <div className="space-y-1.5">
              {[
                { label: 'My Orders',       href: '/account/orders' },
                { label: 'My Wishlist',     href: '/account/wishlist' },
                { label: 'My Wallet',       href: '/account/wallet' },
                { label: 'My Profile',      href: '/account/profile' },
                { label: 'Sell on BELLMAK', href: '/sell' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="block text-xs text-gray-500 hover:text-[#F97316] transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black text-white uppercase tracking-wider mb-3">Help</p>
            <div className="space-y-1.5">
              {[
                { label: 'Help Center',        href: '/help' },
                { label: 'Contact Us',         href: '/contact' },
                { label: 'About BELLMAK',      href: '/about' },
                { label: 'Privacy Policy',     href: '/privacy-policy' },
                { label: 'Terms & Conditions', href: '/terms' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="block text-xs text-gray-500 hover:text-[#F97316] transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <p className="text-xs font-black text-white uppercase tracking-wider mb-3">Newsletter</p>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">Get deals & offers straight to your inbox.</p>
            {subscribed ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xs text-green-400 font-bold">✅ Subscribed!</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                  placeholder="your@email.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#F97316]/50 transition-colors min-w-0" />
                <button onClick={handleSubscribe} disabled={loading}
                  className="w-8 h-8 bg-[#F97316] hover:bg-[#EA580C] rounded-lg flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50">
                  <Send size={13} className="text-white" />
                </button>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-600">
              <Mail size={11} className="text-[#F97316] flex-shrink-0" />
              <span>support@bellmak.in</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-gray-600">© {new Date().getFullYear()} BELLMAK — India Ka Apna Bazaar. All rights reserved.</p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {['💳 Visa', '💳 Mastercard', '🏦 UPI', '📱 PhonePe', '💰 Paytm', '💵 COD'].map(p => (
              <span key={p} className="text-[10px] text-gray-600 font-medium">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}