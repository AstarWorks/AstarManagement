/**
 * Nuxt標準のシンプルなAPIクライアント
 * openapi-fetchを使用した型安全なAPI呼び出し
 */

import createClient from 'openapi-fetch'
import type { paths } from '~/types/api'

export const useApi = () => {
  const config = useRuntimeConfig()
  const { data: session } = useAuth()
  
  // openapi-fetchクライアントの作成
  const client = createClient<paths>({
    baseUrl: config.public.apiBaseUrl || 'http://localhost:8080',
    headers: {
      'Content-Type': 'application/json',
      ...(session.value?.user && {
        Authorization: `Bearer ${session.value?.accessToken}`
      })
    }
  })
  
  return client
}