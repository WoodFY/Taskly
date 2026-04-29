import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string>(localStorage.getItem('accessToken') ?? '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') ?? '')

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  function logout() {
    accessToken.value = ''
    refreshToken.value = ''
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  async function doLogout() {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    logout()
  }

  const isLoggedIn = () => !!accessToken.value

  return { accessToken, refreshToken, setTokens, logout, doLogout, isLoggedIn }
})
