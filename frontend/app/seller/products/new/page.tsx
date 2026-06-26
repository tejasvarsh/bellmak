'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Upload, Plus, X, Loader2, Image as ImageIcon, Link } from 'lucide-react'
import NextLink from 'next/link'

const CATEGORIES = [
  'Mobiles', 'Electronics', 'Fashion', 'Home & Kitchen',
  'Beauty', 'Sports', 'Books', 'Toys', 'Grocery', 'Appliances'
]

export default function AddProduct() {
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageTab, setImageTab] = useState<'gallery' | 'url'>('gallery')

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    mrp: '',
    stock: '',
    brand: '',
    category: '',
    images: [] as string[],
    isAssured: false,
  })

  useEffect(() => {
    if (!isLoggedIn) router.push('/login')
  }, [isLoggedIn])

  const set = (key: string, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  // Gallery se upload karo (file → base64 → cloudinary)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (form.images.length + files.length > 5) {
      toast.error('Max 5 images allowed')
      return
    }

    setUploading(true)
    try {
      const fileArray = Array.from(files)
      const base64Array: string[] = []

      for (const file of fileArray) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} too large (max 5MB)`)
          continue
        }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        base64Array.push(base64)
      }

      if (base64Array.length === 0) return

      const res = await api.post('/upload/multiple', {
        images: base64Array,
        folder: 'bellmak/products'
      })

      const urls = res.data.data.urls
      set('images', [...form.images, ...urls])
      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} upload ho gaya!`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload fail hua')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // URL se add karo
  const addImageUrl = () => {
    if (!imageUrl.trim()) return
    if (form.images.length >= 5) { toast.error('Max 5 images allowed'); return }
    if (!imageUrl.startsWith('http')) { toast.error('Valid URL dalo (https://...)'); return }
    set('images', [...form.images, imageUrl.trim()])
    setImageUrl('')
    toast.success('Image add ho gaya!')
  }

  const removeImage = (idx: number) =>
    set('images', form.images.filter((_, i) => i !== idx))

  const discount = form.price && form.mrp
    ? Math.max(0, Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100))
    : 0

  const handleSubmit = async () => {
    if (!form.title || !form.price || !form.mrp || !form.stock || !form.category) {
      toast.error('Saare required fields bharo')
      return
    }
    if (Number(form.price) > Number(form.mrp)) {
      toast.error('Price, MRP se zyada nahi ho sakta')
      return
    }

    try {
      setLoading(true)
      await api.post('/seller/products', {
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
      })
      toast.success('Product add ho gaya! 🎉')
      router.push('/seller/products')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Product add nahi hua')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <NextLink href="/seller/products"
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 hover:border-orange-200 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </NextLink>
          <div>
            <h1 className="text-2xl font-black text-gray-800">➕ New Product</h1>
            <p className="text-gray-500 text-sm">Product add karo — turant live ho jaayega</p>
          </div>
        </div>

        <div className="space-y-5">

          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-black text-gray-800 mb-4">📝 Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Samsung Galaxy S24 256GB Black"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Product ki details, features, specifications..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Brand</label>
                  <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)}
                    placeholder="e.g. Samsung, Nike"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white">
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-black text-gray-800 mb-4">💰 Pricing & Stock</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">
                  MRP (₹) <span className="text-red-500">*</span>
                </label>
                <input type="number" value={form.mrp} onChange={e => set('mrp', e.target.value)}
                  placeholder="0" min="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">
                  Selling Price (₹) <span className="text-red-500">*</span>
                </label>
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                  placeholder="0" min="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">
                  Stock <span className="text-red-500">*</span>
                </label>
                <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)}
                  placeholder="0" min="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
              </div>
            </div>
            {discount > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
                <span className="text-green-600 font-black text-lg">{discount}% off</span>
                <span className="text-green-600 text-sm">— Customer ko dikhega</span>
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-12 h-6 rounded-full transition-colors relative ${form.isAssured ? 'bg-orange-500' : 'bg-gray-200'}`}
                onClick={() => set('isAssured', !form.isAssured)}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isAssured ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-700">Bellmak Assured</p>
                <p className="text-xs text-gray-400">Quality checked badge</p>
              </div>
            </label>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-black text-gray-800 mb-4">🖼️ Product Images (Max 5)</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setImageTab('gallery')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  imageTab === 'gallery'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                <ImageIcon size={15} /> Gallery se Upload
              </button>
              <button onClick={() => setImageTab('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  imageTab === 'url'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                <Link size={15} /> URL se Add
              </button>
            </div>

            {/* Gallery Upload */}
            {imageTab === 'gallery' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleFileUpload(e.target.files)}
                />
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    uploading
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/30'
                  }`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={28} className="animate-spin text-orange-500" />
                      <p className="text-sm font-bold text-orange-600">Upload ho raha hai...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={28} className="text-gray-300" />
                      <p className="text-sm font-bold text-gray-600">Click karo ya photos drag karo</p>
                      <p className="text-xs text-gray-400">JPG, PNG, WEBP · Max 5MB per image · Max 5 images</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* URL Input */}
            {imageTab === 'url' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addImageUrl()}
                  placeholder="Image URL paste karo (https://...)"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <button onClick={addImageUrl}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
                  <Plus size={16} /> Add
                </button>
              </div>
            )}

            {/* Preview */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-5 gap-3 mt-4">
                {form.images.map((img, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={img} alt="" className="w-full h-full object-contain rounded-xl border border-gray-100 bg-gray-50 p-1" />
                    <button onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">MAIN</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading || uploading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-200">
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Product add ho raha hai...</>
            ) : (
              '🚀 Product Publish Karo'
            )}
          </button>

        </div>
      </div>
    </div>
  )
}