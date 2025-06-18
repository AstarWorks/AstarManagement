/**
 * Authentication context provider
 * 
 * Provides:
 * - Global authentication state management
 * - User session tracking
 * - Automatic token refresh scheduling
 * - Authentication state persistence
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { login, logout, isAuthenticated, getCurrentAuthenticatedUser, type LoginRequest, type UserInfoResponse } from './auth.service'
import { scheduleTokenRefresh, clearTokens, hasTokens } from './token.service'
import { handleApiError, type BoardError } from '../error/error.handler'

interface AuthState {
  isAuthenticated: boolean
  user: UserInfoResponse | null
  isLoading: boolean
  error: BoardError | null
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null
  })

  // Check initial authentication state
  const checkAuthState = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      if (!hasTokens()) {
        setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null
        })
        return
      }
      
      const [authStatus, user] = await Promise.all([
        isAuthenticated(),
        getCurrentAuthenticatedUser()
      ])
      
      setState({
        isAuthenticated: authStatus,
        user,
        isLoading: false,
        error: null
      })
      
      // Schedule token refresh if authenticated
      if (authStatus) {
        scheduleTokenRefresh(() => {
          // Refresh user data after token refresh
          refreshUser()
        })
      }
    } catch (error) {
      console.error('Failed to check auth state:', error)
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: handleApiError(error)
      })
    }
  }, [])

  // Login function
  const handleLogin = useCallback(async (credentials: LoginRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const authResponse = await login(credentials)
      
      setState({
        isAuthenticated: true,
        user: authResponse.user,
        isLoading: false,
        error: null
      })
      
      // Schedule token refresh
      scheduleTokenRefresh(() => {
        refreshUser()
      })
      
      console.log('User logged in successfully:', authResponse.user.email)
    } catch (error) {
      console.error('Login failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: handleApiError(error)
      }))
      throw error
    }
  }, [])

  // Logout function
  const handleLogout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      await logout()
      
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null
      })
      
      console.log('User logged out successfully')
    } catch (error) {
      console.error('Logout failed:', error)
      // Always clear local state even if API call fails
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: handleApiError(error)
      })
    }
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      if (!state.isAuthenticated) return
      
      const user = await getCurrentAuthenticatedUser()
      setState(prev => ({ ...prev, user }))
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      // If user refresh fails, user might need to re-authenticate
      setState(prev => ({
        ...prev,
        error: handleApiError(error)
      }))
    }
  }, [state.isAuthenticated])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthState()
  }, [])

  // Handle storage events (e.g., logout in another tab)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleStorageChange = (event: StorageEvent) => {
      // If tokens were cleared in another tab, update auth state
      if (event.key === 'aster_access_token' && !event.newValue) {
        setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null
        })
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Handle page visibility change (refresh tokens when page becomes visible)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.isAuthenticated) {
        // Check if we're still authenticated when page becomes visible
        checkAuthState()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [state.isAuthenticated, checkAuthState])

  const contextValue: AuthContextValue = {
    ...state,
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
    clearError
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(role: 'LAWYER' | 'CLERK' | 'CLIENT'): boolean {
  const { user } = useAuth()
  return user?.role === role || false
}

/**
 * Hook to check if user has specific permission
 */
export function useHasPermission(permission: string): boolean {
  const { user } = useAuth()
  return user?.permissions.includes(permission) || false
}

/**
 * Hook for protected routes - redirects to login if not authenticated
 */
export function useRequireAuth(): UserInfoResponse {
  const { isAuthenticated, user, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // In a real app, you'd redirect to login page
      console.warn('User not authenticated - should redirect to login')
    }
  }, [isAuthenticated, isLoading])
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  return user
}