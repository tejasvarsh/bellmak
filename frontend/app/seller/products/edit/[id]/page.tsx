'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Save, Package, Tag, IndianRupee,
  Box, Image as ImageIcon, Loader2, Trash2,
  Plus, Upload, X, ToggleLeft, ToggleRight
} from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  'Electronics','Mobile Phones','Laptops','Fashion','Men Clothing',
  'Women Clothing','Home & Kitchen','Beauty & Health','Sports & Fitness',
  'Books','Toys & Games','Grocery','Jewellery','Furniture','Automotive'
]

interface ProductForm {
  title: string; description: string; price: string; mrp: string
  stock: string; brand: string; category: string
  images: string[]; isActive: boolean; specifications: Record<string, string>
}

export default function EditProductPage() {
  const { isLoggedIn }  = useAuthStore()
  const router           = useRouter()
  const params           = useParams()
  const productId        = params.id as string
  const fileRef          = useRef<HTMLInputElement>(null)

  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [dragOver,    setDragOver]    = useState(false)
  const [newSpecKey,  setNewSpecKey]  = useState('')
  const [newSpecVal,  setNewSpecVal]  = useState('')

  const [form, setForm] = useState<ProductForm>({
    title:'', description:'', price:'', mrp:'',
    stock:'', brand:'', category:'',
    images:[], isActive:true, specifications:{}
  })

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    fetchProduct()
  }, [])

  const fetchProduct = async () => {
    try {
      const res = await api.get('/seller/products')
      const products = res.data.data || []
      const product  = products.find((p: any) => p.id === productId)
      if (!product) { toast.error('Product not found'); router.push('/seller/products'); return }

      setForm({
        title:          product.title || '',
        description:    product.description || '',
        price:          String(product.price || ''),
        mrp:            String(product.mrp || ''),
        stock:          String(product.stock || ''),
        brand:          product.brand || '',
        category:       product.category?.name || '',
        images:         product.images || [],
        isActive:       product.isActive ?? true,
        specifications: product.specifications || {}
      })
    } catch {
      toast.error('Failed to load product')
      router.push('/seller/products')
    } finally { setLoading(false) }
  }

  // ✅ Upload from gallery
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const remaining = 6 - form.images.length
    if (remaining <= 0) { toast.error('Maximum 6 images allowed'); return }

    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)
    const uploaded: string[] = []

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) { toast.error(`${file.name} image nahi hai`); continue }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} 5MB se bada hai`); continue }
      try {
        const formData = new FormData()
        formData.append('image', file)
        const res = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (res.data.data?.url) uploaded.push(res.data.data.url)
        else uploaded.push(URL.createObjectURL(file))
      } catch {
        uploaded.push(URL.createObjectURL(file))
      }
    }

    if (uploaded.length > 0) {
      setForm(f => ({ ...f, images: [...f.images, ...uploaded] }))
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded!`)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const removeImage = (idx: number) =>
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))

  const moveImage = (from: number, to: number) => {
    const imgs = [...form.images]
    const [moved] = imgs.splice(from, 1)
    imgs.splice(to, 0, moved)
    setForm(f => ({ ...f, images: imgs }))
  }

  const addSpec = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) { toast.error('Key aur value dono bharo'); return }
    setForm(f => ({ ...f, specifications: { ...f.specifications, [newSpecKey.trim()]: newSpecVal.trim() } }))
    setNewSpecKey(''); setNewSpecVal('')
  }

  const removeSpec = (key: string) => {
    setForm(f => { const s = { ...f.specifications }; delete s[key]; return { ...f, specifications: s } })
  }

  const handleSave = async () => {
    if (!form.title.trim())                    { toast.error('Title required'); return }
    if (!form.price || !form.mrp)              { toast.error('Price aur MRP required'); return }
    if (Number(form.price) > Number(form.mrp)) { toast.error('Price MRP se zyada nahi ho sakta'); return }
    if (!form.stock)                           { toast.error('Stock required'); return }
    if (!form.category)                        { toast.error('Category select karo'); return }

    setSaving(true)
    try {
      await api.put(`/seller/products/${productId}`, {
        title:          form.title,
        description:    form.description,
        price:          Number(form.price),
        mrp:            Number(form.mrp),
        stock:          Number(form.stock),
        brand:          form.brand,
        category:       form.category,
        images:         form.images,
        isActive:       form.isActive,
        specifications: form.specifications
        // ❌ isAssured NOT sent by seller — only admin can change
      })
      toast.success('Product updated! ✅')
      router.push('/seller/products')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update product')
    } finally { setSaving(false) }
  }

  const discount = form.price && form.mrp
    ? Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100) : 0

  const inputCls = "w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-gray-50 focus:bg-white transition-all font-medium"
  const labelCls = "text-xs font-black text-gray-500 uppercase tracking-wider block mb-2"

  if (loading) return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="text-gray-500 font-medium">Loading product...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/seller/products"
              className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-900">Edit Product</h1>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{form.title || 'Loading...'}</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl disabled:opacity-60 shadow-md shadow-orange-200 transition-all">
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
              : <><Save size={15} /> Save Changes</>}
          </button>
        </div>

        <div className="space-y-4">

          {/* Basic Info */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <Package size={16} className="text-blue-600" />
              </div>
              <h2 className="font-black text-gray-900">Basic Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Product Title *</label>
                <input type="text" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Samsung Galaxy S24 Ultra 256GB"
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Product ke baare mein detail mein likho..."
                  rows={4} className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Brand</label>
                  <input type="text" value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    placeholder="e.g. Samsung, Nike" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Category *</label>
                  <select value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className={inputCls}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
                <IndianRupee size={16} className="text-green-600" />
              </div>
              <h2 className="font-black text-gray-900">Pricing & Stock</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Selling Price (₹) *</label>
                <input type="number" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0" min="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>MRP (₹) *</label>
                <input type="number" value={form.mrp}
                  onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                  placeholder="0" min="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Stock (units) *</label>
                <input type="number" value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="0" min="0" className={inputCls} />
              </div>
            </div>
            {discount > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-xl">
                <Tag size={12} /> {discount}% discount — Customer ko dikhega
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                  <ImageIcon size={16} className="text-purple-600" />
                </div>
                <h2 className="font-black text-gray-900">Product Images</h2>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {form.images.length}/6
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-5">Gallery se photos upload karo. Pehli image main photo hogi.</p>

            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {form.images.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50">
                    <img src={url} alt={`Product ${idx + 1}`}
                      className="w-full h-full object-contain p-2"
                      onError={e => { (e.target as any).src = 'https://placehold.co/150?text=Error' }} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {idx > 0 && (
                        <button onClick={() => moveImage(idx, idx - 1)}
                          className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-orange-500 hover:text-white transition-colors text-xs font-black">
                          ←
                        </button>
                      )}
                      <button onClick={() => removeImage(idx)}
                        className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                        <Trash2 size={12} />
                      </button>
                      {idx < form.images.length - 1 && (
                        <button onClick={() => moveImage(idx, idx + 1)}
                          className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-orange-500 hover:text-white transition-colors text-xs font-black">
                          →
                        </button>
                      )}
                    </div>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded-lg font-black">
                        Main Photo
                      </span>
                    )}
                  </div>
                ))}
                {form.images.length < 6 && (
                  <button onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-orange-400 bg-gray-50 hover:bg-orange-50 flex flex-col items-center justify-center gap-2 transition-all group">
                    <Plus size={20} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                    <span className="text-[10px] font-bold text-gray-300 group-hover:text-orange-400">Add More</span>
                  </button>
                )}
              </div>
            )}

            {form.images.length === 0 && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/50'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dragOver ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Upload size={24} className={dragOver ? 'text-orange-500' : 'text-gray-400'} />
                </div>
                <div className="text-center">
                  <p className="font-black text-gray-700">Gallery se photos upload karo</p>
                  <p className="text-xs text-gray-400 mt-1">Drag & drop ya click karo</p>
                </div>
                <div className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black">
                  <ImageIcon size={15} /> Gallery Kholao
                </div>
              </div>
            )}

            {form.images.length > 0 && form.images.length < 6 && (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 hover:border-orange-400 rounded-2xl text-sm font-bold text-gray-500 hover:text-orange-500 hover:bg-orange-50/50 transition-all disabled:opacity-60">
                {uploading
                  ? <><Loader2 size={15} className="animate-spin text-orange-500" /> Uploading...</>
                  : <><Upload size={15} /> Aur photos add karo ({6 - form.images.length} remaining)</>}
              </button>
            )}

            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handleFileUpload(e.target.files)} />
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-cyan-50 rounded-xl flex items-center justify-center">
                <Box size={16} className="text-cyan-600" />
              </div>
              <h2 className="font-black text-gray-900">Specifications</h2>
              <span className="text-xs text-gray-400">(optional)</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">RAM, Storage, Color jaise details</p>

            {Object.entries(form.specifications).length > 0 && (
              <div className="space-y-2 mb-4">
                {Object.entries(form.specifications).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-black text-gray-500 w-28 flex-shrink-0">{key}</span>
                    <span className="text-sm font-medium text-gray-800 flex-1">{val}</span>
                    <button onClick={() => removeSpec(key)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input type="text" value={newSpecKey} onChange={e => setNewSpecKey(e.target.value)}
                placeholder="Key (e.g. RAM)"
                className="w-32 px-3 py-2.5 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-orange-400 bg-gray-50 font-medium" />
              <input type="text" value={newSpecVal} onChange={e => setNewSpecVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSpec()}
                placeholder="Value (e.g. 8GB)"
                className="flex-1 px-3 py-2.5 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-orange-400 bg-gray-50 font-medium" />
              <button onClick={addSpec}
                className="px-4 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors flex items-center gap-1.5">
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Settings — Only isActive, NO isAssured */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-black text-gray-900 mb-4">Product Settings</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="text-sm font-black text-gray-800">Product Active</p>
                <p className="text-xs text-gray-400 mt-0.5">Product customers ko dikhega</p>
              </div>
              <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-orange-500' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button onClick={handleSave} disabled={saving || uploading}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-orange-200 text-base">
            {saving
              ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
              : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}