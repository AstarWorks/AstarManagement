/**
 * Centralized API client with Axios configuration
 * 
 * Provides a configured Axios instance with:
 * - Base URL configuration from environment
 * - Authentication headers via interceptors
 * - Request/response correlation IDs
 * - Error handling and token refresh
 * - Timeout and retry configuration
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { v4 as uuidv4 } from 'uuid'

// Environment configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const API_TIMEOUT = 30000 // 30 seconds

// Types for error handling
export interface ProblemDetail {
  type?: string
  title: string
  status: number
  detail: string
  instance?: string
  [key: string]: any
}

export interface ApiError extends Error {
  status?: number
  problemDetail?: ProblemDetail
  correlationId?: string
}

// Generate correlation ID for request tracking
function generateCorrelationId(): string {
  return uuidv4()
}

// Create Axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Track ongoing token refresh to prevent concurrent attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string | null) => void
  reject: (error: any) => void
}> = []

// Process queued requests after token refresh
function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Request interceptor for authentication and correlation IDs
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Add correlation ID to every request
    config.headers['X-Correlation-ID'] = generateCorrelationId()
    
    // Add authentication token if available
    try {
      const { getAccessToken } = await import('../auth/token.service')
      const token = await getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      // Token service not available or error getting token
      console.warn('Failed to get access token for request:', error)
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        correlationId: config.headers['X-Correlation-ID'],
        data: config.data
      })
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`, {
        correlationId: response.config.headers?.['X-Correlation-ID'],
        data: response.data
      })
    }
    
    return response
  },
  async (error: AxiosError<ProblemDetail>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    // Handle 401 Unauthorized with token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return apiClient(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }
      
      originalRequest._retry = true
      isRefreshing = true
      
      try {
        const { refreshToken } = await import('../auth/token.service')
        const newToken = await refreshToken()
        
        if (newToken) {
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        } else {
          processQueue(new Error('Token refresh failed'), null)
          // Redirect to login or trigger logout
          const { logout } = await import('../auth/auth.service')
          await logout()
          return Promise.reject(error)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        // Redirect to login or trigger logout
        const { logout } = await import('../auth/auth.service')
        await logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    // Create enhanced error with problem details
    const apiError: ApiError = new Error(error.message)
    apiError.name = 'ApiError'
    apiError.status = error.response?.status
    apiError.problemDetail = error.response?.data
    apiError.correlationId = originalRequest?.headers?.['X-Correlation-ID'] as string
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        correlationId: apiError.correlationId,
        problemDetail: apiError.problemDetail
      })
    }
    
    return Promise.reject(apiError)
  }
)

// Utility function for handling API responses
export function handleApiResponse<T>(response: AxiosResponse<T>): T {
  return response.data
}

// Utility function for handling API errors
export function createApiError(error: any): ApiError {
  if (error.name === 'ApiError') {
    return error as ApiError
  }
  
  const apiError: ApiError = new Error(error.message || 'An unexpected error occurred')
  apiError.name = 'ApiError'
  
  if (axios.isAxiosError(error)) {
    apiError.status = error.response?.status
    apiError.problemDetail = error.response?.data
  }
  
  return apiError
}

export default apiClient