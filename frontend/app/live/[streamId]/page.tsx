'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import Link from 'next/link'
import { Send, Users, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface ChatMsg {
  name: string
  msg: string
  time: string
  isSystem?: boolean
}

export default function WatchLivePage() {
  const { streamId } = useParams()
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()

  const videoRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const clientRef = useRef<any>(null)

  const [stream, setStream] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewers, setViewers] = useState(0)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [chatMsg, setChatMsg] = useState('')
  const [isLive, setIsLive] = useState(true)

  // Auto scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [chat])

  // Fetch stream + join Agora + WebSocket
  const fetchAndJoin = useCallback(async () => {
    try {
      const res = await api.get(`/live/${streamId}`)
      const data = res.data.data

      setStream(data.stream)
      setViewers(data.stream.viewerCount || 0)
      setIsLive(data.stream.status === 'LIVE')

      if (data.stream.status !== 'LIVE') {
        setLoading(false)
        return
      }

      // Agora Setup
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      AgoraRTC.setLogLevel(4)

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      await client.setClientRole('audience')

      const { appId, channelName, token, uid } = data.agora

      await client.join(appId, channelName, token, uid)
      clientRef.current = client

      client.on('user-published', async (remoteUser: any, mediaType: string) => {
        await client.subscribe(remoteUser, mediaType)
        if (mediaType === 'video' && videoRef.current) {
          remoteUser.videoTrack?.play(videoRef.current)
        }
        if (mediaType === 'audio') {
          remoteUser.audioTrack?.play()
        }
      })

      client.on('user-unpublished', async (remoteUser: any, mediaType: string) => {
        await client.unsubscribe(remoteUser, mediaType)
      })

      // WebSocket for Chat & Viewers
      connectWS(streamId as string)

    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Stream not found or ended')
    } finally {
      setLoading(false)
    }
  }, [streamId])

  const connectWS = useCallback((sid: string) => {
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        streamId: sid,
        name: isLoggedIn ? (user?.name?.split(' ')[0] || 'Viewer') : 'Guest'
      }))
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'chat') {
          setChat(prev => [...prev, {
            name: data.name,
            msg: data.msg,
            time: data.time,
            isSystem: data.isSystem
          }])
        }
        if (data.type === 'viewers') {
          setViewers(data.count)
        }
      } catch (err) {}
    }

    ws.onerror = () => toast.error('Chat connection lost')
  }, [isLoggedIn, user])

  const sendChat = () => {
    if (!chatMsg.trim() || !wsRef.current) return
    if (!isLoggedIn) {
      toast.error('Chat karne ke liye login karo')
      return
    }

    wsRef.current.send(JSON.stringify({ type: 'chat', msg: chatMsg }))
    setChatMsg('')
  }

  // Cleanup
  useEffect(() => {
    fetchAndJoin()

    return () => {
      clientRef.current?.leave?.()
      clientRef.current?.release?.()
      wsRef.current?.close()
    }
  }, [fetchAndJoin])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Connecting to live stream...</p>
        </div>
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📡</div>
          <h2 className="text-2xl font-bold mb-2">Stream Not Found</h2>
          <Link href="/live" className="text-red-400 hover:underline">← Back to Live Streams</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col lg:flex-row overflow-hidden">

      {/* Video Player */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        <div ref={videoRef} className="w-full h-full max-h-screen bg-black" />

        {/* Live Badge + Viewers */}
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <Link href="/live" className="flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-full text-sm font-medium transition">
            <ArrowLeft size={16} /> Back
          </Link>

          {isLive ? (
            <div className="flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          ) : (
            <div className="bg-gray-700 text-white text-xs font-bold px-4 py-2 rounded-full">ENDED</div>
          )}

          <div className="flex items-center gap-2 bg-black/70 text-white text-xs font-medium px-4 py-2 rounded-full">
            <Users size={14} />
            {viewers}
          </div>
        </div>

        {/* Stream Title */}
        <div className="absolute bottom-6 left-6 right-6 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-2xl">
          <h1 className="text-white text-xl font-bold">{stream.title}</h1>
          <p className="text-gray-400 text-sm mt-1">{stream.seller?.businessName || stream.seller?.user?.name}</p>
        </div>

        {/* Ended Overlay */}
        {!isLive && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-6">🎬</div>
              <h3 className="text-3xl font-black text-white mb-2">Stream has ended</h3>
              <Link href="/live" className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-lg">
                <ArrowLeft /> Browse other live streams
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Chat Sidebar */}
      <div className="w-full lg:w-80 bg-[#111111] flex flex-col border-l border-white/10">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white">Live Chat</h3>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-400">{viewers} watching</span>
        </div>

        {/* Chat Messages */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
          {chat.length === 0 && (
            <div className="text-center text-gray-500 py-10 text-xs">
              No messages yet.<br />Be the first to say hi 👋
            </div>
          )}
          {chat.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.isSystem ? 'items-center' : ''}`}>
              <div className={`inline-block px-3 py-2 rounded-2xl max-w-[85%] ${msg.isSystem
                ? 'bg-yellow-500/10 text-yellow-400 text-center text-xs'
                : 'bg-white/10 text-white'}`}>
                <span className="font-semibold text-blue-400">{msg.name}</span>
                <span className="ml-2 text-gray-200">{msg.msg}</span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-white/10">
          {isLoggedIn ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Type a message..."
                className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-red-500"
              />
              <button
                onClick={sendChat}
                disabled={!chatMsg.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 w-12 h-12 rounded-2xl flex items-center justify-center transition"
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="block w-full text-center bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-bold text-white"
            >
              Login to send messages
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}