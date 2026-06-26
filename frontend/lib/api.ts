import axios from 'axios'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// Har request mein token add karo
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bellmak_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 aane pe refresh token se naya token lo
let isRefreshing = false
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!))
  failedQueue = []
}

api.interceptors.response.use(
  res => res,
  async (error) => {
    const orig = error.config

    // Sirf 401 pe aur sirf ek baar retry karo
    if (error.response?.status !== 401 || orig._retry) {
      return Promise.reject(error)
    }

    // Refresh route pe 401 aaye toh logout karo — loop mat karo
    if (orig.url?.includes('/auth/refresh-token')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bellmak_token')
        localStorage.removeItem('bellmak-auth')
        localStorage.removeItem('bellmak-cart')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Queue mein daalo agar already refresh ho raha hai
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        orig.headers.Authorization = `Bearer ${token}`
        return api(orig)
      })
    }

    orig._retry = true
    isRefreshing = true

    try {
      const res = await axios.post(`${BASE}/auth/refresh-token`, {}, { withCredentials: true })
      const newToken = res.data.data.accessToken

      localStorage.setItem('bellmak_token', newToken)

      // Zustand store mein bhi update karo
      const storeRaw = localStorage.getItem('bellmak-auth')
      if (storeRaw) {
        try {
          const store = JSON.parse(storeRaw)
          if (store?.state) {
            store.state.token = newToken
            localStorage.setItem('bellmak-auth', JSON.stringify(store))
          }
        } catch {}
      }

      processQueue(null, newToken)
      orig.headers.Authorization = `Bearer ${newToken}`
      return api(orig)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bellmak_token')
        localStorage.removeItem('bellmak-auth')
        window.location.href = '/login'
      }
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default api