import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

// Request queue for handling concurrent requests during token refresh
interface QueuedRequest {
  resolve: (value?: any) => void
  reject: (error?: any) => void
  config: AxiosRequestConfig
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
      (config) => {
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
        const duration = Date.now() - response.config.metadata?.startTime
        if (duration > 5000) {
          console.warn(`Slow API response: ${response.config.url} took ${duration}ms`)
        }
        
        return response
      },
      async (error) => {
        const originalRequest = error.config
        
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
  
  private async handle401Error(originalRequest: AxiosRequestConfig, errorData: any) {
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
    
    try {\n      // Attempt to refresh token\n      await authStore.refreshToken()
      \n      // Retry all queued requests\n      this.refreshQueue.forEach(({ resolve, config }) => {\n        resolve(this.instance(config))\n      })\n      \n      // Clear queue\n      this.refreshQueue = []\n      \n      // Retry original request\n      return this.instance(originalRequest)\n      \n    } catch (refreshError) {\n      // Refresh failed, reject all queued requests\n      this.refreshQueue.forEach(({ reject }) => {\n        reject(new AuthError('Session expired. Please log in again.', 'SESSION_EXPIRED'))\n      })\n      \n      this.refreshQueue = []\n      \n      // Logout user\n      await authStore.logout()\n      \n      throw new AuthError('Session expired. Please log in again.', 'SESSION_EXPIRED')\n    } finally {\n      this.isRefreshing = false\n    }\n  }\n  \n  private getCSRFToken(): string | null {\n    // Try to get CSRF token from meta tag first\n    const metaToken = document.querySelector('meta[name=\"csrf-token\"]')?.getAttribute('content')\n    if (metaToken) return metaToken\n    \n    // Fallback to cookie\n    const cookieToken = useCookie('csrf-token')\n    return cookieToken.value || null\n  }\n  \n  // Public API methods\n  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {\n    return this.instance.get(url, config).then(response => response.data)\n  }\n  \n  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {\n    return this.instance.post(url, data, config).then(response => response.data)\n  }\n  \n  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {\n    return this.instance.put(url, data, config).then(response => response.data)\n  }\n  \n  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {\n    return this.instance.patch(url, data, config).then(response => response.data)\n  }\n  \n  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {\n    return this.instance.delete(url, config).then(response => response.data)\n  }\n  \n  // Upload file with progress tracking\n  public uploadFile<T = any>(\n    url: string, \n    file: File, \n    onProgress?: (progress: number) => void,\n    additionalData?: Record<string, any>\n  ): Promise<T> {\n    const formData = new FormData()\n    formData.append('file', file)\n    \n    // Add additional form data\n    if (additionalData) {\n      Object.entries(additionalData).forEach(([key, value]) => {\n        formData.append(key, value)\n      })\n    }\n    \n    return this.instance.post(url, formData, {\n      headers: {\n        'Content-Type': 'multipart/form-data'\n      },\n      onUploadProgress: (progressEvent) => {\n        if (onProgress && progressEvent.total) {\n          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)\n          onProgress(progress)\n        }\n      }\n    }).then(response => response.data)\n  }\n  \n  // Download file with proper headers\n  public async downloadFile(url: string, filename?: string): Promise<void> {\n    const response = await this.instance.get(url, {\n      responseType: 'blob'\n    })\n    \n    // Create download link\n    const blob = new Blob([response.data])\n    const downloadUrl = window.URL.createObjectURL(blob)\n    const link = document.createElement('a')\n    link.href = downloadUrl\n    link.download = filename || 'download'\n    \n    // Trigger download\n    document.body.appendChild(link)\n    link.click()\n    document.body.removeChild(link)\n    \n    // Cleanup\n    window.URL.revokeObjectURL(downloadUrl)\n  }\n}\n\n// Custom error classes\nexport class ApiError extends Error {\n  constructor(\n    message: string,\n    public code: string,\n    public details?: any\n  ) {\n    super(message)\n    this.name = 'ApiError'\n  }\n}\n\nexport class AuthError extends ApiError {\n  constructor(message: string, code: string) {\n    super(message, code)\n    this.name = 'AuthError'\n  }\n}\n\nexport class ValidationError extends ApiError {\n  constructor(\n    message: string,\n    public fieldErrors: Record<string, string[]>\n  ) {\n    super(message, 'VALIDATION_ERROR', fieldErrors)\n    this.name = 'ValidationError'\n  }\n}\n\nexport class RateLimitError extends ApiError {\n  constructor(\n    message: string,\n    public retryAfter: number\n  ) {\n    super(message, 'RATE_LIMITED')\n    this.name = 'RateLimitError'\n  }\n}\n\n// Singleton instance\nconst apiClient = new ApiClient()\n\n// Export the instance and types\nexport default apiClient\nexport type { AxiosRequestConfig, AxiosResponse }