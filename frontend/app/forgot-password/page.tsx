'use client'
import { useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mail, KeyRound, Lock, Eye, EyeOff,
  ArrowLeft, CheckCircle, Loader2, ShieldCheck
} from 'lucide-react'

type Step = 'email' | 'otp' | 'password' | 'success'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [devOtp, setDevOtp] = useState('') // dev mode mein OTP dikhane ke liye

  // Step 1 — Email submit
  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Valid email address enter karo')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      // Dev mode mein OTP response mein aata hai
      if (res.data.data?.otp) setDevOtp(res.data.data.otp)
      toast.success('OTP sent to your email!')
      setStep('otp')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Email not found')
    } finally {
      setLoading(false)
    }
  }

  // OTP input handler — auto focus next box
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const updated = [...otp]
    updated[idx] = val.slice(-1)
    setOtp(updated)
    if (val && idx < 5) {
      const next = document.getElementById(`otp-${idx + 1}`)
      next?.focus()
    }
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const prev = document.getElementById(`otp-${idx - 1}`)
      prev?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      document.getElementById('otp-5')?.focus()
    }
  }

  // Step 2 — OTP verify (we just proceed, actual verify on reset)
  const handleOtpSubmit = () => {
    const otpVal = otp.join('')
    if (otpVal.length !== 6) {
      toast.error('6-digit OTP enter karo')
      return
    }
    setStep('password')
  }

  // Step 3 — Reset password
  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password kam se kam 6 characters ka hona chahiye')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords match nahi kar rahe')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        otp: otp.join(''),
        newPassword
      })
      setStep('success')
      toast.success('Password reset successful!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Reset failed. OTP galat ho sakta hai.')
    } finally {
      setLoading(false)
    }
  }

  const otpFilled = otp.every(d => d !== '')
  const passwordStrength = newPassword.length === 0 ? null
    : newPassword.length < 6 ? 'weak'
    : newPassword.length < 10 ? 'medium'
    : 'strong'

  const strengthConfig = {
    weak: { label: 'Weak', color: 'bg-red-500', width: 'w-1/3', text: 'text-red-500' },
    medium: { label: 'Medium', color: 'bg-yellow-500', width: 'w-2/3', text: 'text-yellow-600' },
    strong: { label: 'Strong', color: 'bg-green-500', width: 'w-full', text: 'text-green-600' },
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Back to Login */}
        {step !== 'success' && (
          <Link href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#2874f0] mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        )}

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Progress Bar */}
          {step !== 'success' && (
            <div className="h-1 bg-gray-100">
              <div className={`h-full bg-[#2874f0] transition-all duration-500 rounded-full ${
                step === 'email' ? 'w-1/3'
                : step === 'otp' ? 'w-2/3'
                : 'w-full'
              }`} />
            </div>
          )}

          <div className="p-8">

            {/* ─── STEP 1: EMAIL ─── */}
            {step === 'email' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail size={28} className="text-[#2874f0]" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-800">Forgot Password?</h1>
                  <p className="text-gray-400 text-sm mt-2">
                    Koi baat nahi! Apna registered email enter karo, hum OTP bhejenge.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                        placeholder="aapka@email.com"
                        autoFocus
                        className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium"
                      />
                    </div>
                  </div>

                  <button onClick={handleEmailSubmit} disabled={loading}
                    className="w-full py-3.5 bg-[#2874f0] hover:bg-blue-700 text-white font-black rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Sending OTP...</>
                      : <>Send OTP <Mail size={16} /></>
                    }
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                  Password yaad aa gaya?{' '}
                  <Link href="/login" className="text-[#2874f0] font-bold hover:underline">Login karo</Link>
                </p>
              </>
            )}

            {/* ─── STEP 2: OTP ─── */}
            {step === 'otp' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <KeyRound size={28} className="text-[#F97316]" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-800">Enter OTP</h1>
                  <p className="text-gray-400 text-sm mt-2">
                    6-digit OTP bheja hai{' '}
                    <span className="text-gray-700 font-bold">{email}</span> pe
                  </p>
                </div>

                {/* Dev OTP hint */}
                {devOtp && (
                  <div className="mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                    <p className="text-xs text-yellow-700 font-medium">
                      🧪 Dev Mode OTP:{' '}
                      <span className="font-black text-yellow-800 text-sm tracking-widest">{devOtp}</span>
                    </p>
                  </div>
                )}

                {/* OTP Boxes */}
                <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className={`w-12 h-14 text-center text-xl font-black border-2 rounded-xl outline-none transition-all ${
                        digit
                          ? 'border-[#2874f0] bg-blue-50 text-[#2874f0]'
                          : 'border-gray-200 bg-gray-50 text-gray-800'
                      } focus:border-[#2874f0] focus:bg-white`}
                    />
                  ))}
                </div>

                <button onClick={handleOtpSubmit} disabled={!otpFilled}
                  className="w-full py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-black rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  Verify OTP <ShieldCheck size={16} />
                </button>

                <div className="flex items-center justify-between mt-5">
                  <button onClick={() => setStep('email')}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
                    ← Change email
                  </button>
                  <button onClick={handleEmailSubmit} disabled={loading}
                    className="text-xs text-[#2874f0] hover:underline font-bold disabled:opacity-50 transition-colors">
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP 3: NEW PASSWORD ─── */}
            {step === 'password' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock size={28} className="text-green-600" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-800">New Password</h1>
                  <p className="text-gray-400 text-sm mt-2">
                    Strong password banao — letters, numbers aur symbols use karo.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        autoFocus
                        className="w-full pl-10 pr-11 py-3.5 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium"
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Strength bar */}
                    {passwordStrength && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${strengthConfig[passwordStrength].color} ${strengthConfig[passwordStrength].width}`} />
                        </div>
                        <p className={`text-xs font-bold mt-1 ${strengthConfig[passwordStrength].text}`}>
                          {strengthConfig[passwordStrength].label} password
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePasswordReset()}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-11 py-3.5 border-2 rounded-xl text-sm outline-none transition-colors font-medium bg-gray-50 focus:bg-white ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-red-300 focus:border-red-400'
                            : confirmPassword && confirmPassword === newPassword
                            ? 'border-green-300 focus:border-green-400'
                            : 'border-gray-100 focus:border-[#2874f0]'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500 font-medium mt-1">Passwords match nahi kar rahe</p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && (
                      <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                        <CheckCircle size={11} /> Passwords match kar rahe hain
                      </p>
                    )}
                  </div>

                  <button onClick={handlePasswordReset} disabled={loading}
                    className="w-full py-3.5 bg-[#2874f0] hover:bg-blue-700 text-white font-black rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Resetting...</>
                      : <><ShieldCheck size={16} /> Reset Password</>
                    }
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP 4: SUCCESS ─── */}
            {step === 'success' && (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <h1 className="text-2xl font-black text-gray-800 mb-2">Password Reset! 🎉</h1>
                <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
                  Aapka password successfully reset ho gaya. Ab naye password se login karo.
                </p>
                <button onClick={() => router.push('/login')}
                  className="w-full py-3.5 bg-[#2874f0] hover:bg-blue-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2">
                  Login Karo <ArrowLeft size={16} className="rotate-180" />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Steps indicator */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {(['email', 'otp', 'password'] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-all ${
                  step === s ? 'bg-[#2874f0] scale-125'
                  : ['email', 'otp', 'password'].indexOf(step) > idx ? 'bg-green-500'
                  : 'bg-gray-300'
                }`} />
                {idx < 2 && <div className={`w-8 h-0.5 rounded-full transition-colors ${
                  ['email', 'otp', 'password'].indexOf(step) > idx ? 'bg-green-500' : 'bg-gray-200'
                }`} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}