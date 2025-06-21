import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  name: string
  role: 'lawyer' | 'clerk' | 'admin'
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)

  // Actions
  const login = async (email: string, password: string) => {
    // TODO: Implement actual API call
    // Mock implementation
    user.value = {
      id: '1',
      email: email,
      name: 'John Doe',
      role: 'lawyer'
    }
    accessToken.value = 'mock-access-token'
    refreshToken.value = 'mock-refresh-token'
  }

  const logout = () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
  }

  const getAccessToken = async () => {
    // TODO: Check token expiry and refresh if needed
    return accessToken.value
  }

  return {
    // State
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    // Actions
    login,
    logout,
    getAccessToken
  }
})