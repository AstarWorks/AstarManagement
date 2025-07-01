import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

// Extended config with metadata
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  metadata?: {
    startTime: number
  }
  _retry?: boolean
}

// Request queue for handling concurrent requests during token refresh
interface QueuedRequest {
  resolve: (value?: any) => void
  reject: (error?: any) => void
  config: ExtendedAxiosRequestConfig
}

class ApiClient {
  private instance: AxiosInstance
  private isRefreshing = false
  private refreshQueue: QueuedRequest[] = []
  
  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NODE_ENV === 'production' 
        ? '/api'  // Production API endpoint
        : 'http://localhost:8080/api', // Development backend
      timeout: 30000,
      withCredentials: true, // Include httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    this.setupInterceptors()
  }
  
  private setupInterceptors() {
    // Request interceptor for CSRF token and request timing
    this.instance.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        // Add CSRF token from meta tag or cookie
        const csrfToken = this.getCSRFToken()
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken
        }
        
        // Add request timestamp for monitoring
        config.metadata = { startTime: Date.now() }
        
        // Update user activity in auth store
        const authStore = useAuthStore()
        authStore.updateActivity()
        
        return config
      },
      (error) => {
        console.error('Request interceptor error:', error)
        return Promise.reject(error)
      }
    )
    
    // Response interceptor for error handling and token refresh
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response time for monitoring
        const config = response.config as ExtendedAxiosRequestConfig
        const duration = Date.now() - (config.metadata?.startTime || 0)
        if (duration > 5000) {
          console.warn(`Slow API response: ${response.config.url} took ${duration}ms`)
        }
        
        return response
      },
      async (error) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig
        
        // Handle different error types
        if (!error.response) {
          // Network error
          console.error('Network error:', error.message)
          throw new ApiError('Network connection failed. Please check your internet connection.', 'NETWORK_ERROR')
        }
        
        const { status, data } = error.response
        
        switch (status) {
          case 401:
            return this.handle401Error(originalRequest, data)
          case 403:
            throw new ApiError('Access denied. You do not have permission to access this resource.', 'FORBIDDEN', data)
          case 422:
            throw new ValidationError('Validation failed', data.errors || {})
          case 429:
            const retryAfter = error.response.headers['retry-after'] || 60
            throw new RateLimitError(`Too many requests. Please try again in ${retryAfter} seconds.`, retryAfter)
          case 500:
            throw new ApiError('Internal server error. Please try again later.', 'SERVER_ERROR')
          default:
            throw new ApiError(data?.message || 'An unexpected error occurred', 'UNKNOWN_ERROR', data)
        }
      }
    )
  }
  
  private async handle401Error(originalRequest: ExtendedAxiosRequestConfig, errorData: any) {
    const authStore = useAuthStore()
    
    // Don't retry if this is already a refresh request or auth endpoint
    if (originalRequest.url?.includes('/auth/refresh') || 
        originalRequest.url?.includes('/auth/login') ||
        originalRequest._retry) {
      // Refresh failed or auth endpoint failed, logout user
      await authStore.logout()
      throw new AuthError('Authentication failed. Please log in again.', 'AUTH_FAILED')
    }
    
    // Mark request as retried
    originalRequest._retry = true
    
    // If we're already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject, config: originalRequest })
      })
    }
    
    // Start refresh process
    this.isRefreshing = true
    
    try {
      // Attempt to refresh token
      await authStore.refreshToken()
      
      // Retry all queued requests
      this.refreshQueue.forEach(({ resolve, config }) => {
        resolve(this.instance(config))
      })
      
      // Clear queue
      this.refreshQueue = []
      
      // Retry original request
      return this.instance(originalRequest)
      
    } catch (refreshError) {
      // Refresh failed, reject all queued requests
      this.refreshQueue.forEach(({ reject }) => {
        reject(new AuthError('Session expired. Please log in again.', 'SESSION_EXPIRED'))
      })
      
      this.refreshQueue = []
      
      // Logout user
      await authStore.logout()
      
      throw new AuthError('Session expired. Please log in again.', 'SESSION_EXPIRED')
    } finally {
      this.isRefreshing = false
    }
  }
  
  private getCSRFToken(): string | null {
    // Try to get CSRF token from meta tag first
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    if (metaToken) return metaToken
    
    // Fallback to reading cookie manually (since this is not in a Vue component)
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'csrf-token') {
          return decodeURIComponent(value)
        }
      }
    }
    
    return null
  }
  
  // Public API methods
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config).then(response => response.data)
  }
  
  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config).then(response => response.data)
  }
  
  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config).then(response => response.data)
  }
  
  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.patch(url, data, config).then(response => response.data)
  }
  
  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config).then(response => response.data)
  }
  
  // Upload file with progress tracking
  public uploadFile<T = any>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)
    
    // Add additional form data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }
    
    return this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    }).then(response => response.data)
  }
  
  // Download file with proper headers
  public async downloadFile(url: string, filename?: string): Promise<void> {
    const response = await this.instance.get(url, {
      responseType: 'blob'
    })
    
    // Create download link
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Cleanup
    window.URL.revokeObjectURL(downloadUrl)
  }
}

// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class AuthError extends ApiError {
  constructor(message: string, code: string) {
    super(message, code)
    this.name = 'AuthError'
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public fieldErrors: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', fieldErrors)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends ApiError {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message, 'RATE_LIMITED')
    this.name = 'RateLimitError'
  }
}

// Singleton instance
const apiClient = new ApiClient()

// Export the instance and types
export default apiClient
export type { AxiosRequestConfig, AxiosResponse }