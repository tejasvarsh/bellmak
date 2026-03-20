'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Video, VideoOff, Mic, MicOff, X, Send, Radio, Clock, Eye, AlertCircle } from 'lucide-react'

export default function SellerLivePage() {
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()

  // ── VIDEO CONTAINER — unique id taaki Agora correctly attach kare ──────────
  const videoContainerId = 'agora-local-video'

  const [step, setStep] = useState<'setup' | 'live' | 'ended'>('setup')
  const [form, setForm] = useState({ title: '', description: '' })
  const [starting, setStarting] = useState(false)
  const [streamData, setStreamData] = useState<any>(null)
  const [agoraClient, setAgoraClient] = useState<any>(null)
  const [videoTrack, setVideoTrack] = useState<any>(null)
  const [audioTrack, setAudioTrack] = useState<any>(null)
  const [videoOn, setVideoOn] = useState(true)
  const [audioOn, setAudioOn] = useState(true)
  const [viewers, setViewers] = useState(0)
  const [duration, setDuration] = useState(0)
  const [permError, setPermError] = useState('')
  const [chat, setChat] = useState<{ name: string; msg: string; time: string; isSystem?: boolean }[]>([
    { name: 'System', msg: '🎉 Stream started! Welcome everyone', time: '00:00', isSystem: true }
  ])
  const [chatMsg, setChatMsg] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const viewerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoTrackRef = useRef<any>(null)
  const audioTrackRef = useRef<any>(null)
  const clientRef = useRef<any>(null)

  // ── AUTH GUARD ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    if (user?.role !== 'SELLER') { router.push('/'); return }
  }, [isLoggedIn, user, router])

  // ── TIMER ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step === 'live') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
      // Fake viewer count simulation (replace with real Agora audience count if needed)
      viewerTimerRef.current = setInterval(() => {
        setViewers(v => v + Math.floor(Math.random() * 3))
      }, 8000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (viewerTimerRef.current) clearInterval(viewerTimerRef.current)
    }
  }, [step])

  // ── AUTO SCROLL CHAT ───────────────────────────────────────────────────────
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chat])

  // ── CLEANUP ON UNMOUNT ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      videoTrackRef.current?.stop()
      videoTrackRef.current?.close()
      audioTrackRef.current?.stop()
      audioTrackRef.current?.close()
      clientRef.current?.leave()
    }
  }, [])

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // ── CHECK CAMERA PERMISSION ────────────────────────────────────────────────
  const checkPermissions = async (): Promise<boolean> => {
    setPermError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      // Permission granted — stop test stream immediately
      stream.getTracks().forEach(t => t.stop())
      return true
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setPermError('Camera aur Microphone permission deny hai. Browser settings mein allow karo.')
      } else if (err.name === 'NotFoundError') {
        setPermError('Camera ya Microphone device nahi mila. Check karo connected hai ya nahi.')
      } else if (err.name === 'NotReadableError') {
        setPermError('Camera already kisi aur app mein use ho rahi hai. Woh app band karo.')
      } else {
        setPermError(`Device error: ${err.message}`)
      }
      return false
    }
  }

  // ── START STREAM ──────────────────────────────────────────────────────────
  const handleStartStream = async () => {
    if (!form.title.trim()) { toast.error('Stream title required!'); return }

    const permitted = await checkPermissions()
    if (!permitted) return

    setStarting(true)
    try {
      // 1. Backend se stream start karo + Agora token lo
      const res = await api.post('/live/start', {
        title: form.title,
        description: form.description,
      })
      const data = res.data.data
      setStreamData(data)

      // 2. Agora SDK import (dynamic — SSR safe)
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      AgoraRTC.setLogLevel(4) // Errors only — reduce console noise

      // 3. Client banao aur join karo
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      await client.setClientRole('host')
      await client.join(
        data.appId,
        data.channelName,
        data.agoraToken || null,
        data.uid || null
      )
      clientRef.current = client
      setAgoraClient(client)

      // 4. Camera + Mic tracks banao
      const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { encoderConfig: 'music_standard' },       // audio quality
        { encoderConfig: '720p_1', facingMode: 'user' } // video quality
      )
      videoTrackRef.current = camTrack
      audioTrackRef.current = micTrack
      setVideoTrack(camTrack)
      setAudioTrack(micTrack)

      // 5. Publish to channel
      await client.publish([micTrack, camTrack])

      // 6. ── KEY FIX: step pehle set karo, phir play karo ──────────────────
      // Video container DOM mein aane ke baad play karo
      setStep('live')

      // Small delay — React ko re-render karne do taaki div mount ho jaye
      setTimeout(() => {
        const container = document.getElementById(videoContainerId)
        if (container) {
          camTrack.play(container)
        } else {
          // Fallback — 500ms baad phir try karo
          setTimeout(() => {
            const el = document.getElementById(videoContainerId)
            if (el) camTrack.play(el)
          }, 500)
        }
      }, 200)

      toast.success('🔴 You are LIVE!')
    } catch (err: any) {
      console.error('Stream start error:', err)
      // Cleanup on error
      videoTrackRef.current?.stop()
      videoTrackRef.current?.close()
      audioTrackRef.current?.stop()
      audioTrackRef.current?.close()
      clientRef.current?.leave()
      if (err.message?.includes('PERMISSION_DENIED') || err.name === 'NotAllowedError') {
        toast.error('Camera/Mic permission deny hai!')
      } else {
        toast.error('Stream start nahi hua. Dobara try karo.')
      }
    } finally {
      setStarting(false)
    }
  }

  // ── END STREAM ─────────────────────────────────────────────────────────────
  const handleEndStream = async () => {
    if (!window.confirm('Stream end karna chahte ho?')) return
    try {
      if (streamData?.stream?.id) {
        await api.post(`/live/${streamData.stream.id}/end`)
      }
    } catch { /* ignore API error, cleanup anyway */ }

    videoTrackRef.current?.stop()
    videoTrackRef.current?.close()
    audioTrackRef.current?.stop()
    audioTrackRef.current?.close()
    await clientRef.current?.leave()

    if (timerRef.current) clearInterval(timerRef.current)
    if (viewerTimerRef.current) clearInterval(viewerTimerRef.current)

    setStep('ended')
    toast.success('Stream ended! Recording saved.')
  }

  // ── TOGGLE VIDEO ───────────────────────────────────────────────────────────
  const toggleVideo = useCallback(async () => {
    const track = videoTrackRef.current
    if (!track) return
    const newState = !videoOn
    await track.setEnabled(newState)
    setVideoOn(newState)

    // Re-play video when turning back on
    if (newState) {
      setTimeout(() => {
        const el = document.getElementById(videoContainerId)
        if (el) track.play(el)
      }, 100)
    }
  }, [videoOn])

  // ── TOGGLE AUDIO ───────────────────────────────────────────────────────────
  const toggleAudio = useCallback(async () => {
    const track = audioTrackRef.current
    if (!track) return
    const newState = !audioOn
    await track.setEnabled(newState)
    setAudioOn(newState)
  }, [audioOn])

  // ── SEND CHAT ──────────────────────────────────────────────────────────────
  const sendChat = useCallback(() => {
    if (!chatMsg.trim()) return
    const mins = Math.floor(duration / 60)
    const secs = duration % 60
    setChat(c => [...c, {
      name: user?.name?.split(' ')[0] || 'Seller',
      msg: chatMsg,
      time: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    }])
    setChatMsg('')
  }, [chatMsg, duration, user])

  // ── RESET ──────────────────────────────────────────────────────────────────
  const resetStream = () => {
    setStep('setup')
    setDuration(0)
    setViewers(0)
    setPermError('')
    setChat([{ name: 'System', msg: '🎉 Stream started! Welcome everyone', time: '00:00', isSystem: true }])
    videoTrackRef.current = null
    audioTrackRef.current = null
    clientRef.current = null
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SETUP SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 'setup') return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
            <Radio size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Start Live Stream</h1>
          <p className="text-gray-400 text-sm mt-1">Sell your products live to thousands of customers</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur">

          {/* Title */}
          <div>
            <label className="text-sm font-bold text-gray-300 block mb-2">Stream Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Big Sale on Electronics! Up to 50% Off 🔥"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 outline-none focus:border-red-500 transition-colors text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-bold text-gray-300 block mb-2">Description <span className="text-gray-500 font-normal">(optional)</span></label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Tell viewers what you'll be showing today..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 outline-none focus:border-red-500 transition-colors text-sm resize-none"
            />
          </div>

          {/* Permission error */}
          {permError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs leading-relaxed">{permError}</p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <p className="text-yellow-400 text-xs font-bold mb-1.5">Before you go live:</p>
            <ul className="text-yellow-300/70 text-xs space-y-1">
              <li>· Browser mein camera & microphone allow karo</li>
              <li>· Achhi lighting ensure karo</li>
              <li>· Stable internet connection use karo</li>
              <li>· Koi doosri app camera use na kare</li>
            </ul>
          </div>

          <button
            onClick={handleStartStream}
            disabled={starting || !form.title.trim()}
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-lg shadow-red-500/30"
          >
            {starting ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Setting up camera...</>
            ) : (
              <><Radio size={20} />Go Live Now!</>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // ENDED SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 'ended') return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🎬</div>
        <h1 className="text-2xl font-black text-white mb-2">Stream Ended!</h1>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-white font-black text-lg">{fmt(duration)}</p>
            <p className="text-gray-400 text-xs">Duration</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-white font-black text-lg">{viewers}</p>
            <p className="text-gray-400 text-xs">Viewers</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/live/recordings')}
            className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors"
          >
            📹 View Recordings
          </button>
          <button
            onClick={resetStream}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
          >
            🔴 Start New Stream
          </button>
          <button
            onClick={() => router.push('/seller/dashboard')}
            className="px-6 py-3 text-gray-400 font-bold hover:text-white transition-colors text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // LIVE SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col lg:flex-row">

      {/* ── VIDEO PANEL ── */}
      <div className="flex-1 relative bg-black">

        {/* ── KEY FIX: id attribute — Agora plays into this div ── */}
        <div
          id={videoContainerId}
          className="w-full h-[55vw] lg:h-screen bg-black"
          style={{ minHeight: 280 }}
        />

        {/* Video off overlay */}
        {!videoOn && (
          <div className="absolute inset-0 bg-black flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <VideoOff size={48} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Camera Off</p>
            </div>
          </div>
        )}

        {/* Top status badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            LIVE
          </div>
          <div className="flex items-center gap-1.5 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Clock size={11} /> {fmt(duration)}
          </div>
          <div className="flex items-center gap-1.5 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Eye size={11} /> {viewers} watching
          </div>
        </div>

        {/* Stream title */}
        <div className="absolute top-4 right-4 max-w-[200px]">
          <p className="text-white/80 text-xs font-bold bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1.5 line-clamp-2 text-right">
            {streamData?.stream?.title || form.title}
          </p>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {/* Video toggle */}
          <button
            onClick={toggleVideo}
            title={videoOn ? 'Camera band karo' : 'Camera chalu karo'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
              videoOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* End stream */}
          <button
            onClick={handleEndStream}
            title="Stream end karo"
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/40 transition-all hover:scale-105"
          >
            <X size={22} />
          </button>

          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            title={audioOn ? 'Mic band karo' : 'Mic chalu karo'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
              audioOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {audioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
        </div>
      </div>

      {/* ── CHAT PANEL ── */}
      <div className="w-full lg:w-80 bg-[#1a1a1a] flex flex-col border-l border-white/10" style={{ height: 'calc(100vh - 55vw)', minHeight: 240 }}>
        <div className="lg:hidden" style={{ height: 'auto' }} />
        <div className="flex-1 flex flex-col lg:h-screen">

          {/* Chat header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <h3 className="text-white font-bold text-sm">💬 Live Chat</h3>
            <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">{viewers} viewers</span>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {chat.map((c, i) => (
              <div key={i} className="text-xs">
                <span className={`font-black ${c.isSystem ? 'text-yellow-400' : 'text-red-400'}`}>
                  {c.name}:{' '}
                </span>
                <span className="text-gray-300">{c.msg}</span>
                <span className="text-gray-600 ml-1.5 text-[10px]">{c.time}</span>
              </div>
            ))}
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-white/10 flex gap-2 flex-shrink-0">
            <input
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Say something..."
              className="flex-1 px-3 py-2 bg-white/10 text-white text-xs rounded-xl border border-white/20 outline-none focus:border-red-500 placeholder-gray-500 transition-colors"
            />
            <button
              onClick={sendChat}
              disabled={!chatMsg.trim()}
              className="w-8 h-8 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send size={13} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
