'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Lock, Eye, EyeOff, Save, ArrowLeft, Shield, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, isLoggedIn, setUser } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
  }, [isLoggedIn, user])

  const handleProfileSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setLoading(true)
    try {
      const res = await api.put('/auth/profile', { name: form.name, phone: form.phone })
      if (res.data.data) setUser(res.data.data)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally { setLoading(false) }
  }

  const handlePasswordChange = async () => {
    if (!passForm.oldPassword || !passForm.newPassword) { toast.error('All fields required'); return }
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Passwords do not match'); return }
    if (passForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.oldPassword, newPassword: passForm.newPassword })
      toast.success('Password changed successfully!')
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Incorrect current password')
    } finally { setLoading(false) }
  }

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#2874f0] mb-5 transition-colors">
          <ArrowLeft size={16} /> Back to Account
        </Link>

        {/* Avatar Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-[#2874f0] to-[#1a5dc8] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <span className="text-white font-black text-2xl">{initials}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle size={11} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{user?.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-0.5 rounded-full font-bold">
                  🪙 {user?.bellmakCoins || 0} Coins
                </span>
                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full font-bold capitalize">
                  {user?.role?.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[{ key: 'profile', label: '👤 Edit Profile' }, { key: 'password', label: '🔒 Change Password' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key ? 'bg-[#2874f0] text-white shadow-sm shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="font-black text-gray-900 text-base">Personal Information</h2>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Full Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] transition-colors bg-gray-50 focus:bg-white font-medium" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="email" value={form.email} disabled
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 font-medium cursor-not-allowed" />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1"><Shield size={11} /> Email cannot be changed for security reasons</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="10-digit mobile number"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] transition-colors bg-gray-50 focus:bg-white font-medium" />
              </div>
            </div>
            <button onClick={handleProfileSave} disabled={loading}
              className="w-full py-3.5 bg-[#fb641b] hover:bg-orange-600 text-white font-black rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save size={17} /> Save Changes</>}
            </button>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="font-black text-gray-900 text-base">Change Password</h2>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-700 font-medium">💡 Use a strong password — letters, numbers, and symbols. Minimum 6 characters.</p>
            </div>
            {[
              { key: 'oldPassword', label: 'Current Password', show: showOldPass, toggle: () => setShowOldPass(v => !v) },
              { key: 'newPassword', label: 'New Password', show: showNewPass, toggle: () => setShowNewPass(v => !v) },
              { key: 'confirmPassword', label: 'Confirm New Password', show: showConfirmPass, toggle: () => setShowConfirmPass(v => !v) },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">{field.label}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={field.show ? 'text' : 'password'} value={(passForm as any)[field.key]}
                    onChange={e => setPassForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] transition-colors bg-gray-50 focus:bg-white font-medium" />
                  <button type="button" onClick={field.toggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <button onClick={handlePasswordChange} disabled={loading}
              className="w-full py-3.5 bg-[#fb641b] hover:bg-orange-600 text-white font-black rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</> : <><Lock size={17} /> Update Password</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
