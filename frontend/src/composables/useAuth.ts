import type { LoginCredentials, TwoFactorCredentials, User } from '@/types/auth'

/**
 * Authentication Composable
 * 
 * Provides reactive authentication state and methods for login, logout,
 * token management, and secure storage using httpOnly cookies.
 */
export function useAuth() {
  const authStore = useAuthStore()
  
  // Reactive state
  const user = computed(() => authStore.user)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isLoading = computed(() => authStore.isLoading)
  const error = computed(() => authStore.error)
  const pendingTwoFactor = computed(() => authStore.pendingTwoFactor)
  const permissions = computed(() => authStore.permissions)
  
  // CSRF token management
  const csrfToken = useCookie('csrf-token', {
    default: () => '',
    httpOnly: false, // CSRF token needs to be accessible to JavaScript
    secure: true,
    sameSite: 'strict'
  })
  
  // Session management
  const sessionId = useCookie('session-id', {
    default: () => '',
    httpOnly: true, // Secure session ID
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
  
  // Remember me preference
  const rememberMe = useCookie('remember-me', {
    default: () => false,
    httpOnly: false,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
  
  /**
   * Initialize CSRF protection
   */
  const initializeCSRF = async () => {
    try {
      const response = await $fetch<{ token: string }>('/api/auth/csrf')
      csrfToken.value = response.token
      
      // Add CSRF token to meta tag for axios interceptor
      const metaTag = document.querySelector('meta[name="csrf-token"]')
      if (metaTag) {
        metaTag.setAttribute('content', response.token)
      } else {
        const newMetaTag = document.createElement('meta')
        newMetaTag.name = 'csrf-token'
        newMetaTag.content = response.token
        document.head.appendChild(newMetaTag)
      }
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error)
    }
  }
  
  /**
   * Login with email and password
   */
  const login = async (credentials: LoginCredentials) => {
    await authStore.login(credentials)
    
    // Update cookie preferences
    if (credentials.rememberMe) {
      rememberMe.value = true
    }
  }
  
  /**
   * Verify two-factor authentication code
   */
  const verify2FA = async (credentials: TwoFactorCredentials) => {
    await authStore.verify2FA(credentials)
  }
  
  /**
   * Logout user and clear all auth data
   */
  const logout = async () => {
    await authStore.logout()
    
    // Clear auth-related cookies
    sessionId.value = ''
    csrfToken.value = ''
    
    // Clear remember me if not persistent
    if (!rememberMe.value) {
      const lastEmailCookie = useCookie('last-email')
      lastEmailCookie.value = ''
    }
  }
  
  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return authStore.hasPermission(permission)
  }
  
  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return authStore.hasAnyPermission(permissions)
  }
  
  /**
   * Check if user has all specified permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return authStore.hasAllPermissions(permissions)
  }
  
  /**
   * Check if user has specific role
   */
  const hasRole = (role: string): boolean => {
    return authStore.hasRole(role)
  }
  
  /**
   * Refresh authentication token
   */
  const refreshToken = async () => {
    await authStore.refreshToken()
  }
  
  /**
   * Check session validity and restore auth state
   */
  const restoreSession = async () => {
    // Only attempt restore if we have a session ID
    if (!sessionId.value || !authStore.user) {
      return false
    }
    
    try {
      // Validate session with backend
      const response = await $fetch<{ user: User; valid: boolean }>('/api/auth/session/validate', {
        method: 'POST',
        body: { sessionId: sessionId.value }
      })
      
      if (response.valid && response.user) {
        // Restore user data
        authStore.user = response.user
        authStore.isAuthenticated = true
        authStore.sessionId = sessionId.value
        authStore.lastActivity = Date.now()
        
        return true
      } else {
        // Invalid session, clear data
        await logout()
        return false
      }
    } catch (error) {
      console.warn('Session validation failed:', error)
      await logout()
      return false
    }
  }
  
  /**
   * Setup automatic token refresh
   */
  const setupTokenRefresh = () => {
    return authStore.startTokenRefreshTimer()
  }
  
  /**
   * Clear authentication error
   */
  const clearError = () => {
    authStore.clearError()
  }
  
  /**
   * Update user activity timestamp
   */
  const updateActivity = () => {
    authStore.updateActivity()
  }
  
  /**
   * Get time remaining in current session
   */
  const getSessionTimeRemaining = () => {
    return authStore.sessionTimeRemaining
  }
  
  /**
   * Send password reset email
   */
  const forgotPassword = async (email: string) => {
    try {
      await $fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email }
      })
      return { success: true }
    } catch (error: any) {
      throw new Error(error.data?.message || 'Failed to send password reset email')
    }
  }
  
  /**
   * Reset password with token
   */
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword }
      })
      return { success: true }
    } catch (error: any) {
      throw new Error(error.data?.message || 'Failed to reset password')
    }
  }
  
  /**
   * Change user password
   */
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await $fetch('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword }
      })
      return { success: true }
    } catch (error: any) {
      throw new Error(error.data?.message || 'Failed to change password')
    }
  }
  
  /**
   * Enable two-factor authentication
   */
  const enableTwoFactor = async () => {
    try {
      const response = await $fetch<{ qrCode: string; secret: string; backupCodes: string[] }>('/api/auth/2fa/enable')
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Failed to enable two-factor authentication')
    }
  }
  
  /**
   * Disable two-factor authentication
   */
  const disableTwoFactor = async (code: string) => {
    try {
      await $fetch('/api/auth/2fa/disable', {
        method: 'POST',
        body: { code }
      })
      return { success: true }
    } catch (error: any) {
      throw new Error(error.data?.message || 'Failed to disable two-factor authentication')
    }
  }
  
  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    pendingTwoFactor,
    permissions,
    
    // Actions
    login,
    verify2FA,
    logout,
    refreshToken,
    restoreSession,
    
    // Permission helpers
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    
    // Utility functions
    initializeCSRF,
    setupTokenRefresh,
    clearError,
    updateActivity,
    getSessionTimeRemaining,
    
    // Password management
    forgotPassword,
    resetPassword,
    changePassword,
    
    // Two-factor authentication
    enableTwoFactor,
    disableTwoFactor
  }
}