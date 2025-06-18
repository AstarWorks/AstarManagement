/**
 * Token service for secure JWT token management
 * 
 * Handles:
 * - Secure token storage (httpOnly cookies preferred, encrypted localStorage fallback)
 * - Token validation and expiration checking
 * - Automatic token refresh
 * - Token cleanup on logout
 */

import { jwtDecode } from 'jwt-decode'

// Token storage keys
const ACCESS_TOKEN_KEY = 'aster_access_token'
const REFRESH_TOKEN_KEY = 'aster_refresh_token'
const TOKEN_EXPIRY_KEY = 'aster_token_expiry'

// JWT payload interface
interface JwtPayload {
  sub: string // user ID
  exp: number // expiration timestamp
  iat: number // issued at timestamp
  email: string
  role: string
  permissions: string[]
}

// Token info interface
export interface TokenInfo {
  userId: string
  email: string
  role: string
  permissions: string[]
  expiresAt: Date
  isExpired: boolean
}

/**
 * Encrypt token for localStorage storage
 * Simple XOR encryption with fixed key - not for production security
 * In production, use proper encryption or preferably httpOnly cookies
 */
function encryptToken(token: string): string {
  if (typeof window === 'undefined') return token
  
  const key = 'aster-mgmt-key' // In production: use proper key management
  let encrypted = ''
  
  for (let i = 0; i < token.length; i++) {
    encrypted += String.fromCharCode(
      token.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    )
  }
  
  return btoa(encrypted)
}

/**
 * Decrypt token from localStorage storage
 */
function decryptToken(encryptedToken: string): string {
  if (typeof window === 'undefined') return encryptedToken
  
  try {
    const key = 'aster-mgmt-key'
    const encrypted = atob(encryptedToken)
    let decrypted = ''
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      )
    }
    
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt token:', error)
    return ''
  }
}

/**
 * Store tokens securely
 */
export function setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  if (typeof window === 'undefined') return
  
  try {
    // Calculate expiry timestamp
    const expiryTimestamp = Date.now() + (expiresIn * 1000)
    
    // Try to use httpOnly cookies if available (requires server-side support)
    // For now, use encrypted localStorage as fallback
    localStorage.setItem(ACCESS_TOKEN_KEY, encryptToken(accessToken))
    localStorage.setItem(REFRESH_TOKEN_KEY, encryptToken(refreshToken))
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString())
    
    console.log('Tokens stored successfully', { expiresAt: new Date(expiryTimestamp) })
  } catch (error) {
    console.error('Failed to store tokens:', error)
    throw new Error('Failed to store authentication tokens')
  }
}

/**
 * Get access token
 */
export async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  
  try {
    const encryptedToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!encryptedToken) return null
    
    const token = decryptToken(encryptedToken)
    if (!token) return null
    
    // Check if token is expired
    const tokenInfo = parseToken(token)
    if (tokenInfo?.isExpired) {
      console.log('Access token expired, attempting refresh')
      return await refreshToken()
    }
    
    return token
  } catch (error) {
    console.error('Failed to get access token:', error)
    return null
  }
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    const encryptedToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!encryptedToken) return null
    
    return decryptToken(encryptedToken)
  } catch (error) {
    console.error('Failed to get refresh token:', error)
    return null
  }
}

/**
 * Parse JWT token to extract payload information
 */
export function parseToken(token: string): TokenInfo | null {
  try {
    const payload = jwtDecode<JwtPayload>(token)
    
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      expiresAt: new Date(payload.exp * 1000),
      isExpired: Date.now() >= payload.exp * 1000
    }
  } catch (error) {
    console.error('Failed to parse token:', error)
    return null
  }
}

/**
 * Check if tokens are available
 */
export function hasTokens(): boolean {
  if (typeof window === 'undefined') return false
  
  return !!(localStorage.getItem(ACCESS_TOKEN_KEY) && localStorage.getItem(REFRESH_TOKEN_KEY))
}

/**
 * Check if access token is expired
 */
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true
  
  try {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiryStr) return true
    
    const expiry = parseInt(expiryStr, 10)
    return Date.now() >= expiry
  } catch (error) {
    console.error('Failed to check token expiry:', error)
    return true
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  
  const refreshTokenValue = getRefreshToken()
  if (!refreshTokenValue) {
    console.log('No refresh token available')
    return null
  }
  
  try {
    // Import auth service to avoid circular dependency
    const { refreshTokens } = await import('./auth.service')
    const response = await refreshTokens(refreshTokenValue)
    
    if (response) {
      setTokens(response.accessToken, response.refreshToken, response.expiresIn)
      return response.accessToken
    }
    
    return null
  } catch (error) {
    console.error('Failed to refresh token:', error)
    clearTokens()
    return null
  }
}

/**
 * Clear all stored tokens
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    
    console.log('Tokens cleared successfully')
  } catch (error) {
    console.error('Failed to clear tokens:', error)
  }
}

/**
 * Get current user info from token
 */
export async function getCurrentUser(): Promise<TokenInfo | null> {
  const token = await getAccessToken()
  if (!token) return null
  
  return parseToken(token)
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.permissions.includes(permission) || false
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role || false
}

/**
 * Get time until token expires
 */
export function getTimeUntilExpiry(): number {
  if (typeof window === 'undefined') return 0
  
  try {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiryStr) return 0
    
    const expiry = parseInt(expiryStr, 10)
    return Math.max(0, expiry - Date.now())
  } catch (error) {
    console.error('Failed to get time until expiry:', error)
    return 0
  }
}

/**
 * Schedule automatic token refresh
 */
export function scheduleTokenRefresh(callback?: () => void): void {
  if (typeof window === 'undefined') return
  
  const timeUntilExpiry = getTimeUntilExpiry()
  
  // Refresh 5 minutes before expiry
  const refreshTime = Math.max(0, timeUntilExpiry - (5 * 60 * 1000))
  
  if (refreshTime > 0) {
    setTimeout(async () => {
      console.log('Scheduled token refresh executing')
      const newToken = await refreshToken()
      if (newToken) {
        console.log('Token refreshed successfully')
        callback?.()
        // Schedule next refresh
        scheduleTokenRefresh(callback)
      } else {
        console.log('Token refresh failed, user needs to re-authenticate')
      }
    }, refreshTime)
    
    console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000)} seconds`)
  }
}