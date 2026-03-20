'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { ArrowLeft, Coins, Gift, ShoppingBag, Star, TrendingUp, Info, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  id: string
  type: 'EARNED' | 'SPENT' | 'EXPIRED' | 'BONUS'
  amount: number
  description: string
  createdAt: string
  orderId?: string
}

const HOW_TO_EARN = [
  { icon: ShoppingBag, label: 'Place an order', desc: 'Earn 1 coin per ₹100 spent', color: 'bg-blue-50 text-blue-600' },
  { icon: Star, label: 'Write a review', desc: 'Earn 10 coins per review', color: 'bg-yellow-50 text-yellow-600' },
  { icon: Gift, label: 'Refer a friend', desc: 'Earn 100 coins per referral', color: 'bg-green-50 text-green-600' },
  { icon: TrendingUp, label: 'First purchase bonus', desc: 'Earn 50 coins on 1st order', color: 'bg-purple-50 text-purple-600' },
]

export default function WalletPage() {
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'earned' | 'spent'>('all')

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/auth/coins/history')
      setTransactions(res.data.data || [])
    } catch {
      // Use mock data if endpoint not ready
      setTransactions([
        { id: '1', type: 'BONUS', amount: 50, description: 'Welcome bonus', createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
        { id: '2', type: 'EARNED', amount: 12, description: 'Order #ORD-001 completed', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), orderId: 'ORD-001' },
        { id: '3', type: 'SPENT', amount: 30, description: 'Redeemed on Order #ORD-002', createdAt: new Date(Date.now() - 86400000).toISOString(), orderId: 'ORD-002' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const coins = user?.bellmakCoins || 0
  const coinsValue = (coins * 0.25).toFixed(2) // 1 coin = ₹0.25
  const totalEarned = transactions.filter(t => t.type === 'EARNED' || t.type === 'BONUS').reduce((s, t) => s + t.amount, 0)
  const totalSpent = transactions.filter(t => t.type === 'SPENT').reduce((s, t) => s + t.amount, 0)

  const filtered = transactions.filter(t => {
    if (activeTab === 'earned') return t.type === 'EARNED' || t.type === 'BONUS'
    if (activeTab === 'spent') return t.type === 'SPENT' || t.type === 'EXPIRED'
    return true
  })

  const typeConfig: Record<string, { icon: any, color: string, label: string, sign: string }> = {
    EARNED: { icon: CheckCircle, color: 'text-green-500', label: 'Earned', sign: '+' },
    BONUS: { icon: Gift, color: 'text-purple-500', label: 'Bonus', sign: '+' },
    SPENT: { icon: ShoppingBag, color: 'text-orange-500', label: 'Redeemed', sign: '-' },
    EXPIRED: { icon: XCircle, color: 'text-red-400', label: 'Expired', sign: '-' },
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#2874f0] mb-5 transition-colors">
          <ArrowLeft size={16} /> Back to Account
        </Link>

        {/* Coins Hero Card */}
        <div className="relative bg-gradient-to-br from-[#2874f0] via-[#1a5dc8] to-[#0d3f9e] rounded-3xl p-6 mb-4 overflow-hidden shadow-xl shadow-blue-200">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full" />
          <div className="absolute top-4 right-20 w-4 h-4 bg-yellow-400/30 rounded-full" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-200 text-sm font-bold mb-1">BELLMAK Coins Balance</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-white">{coins.toLocaleString('en-IN')}</span>
                  <span className="text-2xl mb-1">🪙</span>
                </div>
                <p className="text-blue-200 text-sm mt-1">Worth <span className="text-white font-bold">₹{coinsValue}</span></p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3">
                <Coins size={28} className="text-yellow-300" />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-200 text-xs font-bold mb-0.5">Total Earned</p>
                <p className="text-white font-black text-lg">+{totalEarned} 🪙</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs font-bold mb-0.5">Total Redeemed</p>
                <p className="text-white font-black text-lg">-{totalSpent} 🪙</p>
              </div>
            </div>
          </div>
        </div>

        {/* How Coins Work */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-[#2874f0]" />
            <h2 className="font-black text-gray-900 text-sm">How to Earn BELLMAK Coins</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {HOW_TO_EARN.map(item => (
              <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon size={17} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{item.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
            <p className="text-xs text-orange-700 font-medium flex items-start gap-1.5">
              <span className="flex-shrink-0">💡</span>
              <span>1 BELLMAK Coin = ₹0.25. Use coins at checkout to get instant discounts. Maximum 100 coins per order.</span>
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 text-base">Transaction History</h2>
            {transactions.length > 0 && (
              <div className="flex gap-1">
                {[{ k: 'all', l: 'All' }, { k: 'earned', l: 'Earned' }, { k: 'spent', l: 'Spent' }].map(t => (
                  <button key={t.k} onClick={() => setActiveTab(t.k as any)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeTab === t.k ? 'bg-[#2874f0] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {t.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🪙</div>
              <p className="text-gray-500 font-bold mb-1">No transactions yet</p>
              <p className="text-sm text-gray-400">Start shopping to earn BELLMAK Coins!</p>
              <Link href="/" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#2874f0] text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors">
                Shop Now <ChevronRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(tx => {
                const cfg = typeConfig[tx.type] || typeConfig.EARNED
                const Icon = cfg.icon
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {formatDate(tx.createdAt)}
                        {tx.orderId && <span className="ml-1 text-[#2874f0] font-bold">· {tx.orderId}</span>}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-black ${tx.type === 'SPENT' || tx.type === 'EXPIRED' ? 'text-red-500' : 'text-green-600'}`}>
                        {cfg.sign}{tx.amount} 🪙
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">{cfg.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
