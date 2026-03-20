'use client'
import { useState } from 'react'
import { ChevronDown, Send, Loader2, CheckCircle } from 'lucide-react'

const topics = [
  { icon: '📦', title: 'Order Issues', topics: ['Order not showing', 'Wrong order details', 'Order cancellation', 'Bulk orders'] },
  { icon: '💰', title: 'Payments & Payouts', topics: ['Payment not received', 'Payout delay', 'Commission deducted incorrectly', 'Invoice issues'] },
  { icon: '🏷️', title: 'Product Listing', topics: ['Product rejected', 'How to add variants', 'Image guidelines', 'Category selection'] },
  { icon: '↩️', title: 'Returns & Refunds', topics: ['Return request raised by buyer', 'Refund deducted from my account', 'Return policy', 'Damaged return received'] },
  { icon: '📊', title: 'Account & KYC', topics: ['KYC pending', 'GSTIN update', 'Bank account change', 'Account suspended'] },
  { icon: '🚚', title: 'Shipping', topics: ['Pickup not scheduled', 'Wrong delivery address', 'Courier partner issue', 'Shipping charges'] },
]

const mockTickets = [
  { id: 'TKT-001', subject: 'Payment not received for order #BM123', status: 'open', date: '2 days ago', type: 'Payment' },
  { id: 'TKT-002', subject: 'Product listing rejected - Electronics', status: 'resolved', date: '5 days ago', type: 'Listing' },
  { id: 'TKT-003', subject: 'KYC document verification pending', status: 'pending', date: '1 week ago', type: 'KYC' },
]

const statusColor: any = {
  open: { bg: '#fef3c7', color: '#d97706', label: '🟡 Open' },
  pending: { bg: '#dbeafe', color: '#2563eb', label: '🔵 Pending' },
  resolved: { bg: '#d1fae5', color: '#059669', label: '🟢 Resolved' },
  closed: { bg: '#f3f4f6', color: '#6b7280', label: '⚫ Closed' },
}

export default function SellerSupportPage() {
  const [tab, setTab] = useState(0)
  const [openTopic, setOpenTopic] = useState<number | null>(null)
  const [form, setForm] = useState({ type: '', subject: '', orderId: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!form.subject || !form.message) return
    setSending(true)
    await new Promise(r => setTimeout(r, 1500))
    setSending(false)
    setSent(true)
    setForm({ type: '', subject: '', orderId: '', message: '' })
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <h1 className="text-xl font-black text-gray-900">🎫 Seller Support Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Get help with your seller account, orders, payments & more</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Avg Response', value: '< 4 hrs', icon: '⚡' },
              { label: 'Resolution Rate', value: '94%', icon: '✅' },
              { label: 'Satisfaction', value: '4.8 / 5', icon: '⭐' },
            ].map((s, i) => (
              <div key={i} className="bg-orange-50 rounded-xl p-3 text-center">
                <div className="text-lg">{s.icon}</div>
                <div className="font-black text-gray-900 text-sm">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-0">
          {['📚 Help Articles', '🎫 Raise Ticket', '📋 My Tickets'].map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab === i ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Tab 0 — Help Articles */}
        {tab === 0 && (
          <div className="space-y-3">
            {topics.map((cat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => setOpenTopic(openTopic === i ? null : i)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <div className="text-2xl">{cat.icon}</div>
                  <span className="font-bold text-gray-900 flex-1 text-left">{cat.title}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${openTopic === i ? 'rotate-180' : ''}`} />
                </button>
                {openTopic === i && (
                  <div className="border-t border-gray-100 px-4 pb-3">
                    {cat.topics.map((t, ti) => (
                      <button key={ti} onClick={() => { setTab(1); setForm(f => ({ ...f, subject: t })) }}
                        className="w-full flex items-center gap-2 py-2.5 text-sm text-gray-700 hover:text-orange-500 transition-colors border-b border-gray-50 last:border-0 text-left">
                        <span className="text-gray-300">›</span> {t}
                        <span className="ml-auto text-xs text-orange-400 font-semibold">Raise Ticket →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 1 — Raise Ticket */}
        {tab === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-black text-gray-900">Raise a Support Ticket</h2>

            {sent && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-green-800 text-sm">Ticket raised successfully!</p>
                  <p className="text-xs text-green-600">We'll respond within 4 hours. Check "My Tickets" for updates.</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1.5">Issue Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-orange-400 bg-white">
                <option value="">Select issue type...</option>
                <option>Order Issue</option>
                <option>Payment / Payout</option>
                <option>Product Listing</option>
                <option>Return / Refund</option>
                <option>Account / KYC</option>
                <option>Shipping</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1.5">Order ID (optional)</label>
              <input type="text" value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
                placeholder="e.g. BM-2024-001234"
                className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-orange-400" />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1.5">Subject <span className="text-red-500">*</span></label>
              <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-orange-400" />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1.5">Message <span className="text-red-500">*</span></label>
              <textarea rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Describe your issue in detail..."
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-orange-400 resize-none" />
            </div>

            <button onClick={handleSubmit} disabled={sending || !form.subject || !form.message}
              className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {sending ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Ticket</>}
            </button>
          </div>
        )}

        {/* Tab 2 — My Tickets */}
        {tab === 2 && (
          <div className="space-y-3">
            {mockTickets.map((ticket, i) => {
              const s = statusColor[ticket.status]
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-gray-400">{ticket.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate">{ticket.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ticket.type} · {ticket.date}</p>
                  </div>
                  <button className="text-xs font-bold text-orange-500 hover:text-orange-600 flex-shrink-0">View →</button>
                </div>
              )
            })}
            {mockTickets.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
                <div className="text-4xl mb-2">🎫</div>
                <p className="font-semibold">No tickets yet</p>
                <p className="text-sm mt-1">Raise a ticket if you need help</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}