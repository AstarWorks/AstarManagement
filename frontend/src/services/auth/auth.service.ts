/**
 * Authentication service for API calls
 * 
 * Handles:
 * - User login and logout
 * - Token refresh operations
 * - Session management
 * - Authentication state tracking
 */

import { apiClient, handleApiResponse, createApiError } from '../api/client'
import { setTokens, clearTokens, getCurrentUser, hasTokens } from './token.service'

// Authentication request/response types matching backend DTOs
export interface LoginRequest {
  email: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface LogoutRequest {
  revokeAllSessions?: boolean
}

export interface UserInfoResponse {
  id: string
  email: string
  name: string
  role: 'LAWYER' | 'CLERK' | 'CLIENT'
  permissions: string[]
}

export interface AuthenticationResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserInfoResponse
}

export interface SessionInfo {
  userId: string
  username: string
  authorities: string[]
  isActive: boolean
  sessionCount: number
  activeSessions: any[]
}

/**
 * Login user with email and password
 */
export async function login(credentials: LoginRequest): Promise<AuthenticationResponse> {
  try {
    console.log('Attempting login for:', credentials.email)
    
    const response = await apiClient.post<AuthenticationResponse>('/auth/login', credentials)
    const authResponse = handleApiResponse(response)
    
    // Store tokens securely
    setTokens(authResponse.accessToken, authResponse.refreshToken, authResponse.expiresIn)
    
    console.log('Login successful for user:', authResponse.user.email)
    
    return authResponse
  } catch (error) {
    console.error('Login failed:', error)
    throw createApiError(error)
  }
}

/**
 * Refresh authentication tokens
 */
export async function refreshTokens(refreshToken: string): Promise<AuthenticationResponse | null> {
  try {
    console.log('Attempting token refresh')
    
    const request: RefreshTokenRequest = { refreshToken }
    const response = await apiClient.post<AuthenticationResponse>('/auth/refresh', request)
    const authResponse = handleApiResponse(response)
    
    console.log('Token refresh successful')
    
    return authResponse
  } catch (error) {
    console.error('Token refresh failed:', error)
    // Don't throw here - let the caller handle the failure
    return null
  }
}

/**
 * Logout user and invalidate tokens
 */
export async function logout(revokeAllSessions = false): Promise<void> {
  try {
    console.log('Attempting logout', { revokeAllSessions })
    
    // Only call logout endpoint if we have tokens
    if (hasTokens()) {
      const request: LogoutRequest = { revokeAllSessions }
      await apiClient.post('/auth/logout', request)
    }
    
    // Always clear local tokens
    clearTokens()
    
    console.log('Logout successful')
  } catch (error) {
    console.error('Logout failed:', error)
    // Always clear tokens even if API call fails
    clearTokens()
    // Don't throw - logout should always succeed locally
  }
}

/**
 * Get current session information
 */
export async function getSession(): Promise<SessionInfo> {
  try {
    const response = await apiClient.get<SessionInfo>('/auth/session')
    return handleApiResponse(response)
  } catch (error) {
    console.error('Failed to get session info:', error)
    throw createApiError(error)
  }
}

/**
 * Revoke all user sessions
 */
export async function revokeAllSessions(): Promise<void> {
  try {
    console.log('Revoking all sessions')
    
    await apiClient.post('/auth/revoke-sessions')
    
    // Clear local tokens after revoking sessions
    clearTokens()
    
    console.log('All sessions revoked successfully')
  } catch (error) {
    console.error('Failed to revoke sessions:', error)
    throw createApiError(error)
  }
}

/**
 * Check authentication service health
 */
export async function checkAuthHealth(): Promise<{ status: string; service: string; timestamp: string }> {
  try {
    const response = await apiClient.get('/auth/health')
    return handleApiResponse(response)
  } catch (error) {
    console.error('Auth health check failed:', error)
    throw createApiError(error)
  }
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    return !!user && !user.isExpired
  } catch (error) {
    console.error('Failed to check authentication status:', error)
    return false
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentAuthenticatedUser(): Promise<UserInfoResponse | null> {
  try {
    const tokenInfo = await getCurrentUser()
    if (!tokenInfo || tokenInfo.isExpired) {
      return null
    }
    
    // Map token info to UserInfoResponse format
    return {
      id: tokenInfo.userId,
      email: tokenInfo.email,
      name: tokenInfo.email, // Backend should provide full name
      role: tokenInfo.role as 'LAWYER' | 'CLERK' | 'CLIENT',
      permissions: tokenInfo.permissions
    }
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * Check if current user has specific role
 */
export async function hasRole(role: 'LAWYER' | 'CLERK' | 'CLIENT'): Promise<boolean> {
  try {
    const user = await getCurrentAuthenticatedUser()
    return user?.role === role || false
  } catch (error) {
    console.error('Failed to check user role:', error)
    return false
  }
}

/**
 * Check if current user has specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const user = await getCurrentAuthenticatedUser()
    return user?.permissions.includes(permission) || false
  } catch (error) {
    console.error('Failed to check user permission:', error)
    return false
  }
}