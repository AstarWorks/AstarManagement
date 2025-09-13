/**
 * Nuxt標準のuseFetchを型安全にラップ
 * 認証ヘッダーを自動付与
 */

// 認証ヘッダーを提供するcomposable
const useAuthHeaders = () => {
  const { data: session } = useAuth()
  return computed(() => ({
    ...(session.value?.accessToken && {
      Authorization: `Bearer ${session.value.accessToken}`
    })
  }))
}

export const useTypedFetch = <T>(
  request: string,
  options?: Record<string, unknown>
) => {
  const config = useRuntimeConfig()
  const authHeaders = useAuthHeaders()
  
  return useFetch<T>(request, {
    baseURL: config.public.apiBaseUrl || 'http://localhost:8080',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders.value,
      ...(options?.headers as Record<string, string> || {})
    }
  })
}