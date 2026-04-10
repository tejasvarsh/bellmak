'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft,
  CheckCircle, Loader2, ShieldCheck, RefreshCw,
  AlertCircle, ArrowRight, Sparkles
} from 'lucide-react'

type Step = 'email' | 'otp' | 'password' | 'success'

function getStrength(p: string) {
  if (!p) return null
  let score = 0
  if (p.length >= 6)               score++
  if (p.length >= 10)              score++
  if (/[A-Z]/.test(p))             score++
  if (/[0-9]/.test(p))             score++
  if (/[^A-Za-z0-9]/.test(p))     score++
  if (score <= 1) return { label:'Very Weak', color:'bg-red-500',    width:'w-1/5',  text:'text-red-500',    emoji:'😟' }
  if (score === 2) return { label:'Weak',      color:'bg-orange-500', width:'w-2/5',  text:'text-orange-500', emoji:'😐' }
  if (score === 3) return { label:'Fair',       color:'bg-yellow-500', width:'w-3/5',  text:'text-yellow-600', emoji:'🙂' }
  if (score === 4) return { label:'Strong',     color:'bg-blue-500',   width:'w-4/5',  text:'text-blue-600',   emoji:'😊' }
  return              { label:'Very Strong', color:'bg-green-500',  width:'w-full', text:'text-green-600',  emoji:'💪' }
}

function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const updated = [...value]
    updated[idx] = val.slice(-1)
    onChange(updated)
    if (val && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) refs.current[idx - 1]?.focus()
    if (e.key === 'ArrowLeft'  && idx > 0) refs.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      onChange(pasted.split(''))
      refs.current[5]?.focus()
    }
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {value.map((digit, idx) => (
        <input
          key={idx}
          ref={el => { refs.current[idx] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKey(idx, e)}
          onFocus={e => e.target.select()}
          className={`w-12 h-14 text-center text-2xl font-black border-2 rounded-2xl outline-none transition-all duration-200 ${
            digit
              ? 'border-orange-500 bg-orange-50 text-orange-600 scale-105 shadow-md shadow-orange-100'
              : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-300'
          } focus:border-orange-500 focus:bg-white focus:scale-105`}
        />
      ))}
    </div>
  )
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step,            setStep]            = useState<Step>('email')
  const [loading,         setLoading]         = useState(false)
  const [email,           setEmail]           = useState('')
  const [otp,             setOtp]             = useState(['','','','','',''])
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass,        setShowPass]        = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [resendTimer,     setResendTimer]     = useState(0)
  const [attempts,        setAttempts]        = useState(0)

  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim())        { toast.error('Email address enter karo'); return }
    if (!email.includes('@')) { toast.error('Valid email enter karo');   return }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      toast.success('OTP aapke email par bheja gaya! 📧')
      setStep('otp')
      setResendTimer(60)
      setOtp(['','','','','',''])
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Kuch problem aayi. Dobara try karo.')
    } finally { setLoading(false) }
  }, [email])

  const handleResend = useCallback(async () => {
    if (resendTimer > 0) return
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      toast.success('OTP dobara bheja gaya! 📧')
      setResendTimer(60)
      setOtp(['','','','','',''])
      setAttempts(0)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Resend failed')
    } finally { setLoading(false) }
  }, [email, resendTimer])

  const handleOtpSubmit = useCallback(() => {
    const otpVal = otp.join('')
    if (otpVal.length !== 6) { toast.error('6-digit OTP enter karo'); return }
    if (attempts >= 5)       { toast.error('Too many attempts. Naya OTP request karo.'); return }
    setAttempts(a => a + 1)
    setStep('password')
  }, [otp, attempts])

  const handlePasswordReset = useCallback(async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password minimum 6 characters ka hona chahiye'); return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords match nahi kar rahe'); return
    }
    const s = getStrength(newPassword)
    if (s?.label === 'Very Weak' || s?.label === 'Weak') {
      toast.error('Thoda strong password banao!'); return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email, otp: otp.join(''), newPassword
      })
      setStep('success')
      toast.success('Password reset ho gaya! 🎉')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Reset failed. OTP galat ya expire ho gaya.'
      toast.error(msg)
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('expire')) {
        setStep('otp')
        setOtp(['','','','','',''])
      }
    } finally { setLoading(false) }
  }, [email, otp, newPassword, confirmPassword])

  const strength      = getStrength(newPassword)
  const otpFilled     = otp.every(d => d !== '')
  const passwordMatch = confirmPassword && confirmPassword === newPassword
  const stepNum       = step === 'email' ? 1 : step === 'otp' ? 2 : step === 'password' ? 3 : 4

  const inputCls = "w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100/50 bg-gray-50/80 focus:bg-white transition-all font-medium placeholder-gray-400"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f2f5] via-orange-50/30 to-[#f0f2f5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {step !== 'success' && (
          <Link href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-500 mb-6 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
        )}

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100/80 overflow-hidden">

          {/* Progress Bar */}
          {step !== 'success' && (
            <div className="h-1.5 bg-gray-100">
              <div className={`h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-700 ease-out rounded-full ${
                step === 'email' ? 'w-1/3' : step === 'otp' ? 'w-2/3' : 'w-full'
              }`} />
            </div>
          )}

          {/* Step Indicators */}
          {step !== 'success' && (
            <div className="flex items-center justify-between px-8 pt-5">
              {[{n:1,label:'Email'},{n:2,label:'OTP'},{n:3,label:'Password'}].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      stepNum > s.n  ? 'bg-green-500 text-white' :
                      stepNum === s.n ? 'bg-orange-500 text-white shadow-md shadow-orange-200' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {stepNum > s.n ? <CheckCircle size={14} /> : s.n}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      stepNum === s.n ? 'text-orange-500' : stepNum > s.n ? 'text-green-500' : 'text-gray-300'
                    }`}>{s.label}</span>
                  </div>
                  {i < 2 && (
                    <div className={`w-16 h-0.5 rounded-full mb-4 transition-colors ${
                      stepNum > s.n ? 'bg-green-400' : 'bg-gray-100'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="p-8 pt-6">

            {/* ── STEP 1: EMAIL ── */}
            {step === 'email' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
                    <Mail size={28} className="text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900">Forgot Password?</h1>
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                    Apna registered email enter karo. Hum OTP bhejenge jisse aap password reset kar sako.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                      placeholder="aapka@email.com"
                      autoFocus
                      className={inputCls}
                    />
                  </div>
                </div>

                <button onClick={handleEmailSubmit} disabled={loading || !email.trim()}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:scale-[1.01] active:scale-[0.99]">
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Sending OTP...</>
                    : <>Send OTP <ArrowRight size={16} /></>}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Password yaad aa gaya?{' '}
                  <Link href="/login" className="text-orange-500 font-black hover:underline">Login karo</Link>
                </p>
              </div>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === 'otp' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                    <KeyRound size={28} className="text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900">Enter OTP</h1>
                  <p className="text-gray-400 text-sm mt-2">
                    6-digit OTP bheja hai{' '}
                    <span className="text-gray-700 font-black">{email}</span>{' '}
                    par. Email check karo.
                  </p>
                </div>

                {/* Info box — no OTP shown */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <Mail size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-blue-700">OTP Email Par Bheja Gaya Hai</p>
                    <p className="text-xs text-blue-500 mt-0.5">
                      Apna inbox aur spam folder check karo. OTP 10 minutes mein expire hoga.
                    </p>
                  </div>
                </div>

                <OtpInput value={otp} onChange={setOtp} />

                {attempts > 2 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold">
                    <AlertCircle size={13} />
                    {5 - attempts} attempts remaining
                  </div>
                )}

                <button onClick={handleOtpSubmit} disabled={!otpFilled}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:scale-[1.01] active:scale-[0.99]">
                  <ShieldCheck size={16} /> Verify OTP
                </button>

                <div className="flex items-center justify-between">
                  <button onClick={() => setStep('email')}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1">
                    <ArrowLeft size={12} /> Change email
                  </button>
                  <button onClick={handleResend} disabled={resendTimer > 0 || loading}
                    className="flex items-center gap-1.5 text-xs font-black disabled:opacity-50">
                    {resendTimer > 0
                      ? <span className="text-gray-400">Resend in <span className="text-orange-500">{resendTimer}s</span></span>
                      : <span className="text-orange-500 flex items-center gap-1">
                          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                          Resend OTP
                        </span>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: NEW PASSWORD ── */}
            {step === 'password' && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                    <Lock size={28} className="text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900">New Password</h1>
                  <p className="text-gray-400 text-sm mt-2">Strong password banao.</p>
                </div>

                {/* Password Tips */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Strong Password Tips</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { check: newPassword.length >= 8,          label: '8+ characters'   },
                      { check: /[A-Z]/.test(newPassword),        label: 'Uppercase letter' },
                      { check: /[0-9]/.test(newPassword),        label: 'Number'           },
                      { check: /[^A-Za-z0-9]/.test(newPassword), label: 'Special char'     },
                    ].map(tip => (
                      <div key={tip.label} className={`flex items-center gap-1.5 text-[11px] font-bold ${tip.check ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${tip.check ? 'bg-green-500' : 'bg-gray-200'}`}>
                          {tip.check && <CheckCircle size={9} className="text-white" />}
                        </div>
                        {tip.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPass ? 'text' : 'password'} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••" autoFocus
                      className={`${inputCls} pr-12`} />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {strength && (
                    <div className="mt-2.5 space-y-1">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.width}`} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-black ${strength.text}`}>{strength.emoji} {strength.label}</p>
                        <p className="text-[10px] text-gray-400">{newPassword.length} chars</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePasswordReset()}
                      placeholder="••••••••"
                      className={`${inputCls} pr-12 ${
                        confirmPassword && !passwordMatch ? 'border-red-300 focus:border-red-400' :
                        passwordMatch ? 'border-green-300 focus:border-green-400' : ''
                      }`} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && !passwordMatch && (
                    <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} /> Passwords match nahi kar rahe
                    </p>
                  )}
                  {passwordMatch && (
                    <p className="text-xs text-green-600 font-bold mt-1.5 flex items-center gap-1">
                      <CheckCircle size={11} /> Perfect match! ✓
                    </p>
                  )}
                </div>

                <button onClick={handlePasswordReset} disabled={loading || !newPassword || !confirmPassword}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:scale-[1.01] active:scale-[0.99]">
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Resetting...</>
                    : <><ShieldCheck size={16} /> Reset Password</>}
                </button>
              </div>
            )}

            {/* ── STEP 4: SUCCESS ── */}
            {step === 'success' && (
              <div className="py-4 text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-200">
                    <CheckCircle size={44} className="text-white" />
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl font-black text-gray-900 mb-2">Password Reset! 🎉</h1>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Aapka password successfully reset ho gaya. Ab naye password se login karo.
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-left space-y-2">
                  {['Password updated successfully','Purane saare sessions logout ho gaye','Ab naye password se login karo'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-green-700">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={11} className="text-white" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>

                <button onClick={() => router.push('/login')}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:scale-[1.01]">
                  <Sparkles size={16} /> Login Now
                </button>

                <p className="text-xs text-gray-400">
                  Koi problem?{' '}
                  <a href="mailto:support@bellmak.com" className="text-orange-500 font-bold hover:underline">
                    support@bellmak.com
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          🔒 Secured by BELLMAK · Your data is safe
        </p>
      </div>
    </div>
  )
}