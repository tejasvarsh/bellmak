'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { Send, Users, Eye, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WatchLivePage() {
  const { streamId } = useParams()
  const { user, isLoggedIn } = useAuthStore()
  const videoRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const [stream, setStream] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [duration, setDuration] = useState(0)
  const [chat, setChat] = useState<{ name: string; msg: string }[]>([
    { name: 'System', msg: '👋 Welcome to the live stream!' }
  ])
  const [chatMsg, setChatMsg] = useState('')

  useEffect(() => {
    fetchStream()
    const timer = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chat])

  const fetchStream = async () => {
    try {
      const res = await api.get(`/live/${streamId}`)
      const data = res.data.data
      setStream(data.stream)

      if (data.stream.status === 'LIVE') {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        const agoraClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
        agoraClient.setClientRole('audience')
        await agoraClient.join(data.appId, data.stream.channelName, data.agoraToken, data.uid)

        agoraClient.on('user-published', async (remoteUser: any, mediaType: any) => {
          await agoraClient.subscribe(remoteUser, mediaType)
          if (mediaType === 'video' && videoRef.current) {
            remoteUser.videoTrack?.play(videoRef.current)
          }
          if (mediaType === 'audio') {
            remoteUser.audioTrack?.play()
          }
        })

        setClient(agoraClient)
      }
    } catch {
      toast.error('Stream not found')
    } finally {
      setLoading(false)
    }
  }

  const sendChat = () => {
    if (!chatMsg.trim()) return
    setChat(c => [...c, { name: user?.name?.split(' ')[0] || 'Viewer', msg: chatMsg }])
    setChatMsg('')
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400">Connecting to stream...</p>
      </div>
    </div>
  )

  if (!stream) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-5xl mb-4">📡</div>
        <h2 className="text-xl font-bold mb-2">Stream not found</h2>
        <a href="/live" className="text-red-400 hover:underline">Browse all streams</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col lg:flex-row">
      <div className="flex-1 relative">
        <div ref={videoRef} className="w-full h-[50vh] lg:h-screen bg-black" />

        {stream.status === 'ENDED' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <div className="text-5xl mb-3">🎬</div>
              <h3 className="text-xl font-bold">Stream has ended</h3>
              <a href="/live" className="text-red-400 hover:underline text-sm mt-2 block">Browse other streams</a>
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 flex items-center gap-2">
          {stream.status === 'LIVE' ? (
            <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-ping" />LIVE
            </div>
          ) : (
            <div className="bg-gray-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">ENDED</div>
          )}
          <div className="flex items-center gap-1 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
            <Clock size={11} /> {formatDuration(duration)}
          </div>
          <div className="flex items-center gap-1 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
            <Eye size={11} /> {stream.viewerCount}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/60 backdrop-blur rounded-xl p-3">
            <h3 className="text-white font-bold text-sm">{stream.title}</h3>
            <p className="text-gray-300 text-xs mt-0.5">{stream.seller?.businessName}</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-[#1a1a1a] flex flex-col border-l border-white/10 h-[50vh] lg:h-screen">
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Users size={16} className="text-red-400" /> Live Chat
          </h3>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {chat.map((c, i) => (
            <div key={i} className="text-xs">
              <span className={`font-bold ${c.name === 'System' ? 'text-yellow-400' : 'text-red-400'}`}>{c.name}: </span>
              <span className="text-gray-300">{c.msg}</span>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/10 flex gap-2">
          {isLoggedIn ? (
            <>
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Say something..."
                className="flex-1 px-3 py-2 bg-white/10 text-white text-xs rounded-xl border border-white/20 outline-none focus:border-red-500 placeholder-gray-500" />
              <button onClick={sendChat} className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center hover:bg-red-600 flex-shrink-0">
                <Send size={13} className="text-white" />
              </button>
            </>
          ) : (
            <a href="/login" className="flex-1 text-center py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors">
              Login to chat
            </a>
          )}
        </div>
      </div>
    </div>
  )
}