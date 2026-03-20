import Link from 'next/link'
import { ArrowRight, ShoppingBag, Users, Shield, Zap, Heart, Star, TrendingUp, Globe } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="bg-[#1a1a2e] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #F97316 0%, transparent 60%), radial-gradient(circle at 80% 20%, #F97316 0%, transparent 50%)' }} />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center relative z-10">
          <span className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-xs font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            🛒 Our Story
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
            India Ka<br /><span className="text-[#F97316]">Apna Bazaar</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            BELLMAK is built on a simple belief — every Indian deserves access to quality products at honest prices, with a shopping experience that feels truly their own.
          </p>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-black text-[#F97316] uppercase tracking-widest mb-3">Our Mission</p>
            <h2 className="text-3xl font-black text-gray-900 leading-tight mb-4">
              Empowering buyers.<br />Enabling sellers.
            </h2>
            <p className="text-gray-500 leading-relaxed mb-4">
              We're building a marketplace where small businesses across India can reach millions of customers — and where shoppers can trust every purchase they make.
            </p>
            <p className="text-gray-500 leading-relaxed mb-6">
              Whether you're a first-time buyer looking for the best deal, or a seller ready to grow your business online, BELLMAK is designed for you.
            </p>
            <Link href="/products"
              className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-sm px-6 py-3 rounded-xl transition-all">
              Start Shopping <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: ShoppingBag, label: 'Products', value: '10,000+', color: 'bg-orange-50 text-[#F97316]' },
              { icon: Users, label: 'Happy Buyers', value: '50,000+', color: 'bg-blue-50 text-blue-500' },
              { icon: Star, label: 'Avg Rating', value: '4.7 ★', color: 'bg-yellow-50 text-yellow-500' },
              { icon: Shield, label: 'Secure Orders', value: '100%', color: 'bg-green-50 text-green-500' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100">
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <Icon size={18} />
                </div>
                <p className="text-xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black text-[#F97316] uppercase tracking-widest mb-2">What We Stand For</p>
            <h2 className="text-3xl font-black text-gray-900">Our Core Values</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: 'Customer First', desc: 'Every decision we make starts with one question: Is this good for our customer? Your trust is our biggest asset.', color: 'bg-red-500' },
              { icon: Shield, title: 'Trust & Safety', desc: 'We verify every seller and every product. Bank-grade security protects every transaction on our platform.', color: 'bg-blue-500' },
              { icon: TrendingUp, title: 'Seller Growth', desc: 'We succeed when our sellers succeed. Zero fees to start, powerful tools to scale, and a community to grow with.', color: 'bg-green-500' },
              { icon: Zap, title: 'Speed & Reliability', desc: 'Fast delivery, instant support, and a platform that works flawlessly — because your time matters.', color: 'bg-yellow-500' },
              { icon: Globe, title: 'Made for India', desc: 'Built with Bharat in mind. Hindi support, local payment methods, and prices that make sense for Indian buyers.', color: 'bg-purple-500' },
              { icon: Star, title: 'Quality Assured', desc: 'Every product listed goes through our quality check. No fakes, no misleading listings — ever.', color: 'bg-[#F97316]' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all">
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="font-black text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-[10px] font-black text-[#F97316] uppercase tracking-widest mb-3">How It Started</p>
        <h2 className="text-3xl font-black text-gray-900 mb-6">The BELLMAK Story</h2>
        <div className="space-y-4 text-gray-500 leading-relaxed text-left">
          <p>
            BELLMAK started with a simple frustration — why is it so hard for small Indian businesses to sell online? The big platforms charge high fees, demand complicated setups, and leave small sellers feeling lost.
          </p>
          <p>
            At the same time, millions of Indian buyers were struggling to find quality products at fair prices, without worrying about fake reviews or hidden charges.
          </p>
          <p>
            We built BELLMAK to fix both problems. A marketplace that's free to join, easy to use, and genuinely focused on doing right by both buyers and sellers. No fluff, no fake discounts, no nonsense.
          </p>
          <p className="font-bold text-gray-700">
            We're just getting started — and we're building this together with you. 🇮🇳
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#1a1a2e] py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-3">
            Join the <span className="text-[#F97316]">BELLMAK</span> family
          </h2>
          <p className="text-gray-400 mb-8">Whether you're here to shop or sell, there's a place for you.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/products"
              className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-black px-8 py-4 rounded-xl transition-all">
              Shop Now <ArrowRight size={14} />
            </Link>
            <Link href="/sell"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold px-8 py-4 rounded-xl transition-all">
              Become a Seller
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}