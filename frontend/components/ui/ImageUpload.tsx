'use client'
import { useState, useRef } from 'react'
import { Upload, X, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  label?: string
}

export default function ImageUpload({ value, onChange, maxImages = 5, label = 'Upload Images' }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFiles = async (files: FileList) => {
    const remaining = maxImages - value.length
    if (remaining <= 0) { toast.error(`Max ${maxImages} images allowed`); return }

    const selected = Array.from(files).slice(0, remaining)

    for (const file of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Only JPG, PNG, WEBP allowed'); return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Max file size 5MB'); return
      }
    }

    setUploading(true)
    try {
      const base64s = await Promise.all(selected.map(toBase64))
      const res = await api.post('/upload/multiple', { images: base64s })
      onChange([...value, ...res.data.data.urls])
      toast.success('Images uploaded!')
    } catch {
      toast.error('Upload failed. Check Cloudinary settings.')
    } finally {
      setUploading(false)
    }
  }

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))

  const move = (i: number, dir: number) => {
    const arr = [...value]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onChange(arr)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-gray-700">{label}</p>

      {/* Upload Zone */}
      {value.length < maxImages && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="animate-spin text-orange-500" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Upload size={22} className="text-orange-500" />
              </div>
              <p className="text-sm font-bold text-gray-700">Click or drag images here</p>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP · Max 5MB · {value.length}/{maxImages}</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((url, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50 aspect-square">
              <img src={url} alt="" className="w-full h-full object-contain p-1" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Main
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button onClick={() => move(i, -1)} className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-gray-100">
                  <ArrowLeft size={12} />
                </button>
                <button onClick={() => remove(i)} className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                  <X size={12} className="text-white" />
                </button>
                <button onClick={() => move(i, 1)} className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-gray-100">
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}