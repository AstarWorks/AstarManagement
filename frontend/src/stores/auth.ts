import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { User, LoginCredentials, TwoFactorCredentials, UserProfile } from '~/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  pendingTwoFactor: boolean
  isLoading: boolean
  error: string | null
  sessionId: string | null
  lastActivity: number
  refreshPromise: Promise<void> | null
}

interface AuthResponse {
  user: User
  requiresTwoFactor?: boolean
  sessionId: string
  expiresAt: number
}

interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

// RBAC Permission mappings
const ROLE_PERMISSIONS: Record<string, string[]> = {
  lawyer: [
    'matter.create',
    'matter.read',
    'matter.update',
    'matter.delete',
    'document.create',
    'document.read',
    'document.update',
    'document.delete',
    'client.create',
    'client.read',
    'client.update',
    'reports.view',
    'reports.export',
    'billing.read',
    'billing.create',
    'settings.read'
  ],
  clerk: [
    'matter.read',
    'matter.update',
    'document.create',
    'document.read',
    'document.update',
    'client.read',
    'client.update',
    'reports.view',
    'billing.read'
  ],
  client: [
    'matter.read',
    'document.read',
    'communication.read',
    'communication.create'
  ]
}

// Persistent state for remember me functionality
const useAuthPersistence = () => {
  const rememberMe = useStorage('auth-remember-me', false)
  const lastEmail = useStorage('auth-last-email', '')
  
  return {
    rememberMe,
    lastEmail
  }
}

export const useAuthStore = defineStore('auth', () => {
  // Core state
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const pendingTwoFactor = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const sessionId = ref<string | null>(null)
  const lastActivity = ref(Date.now())
  const refreshPromise = ref<Promise<void> | null>(null)
  
  // Persistent state
  const { rememberMe, lastEmail } = useAuthPersistence()
  
  // Computed properties
  const permissions = computed(() => {
    if (!user.value) return []
    return user.value.permissions || ROLE_PERMISSIONS[user.value.role] || []
  })
  
  const userDisplayName = computed(() => {
    if (!user.value) return ''
    return user.value.profile?.firstName 
      ? `${user.value.profile.firstName} ${user.value.profile.lastName}`
      : user.value.name
  })
  
  const sessionTimeRemaining = computed(() => {
    if (!isAuthenticated.value) return 0
    const inactiveTime = Date.now() - lastActivity.value
    const maxInactive = 30 * 60 * 1000 // 30 minutes
    return Math.max(0, maxInactive - inactiveTime)
  })
  
  // Actions
  const login = async (credentials: LoginCredentials): Promise<void> => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      if (response.requiresTwoFactor) {
        pendingTwoFactor.value = true
        sessionId.value = response.sessionId
        
        // Store email for 2FA flow
        lastEmail.value = credentials.email
      } else {
        // Complete login
        user.value = response.user
        isAuthenticated.value = true
        sessionId.value = response.sessionId
        lastActivity.value = Date.now()
        
        // Handle remember me
        if (credentials.rememberMe) {
          rememberMe.value = true
          lastEmail.value = credentials.email
        }
      }
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } }
      error.value = errorData.data?.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const verify2FA = async (credentials: TwoFactorCredentials): Promise<void> => {
    if (!pendingTwoFactor.value || !sessionId.value) {
      throw new Error('Two-factor verification not initiated')
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch<AuthResponse>('/api/auth/verify-2fa', {
        method: 'POST',
        body: {
          code: credentials.code,
          sessionId: sessionId.value,
          trustDevice: credentials.trustDevice
        }
      })
      
      // Complete authentication
      user.value = response.user
      isAuthenticated.value = true
      pendingTwoFactor.value = false
      lastActivity.value = Date.now()
      
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } }
      error.value = errorData.data?.message || 'Two-factor verification failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const logout = async (): Promise<void> => {
    isLoading.value = true
    
    try {
      if (sessionId.value) {
        await $fetch('/api/auth/logout', {
          method: 'POST',
          body: { sessionId: sessionId.value }
        })
      }
    } catch (err) {
      // Ignore logout errors, continue with local cleanup
      console.warn('Logout request failed:', err)
    } finally {
      // Clear all auth state
      user.value = null
      isAuthenticated.value = false
      pendingTwoFactor.value = false
      sessionId.value = null
      error.value = null
      refreshPromise.value = null
      lastActivity.value = 0
      
      // Clear remember me if not persistent
      if (!rememberMe.value) {
        lastEmail.value = ''
      }
      
      isLoading.value = false
      
      // Navigate to login page
      await navigateTo('/login')
    }
  }
  
  const refreshToken = async (): Promise<void> => {
    // Prevent concurrent refresh attempts
    if (refreshPromise.value) {
      return refreshPromise.value
    }
    
    refreshPromise.value = (async () => {
      try {
        const response = await $fetch<AuthResponse>('/api/auth/refresh', {
          method: 'POST',
          body: { sessionId: sessionId.value }
        })
        
        // Update user data and session
        user.value = response.user
        sessionId.value = response.sessionId
        lastActivity.value = Date.now()
        
      } catch (err: unknown) {
        // Refresh failed, logout user
        console.warn('Token refresh failed:', err)
        await logout()
        throw err
      } finally {
        refreshPromise.value = null
      }
    })()
    
    return refreshPromise.value
  }
  
  const updateProfile = async (profile: Partial<UserProfile>): Promise<void> => {
    if (!user.value) throw new Error('User not authenticated')
    
    isLoading.value = true
    error.value = null
    
    try {
      const updatedUser = await $fetch<User>('/api/auth/profile', {
        method: 'PATCH',
        body: profile
      })
      
      user.value = updatedUser
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } }
      error.value = errorData.data?.message || 'Profile update failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const updateActivity = (): void => {
    if (isAuthenticated.value) {
      lastActivity.value = Date.now()
    }
  }
  
  const clearError = (): void => {
    error.value = null
  }
  
  // Permission helpers
  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission)
  }
  
  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some(permission => hasPermission(permission))
  }
  
  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every(permission => hasPermission(permission))
  }
  
  const hasRole = (role: string): boolean => {
    return user.value?.role === role
  }
  
  const canAccessRoute = (routePermissions?: string[]): boolean => {
    if (!routePermissions || routePermissions.length === 0) return true
    return hasAnyPermission(routePermissions)
  }
  
  // Auto-refresh token before expiry
  const startTokenRefreshTimer = () => {
    // Refresh token 5 minutes before expiry
    const refreshInterval = 25 * 60 * 1000 // 25 minutes
    
    const timer = setInterval(async () => {
      if (isAuthenticated.value && !pendingTwoFactor.value) {
        try {
          await refreshToken()
        } catch (err) {
          // Token refresh failed, user will be logged out
          clearInterval(timer)
        }
      } else {
        clearInterval(timer)
      }
    }, refreshInterval)
    
    // Clear timer on logout
    return timer
  }
  
  return {
    // State
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    pendingTwoFactor: readonly(pendingTwoFactor),
    isLoading: readonly(isLoading),
    error: readonly(error),
    sessionId: readonly(sessionId),
    permissions,
    userDisplayName,
    sessionTimeRemaining,
    
    // Persistent state
    rememberMe,
    lastEmail,
    
    // Actions
    login,
    verify2FA,
    logout,
    refreshToken,
    updateProfile,
    updateActivity,
    clearError,
    
    // Permission helpers
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canAccessRoute,
    
    // Utilities
    startTokenRefreshTimer
  }
})