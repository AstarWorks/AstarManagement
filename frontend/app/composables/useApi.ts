/**
 * Simplified API Composable
 * Simple over Easy: 直接$fetchを使用、不要な抽象化を除去
 */

import { useApiAuth } from './useApiAuth'
import type { Result } from '~/types/auth'
import { createSuccess, createFailure } from '~/types/auth'
import type { $Fetch } from 'nitropack'

/**
 * API オプション（簡素化）
 */
export interface ApiOptions {
  requiresAuth?: boolean
  skipErrorHandler?: boolean
  headers?: Record<string, string>
  timeout?: number
  retry?: number
  signal?: AbortSignal
}

/**
 * 一般的なAPIエラー型（型安全）
 */
export interface ApiError {
  readonly code: 'NETWORK_ERROR' | 'SERVER_ERROR' | 'CLIENT_ERROR' | 'TIMEOUT_ERROR' | 'UNKNOWN_ERROR'
  readonly message: string
  readonly status: number
  readonly details?: Record<string, unknown>
}

/**
 * APIエラー作成ヘルパー
 */
export function createApiError(
  code: ApiError['code'], 
  message: string, 
  status: number, 
  details?: Record<string, unknown>
): ApiError {
  return { code, message, status, details }
}

/**
 * $fetchエラーからAPIエラーを作成
 */
export function fromFetchError(error: unknown): ApiError {
  const status = (error as { status?: number; statusCode?: number })?.status || 
                 (error as { status?: number; statusCode?: number })?.statusCode || 500
  const message = (error as Error)?.message || 'API request failed'
  const data = (error as { data?: unknown })?.data
  
  let code: ApiError['code']
  if (status >= 500) {
    code = 'SERVER_ERROR'
  } else if (status >= 400) {
    code = 'CLIENT_ERROR'
  } else if (status === 0) {
    code = 'NETWORK_ERROR'
  } else {
    code = 'UNKNOWN_ERROR'
  }
  
  return createApiError(code, message, status, { originalError: error, data })
}

/**
 * メインAPIクライアントのコンポーザブル
 * 直接$fetchを使用してシンプル化
 */
export const useApi = () => {
  const authApi = useApiAuth()

  /**
   * 認証が必要なHTTPリクエスト（Result型パターン）
   */
  const authenticatedRequest = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: unknown,
    options: ApiOptions = {}
  ): Promise<Result<T, ApiError>> => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      const error = createApiError('CLIENT_ERROR', 'Authentication required', 401)
      return createFailure(error)
    }

    const headers = {
      'Authorization': `Bearer ${authStore.currentTokens?.accessToken}`,
      ...options.headers
    }

    try {
      // ApiOptionsから$fetch固有でないプロパティを除外
      const { requiresAuth, skipErrorHandler, headers: optionHeaders, ...fetchOptions } = options
      
      const response = await $fetch<T>(url, {
        method,
        body: (method !== 'GET' && method !== 'DELETE') ? body as BodyInit : undefined,
        headers,
        ...fetchOptions
      })
      
      return createSuccess(response)
    } catch (error: unknown) {
      const apiError = fromFetchError(error)
      return createFailure(apiError)
    }
  }

  /**
   * 便利メソッド（Result型パターン）
   */
  const get = <T>(url: string, options?: ApiOptions): Promise<Result<T, ApiError>> =>
    authenticatedRequest<T>('GET', url, undefined, options)

  const post = <T>(url: string, body?: unknown, options?: ApiOptions): Promise<Result<T, ApiError>> =>
    authenticatedRequest<T>('POST', url, body, options)

  const put = <T>(url: string, body?: unknown, options?: ApiOptions): Promise<Result<T, ApiError>> =>
    authenticatedRequest<T>('PUT', url, body, options)

  const del = <T>(url: string, options?: ApiOptions): Promise<Result<T, ApiError>> =>
    authenticatedRequest<T>('DELETE', url, undefined, options)

  return {
    // メインAPI
    get,
    post,
    put,
    delete: del,
    
    // 認証API
    auth: authApi,
    
    // 低レベルアクセス（$fetch直接）
    $fetch,
  }
}

/**
 * 簡易ファイルアップロード（Result型パターン）
 */
export const useApiUpload = () => {
  const { post } = useApi()

  const uploadFile = async (url: string, file: File): Promise<Result<unknown, ApiError>> => {
    const formData = new FormData()
    formData.append('file', file)
    
    return post(url, formData, {
      headers: {
        // Content-Typeを設定しない（ブラウザが自動設定）
      }
    })
  }

  return {
    uploadFile
  }
}