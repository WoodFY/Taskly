import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 10000
})

let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

http.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  return config
})

http.interceptors.response.use(
  res => res.data,
  async err => {
    const original = err.config
    const authStore = useAuthStore()

    if (err.response?.status === 401 && !original._retry && authStore.refreshToken) {
      if (isRefreshing) {
        return new Promise(resolve => {
          pendingQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(http(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const res: any = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${authStore.refreshToken}` } }
        )
        const { accessToken, refreshToken } = res.data
        authStore.setTokens(accessToken, refreshToken)
        pendingQueue.forEach(cb => cb(accessToken))
        pendingQueue = []
        original.headers.Authorization = `Bearer ${accessToken}`
        return http(original)
      } catch {
        authStore.logout()
        router.push('/login')
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err.response?.data ?? err)
  }
)

export default http
