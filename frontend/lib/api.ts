import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Har request mein token add karo
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bellmak_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// 401 aane pe refresh token se naya token lo
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Agar 401 aaya aur ye refresh request nahi hai
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Agar already refresh ho raha hai toh queue mein daalo
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Refresh token se naya access token lo
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        )

        const newToken = res.data.data.accessToken

        // Naya token save karo
        localStorage.setItem('bellmak_token', newToken)

        // Zustand store bhi update karo
        if (typeof window !== 'undefined') {
          const storeRaw = localStorage.getItem('bellmak-auth')
          if (storeRaw) {
            const store = JSON.parse(storeRaw)
            if (store?.state) {
              store.state.accessToken = newToken
              localStorage.setItem('bellmak-auth', JSON.stringify(store))
            }
          }
        }

        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)

      } catch (refreshError) {
        // Refresh bhi fail ho gaya — logout karo
        processQueue(refreshError, null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('bellmak_token')
          localStorage.removeItem('bellmak-auth')
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api