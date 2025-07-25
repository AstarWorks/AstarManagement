# T02_S02 - Error Handling Enhancement

## Task Overview
**Duration**: 3 hours  
**Priority**: High  
**Dependencies**: T01_S02_AuthStore_API_Integration  
**Sprint**: S02_M001_INTEGRATION  

## Objective
Implement comprehensive error handling for network failures, API errors, and user feedback with proper retry mechanisms and user-friendly messaging.

## Background
The current mock implementation provides basic error simulation, but production requires robust error handling for:
- Network connectivity issues
- API server errors (5xx)
- Authentication failures (401, 403)
- Validation errors (400, 422)
- Rate limiting (429)
- Business logic errors

## Technical Requirements

### 1. Global Error Handler
Implement centralized error handling for the application:

```typescript
// plugins/error-handler.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  const { showToast } = useToast()
  
  // Global Vue error handler
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('Global Vue error:', error, info)
    
    // Log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      logError(error, { context: 'vue-error', info })
    }
    
    // Show user-friendly message
    if (!isApiError(error)) {
      showToast('予期しないエラーが発生しました', 'error')
    }
  }
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    if (process.env.NODE_ENV === 'production') {
      logError(event.reason, { context: 'unhandled-promise' })
    }
    
    // Prevent default browser error dialog
    event.preventDefault()
    
    // Show user-friendly message
    showToast('通信エラーが発生しました。再度お試しください', 'error')
  })
})
```

### 2. Enhanced API Error Types
Extend error handling with comprehensive error types:

```typescript
// utils/api-error.ts
export interface ErrorDetail {
  field: string
  message: string
  value?: unknown
  code?: string
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: ErrorDetail[]
    timestamp?: string
    path?: string
    traceId?: string
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: ErrorDetail[],
    public traceId?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
  
  static fromResponse(response: any): ApiError {
    const error = response._data?.error
    return new ApiError(
      error?.code || 'UNKNOWN_ERROR',
      response.status,
      error?.message || 'An error occurred',
      error?.details,
      error?.traceId
    )
  }
  
  // Check if error is retryable
  get isRetryable(): boolean {
    return this.statusCode >= 500 || 
           this.statusCode === 429 ||
           this.code === 'NETWORK_ERROR'
  }
  
  // Get user-friendly message
  get userMessage(): string {
    return getUserFriendlyMessage(this.code, this.message)
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = 'NetworkError'
  }
  
  get isRetryable(): boolean {
    return true
  }
}

// Type guards
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

export function hasErrorCode<T extends string>(
  error: unknown,
  code: T
): error is ApiError & { code: T } {
  return isApiError(error) && error.code === code
}
```

### 3. User-Friendly Error Messages
Create localized error messages:

```typescript
// utils/error-messages.ts
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  TOKEN_EXPIRED: 'セッションが期限切れです。再度ログインしてください',
  ACCOUNT_SUSPENDED: 'アカウントが停止されています。管理者にお問い合わせください',
  UNAUTHORIZED: '認証が必要です。ログインしてください',
  FORBIDDEN: 'この操作を実行する権限がありません',
  INSUFFICIENT_PERMISSIONS: '必要な権限がありません',
  TOO_MANY_ATTEMPTS: 'ログイン試行回数が多すぎます。しばらく時間をおいてお試しください',
  
  // 2FA errors
  INVALID_2FA_TOKEN: '認証コードが正しくありません',
  '2FA_REQUIRED': '2段階認証が必要です',
  
  // Validation errors
  VALIDATION_ERROR: '入力内容に不備があります',
  REQUIRED_FIELD_MISSING: '必須項目が入力されていません',
  INVALID_FORMAT: '入力形式が正しくありません',
  VALUE_TOO_LONG: '入力値が長すぎます',
  VALUE_TOO_SHORT: '入力値が短すぎます',
  INVALID_EMAIL: '有効なメールアドレスを入力してください',
  INVALID_DATE_RANGE: '無効な日付範囲です',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION: 'ビジネスルールに違反しています',
  INVALID_STATE_TRANSITION: '無効な状態変更です',
  DUPLICATE_ENTRY: 'すでに存在するデータです',
  REFERENTIAL_INTEGRITY: '関連するデータが存在するため削除できません',
  QUOTA_EXCEEDED: '利用可能な上限を超えています',
  INSUFFICIENT_BALANCE: '残高が不足しています',
  
  // Resource errors
  NOT_FOUND: 'データが見つかりません',
  ALREADY_EXISTS: 'すでに存在します',
  RESOURCE_LOCKED: 'リソースが他のプロセスによって使用中です',
  RESOURCE_DELETED: 'データが削除されています',
  VERSION_CONFLICT: 'データが他のユーザーによって更新されています。最新データを取得してください',
  
  // File errors
  FILE_TOO_LARGE: 'ファイルサイズが上限を超えています',
  UNSUPPORTED_FILE_TYPE: 'サポートされていないファイル形式です',
  FILE_UPLOAD_FAILED: 'ファイルのアップロードに失敗しました',
  FILE_PROCESSING_FAILED: 'ファイルの処理に失敗しました',
  VIRUS_DETECTED: 'ウイルスが検出されました',
  
  // Network errors
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  TIMEOUT: 'タイムアウトが発生しました',
  
  // Server errors
  INTERNAL_ERROR: 'サーバーエラーが発生しました',
  SERVICE_UNAVAILABLE: 'サービスが一時的に利用できません',
  MAINTENANCE_MODE: 'メンテナンス中です',
  RATE_LIMITED: 'リクエストが多すぎます。しばらく待ってから再度お試しください',
  
  // Default
  UNKNOWN_ERROR: '予期しないエラーが発生しました'
}

export function getUserFriendlyMessage(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] || fallback || ERROR_MESSAGES.UNKNOWN_ERROR
}
```

### 4. Enhanced API Client with Error Handling
Update the API client to handle all error scenarios:

```typescript
// utils/api.ts
export const api = $fetch.create({
  baseURL: '/api/v1',
  timeout: 30000, // 30 second timeout
  
  onRequest({ options }) {
    const { getAccessToken } = useAuth()
    const token = getAccessToken()
    
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    }
  },
  
  onRequestError({ request, error }) {
    console.error('Request error:', error)
    throw new NetworkError('Network request failed', error)
  },
  
  onResponseError({ response, request }) {
    const error = ApiError.fromResponse(response)
    
    // Handle specific status codes
    switch (response.status) {
      case 401:
        handleUnauthorized(error, request)
        break
      case 403:
        handleForbidden(error)
        break
      case 404:
        handleNotFound(error)
        break
      case 422:
        handleValidationError(error)
        break
      case 429:
        handleRateLimit(error, response)
        break
      case 500:
      case 502:
      case 503:
        handleServerError(error)
        break
    }
    
    throw error
  }
})

// Error handlers
async function handleUnauthorized(error: ApiError, request: any) {
  const { refreshToken, logout } = useAuthStore()
  
  if (error.code === 'TOKEN_EXPIRED') {
    try {
      await refreshToken()
      // Retry the original request
      return api(request.url, request.options)
    } catch (refreshError) {
      logout()
      await navigateTo('/login')
    }
  } else {
    logout()
    await navigateTo('/login')
  }
}

function handleForbidden(error: ApiError) {
  const { showToast } = useToast()
  showToast(error.userMessage, 'error')
}

function handleNotFound(error: ApiError) {
  const { showToast } = useToast()
  showToast(error.userMessage, 'error')
}

function handleValidationError(error: ApiError) {
  // Let components handle validation errors
  console.warn('Validation error:', error.details)
}

function handleRateLimit(error: ApiError, response: any) {
  const { showToast } = useToast()
  const retryAfter = response.headers.get('Retry-After')
  
  let message = error.userMessage
  if (retryAfter) {
    message += `（${retryAfter}秒後に再試行してください）`
  }
  
  showToast(message, 'warning')
}

function handleServerError(error: ApiError) {
  const { showToast } = useToast()
  showToast('サーバーエラーが発生しました。しばらく時間をおいてお試しください', 'error')
}
```

### 5. Retry Mechanism
Implement intelligent retry logic:

```typescript
// composables/useRetry.ts
export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryCondition?: (error: Error) => boolean
  onRetry?: (error: Error, attempt: number) => void
}

export const useRetry = (options: RetryOptions = {}) => {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => {
      return isApiError(error) ? error.isRetryable : isNetworkError(error)
    },
    onRetry
  } = options
  
  const executeWithRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        // Check if error should be retried
        if (!retryCondition(lastError) || attempt === maxAttempts) {
          throw lastError
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        )
        
        onRetry?.(lastError, attempt)
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
  }
  
  return { executeWithRetry }
}
```

### 6. Component Error Boundary
Create reusable error boundary component:

```vue
<!-- components/ErrorBoundary.vue -->
<script setup lang="ts">
interface Props {
  fallback?: Component
  showRetry?: boolean
  onError?: (error: Error) => void
}

const props = withDefaults(defineProps<Props>(), {
  showRetry: true
})

const error = ref<Error | null>(null)
const isRetrying = ref(false)

onErrorCaptured((err) => {
  error.value = err
  props.onError?.(err)
  return false // Prevent error propagation
})

const retry = () => {
  isRetrying.value = true
  error.value = null
  
  nextTick(() => {
    isRetrying.value = false
  })
}

const errorMessage = computed(() => {
  if (!error.value) return ''
  
  if (isApiError(error.value)) {
    return error.value.userMessage
  }
  
  return getUserFriendlyMessage('UNKNOWN_ERROR')
})
</script>

<template>
  <div v-if="error" class="error-boundary">
    <div v-if="fallback">
      <component 
        :is="fallback" 
        :error="error"
        :error-message="errorMessage"
        @retry="retry"
      />
    </div>
    <div v-else class="default-error-fallback">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">エラーが発生しました</h3>
      <p class="error-message">{{ errorMessage }}</p>
      <Button 
        v-if="showRetry" 
        @click="retry" 
        :loading="isRetrying"
        variant="outline"
      >
        再試行
      </Button>
    </div>
  </div>
  <slot v-else />
</template>

<style scoped>
.error-boundary {
  @apply p-6 text-center;
}

.default-error-fallback {
  @apply space-y-4;
}

.error-icon {
  @apply text-4xl;
}

.error-title {
  @apply text-lg font-semibold text-gray-900;
}

.error-message {
  @apply text-gray-600;
}
</style>
```

## Implementation Steps

1. **Global error handler setup** (0.5 hours)
   - Plugin for global error handling
   - Unhandled promise rejection handling

2. **API error enhancement** (1 hour)
   - Enhanced error types and classes
   - User-friendly error messages
   - Error categorization

3. **API client update** (1 hour)
   - Error handling in interceptors
   - Retry mechanism integration
   - Specific error handlers

4. **Component integration** (0.5 hours)
   - Error boundary component
   - Form error handling
   - Toast notifications

## Testing Requirements

### Unit Tests
```typescript
// utils/__tests__/api-error.test.ts
describe('ApiError', () => {
  it('should create ApiError from response', () => {
    const response = {
      status: 400,
      _data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: [{ field: 'email', message: 'Invalid email' }]
        }
      }
    }
    
    const error = ApiError.fromResponse(response)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.statusCode).toBe(400)
    expect(error.details?.length).toBe(1)
  })

  it('should determine if error is retryable', () => {
    const serverError = new ApiError('INTERNAL_ERROR', 500, 'Server error')
    const validationError = new ApiError('VALIDATION_ERROR', 400, 'Invalid input')
    
    expect(serverError.isRetryable).toBe(true)
    expect(validationError.isRetryable).toBe(false)
  })
})
```

### Integration Tests
- Error handling in authentication flow
- Network error scenarios
- Retry mechanism behavior
- Error boundary functionality

## Success Criteria

- [ ] All API errors are properly caught and handled
- [ ] User-friendly error messages are displayed
- [ ] Retry mechanism works for appropriate errors
- [ ] Error boundaries prevent application crashes
- [ ] Authentication errors trigger appropriate actions
- [ ] Validation errors are displayed at field level
- [ ] Network errors are handled gracefully

## Security Considerations

1. **Error Information**: Don't expose sensitive information in error messages
2. **Logging**: Log errors for monitoring without sensitive data
3. **Rate Limiting**: Handle rate limiting gracefully
4. **Attack Prevention**: Don't reveal system internals in error messages

## Files to Create/Modify

- `plugins/error-handler.client.ts` - Global error handler
- `utils/api-error.ts` - Enhanced error types
- `utils/error-messages.ts` - Localized error messages
- `utils/api.ts` - Updated API client
- `composables/useRetry.ts` - Retry mechanism
- `components/ErrorBoundary.vue` - Error boundary component

## Technical References

### Architecture Guidelines
- Reference: `/archived-2025-07-23/frontend/docs/api/error-handling.md` - Comprehensive API error handling patterns and user-friendly message strategies
- Reference: `/archived-2025-07-23/frontend/docs/developer-guide/architecture.md` - Error boundary patterns and component-level error handling
- Reference: `/archived-2025-07-23/frontend/CLAUDE.md` - Vue 3 error handling best practices with Composition API

### Design Patterns
- Implement global error handler following Vue 3 patterns
- Use the ApiError class structure from architecture documentation
- Follow the localized error message patterns for Japanese legal domain
- Use component error boundaries as documented in architecture guide

## Related Tasks

- T01_S02_AuthStore_API_Integration
- T03_S02_Token_Refresh_Implementation
- T05_S02_LoginForm_Storybook_Stories

---

**Note**: This task enhances error handling across the entire application. Test thoroughly with various error scenarios including network failures, server errors, and authentication issues.