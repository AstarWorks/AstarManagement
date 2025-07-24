# API Error Handling Guide

This guide covers error handling patterns for the Aster Management API, including error formats, common error codes, and implementation strategies in Nuxt.js.

## Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string           // Machine-readable error code
    message: string        // Human-readable error message
    details?: ErrorDetail[] // Field-specific errors
    timestamp?: string     // When the error occurred
    path?: string         // API endpoint path
    traceId?: string      // For debugging/support
  }
}

interface ErrorDetail {
  field: string           // Field name that caused the error
  message: string         // Field-specific error message
  value?: unknown        // The invalid value (if safe to return)
  code?: string          // Field-specific error code
}
```

## HTTP Status Codes

### 4xx Client Errors

#### 400 Bad Request
Invalid request syntax or validation errors.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "not-an-email"
      },
      {
        "field": "dueDate",
        "message": "Due date must be in the future",
        "value": "2023-01-01"
      }
    ]
  }
}
```

#### 401 Unauthorized
Missing or invalid authentication.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired"
  }
}
```

#### 403 Forbidden
Authenticated but lacks permission.

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "This action requires 'matter:delete' permission"
  }
}
```

#### 404 Not Found
Resource doesn't exist.

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Matter not found",
    "details": [
      {
        "field": "id",
        "message": "No matter exists with ID: 550e8400-e29b-41d4-a716-446655440001"
      }
    ]
  }
}
```

#### 409 Conflict
Request conflicts with current state.

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Email address already in use"
  }
}
```

```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition matter from ARCHIVED to ACTIVE"
  }
}
```

#### 422 Unprocessable Entity
Business rule violation.

```json
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Cannot delete matter with active tasks"
  }
}
```

#### 429 Too Many Requests
Rate limit exceeded.

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": {
      "limit": 100,
      "window": "1h",
      "retryAfter": 3600
    }
  }
}
```

### 5xx Server Errors

#### 500 Internal Server Error
Unexpected server error.

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "traceId": "abc-123-def-456"
  }
}
```

#### 502 Bad Gateway
Upstream service error.

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Document processing service is temporarily unavailable"
  }
}
```

#### 503 Service Unavailable
Service is down or in maintenance.

```json
{
  "error": {
    "code": "MAINTENANCE_MODE",
    "message": "System is under maintenance. Please try again later.",
    "details": {
      "estimatedDowntime": "30m",
      "maintenanceEndTime": "2024-04-01T15:00:00Z"
    }
  }
}
```

## Common Error Codes

### Authentication & Authorization
- `UNAUTHORIZED` - No authentication provided
- `TOKEN_EXPIRED` - JWT token has expired
- `TOKEN_INVALID` - JWT token is malformed
- `FORBIDDEN` - Lacks required permission
- `INSUFFICIENT_PERMISSIONS` - Specific permission missing
- `ACCOUNT_SUSPENDED` - User account is suspended
- `2FA_REQUIRED` - Two-factor authentication needed

### Validation
- `VALIDATION_ERROR` - General validation failure
- `REQUIRED_FIELD_MISSING` - Required field not provided
- `INVALID_FORMAT` - Field format is invalid
- `VALUE_TOO_LONG` - Value exceeds max length
- `VALUE_TOO_SHORT` - Value below min length
- `INVALID_ENUM_VALUE` - Value not in allowed list
- `INVALID_DATE_RANGE` - Date range is invalid

### Business Logic
- `BUSINESS_RULE_VIOLATION` - Business rule check failed
- `INVALID_STATE_TRANSITION` - State change not allowed
- `DUPLICATE_ENTRY` - Unique constraint violation
- `REFERENTIAL_INTEGRITY` - Foreign key constraint
- `QUOTA_EXCEEDED` - Usage limit reached
- `INSUFFICIENT_BALANCE` - Not enough credits/balance

### Resource Management
- `NOT_FOUND` - Resource doesn't exist
- `ALREADY_EXISTS` - Resource already exists
- `RESOURCE_LOCKED` - Resource is locked by another process
- `RESOURCE_DELETED` - Resource has been deleted
- `VERSION_CONFLICT` - Optimistic locking failure

### File Operations
- `FILE_TOO_LARGE` - File exceeds size limit
- `UNSUPPORTED_FILE_TYPE` - File type not allowed
- `FILE_UPLOAD_FAILED` - Upload process failed
- `FILE_PROCESSING_FAILED` - Processing (OCR, etc.) failed
- `VIRUS_DETECTED` - Malware found in file

## Error Handling in Nuxt.js

### Global Error Handler

Create a plugin for centralized error handling:

```typescript
// plugins/error-handler.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('Global error:', error)
    
    // Send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Sentry, LogRocket, etc.
    }
  }
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
  })
})
```

### API Error Interceptor

Configure $fetch to handle errors consistently:

```typescript
// plugins/api.ts
export default defineNuxtPlugin(() => {
  const { showToast } = useToast()
  const { logout } = useAuthStore()
  
  const api = $fetch.create({
    baseURL: '/api/v1',
    
    onRequest({ options }) {
      const { token } = useAuthStore()
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`
        }
      }
    },
    
    onResponseError({ response }) {
      const error = response._data?.error
      
      switch (response.status) {
        case 401:
          // Handle authentication errors
          if (error?.code === 'TOKEN_EXPIRED') {
            // Try to refresh token
            return refreshTokenAndRetry(response)
          }
          logout()
          navigateTo('/login')
          break
          
        case 403:
          showToast('You don\'t have permission to perform this action', 'error')
          break
          
        case 404:
          showToast('Resource not found', 'error')
          break
          
        case 422:
          // Business rule violations
          showToast(error?.message || 'Operation failed', 'error')
          break
          
        case 429:
          // Rate limiting
          const retryAfter = error?.details?.retryAfter
          showToast(
            `Too many requests. Please wait ${retryAfter} seconds`,
            'warning'
          )
          break
          
        case 500:
        case 502:
        case 503:
          showToast('Server error. Please try again later', 'error')
          break
      }
    }
  })
  
  return {
    provide: {
      api
    }
  }
})
```

### Type-Safe Error Handling

```typescript
// utils/api-error.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: ErrorDetail[]
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
      error?.details
    )
  }
}

// Type guard
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

// Error code type guard
export function hasErrorCode<T extends string>(
  error: unknown,
  code: T
): error is ApiError & { code: T } {
  return isApiError(error) && error.code === code
}
```

### Component-Level Error Handling

```vue
<script setup lang="ts">
import { isApiError, hasErrorCode } from '~/utils/api-error'

const { createMatter } = useMatters()
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

const handleSubmit = async (data: CreateMatterRequest) => {
  error.value = null
  fieldErrors.value = {}
  
  try {
    await createMatter(data)
    await navigateTo('/matters')
  } catch (err) {
    if (hasErrorCode(err, 'VALIDATION_ERROR')) {
      // Handle validation errors
      err.details?.forEach(detail => {
        fieldErrors.value[detail.field] = detail.message
      })
    } else if (hasErrorCode(err, 'QUOTA_EXCEEDED')) {
      // Handle specific business errors
      error.value = 'You have reached your matter limit. Please upgrade your plan.'
    } else if (isApiError(err)) {
      // Handle other API errors
      error.value = err.message
    } else {
      // Handle unexpected errors
      error.value = 'An unexpected error occurred'
      console.error(err)
    }
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>
    
    <FormField>
      <FormLabel>Title</FormLabel>
      <FormControl>
        <Input v-model="title" :error="fieldErrors.title" />
      </FormControl>
      <FormMessage v-if="fieldErrors.title">
        {{ fieldErrors.title }}
      </FormMessage>
    </FormField>
  </form>
</template>
```

### Async Error Boundaries

```vue
<!-- components/AsyncErrorBoundary.vue -->
<script setup lang="ts">
interface Props {
  fallback?: Component
  onError?: (error: Error) => void
}

const props = defineProps<Props>()
const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err
  props.onError?.(err)
  return false
})

const retry = () => {
  error.value = null
}
</script>

<template>
  <div v-if="error" class="error-boundary">
    <component 
      v-if="fallback" 
      :is="fallback" 
      :error="error"
      @retry="retry"
    />
    <div v-else class="default-error">
      <h3>Something went wrong</h3>
      <p>{{ error.message }}</p>
      <button @click="retry">Try Again</button>
    </div>
  </div>
  <slot v-else />
</template>
```

### Retry Logic

```typescript
// composables/useRetry.ts
export const useRetry = (
  fn: () => Promise<any>,
  options: {
    maxAttempts?: number
    delay?: number
    backoff?: boolean
    onError?: (error: Error, attempt: number) => void
  } = {}
) => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onError
  } = options
  
  const execute = async () => {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        onError?.(lastError, attempt)
        
        if (attempt < maxAttempts) {
          const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }
    
    throw lastError!
  }
  
  return { execute }
}

// Usage
const { execute } = useRetry(
  () => fetchCriticalData(),
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: true,
    onError: (error, attempt) => {
      console.log(`Attempt ${attempt} failed:`, error)
    }
  }
)
```

## Best Practices

1. **Always handle errors at the appropriate level**
   - Global handlers for unexpected errors
   - Component-level for user feedback
   - Form-level for validation errors

2. **Provide meaningful error messages**
   - User-friendly messages in the UI
   - Technical details in logs
   - Error codes for support

3. **Implement retry mechanisms**
   - Automatic retry for transient failures
   - Manual retry options for users
   - Exponential backoff for rate limits

4. **Track errors**
   - Log errors with context
   - Monitor error rates
   - Alert on error spikes

5. **Test error scenarios**
   - Unit tests for error handling
   - E2E tests for error flows
   - Load tests for rate limits