'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', emailOrPhone: '', password: '', confirmPassword: '', role: 'CUSTOMER'
  })
  const router = useRouter()
  const setUser = useAuthStore(state => state.setUser)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLogin = async () => {
    if (!form.emailOrPhone || !form.password) { toast.error('Please fill all fields!'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', {
        emailOrPhone: form.emailOrPhone,
        password: form.password
      })
      setUser(res.data.data.user, res.data.data.accessToken)
      toast.success('Welcome back! 🎉')
      const role = res.data.data.user.role
      if (role === 'ADMIN') router.push('/admin')
      else if (role === 'SELLER') router.push('/seller/dashboard')
      else router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed!')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!form.name || !form.emailOrPhone || !form.password) { toast.error('Please fill all fields!'); return }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match!'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters!'); return }
    setLoading(true)
    try {
      const isPhone = /^\d{10}$/.test(form.emailOrPhone)
      const res = await api.post('/auth/register', {
        name: form.name,
        email: isPhone ? undefined : form.emailOrPhone,
        phone: isPhone ? form.emailOrPhone : undefined,
        password: form.password,
        role: form.role
      })
      setUser(res.data.data.user, res.data.data.accessToken)
      toast.success('Account created! Welcome to BELLMAK 🎉')
      if (form.role === 'SELLER') router.push('/seller/dashboard')
      else router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-xl">🛒</div>
            <span className="text-3xl font-black text-gray-800">BELL<span className="text-orange-500">MAK</span></span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">India Ka Apna Bazaar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">

          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {['Login', 'Register'].map((tab, i) => (
              <button key={i} onClick={() => setIsLogin(i === 0)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  isLogin === (i === 0) ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="Rahul Sharma"
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 transition-all" />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email or Phone</label>
              <input type="text" name="emailOrPhone" value={form.emailOrPhone} onChange={handleChange}
                placeholder="email@example.com or 9876543210"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 transition-all" />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 transition-all" />
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { role: 'CUSTOMER', icon: '🛒', label: 'Customer', desc: 'Shop products' },
                    { role: 'SELLER', icon: '🏪', label: 'Seller', desc: 'Sell products' },
                  ].map(opt => (
                    <div key={opt.role} onClick={() => setForm({ ...form, role: opt.role })}
                      className={`border-2 rounded-xl p-3 cursor-pointer text-center transition-all ${
                        form.role === opt.role ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="text-2xl mb-1">{opt.icon}</div>
                      <p className="font-bold text-sm text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-orange-500 hover:underline">Forgot Password?</Link>
              </div>
            )}

            <button onClick={isLogin ? handleLogin : handleRegister} disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Please wait...</> : isLogin ? 'Login to BELLMAK' : `Create ${form.role === 'SELLER' ? 'Seller' : 'Customer'} Account`}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to BELLMAK's{' '}
          <Link href="/terms" className="text-orange-500 hover:underline">Terms</Link>{' '}and{' '}
          <Link href="/privacy-policy" className="text-orange-500 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}