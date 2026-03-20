'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Package, ChevronRight } from 'lucide-react'

const STATUS_COLORS: any = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  RETURN_REQUESTED: 'bg-pink-100 text-pink-700',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    api.get('/orders').then(res => {
      setOrders(res.data.data || [])
    }).catch(() => {
      setOrders(DUMMY_ORDERS as any)
    }).finally(() => setLoading(false))
  }, [])

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0
  }).format(price)

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  )

  if (orders.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Package size={80} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet!</h2>
        <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
        <Link href="/" className="bg-primary text-white px-8 py-3 rounded-xl font-semibold">
          Shop Now
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Package className="text-primary" /> My Orders
        </h1>

        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm p-5">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-800">#{order.orderId}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                  {order.status?.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Items */}
              {order.items?.slice(0, 2).map((item: any) => (
                <div key={item.id} className="flex gap-3 mb-3">
                  <img
                    src={item.image || item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                    alt={item.title}
                    className="w-14 h-14 rounded-xl object-contain bg-gray-50 p-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}

              {order.items?.length > 2 && (
                <p className="text-xs text-gray-400 mb-3">+{order.items.length - 2} more items</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                </div>
                <Link
                  href={`/account/orders/${order.orderId}`}
                  className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline"
                >
                  View Details <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const DUMMY_ORDERS = [
  {
    id: '1', orderId: 'BLM-2024-XY123', status: 'DELIVERED',
    createdAt: '2024-01-15', totalAmount: 89999,
    items: [
      { id: '1', title: 'Samsung Galaxy S23 Ultra', quantity: 1, price: 89999, image: 'https://via.placeholder.com/60?text=S23' }
    ]
  },
  {
    id: '2', orderId: 'BLM-2024-AB456', status: 'SHIPPED',
    createdAt: '2024-01-20', totalAmount: 24990,
    items: [
      { id: '2', title: 'Sony WH-1000XM5 Headphones', quantity: 1, price: 24990, image: 'https://via.placeholder.com/60?text=Sony' }
    ]
  }
]