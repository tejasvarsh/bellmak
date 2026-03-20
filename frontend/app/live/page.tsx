'use client'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { Eye, Clock, Radio } from 'lucide-react'
import Link from 'next/link'

export default function LiveBrowsePage() {
  const { isLoggedIn } = useAuthStore()
  const [streams, setStreams] = useState<any[]>([])
  const [recordings, setRecordings] = useState<any[]>([])
  const [tab, setTab] = useState<'live' | 'recordings'>('live')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStreams()
    const interval = setInterval(fetchStreams, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchStreams = async () => {
    try {
      const [liveRes, recRes] = await Promise.all([
        api.get('/live'),
        api.get('/live/recordings')
      ])
      setStreams(liveRes.data.data || [])
      setRecordings(recRes.data.data || [])
    } catch {
      setStreams([])
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (start: string, end?: string) => {
    const s = new Date(start)
    const e = end ? new Date(end) : new Date()
    const diff = Math.floor((e.getTime() - s.getTime()) / 1000)
    const m = Math.floor(diff / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}h ${m % 60}m`
    return `${m}m`
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Radio className="text-red-500" size={24} /> BELLMAK Live
            </h1>
            <p className="text-gray-400 text-sm mt-1">Watch live selling sessions from top sellers</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'live', label: `🔴 Live Now (${streams.length})` },
            { key: 'recordings', label: `🎬 Recordings (${recordings.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.key ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl aspect-video animate-pulse" />
            ))}
          </div>
        ) : tab === 'live' ? (
          streams.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📡</div>
              <h3 className="text-xl font-bold text-white mb-2">No live streams right now</h3>
              <p className="text-gray-400">Check back later or watch recordings</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map(stream => (
                <Link key={stream.id} href={`/live/${stream.id}`}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all group">
                  <div className="aspect-video bg-black relative flex items-center justify-center">
                    <div className="text-4xl">📹</div>
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />LIVE
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      <Eye size={10} /> {stream.viewerCount}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-red-400 transition-colors">{stream.title}</h3>
                    <p className="text-gray-400 text-xs mt-1">{stream.seller?.businessName}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock size={11} /> {formatDuration(stream.startedAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          recordings.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🎬</div>
              <h3 className="text-xl font-bold text-white mb-2">No recordings yet</h3>
              <p className="text-gray-400">Past live streams will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recordings.map(rec => (
                <div key={rec.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="aspect-video bg-black relative flex items-center justify-center">
                    <div className="text-4xl">🎬</div>
                    <div className="absolute top-2 left-2 bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">ENDED</div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {formatDuration(rec.startedAt, rec.endedAt)}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-bold text-sm line-clamp-1">{rec.title}</h3>
                    <p className="text-gray-400 text-xs mt-1">{rec.seller?.businessName}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span><Eye size={11} className="inline mr-1" />{rec.viewerCount} watched</span>
                      <span>{new Date(rec.startedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}