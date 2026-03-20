'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { Video, Clock, Eye, Radio, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SellerRecordingsPage() {
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [recordings, setRecordings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    if (user?.role !== 'SELLER') { router.push('/'); return }
    fetchRecordings()
  }, [])

  const fetchRecordings = async () => {
    try {
      const res = await api.get('/live/recordings?mine=true')
      setRecordings(res.data.data || [])
    } catch {
      setRecordings([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await api.delete(`/live/${id}`)
      setRecordings(prev => prev.filter(r => r.id !== id))
      setConfirmDelete(null)
      toast.success('Recording deleted!')
    } catch {
      toast.error('Delete failed. Try again.')
    } finally {
      setDeleting(null)
    }
  }

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'N/A'
    const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000)
    const m = Math.floor(diff / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}h ${m % 60}m`
    return `${m}m`
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Video className="text-red-500" size={22} /> My Live Recordings
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{recordings.length} recordings</p>
          </div>
          <Link href="/live/seller"
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors">
            <Radio size={16} /> Go Live
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}
          </div>
        ) : recordings.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
            <div className="text-5xl mb-4">📡</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No recordings yet</h3>
            <p className="text-gray-500 mb-6">Start your first live stream to see recordings here</p>
            <Link href="/live/seller"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors">
              <Radio size={18} /> Start Live Stream
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map(rec => (
              <div key={rec.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-14 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Video size={20} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{rec.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(rec.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={11} /> {formatDuration(rec.startedAt, rec.endedAt)}</span>
                      <span className="flex items-center gap-1"><Eye size={11} /> {rec.viewerCount} viewers</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">ENDED</span>
                    <button
                      onClick={() => setConfirmDelete(rec.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete recording">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Confirm delete */}
                {confirmDelete === rec.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 flex-1">Delete this recording permanently?</p>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      disabled={deleting === rec.id}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                      {deleting === rec.id ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}