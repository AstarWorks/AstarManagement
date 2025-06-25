import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  name: string
  role: 'lawyer' | 'clerk' | 'admin'
  permissions: string[]
  avatar?: string
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
      role: 'lawyer',
      permissions: [
        'matter.create',
        'matter.read',
        'matter.update',
        'document.create',
        'document.read',
        'reports.view'
      ]
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

  // Permission helpers
  const hasPermission = (permission: string): boolean => {
    return user.value?.permissions.includes(permission) || false
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasRole = (role: string): boolean => {
    return user.value?.role === role
  }

  return {
    // State
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    permissions: computed(() => user.value?.permissions || []),
    // Actions
    login,
    logout,
    getAccessToken,
    // Permission helpers
    hasPermission,
    hasAnyPermission,
    hasRole
  }
})