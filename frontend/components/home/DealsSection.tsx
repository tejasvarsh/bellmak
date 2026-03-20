'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'

const DUMMY = [
  { id: 'd1', title: 'boAt Rockerz 450 Bluetooth Headphones', price: 1299, mrp: 3990, discount: 67, images: ['https://via.placeholder.com/280x280/fff7ed/f97316?text=boAt'], avgRating: 4.2, totalReviews: 1234, slug: 'boat-rockerz', isAssured: false, stock: 50 },
  { id: 'd2', title: 'Xiaomi 11 Lite NE 5G Smartphone', price: 19999, mrp: 29999, discount: 33, images: ['https://via.placeholder.com/280x280/eff6ff/3b82f6?text=Xiaomi'], avgRating: 4.3, totalReviews: 567, slug: 'xiaomi-11-lite', isAssured: true, stock: 20 },
  { id: 'd3', title: 'Fastrack Analog Wrist Watch', price: 1295, mrp: 2995, discount: 57, images: ['https://via.placeholder.com/280x280/fefce8/eab308?text=Fastrack'], avgRating: 4.0, totalReviews: 345, slug: 'fastrack-watch', isAssured: false, stock: 100 },
  { id: 'd4', title: 'Wildcraft Trekking Backpack 45L', price: 1499, mrp: 3499, discount: 57, images: ['https://via.placeholder.com/280x280/f0fdf4/22c55e?text=Wildcraft'], avgRating: 4.1, totalReviews: 234, slug: 'wildcraft-bag', isAssured: false, stock: 30 },
  { id: 'd5', title: 'Prestige Iris 750W Mixer Grinder', price: 2499, mrp: 4500, discount: 44, images: ['https://via.placeholder.com/280x280/fff1f2/f43f5e?text=Prestige'], avgRating: 4.2, totalReviews: 789, slug: 'prestige-mixer', isAssured: false, stock: 60 },
]

export default function DealsSection() {
  const [deals, setDeals] = useState<any[]>([])
  const [time, setTime] = useState({ h: 5, m: 47, s: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    api.get('/products/deals').then(r => setDeals(r.data.data || [])).catch(() => {})
    const t = setInterval(() => {
      setTime(p => {
        if (p.s > 0) return { ...p, s: p.s - 1 }
        if (p.m > 0) return { ...p, m: p.m - 1, s: 59 }
        if (p.h > 0) return { h: p.h - 1, m: 59, s: 59 }
        return p
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')
  const show = deals.length > 0 ? deals : DUMMY

  return (
    <section className="bg-white shadow-sm mb-3">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center animate-glow">
                <Zap size={16} className="text-white fill-white" />
              </div>
              <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Deals of the Day
              </h2>
            </div>

            {mounted && (
              <div className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg">
                <span className="text-[11px] text-gray-400 mr-0.5">Ends in</span>
                {[time.h, time.m, time.s].map((v, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="bg-primary font-black text-xs px-2 py-1 rounded min-w-[28px] text-center font-mono">
                      {pad(v)}
                    </span>
                    {i < 2 && <span className="text-primary font-black animate-pulse2">:</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Link href="/products?discount=20"
            className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-dark group transition-colors px-4 py-2 border border-primary/30 rounded-full hover:bg-primary/5">
            View All <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Products */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-y divide-gray-100">
          {show.slice(0, 5).map((p: any, i) => (
            <div key={p.id} className="animate-slideUp" style={{ animationDelay: `${i * 60}ms` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
