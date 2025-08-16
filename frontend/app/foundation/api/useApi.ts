/**
 * Simplified API Composable
 * Simple over Easy: 直接$fetchを使用、不要な抽象化を除去
 */

import { useApiAuth } from './useApiAuth'
import { useAuthStore } from '~/modules/auth/stores/auth'
import type { Result } from '~/modules/auth/types/auth'
import { createSuccess, createFailure } from '~/modules/auth/types/auth'

/**
 * API オプション（簡素化）
 */
export interface IApiOptions {
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
export interface IApiError {
  readonly code: 'NETWORK_ERROR' | 'SERVER_ERROR' | 'CLIENT_ERROR' | 'TIMEOUT_ERROR' | 'UNKNOWN_ERROR'
  readonly message: string
  readonly status: number
  readonly details?: Record<string, unknown>
}

/**
 * APIエラー作成ヘルパー
 */
export function createApiError(
  code: IApiError['code'], 
  message: string, 
  status: number, 
  details?: Record<string, unknown>
): IApiError {
  return { code, message, status, details }
}

/**
 * $fetchエラーからAPIエラーを作成
 */
export function fromFetchError(error: unknown): IApiError {
  const status = (error as { status?: number; statusCode?: number })?.status || 
                 (error as { status?: number; statusCode?: number })?.statusCode || 500
  const message = (error as Error)?.message || 'API request failed'
  const data = (error as { data?: unknown })?.data
  
  let code: IApiError['code']
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
    options: IApiOptions = {}
  ): Promise<Result<T, IApiError>> => {
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
      const { requiresAuth: _requiresAuth, skipErrorHandler: _skipErrorHandler, headers: _optionHeaders, ...fetchOptions } = options
      
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
  const get = <T>(url: string, options?: IApiOptions): Promise<Result<T, IApiError>> =>
    authenticatedRequest<T>('GET', url, undefined, options)

  const post = <T>(url: string, body?: unknown, options?: IApiOptions): Promise<Result<T, IApiError>> =>
    authenticatedRequest<T>('POST', url, body, options)

  const put = <T>(url: string, body?: unknown, options?: IApiOptions): Promise<Result<T, IApiError>> =>
    authenticatedRequest<T>('PUT', url, body, options)

  const del = <T>(url: string, options?: IApiOptions): Promise<Result<T, IApiError>> =>
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

  const uploadFile = async (url: string, file: File): Promise<Result<unknown, IApiError>> => {
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