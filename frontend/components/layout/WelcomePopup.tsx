'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function WelcomePopup() {
  const [open, setOpen] = useState(false)
  const [everShown, setEverShown] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('bellmak_popup_seen')
    if (!seen) {
      setOpen(true)
      setEverShown(true)
      sessionStorage.setItem('bellmak_popup_seen', '1')
    }
  }, [])

  const close = () => setOpen(false)

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative max-w-md w-full">
            <button
              onClick={close}
              className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg z-10 hover:scale-110 transition-transform"
            >
              <X size={18} className="text-gray-800" />
            </button>
            <img
              src="/bellmak-poster.jpg"
              alt="BELLMAK"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {!open && everShown && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-20 left-3 z-[90] w-12 h-12 rounded-full overflow-hidden border-2 border-[#F97316] shadow-lg hover:scale-110 transition-transform bg-white"
        >
          <img src="/bellmak-poster.jpg" alt="BELLMAK" className="w-full h-full object-cover" />
        </button>
      )}
    </>
  )
}