import axios, { type AxiosInstance } from 'axios'

export const useApi = () => {
  const config = useRuntimeConfig()
  
  // Create axios instance
  const apiClient: AxiosInstance = axios.create({
    baseURL: config.public.apiUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
  
  // Request interceptor for auth
  apiClient.interceptors.request.use(async (config) => {
    // TODO: Get token from auth store
    // const token = await authStore.getAccessToken()
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  })
  
  // Response interceptor for error handling
  apiClient.interceptors.response.use(
    response => response,
    async error => {
      if (error.response?.status === 401) {
        // TODO: Handle token refresh
        console.error('Unauthorized - need to refresh token')
      }
      return Promise.reject(error)
    }
  )
  
  // API methods
  const matters = {
    getAll: () => apiClient.get('/api/matters'),
    getById: (id: string) => apiClient.get(`/api/matters/${id}`),
    create: (data: any) => apiClient.post('/api/matters', data),
    update: (id: string, data: any) => apiClient.put(`/api/matters/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/matters/${id}`)
  }
  
  return {
    apiClient,
    matters
  }
}