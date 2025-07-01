import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { Matter } from '~/types/matter'
import { useApiErrorHandler } from './useErrorHandler'

// API Response interfaces
interface ApiResponse<T> {
  data: T
  loading: boolean
  error: string | null
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// API Error interface
interface ApiError {
  message: string
  code: string
  details?: unknown
}

// Matter creation/update interfaces
type CreateMatterData = Omit<Matter, 'id' | 'createdAt' | 'updatedAt'>
type UpdateMatterData = Partial<CreateMatterData>

export const useApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const { handleApiRequest, clearError } = useApiErrorHandler()
  
  // Create axios instance
  const apiClient: AxiosInstance = axios.create({
    baseURL: config.public.apiUrl as string,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
  
  // Request interceptor for auth
  apiClient.interceptors.request.use(async (config) => {
    // TODO: Implement proper access token retrieval when auth system is fully implemented
    const token = authStore.user?.id ? 'mock-token' : ''
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  
  // Response interceptor for error handling
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized - redirect to login
        await navigateTo('/login')
      }
      
      // Transform error to consistent format
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'An error occurred',
        code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
        details: error.response?.data?.details
      }
      
      return Promise.reject(apiError)
    }
  )
  
  // Generic API method with error handling
  const apiCall = async <T>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<ApiResponse<T>> => {
    const response: ApiResponse<T> = {
      data: null as unknown as T,
      loading: true,
      error: null
    }
    
    try {
      const result = await requestFn()
      response.data = result.data
      response.loading = false
    } catch (error) {
      response.loading = false
      response.error = error instanceof Error ? error.message : 'Unknown error'
    }
    
    return response
  }
  
  // Type-safe API methods with consistent error handling
  const matters = {
    getAll: () => handleApiRequest(() => 
      apiClient.get<PaginatedResponse<Matter>>('/api/matters'),
      'Failed to fetch matters'
    ),
    
    getById: (id: string) => handleApiRequest(() => 
      apiClient.get<Matter>(`/api/matters/${id}`),
      `Failed to fetch matter ${id}`
    ),
    
    create: (data: CreateMatterData) => handleApiRequest(() => 
      apiClient.post<Matter>('/api/matters', data),
      'Failed to create matter'
    ),
    
    update: (id: string, data: UpdateMatterData) => handleApiRequest(() => 
      apiClient.put<Matter>(`/api/matters/${id}`, data),
      `Failed to update matter ${id}`
    ),
    
    delete: (id: string) => handleApiRequest(() => 
      apiClient.delete<void>(`/api/matters/${id}`),
      `Failed to delete matter ${id}`
    )
  }
  
  return {
    apiClient,
    matters,
    // Expose generic API call method for other endpoints
    apiCall,
    // Error handling utilities
    clearError
  }
}