'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Video, VideoOff, Mic, MicOff, X, Send,
  Radio, Clock, Users, AlertCircle, ArrowLeft
} from 'lucide-react'

interface ChatMsg {
  name: string
  msg: string
  time: string
  isSystem?: boolean
  isSeller?: boolean
}

export default function SellerLivePage() {
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()

  const [step, setStep] = useState<'setup' | 'live' | 'ended'>('setup')
  const [form, setForm] = useState({ title: '', description: '' })
  const [starting, setStarting] = useState(false)
  const [streamData, setStreamData] = useState<any>(null)
  const [videoOn, setVideoOn] = useState(true)
  const [audioOn, setAudioOn] = useState(true)
  const [viewers, setViewers] = useState(0)
  const [duration, setDuration] = useState(0)
  const [chatMsg, setChatMsg] = useState('')
  const [chat, setChat] = useState<ChatMsg[]>([])

  const chatRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<any>(null)
  const videoTrackRef = useRef<any>(null)
  const audioTrackRef = useRef<any>(null)
  const clientRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const streamIdRef = useRef<string>('')

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn || (user?.role !== 'SELLER' && user?.role !== 'ADMIN')) {
      router.push('/login')
    }
  }, [isLoggedIn, user, router])

  // Timer
  useEffect(() => {
    if (step === 'live') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [step])

  // Auto scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chat])

  // Cleanup
  useEffect(() => () => {
    videoTrackRef.current?.stop?.()
    audioTrackRef.current?.stop?.()
    clientRef.current?.leave?.()
    wsRef.current?.close()
    clearInterval(timerRef.current)
  }, [])

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // WebSocket
  const connectWS = useCallback((streamId: string) => {
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        streamId,
        name: user?.name?.split(' ')[0] || 'Seller',
      }))
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'chat') {
          setChat(c => [...c, {
            name: data.name,
            msg: data.msg,
            time: data.time,
            isSystem: data.isSystem,
            isSeller: data.name === (user?.name?.split(' ')[0] || 'Seller')
          }])
        }
        if (data.type === 'viewers') setViewers(data.count)
      } catch {}
    }
  }, [user])

  // Start Stream
  const handleStartStream = async () => {
    if (!form.title.trim()) {
      toast.error('Stream title zaroori hai!')
      return
    }

    setStarting(true)
    try {
      const res = await api.post('/live/start', {
        title: form.title,
        description: form.description || ''
      })

      const data = res.data.data
      setStreamData(data)
      streamIdRef.current = data.stream.id

      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      await client.setClientRole('host')

      const { appId, channelName, token, uid } = data.agora
      await client.join(appId, channelName, token, uid)
      clientRef.current = client

      const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      videoTrackRef.current = camTrack
      audioTrackRef.current = micTrack
      await client.publish([micTrack, camTrack])

      // Play local video
      setTimeout(() => {
        const el = document.getElementById('seller-video')
        if (el) camTrack.play(el)
      }, 300)

      setStep('live')
      connectWS(data.stream.id)

      setChat([{
        name: 'System',
        msg: '🔴 Stream started! Welcome everyone!',
        time: '00:00',
        isSystem: true,
      }])

      toast.success('🔴 You are now LIVE!')
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Stream start nahi ho paaya')
    } finally {
      setStarting(false)
    }
  }

  const handleEndStream = async () => {
    if (!confirm('Stream end karna chahte ho?')) return

    try {
      if (streamIdRef.current) await api.post(`/live/${streamIdRef.current}/end`)
    } catch {}

    videoTrackRef.current?.stop?.()
    audioTrackRef.current?.stop?.()
    clientRef.current?.leave?.()
    wsRef.current?.close()
    clearInterval(timerRef.current)

    setStep('ended')
    toast.success('Stream ended!')
  }

  const toggleVideo = async () => {
    const track = videoTrackRef.current
    if (!track) return
    await track.setEnabled(!videoOn)
    setVideoOn(!videoOn)
  }

  const toggleAudio = async () => {
    const track = audioTrackRef.current
    if (!track) return
    await track.setEnabled(!audioOn)
    setAudioOn(!audioOn)
  }

  const sendChat = () => {
    if (!chatMsg.trim() || !wsRef.current) return
    wsRef.current.send(JSON.stringify({ type: 'chat', msg: chatMsg }))
    setChatMsg('')
  }

  // ── SETUP SCREEN ──
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Radio size={36} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white">Go Live</h1>
            <p className="text-gray-400 mt-2">Apne products live becho</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">STREAM TITLE *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. 🔥 Summer Sale - Up to 70% Off"
                className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Aaj kya showcase kar rahe ho?"
                className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white outline-none focus:border-red-500 resize-none"
              />
            </div>

            <button
              onClick={handleStartStream}
              disabled={starting || !form.title.trim()}
              className="w-full py-5 bg-red-500 hover:bg-red-600 text-white font-black text-xl rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {starting ? (
                <>Setting up live stream...</>
              ) : (
                <>🔴 GO LIVE NOW</>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── LIVE SCREEN ──
  if (step === 'live') {
    return (
      <div className="h-screen bg-[#0a0a0a] flex flex-col lg:flex-row overflow-hidden">
        {/* Video */}
        <div className="flex-1 relative bg-black">
          <div id="seller-video" className="w-full h-full bg-black" />

          {/* HUD */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className="bg-red-500 text-white text-xs font-black px-4 py-2 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-ping" /> LIVE
            </div>
            <div className="bg-black/70 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2">
              <Clock size={14} /> {fmt(duration)}
            </div>
            <div className="bg-black/70 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2">
              <Users size={14} /> {viewers}
            </div>
          </div>

          {/* Stream Title */}
          <div className="absolute top-6 right-6 bg-black/70 text-white text-sm px-4 py-2 rounded-2xl">
            {streamData?.stream?.title || form.title}
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
            <button onClick={toggleVideo} className={`w-14 h-14 rounded-2xl flex items-center justify-center ${videoOn ? 'bg-white/20' : 'bg-red-500'}`}>
              {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>

            <button onClick={handleEndStream} className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
              <X size={32} />
            </button>

            <button onClick={toggleAudio} className={`w-14 h-14 rounded-2xl flex items-center justify-center ${audioOn ? 'bg-white/20' : 'bg-red-500'}`}>
              {audioOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
          </div>
        </div>

        {/* Chat */}
        <div className="w-full lg:w-80 bg-[#111] flex flex-col border-l border-white/10">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-bold text-white">Live Chat</h3>
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full">{viewers} watching</span>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {chat.map((msg, i) => (
              <div key={i} className={`text-sm ${msg.isSystem ? 'text-center' : ''}`}>
                <span className={`font-bold ${msg.isSystem ? 'text-yellow-400' : msg.isSeller ? 'text-red-400' : 'text-blue-400'}`}>
                  {msg.name}:
                </span>
                <span className="ml-2 text-gray-200">{msg.msg}</span>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Type message..."
                className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white outline-none"
              />
              <button onClick={sendChat} className="bg-red-500 px-6 rounded-2xl text-white">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ENDED SCREEN ──
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white mb-4">Stream Ended</h1>
        <button onClick={() => router.push('/seller/dashboard')} className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl text-white">
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}