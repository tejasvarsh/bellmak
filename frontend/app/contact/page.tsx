'use client'
import { useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Mail, MessageSquare, Clock, Send, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      await api.post('/contact', form)
      setSent(true)
      toast.success('Message sent! We\'ll get back to you soon 🎉')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Message Sent! 🎉</h2>
          <p className="text-gray-500 mb-6">
            Thanks for reaching out! Our team will reply to <strong>{form.email}</strong> within 24–48 hours.
          </p>
          <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
            className="text-[#F97316] font-bold text-sm hover:underline">
            Send another message
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-[#1a1a2e] py-14 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #F97316 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            💬 Get in Touch
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Contact Us</h1>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Have a question, complaint, or feedback? We'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Info Cards */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                <Mail size={18} className="text-[#F97316]" />
              </div>
              <p className="font-black text-gray-900 text-sm mb-1">Email Us</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                support@bellmak.in<br />
                <span className="text-gray-400">We'll reply within 24-48 hours</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <Clock size={18} className="text-blue-500" />
              </div>
              <p className="font-black text-gray-900 text-sm mb-1">Response Time</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Monday – Saturday<br />
                <span className="text-gray-400">10:00 AM – 6:00 PM IST</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                <MessageSquare size={18} className="text-purple-500" />
              </div>
              <p className="font-black text-gray-900 text-sm mb-1">Common Topics</p>
              <div className="space-y-1.5 mt-2">
                {['Order issues', 'Payment problems', 'Seller support', 'Returns & Refunds', 'Account help'].map(t => (
                  <p key={t} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#F97316] rounded-full flex-shrink-0" />{t}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-gray-900 text-lg mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">Your Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Rahul Sharma"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">Your Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="rahul@gmail.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Subject</label>
                <select
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F97316] transition-all text-gray-700 bg-white"
                >
                  <option value="">Select a topic...</option>
                  <option>Order Issue</option>
                  <option>Payment Problem</option>
                  <option>Return / Refund</option>
                  <option>Seller Support</option>
                  <option>Account Problem</option>
                  <option>Report a Product</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Message *</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-50 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-black py-3.5 rounded-xl transition-all disabled:opacity-60"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><Send size={15} /> Send Message</>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center">
                We typically respond within 24–48 business hours.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}