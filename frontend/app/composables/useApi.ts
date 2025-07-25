import type { UseFetchOptions } from 'nuxt/app'
import type { ApiErrorResponse } from '~/types/auth'

export interface ApiOptions extends UseFetchOptions<any> {
  requiresAuth?: boolean
  skipErrorHandler?: boolean
}

/**
 * API リクエストのためのカスタム composable
 */
export const useApi = () => {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  /**
   * API リクエストを実行
   */
  const api = async <T = any>(
    url: string,
    options: ApiOptions = {}
  ): Promise<T> => {
    const {
      requiresAuth = true,
      skipErrorHandler = false,
      ...fetchOptions
    } = options

    // Base URL の設定
    const baseURL = config.public.apiBaseUrl

    // 認証ヘッダーの追加
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {}),
    }

    if (requiresAuth && authStore.tokens?.accessToken) {
      headers.Authorization = `Bearer ${authStore.tokens.accessToken}`
    }

    try {
      const response = await $fetch<T>(url, {
        ...fetchOptions,
        baseURL,
        headers,
        // リクエストインターセプター
        onRequest({ request, options }) {
          // アクティビティの更新
          if (requiresAuth) {
            authStore.updateLastActivity()
          }
        },
        // レスポンスインターセプター
        onResponse({ response }) {
          // 成功時の処理
          if (requiresAuth) {
            authStore.updateLastActivity()
          }
        },
        // エラーインターセプター
        onResponseError({ response }) {
          if (skipErrorHandler) return

          // 401エラーの場合、自動的にトークンリフレッシュを試行
          if (response.status === 401 && requiresAuth) {
            authStore.refreshTokens().then((success) => {
              if (!success) {
                // リフレッシュも失敗した場合、ログアウト
                authStore.logout()
                navigateTo('/login')
              }
            })
          }
        },
      })

      return response
    } catch (error: any) {
      if (!skipErrorHandler) {
        handleApiError(error)
      }
      throw error
    }
  }

  /**
   * GET リクエスト
   */
  const get = <T = any>(url: string, options: ApiOptions = {}): Promise<T> => {
    return api<T>(url, { ...options, method: 'GET' })
  }

  /**
   * POST リクエスト
   */
  const post = <T = any>(
    url: string,
    body?: any,
    options: ApiOptions = {}
  ): Promise<T> => {
    return api<T>(url, { ...options, method: 'POST', body })
  }

  /**
   * PUT リクエスト
   */
  const put = <T = any>(
    url: string,
    body?: any,
    options: ApiOptions = {}
  ): Promise<T> => {
    return api<T>(url, { ...options, method: 'PUT', body })
  }

  /**
   * PATCH リクエスト
   */
  const patch = <T = any>(
    url: string,
    body?: any,
    options: ApiOptions = {}
  ): Promise<T> => {
    return api<T>(url, { ...options, method: 'PATCH', body })
  }

  /**
   * DELETE リクエスト
   */
  const del = <T = any>(url: string, options: ApiOptions = {}): Promise<T> => {
    return api<T>(url, { ...options, method: 'DELETE' })
  }

  /**
   * API エラーハンドリング
   */
  const handleApiError = (error: any) => {
    let errorMessage = 'APIエラーが発生しました'

    if (error.data?.error) {
      const apiError = error.data.error as ApiErrorResponse['error']
      errorMessage = apiError.message || errorMessage
    } else if (error.message) {
      errorMessage = error.message
    }

    // エラー通知（今後実装予定のtoast等）
    console.error('API Error:', errorMessage)

    // 認証エラーの場合はauthStoreに設定
    if (error.status === 401 || error.status === 403) {
      authStore.setError(errorMessage)
    }
  }

  /**
   * ファイルアップロード用のAPI
   */
  const uploadFile = async <T = any>(
    url: string,
    file: File,
    options: ApiOptions & {
      fieldName?: string
      additionalData?: Record<string, any>
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<T> => {
    const {
      fieldName = 'file',
      additionalData = {},
      onProgress,
      requiresAuth = true,
      ...fetchOptions
    } = options

    const formData = new FormData()
    formData.append(fieldName, file)

    // 追加データを FormData に含める
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key])
    })

    const headers: Record<string, string> = {
      ...((fetchOptions.headers as Record<string, string>) || {}),
    }

    // Content-Type は自動設定されるので削除
    delete headers['Content-Type']

    if (requiresAuth && authStore.tokens?.accessToken) {
      headers.Authorization = `Bearer ${authStore.tokens.accessToken}`
    }

    return api<T>(url, {
      ...fetchOptions,
      method: 'POST',
      body: formData,
      headers,
    })
  }

  return {
    api,
    get,
    post,
    put,
    patch,
    del,
    uploadFile,
    handleApiError,
  }
}

/**
 * 認証API用のcomposable
 */
export const useAuthApi = () => {
  const { post } = useApi()

  return {
    /**
     * ログイン
     */
    login: (credentials: any) => post('/auth/login', credentials, { requiresAuth: false }),

    /**
     * 2要素認証確認
     */
    verifyTwoFactor: (data: any) => post('/auth/verify-2fa', data, { requiresAuth: false }),

    /**
     * ログアウト
     */
    logout: () => post('/auth/logout', {}, { requiresAuth: true }),

    /**
     * トークンリフレッシュ
     */
    refreshToken: (refreshToken: string) => 
      post('/auth/refresh', {}, { 
        requiresAuth: false,
        headers: { Authorization: `Bearer ${refreshToken}` }
      }),

    /**
     * ユーザー情報取得
     */
    getMe: () => post('/auth/me', {}, { requiresAuth: true }),

    /**
     * パスワードリセット要求
     */
    forgotPassword: (email: string) => 
      post('/auth/forgot-password', { email }, { requiresAuth: false }),

    /**
     * パスワードリセット
     */
    resetPassword: (data: any) => 
      post('/auth/reset-password', data, { requiresAuth: false }),
  }
}