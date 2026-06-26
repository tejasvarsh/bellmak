'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft, ShoppingBag, Star, Gift, TrendingUp,
  Info, ChevronRight, Clock, CheckCircle, XCircle,
  Zap, Target, ArrowUpRight, Sparkles, RefreshCw
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'EARNED' | 'SPENT' | 'EXPIRED' | 'BONUS'
  amount: number
  description: string
  createdAt: string
  orderId?: string
}

const TYPE_CFG: Record<string, { icon: any; color: string; bg: string; label: string; sign: string }> = {
  EARNED:  { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50',  label: 'Earned',   sign: '+' },
  BONUS:   { icon: Gift,        color: 'text-purple-600', bg: 'bg-purple-50', label: 'Bonus',    sign: '+' },
  SPENT:   { icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Used',     sign: '-' },
  EXPIRED: { icon: XCircle,     color: 'text-red-400',    bg: 'bg-red-50',    label: 'Expired',  sign: '-' },
}

const HOW_EARN = [
  { icon: ShoppingBag, label: 'Place Order',       desc: '1 coin per ₹100',    color: 'bg-blue-50 text-blue-600'    },
  { icon: Star,        label: 'Write Review',      desc: '10 coins/review',    color: 'bg-yellow-50 text-yellow-600'},
  { icon: Gift,        label: 'Refer Friend',      desc: '100 coins/referral', color: 'bg-green-50 text-green-600'  },
  { icon: TrendingUp,  label: 'First Purchase',    desc: '50 bonus coins',     color: 'bg-purple-50 text-purple-600'},
]

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
})

export default function WalletPage() {
  const { user, isLoggedIn, updateUser } = useAuthStore()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [activeTab,    setActiveTab]    = useState<'all' | 'earned' | 'spent'>('all')
  const [mounted,      setMounted]      = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isLoggedIn) { router.push('/login'); return }
    fetchData()
  }, [])

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await api.get('/auth/coins/history')
      const data = res.data.data
      setTransactions(data.transactions || [])
      // Sync coins from server — always accurate
      if (data.currentBalance !== undefined) {
        updateUser({ bellmakCoins: data.currentBalance })
      }
    } catch {
      toast.error('Failed to load wallet data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const coins      = user?.bellmakCoins || 0
  const coinsValue = (coins * 0.25).toFixed(0)

  const { totalEarned, totalSpent, filtered } = useMemo(() => {
    const earned  = transactions.filter(t => t.type === 'EARNED' || t.type === 'BONUS')
    const spent   = transactions.filter(t => t.type === 'SPENT' || t.type === 'EXPIRED')
    const filtered = activeTab === 'earned' ? earned
                   : activeTab === 'spent'  ? spent
                   : transactions
    return {
      totalEarned: earned.reduce((s, t) => s + t.amount, 0),
      totalSpent:  spent.reduce((s, t)  => s + t.amount, 0),
      filtered,
    }
  }, [transactions, activeTab])

  // Progress to next milestone
  const milestones  = [100, 250, 500, 1000, 2500, 5000]
  const nextMilestone = milestones.find(m => m > coins) || 5000
  const prevMilestone = milestones.filter(m => m <= coins).pop() || 0
  const progress = Math.min(((coins - prevMilestone) / (nextMilestone - prevMilestone)) * 100, 100)

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Back */}
        <div className="flex items-center justify-between">
          <Link href="/account"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="p-2 rounded-xl hover:bg-white transition-colors">
            <RefreshCw size={15} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ── Hero Coin Card ── */}
        <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#0f3460] to-[#1a1a4e] rounded-3xl p-6 overflow-hidden shadow-xl">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-orange-500/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute top-6 right-24 w-3 h-3 bg-yellow-400/40 rounded-full animate-pulse" />

          <div className="relative">
            {/* Balance */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">BELLMAK Coins</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-white">{coins.toLocaleString('en-IN')}</span>
                  <span className="text-3xl mb-1">🪙</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-gray-400 text-xs">Worth</span>
                  <span className="text-[#F97316] font-black text-sm">₹{coinsValue}</span>
                  <span className="text-gray-500 text-[10px]">· 1 coin = ₹0.25</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-[#F97316]/20 rounded-2xl flex items-center justify-center border border-[#F97316]/30">
                <span className="text-2xl">🏅</span>
              </div>
            </div>

            {/* Milestone Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-gray-400 text-[10px] font-bold">Next Milestone: {nextMilestone} coins</p>
                <p className="text-[#F97316] text-[10px] font-black">{nextMilestone - coins} more to go!</p>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#F97316] to-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              {[
                { label: 'Earned',   value: `+${totalEarned}`, color: 'text-green-400' },
                { label: 'Used',     value: `-${totalSpent}`,  color: 'text-red-400'   },
                { label: 'Net Worth', value: `₹${coinsValue}`,  color: 'text-[#F97316]' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`font-black text-base ${s.color}`}>{s.value}</p>
                  <p className="text-gray-500 text-[9px] mt-0.5 font-bold uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Use Coins CTA ── */}
        {coins > 0 && (
          <div className="bg-gradient-to-r from-[#F97316] to-orange-500 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <p className="font-black text-white text-sm">Use your coins now!</p>
                <p className="text-orange-100 text-xs mt-0.5">Save ₹{coinsValue} on your next order</p>
              </div>
            </div>
            <Link href="/products"
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-orange-600 font-black text-xs rounded-xl hover:bg-orange-50 transition-colors flex-shrink-0">
              Shop Now <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* ── How to Earn ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
              <Sparkles size={14} className="text-orange-500" />
            </div>
            <h2 className="font-black text-gray-900 text-sm">How to Earn Coins</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {HOW_EARN.map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-gray-800">{item.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
            <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 font-medium">
              Max 100 coins usable per order. Coins never expire. Use at checkout for instant discount!
            </p>
          </div>
        </div>

        {/* ── Transaction History ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900">History</h2>
            <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
              {(['all', 'earned', 'spent'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all capitalize ${
                    activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🪙</div>
              <p className="font-black text-gray-700 mb-1">
                {activeTab === 'all' ? 'No transactions yet' :
                 activeTab === 'earned' ? 'No coins earned yet' : 'No coins used yet'}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {activeTab === 'all' || activeTab === 'earned'
                  ? 'Place an order to start earning coins!'
                  : 'Use coins at checkout for discounts!'}
              </p>
              <Link href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F97316] text-white font-black text-sm rounded-xl hover:bg-orange-600 transition-colors">
                Shop Now <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(tx => {
                const cfg = TYPE_CFG[tx.type] || TYPE_CFG.EARNED
                const Icon = cfg.icon
                const isPositive = tx.type === 'EARNED' || tx.type === 'BONUS'
                return (
                  <div key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon size={17} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{tx.description}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={9} /> {fmtDate(tx.createdAt)}
                        {tx.orderId && (
                          <span className="ml-1 text-[#F97316] font-black">· #{tx.orderId}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-black ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                        {cfg.sign}{tx.amount} 🪙
                      </p>
                      <p className={`text-[9px] font-bold ${cfg.color}`}>{cfg.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Coins Rules ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">
              <Target size={14} className="text-gray-500" />
            </div>
            <h2 className="font-black text-gray-900 text-sm">Coins Rules</h2>
          </div>
          <div className="space-y-2">
            {[
              '🪙 1 BELLMAK Coin = ₹0.25 discount',
              '🛒 Max 100 coins per order (= ₹25 off)',
              '✅ Coins earned only on DELIVERED orders',
              '♾️ Coins never expire — use anytime',
              '🚫 Coins cannot be transferred or withdrawn',
            ].map(rule => (
              <p key={rule} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="flex-shrink-0">{rule.slice(0,2)}</span>
                <span>{rule.slice(2)}</span>
              </p>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}