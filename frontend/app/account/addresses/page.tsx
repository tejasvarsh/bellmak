'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { MapPin, Plus, Trash2, Edit3, Check, AlertCircle, ArrowLeft, Home, Briefcase, X } from 'lucide-react'
import Link from 'next/link'

interface Address {
  id: string; fullName: string; phone: string; line1: string; line2?: string
  city: string; state: string; pincode: string; type: string; isDefault: boolean
}
const EMPTY = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', type: 'HOME' }
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal']

export default function AddressesPage() {
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => { if (!isLoggedIn) { router.push('/login'); return }; fetchAddresses() }, [])

  const fetchAddresses = async () => {
    try { const res = await api.get('/address'); setAddresses(res.data.data || []) }
    catch { setAddresses([]) } finally { setLoading(false) }
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.fullName || !form.phone || !form.line1 || !form.city || !form.state || !form.pincode) { toast.error('Fill all required fields'); return }
    if (form.phone.length !== 10) { toast.error('Enter valid 10-digit phone'); return }
    if (form.pincode.length !== 6) { toast.error('Enter valid 6-digit pincode'); return }
    setSaving(true)
    try {
      if (editId) { await api.put(`/address/${editId}`, form); toast.success('Address updated!') }
      else { await api.post('/address', form); toast.success('Address added!') }
      setShowForm(false); setEditId(null); setForm(EMPTY); fetchAddresses()
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleEdit = (a: Address) => {
    setForm({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode, type: a.type })
    setEditId(a.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try { await api.delete(`/address/${id}`); setAddresses(p => p.filter(a => a.id !== id)); setConfirmDelete(null); toast.success('Deleted!') }
    catch { toast.error('Delete failed') } finally { setDeleting(null) }
  }

  const handleSetDefault = async (id: string) => {
    try { await api.put(`/address/${id}/default`); fetchAddresses(); toast.success('Default address set!') }
    catch { toast.error('Failed') }
  }

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY) }

  const input = (key: string, label: string, placeholder: string, opts?: { type?: string, maxLen?: number, numeric?: boolean }) => (
    <div>
      <label className="text-xs font-bold text-gray-500 block mb-1.5">{label}</label>
      <input type={opts?.type || 'text'} value={(form as any)[key]}
        onChange={e => { let v = e.target.value; if (opts?.numeric) v = v.replace(/\D/g, ''); if (opts?.maxLen) v = v.slice(0, opts.maxLen); f(key, v) }}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] transition-colors bg-gray-50 focus:bg-white font-medium" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#2874f0] mb-5 transition-colors">
          <ArrowLeft size={16} /> Back to Account
        </Link>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2"><MapPin className="text-[#2874f0]" size={20} /> Saved Addresses</h1>
            <p className="text-sm text-gray-400 mt-0.5">{addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#2874f0] text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add New
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-gray-900 text-base">{editId ? 'Edit Address' : 'Add New Address'}</h2>
              <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Type */}
            <div className="mb-5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Address Type</label>
              <div className="flex gap-2">
                {[{ v: 'HOME', l: 'Home', I: Home }, { v: 'WORK', l: 'Work', I: Briefcase }, { v: 'OTHER', l: 'Other', I: MapPin }].map(t => (
                  <button key={t.v} onClick={() => f('type', t.v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${form.type === t.v ? 'border-[#2874f0] bg-blue-50 text-[#2874f0]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                    <t.I size={14} /> {t.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {input('fullName', 'Full Name *', 'Recipient name')}
              {input('phone', 'Phone Number *', '10-digit mobile', { numeric: true, maxLen: 10 })}
            </div>
            <div className="mt-4">{input('line1', 'Address Line 1 *', 'Flat/House No., Building, Street')}</div>
            <div className="mt-4">{input('line2', 'Address Line 2', 'Area, Landmark (optional)')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {input('city', 'City *', 'City')}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">State *</label>
                <select value={form.state} onChange={e => f('state', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-[#2874f0] transition-colors bg-gray-50 focus:bg-white font-medium">
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {input('pincode', 'Pincode *', '6-digit', { numeric: true, maxLen: 6 })}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={cancelForm} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-[#fb641b] text-white font-black text-sm rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Check size={16} />{editId ? 'Update' : 'Save Address'}</>}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-gray-100" />)}</div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-xl font-black text-gray-800 mb-2">No addresses saved</h3>
            <p className="text-gray-400 mb-6">Add your delivery address to checkout faster</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-[#2874f0] text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${addr.isDefault ? 'border-[#2874f0] ring-2 ring-blue-50' : 'border-gray-100'}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${addr.isDefault ? 'bg-[#2874f0] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {addr.type === 'HOME' ? <Home size={18} /> : addr.type === 'WORK' ? <Briefcase size={18} /> : <MapPin size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-900 text-sm">{addr.fullName}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{addr.type}</span>
                        {addr.isDefault && <span className="text-xs bg-blue-50 text-[#2874f0] border border-blue-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Check size={10} /> Default</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">📞 {addr.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                    {!addr.isDefault && (
                      <button onClick={() => handleSetDefault(addr.id)} className="text-xs font-bold text-[#2874f0] hover:underline flex items-center gap-1">
                        <Check size={11} /> Set Default
                      </button>
                    )}
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => handleEdit(addr)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={() => setConfirmDelete(addr.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>

                  {confirmDelete === addr.id && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                      <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700 flex-1 font-medium">Delete this address?</p>
                      <button onClick={() => handleDelete(addr.id)} disabled={deleting === addr.id}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 disabled:opacity-50">
                        {deleting === addr.id ? 'Deleting...' : 'Delete'}
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 bg-white text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 border border-gray-200">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
