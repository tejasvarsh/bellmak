'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Package, Tag, IndianRupee, Box, Image as ImageIcon, Loader2, Trash2, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  'Electronics', 'Mobile Phones', 'Laptops', 'Fashion', 'Men Clothing',
  'Women Clothing', 'Home & Kitchen', 'Beauty & Health', 'Sports & Fitness',
  'Books', 'Toys & Games', 'Grocery', 'Jewellery', 'Furniture', 'Automotive'
]

interface ProductForm {
  title: string
  description: string
  price: string
  mrp: string
  stock: string
  brand: string
  category: string
  images: string[]
  isAssured: boolean
  specifications: Record<string, string>
}

export default function NewProductPage() {
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newSpecKey, setNewSpecKey] = useState('')
  const [newSpecVal, setNewSpecVal] = useState('')

  const [form, setForm] = useState<ProductForm>({
    title: '', description: '', price: '', mrp: '',
    stock: '', brand: '', category: '',
    images: [], isAssured: false, specifications: {}
  })

  useEffect(() => {
    if (!isLoggedIn) router.push('/login')
  }, [isLoggedIn])

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    if (!form.price || !form.mrp) { toast.error('Price aur MRP required hai'); return }
    if (Number(form.price) > Number(form.mrp)) { toast.error('Price MRP se zyada nahi ho sakta'); return }
    if (!form.stock) { toast.error('Stock required hai'); return }
    if (!form.category) { toast.error('Category select karo'); return }
    if (form.images.length === 0) { toast.error('Kam se kam 1 image add karo'); return }

    setSaving(true)
    try {
      await api.post('/seller/products', {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
        brand: form.brand,
        category: form.category,
        images: form.images,
        isAssured: form.isAssured,
        specifications: form.specifications
      })
      toast.success('Product created successfully! 🎉')
      router.push('/seller/products')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  const addImage = () => {
    const url = newImageUrl.trim()
    if (!url) { toast.error('Image URL enter karo'); return }
    if (form.images.includes(url)) { toast.error('Ye image already add hai'); return }
    if (form.images.length >= 6) { toast.error('Maximum 6 images allowed'); return }
    setForm(f => ({ ...f, images: [...f.images, url] }))
    setNewImageUrl('')
  }

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }

  const addSpec = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) { toast.error('Key aur value dono bharo'); return }
    setForm(f => ({ ...f, specifications: { ...f.specifications, [newSpecKey.trim()]: newSpecVal.trim() } }))
    setNewSpecKey('')
    setNewSpecVal('')
  }

  const removeSpec = (key: string) => {
    setForm(f => {
      const specs = { ...f.specifications }
      delete specs[key]
      return { ...f, specifications: specs }
    })
  }

  const discount = form.price && form.mrp
    ? Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/seller/products"
              className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-800">Add New Product</h1>
              <p className="text-xs text-gray-400 mt-0.5">Sari details sahi se bharo</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#fb641b] hover:bg-orange-600 text-white font-black rounded-xl transition-all disabled:opacity-60 shadow-sm">
            {saving
              ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
              : <><Save size={16} /> Publish Product</>
            }
          </button>
        </div>

        <div className="space-y-4">

          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Package size={18} className="text-[#2874f0]" />
              <h2 className="font-black text-gray-800">Basic Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Product Title *</label>
                <input type="text" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Samsung Galaxy S24 Ultra 256GB"
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Description</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Product ke baare mein detail mein likho — features, material, size, etc."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Brand</label>
                  <input type="text" value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    placeholder="e.g. Samsung, Nike, Sony"
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Category *</label>
                  <select value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium">
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <IndianRupee size={18} className="text-[#2874f0]" />
              <h2 className="font-black text-gray-800">Pricing & Stock</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Selling Price (₹) *</label>
                <input type="number" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0" min="0"
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">MRP (₹) *</label>
                <input type="number" value={form.mrp}
                  onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                  placeholder="0" min="0"
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Stock (units) *</label>
                <input type="number" value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="0" min="0"
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
              </div>
            </div>
            {discount > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-xl">
                <Tag size={12} /> {discount}% discount — Customer ko dikhega
              </div>
            )}
            {form.price && form.mrp && Number(form.price) > Number(form.mrp) && (
              <div className="mt-3 inline-flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-xl">
                ⚠️ Price MRP se zyada nahi ho sakta
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={18} className="text-[#2874f0]" />
              <h2 className="font-black text-gray-800">Product Images</h2>
              <span className="text-xs text-gray-400 font-medium">({form.images.length}/6)</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">Pehli image main photo hogi. Minimum 1 image required.</p>

            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {form.images.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50">
                    <img src={url} alt={`Product ${idx + 1}`}
                      className="w-full h-full object-contain p-2"
                      onError={e => { (e.target as any).src = 'https://via.placeholder.com/150?text=Invalid' }} />
                    <button onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={11} />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-[#2874f0] text-white px-1.5 py-0.5 rounded-md font-bold">Main</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {form.images.length < 6 && (
              <div className="flex gap-2">
                <input type="url" value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addImage()}
                  placeholder="Image URL paste karo (https://...)"
                  className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
                <button onClick={addImage}
                  className="px-4 py-3 bg-[#2874f0] text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                  <Plus size={16} /> Add
                </button>
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Box size={18} className="text-[#2874f0]" />
              <h2 className="font-black text-gray-800">Specifications</h2>
              <span className="text-xs text-gray-400 font-medium">(optional)</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">RAM, Storage, Color jaise details add karo</p>

            {Object.entries(form.specifications).length > 0 && (
              <div className="space-y-2 mb-4">
                {Object.entries(form.specifications).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 w-32 flex-shrink-0">{key}</span>
                    <span className="text-sm font-medium text-gray-800 flex-1">{val}</span>
                    <button onClick={() => removeSpec(key)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input type="text" value={newSpecKey}
                onChange={e => setNewSpecKey(e.target.value)}
                placeholder="e.g. RAM"
                className="w-32 px-3 py-2.5 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
              <input type="text" value={newSpecVal}
                onChange={e => setNewSpecVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSpec()}
                placeholder="e.g. 8GB"
                className="flex-1 px-3 py-2.5 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
              <button onClick={addSpec}
                className="px-4 py-2.5 bg-[#2874f0] text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                <Plus size={15} /> Add
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={18} className="text-[#2874f0]" />
              <h2 className="font-black text-gray-800">Product Settings</h2>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">BELLMAK Assured</p>
                <p className="text-xs text-gray-400 mt-0.5">Quality guaranteed badge milega</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, isAssured: !f.isAssured }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.isAssured ? 'bg-[#2874f0]' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isAssured ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Bottom Publish Button */}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 bg-[#fb641b] hover:bg-orange-600 text-white font-black rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm text-base">
            {saving
              ? <><Loader2 size={18} className="animate-spin" /> Publishing...</>
              : <><Sparkles size={18} /> Publish Product</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}