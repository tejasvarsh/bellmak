'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function SellPage() {
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isLoggedIn && user?.role === 'SELLER') {
      router.push('/seller/dashboard')
    }
  }, [isLoggedIn])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-secondary to-gray-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🏪</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Sell on <span className="text-primary">BELLMAK</span>
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Reach crores of customers across India. Start your online business today — it is free!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-dark transition-colors"
            >
              Start Selling Now 🚀
            </Link>
            
              <a href="#how-it-works"
              className="bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors"
            >
              How it Works
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '10Cr+', label: 'Customers' },
            { value: '50K+', label: 'Sellers' },
            { value: '₹0', label: 'Registration Fee' },
            { value: '24/7', label: 'Seller Support' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-3xl font-black text-primary">{stat.value}</p>
              <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Sell */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-black text-center text-gray-800 mb-10">
          Why Sell on BELLMAK
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🌍', title: 'Pan-India Reach', desc: 'Sell to customers in every corner of India. No geographical limits!' },
            { icon: '💰', title: 'Low Commission', desc: 'Industry lowest commission rates. Keep more of what you earn.' },
            { icon: '🚚', title: 'Easy Logistics', desc: 'We handle delivery and returns. You focus on your products.' },
            { icon: '📊', title: 'Seller Dashboard', desc: 'Track orders, revenue, and performance in real-time.' },
            { icon: '🔒', title: 'Secure Payments', desc: 'Get paid on time, every time. 100% secure payment guarantee.' },
            { icon: '📞', title: '24/7 Support', desc: 'Dedicated seller support team always ready to help you.' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div id="how-it-works" className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center text-gray-800 mb-10">
            Start Selling in 4 Easy Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: '📝', title: 'Register', desc: 'Create your free seller account in minutes' },
              { step: '2', icon: '📦', title: 'List Products', desc: 'Upload your products with photos and details' },
              { step: '3', icon: '🛒', title: 'Get Orders', desc: 'Customers find and buy your products' },
              { step: '4', icon: '💸', title: 'Get Paid', desc: 'Receive payment directly in your bank account' },
            ].map((item, index) => (
              <div key={item.step} className="text-center relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-3/4 w-1/2 h-0.5 bg-orange-200 z-0" />
                )}
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 relative z-10">
                  {item.icon}
                </div>
                <div className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2">
                  Step {item.step}
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary to-orange-400 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl font-black mb-4">Ready to Start Selling 🚀</h2>
          <p className="mb-8 opacity-90">Join thousands of sellers already growing their business on BELLMAK</p>
          <Link
            href="/login"
            className="bg-white text-primary px-10 py-4 rounded-xl font-black text-lg hover:bg-gray-100 transition-colors inline-block"
          >
            Create Seller Account — It is FREE
          </Link>
        </div>
      </div>

    </div>
  )
}