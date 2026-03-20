'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Package, Tag, IndianRupee, Box, Image as ImageIcon, Loader2, Trash2, Plus } from 'lucide-react'
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
  isActive: boolean
  isAssured: boolean
  specifications: Record<string, string>
}

export default function EditProductPage() {
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newSpecKey, setNewSpecKey] = useState('')
  const [newSpecVal, setNewSpecVal] = useState('')

  const [form, setForm] = useState<ProductForm>({
    title: '', description: '', price: '', mrp: '',
    stock: '', brand: '', category: '',
    images: [], isActive: true, isAssured: false,
    specifications: {}
  })

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    fetchProduct()
  }, [])

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/seller/products`)
      const products = res.data.data || []
      const product = products.find((p: any) => p.id === productId)
      if (!product) { toast.error('Product not found'); router.push('/seller/products'); return }

      setForm({
        title: product.title || '',
        description: product.description || '',
        price: String(product.price || ''),
        mrp: String(product.mrp || ''),
        stock: String(product.stock || ''),
        brand: product.brand || '',
        category: product.category?.name || '',
        images: product.images || [],
        isActive: product.isActive ?? true,
        isAssured: product.isAssured ?? false,
        specifications: product.specifications || {}
      })
    } catch {
      toast.error('Failed to load product')
      router.push('/seller/products')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    if (!form.price || !form.mrp) { toast.error('Price and MRP required'); return }
    if (Number(form.price) > Number(form.mrp)) { toast.error('Price cannot be more than MRP'); return }
    if (!form.stock) { toast.error('Stock required'); return }
    if (!form.category) { toast.error('Category required'); return }

    setSaving(true)
    try {
      await api.put(`/seller/products/${productId}`, {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
        brand: form.brand,
        category: form.category,
        images: form.images,
        isActive: form.isActive,
        isAssured: form.isAssured,
        specifications: form.specifications
      })
      toast.success('Product updated successfully!')
      router.push('/seller/products')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const addImage = () => {
    const url = newImageUrl.trim()
    if (!url) { toast.error('Image URL enter karo'); return }
    if (form.images.includes(url)) { toast.error('Ye image already added hai'); return }
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

  if (loading) return (
    <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-[#2874f0]" />
        <p className="text-gray-500 font-medium">Loading product...</p>
      </div>
    </div>
  )

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
              <h1 className="text-xl font-black text-gray-800">Edit Product</h1>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{form.title || 'Loading...'}</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#fb641b] hover:bg-orange-600 text-white font-black rounded-xl transition-all disabled:opacity-60 shadow-sm">
            {saving
              ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
              : <><Save size={16} /> Save Changes</>
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
                  placeholder="Product ke baare mein detail mein likho..."
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
                  placeholder="0"
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">MRP (₹) *</label>
                <input type="number" value={form.mrp}
                  onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                  placeholder="0"
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Stock (units) *</label>
                <input type="number" value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="0"
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] bg-gray-50 focus:bg-white transition-colors font-medium" />
              </div>
            </div>
            {discount > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-xl">
                <Tag size={12} /> {discount}% discount — Customer ko dikhega
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <ImageIcon size={18} className="text-[#2874f0]" />
              <h2 className="font-black text-gray-800">Product Images</h2>
              <span className="text-xs text-gray-400 font-medium">({form.images.length}/6)</span>
            </div>

            {/* Image previews */}
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

            {/* Add image URL */}
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
            <div className="flex items-center gap-2 mb-5">
              <Box size={18} className="text-[#2874f0]" />
              <h2 className="font-black text-gray-800">Specifications</h2>
              <span className="text-xs text-gray-400 font-medium">(optional)</span>
            </div>

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
            <h2 className="font-black text-gray-800 mb-4">Product Settings</h2>
            <div className="space-y-3">
              {[
                { key: 'isActive', label: 'Product Active', desc: 'Product customers ko dikhega' },
                { key: 'isAssured', label: 'BELLMAK Assured', desc: 'Quality guaranteed badge milega' },
              ].map(setting => (
                <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{setting.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{setting.desc}</p>
                  </div>
                  <button
                    onClick={() => setForm(f => ({ ...f, [setting.key]: !f[setting.key as keyof ProductForm] }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${(form as any)[setting.key] ? 'bg-[#2874f0]' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${(form as any)[setting.key] ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Save */}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 bg-[#fb641b] hover:bg-orange-600 text-white font-black rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm text-base">
            {saving
              ? <><Loader2 size={18} className="animate-spin" /> Saving Changes...</>
              : <><Save size={18} /> Save Changes</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}