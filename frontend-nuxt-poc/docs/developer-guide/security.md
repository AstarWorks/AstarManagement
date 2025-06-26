# Security Guide

This guide covers security best practices and implementation patterns for the Aster Management application.

## Authentication & Authorization

### JWT Token Management

```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const user = useState<User | null>('auth.user', () => null)
  const token = useCookie('auth-token', {
    default: () => null,
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
  
  const refreshToken = useCookie('refresh-token', {
    default: () => null,
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
  
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      // Tokens are set as httpOnly cookies by the server
      user.value = response.user
      
      await navigateTo('/dashboard')
    } catch (error) {
      throw new Error('Invalid credentials')
    }
  }
  
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      user.value = null
      token.value = null
      refreshToken.value = null
      await navigateTo('/login')
    }
  }
  
  const refreshAccessToken = async () => {
    try {
      const response = await $fetch('/api/auth/refresh', {
        method: 'POST'
      })
      
      user.value = response.user
      return response.accessToken
    } catch (error) {
      // Refresh failed, redirect to login
      await logout()
      throw error
    }
  }
  
  return {
    user: readonly(user),
    login,
    logout,
    refreshAccessToken
  }
}
```

### Role-Based Access Control (RBAC)

```typescript
// types/auth.ts
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: Permission[]
}

export type UserRole = 'ADMIN' | 'LAWYER' | 'CLERK' | 'CLIENT'

export interface Permission {
  id: string
  resource: string
  action: string
  conditions?: Record<string, any>
}

// composables/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuth()
  
  const hasPermission = (resource: string, action: string, context?: any): boolean => {
    if (!user.value) return false
    
    const permission = user.value.permissions.find(p => 
      p.resource === resource && p.action === action
    )
    
    if (!permission) return false
    
    // Check conditions if present
    if (permission.conditions && context) {
      return evaluateConditions(permission.conditions, context)
    }
    
    return true
  }
  
  const hasRole = (role: UserRole): boolean => {
    return user.value?.role === role
  }
  
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user.value ? roles.includes(user.value.role) : false
  }
  
  const canAccessMatter = (matter: Matter): boolean => {
    if (!user.value) return false
    
    // Admins and lawyers can access all matters
    if (hasAnyRole(['ADMIN', 'LAWYER'])) return true
    
    // Clients can only access their own matters
    if (hasRole('CLIENT')) {
      return matter.clientId === user.value.id
    }
    
    // Clerks can access matters they're assigned to
    if (hasRole('CLERK')) {
      return matter.assigneeId === user.value.id
    }
    
    return false
  }
  
  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    canAccessMatter
  }
}
```

### Route Protection

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()
  
  if (!user.value) {
    return navigateTo('/login', {
      query: { redirect: to.fullPath }
    })
  }
})

// middleware/rbac.ts
export default defineNuxtRouteMiddleware((to) => {
  const { hasPermission, hasRole } = usePermissions()
  
  // Check route-level permissions
  const requiredRole = to.meta.role as UserRole
  const requiredPermission = to.meta.permission as string
  
  if (requiredRole && !hasRole(requiredRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied: Insufficient role privileges'
    })
  }
  
  if (requiredPermission) {
    const [resource, action] = requiredPermission.split(':')
    if (!hasPermission(resource, action)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied: Insufficient permissions'
      })
    }
  }
})
```

## Input Validation & Sanitization

### Schema Validation

```typescript
// schemas/validation.ts
import { z } from 'zod'

// Sanitize and validate HTML input
const sanitizeHtml = (html: string): string => {
  // Use DOMPurify or similar library
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  })
}

export const matterSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Title too long')
    .regex(/^[\w\s\-\.]+$/, 'Title contains invalid characters'),
    
  description: z.string()
    .trim()
    .max(1000, 'Description too long')
    .transform(sanitizeHtml)
    .optional(),
    
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .max(254, 'Email too long'),
    
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional(),
    
  // File validation
  document: z.custom<File>((file) => {
    if (!(file instanceof File)) return false
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) return false
    
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]
    
    return allowedTypes.includes(file.type)
  }, 'Invalid file type or size')
})
```

### XSS Prevention

```vue
<!-- Use v-text instead of v-html when possible -->
<template>
  <div>
    <!-- Safe: Uses v-text -->
    <p v-text="userInput"></p>
    
    <!-- Dangerous: Direct HTML injection -->
    <!-- <p v-html="userInput"></p> -->
    
    <!-- Safe: Sanitized HTML -->
    <div v-html="sanitizedContent"></div>
  </div>
</template>

<script setup>
import DOMPurify from 'dompurify'

const props = defineProps<{
  userInput: string
  htmlContent: string
}>()

// Sanitize HTML content
const sanitizedContent = computed(() => {
  return DOMPurify.sanitize(props.htmlContent, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: []
  })
})
</script>
```

## CSRF Protection

```typescript
// plugins/csrf.client.ts
export default defineNuxtPlugin(async () => {
  // Get CSRF token on app initialization
  const csrfToken = await $fetch('/api/csrf-token')
  
  // Add CSRF token to all API requests
  $fetch.create({
    onRequest({ options }) {
      if (options.method !== 'GET') {
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': csrfToken
        }
      }
    }
  })
})
```

## Secure Headers

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          // Content Security Policy
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://api.example.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
          ].join('; '),
          
          // Security headers
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          
          // HTTPS enforcement
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
        }
      }
    }
  }
})
```

## Data Protection

### Sensitive Data Handling

```typescript
// utils/encryption.ts
import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!

export const encryptSensitiveData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
}

export const decryptSensitiveData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// Use for PII data
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@')
  const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2)
  return `${maskedUsername}@${domain}`
}

export const maskPhone = (phone: string): string => {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-***-$3')
}
```

### Secure File Uploads

```typescript
// composables/useSecureFileUpload.ts
export const useSecureFileUpload = () => {
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 10MB limit' }
    }
    
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' }
    }
    
    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase()
    const expectedExtensions: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png']
    }
    
    const validExtensions = expectedExtensions[file.type] || []
    if (!validExtensions.includes(extension || '')) {
      return { valid: false, error: 'File extension does not match file type' }
    }
    
    return { valid: true }
  }
  
  const uploadFile = async (file: File, matterId: string) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    
    // Generate secure filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2)
    const extension = file.name.split('.').pop()
    const secureFilename = `${matterId}_${timestamp}_${randomString}.${extension}`
    
    const formData = new FormData()
    formData.append('file', file, secureFilename)
    formData.append('matterId', matterId)
    
    return await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
  }
  
  return {
    validateFile,
    uploadFile
  }
}
```

## API Security

### Rate Limiting

```typescript
// server/api/middleware/rateLimit.ts
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export const rateLimit = (options: {
  windowMs: number
  maxRequests: number
}) => {
  return (req: any, res: any, next: any) => {
    const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const now = Date.now()
    
    // Clean up expired entries
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) {
        delete store[key]
      }
    })
    
    // Check rate limit
    if (!store[clientId]) {
      store[clientId] = {
        count: 1,
        resetTime: now + options.windowMs
      }
    } else {
      store[clientId].count++
    }
    
    if (store[clientId].count > options.maxRequests) {
      res.status(429).json({ error: 'Too many requests' })
      return
    }
    
    next()
  }
}
```

### Request Validation

```typescript
// server/api/matters/index.post.ts
import { z } from 'zod'
import { matterSchema } from '~/schemas/validation'

export default defineEventHandler(async (event) => {
  try {
    // Validate request body
    const body = await readBody(event)
    const validatedData = matterSchema.parse(body)
    
    // Check user permissions
    const user = await getUserFromToken(event)
    if (!user || !hasPermission(user, 'matters', 'create')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions'
      })
    }
    
    // Create matter with validated data
    const matter = await createMatter({
      ...validatedData,
      createdBy: user.id
    })
    
    return matter
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: error.errors
      })
    }
    
    throw error
  }
})
```

## Logging & Monitoring

### Security Event Logging

```typescript
// utils/securityLogger.ts
interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'PERMISSION_DENIED' | 'SUSPICIOUS_ACTIVITY' | 'DATA_ACCESS'
  userId?: string
  ip: string
  userAgent: string
  resource?: string
  details: Record<string, any>
  timestamp: Date
}

export const logSecurityEvent = async (event: SecurityEvent) => {
  // Log to secure audit trail
  console.log('[SECURITY]', JSON.stringify({
    ...event,
    timestamp: event.timestamp.toISOString()
  }))
  
  // Send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    await $fetch('/api/security/events', {
      method: 'POST',
      body: event
    })
  }
  
  // Alert on critical events
  if (event.type === 'SUSPICIOUS_ACTIVITY') {
    await sendSecurityAlert(event)
  }
}

// Usage in auth composable
export const useAuth = () => {
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      user.value = response.user
      
      // Log successful authentication
      await logSecurityEvent({
        type: 'AUTH_SUCCESS',
        userId: response.user.id,
        ip: await getClientIP(),
        userAgent: navigator.userAgent,
        details: { method: 'password' },
        timestamp: new Date()
      })
      
    } catch (error) {
      // Log failed authentication
      await logSecurityEvent({
        type: 'AUTH_FAILURE',
        ip: await getClientIP(),
        userAgent: navigator.userAgent,
        details: { 
          email: credentials.email,
          error: error.message 
        },
        timestamp: new Date()
      })
      
      throw error
    }
  }
}
```

## Security Testing

### Automated Security Tests

```typescript
// tests/security/xss.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MatterForm from '~/components/forms/MatterForm.vue'

describe('XSS Prevention', () => {
  it('should sanitize malicious script tags', async () => {
    const maliciousInput = '<script>alert("XSS")</script>'
    
    const wrapper = mount(MatterForm)
    
    await wrapper.find('input[name="title"]').setValue(maliciousInput)
    await wrapper.find('form').trigger('submit')
    
    // Verify script tags are removed
    expect(wrapper.text()).not.toContain('<script>')
    expect(wrapper.text()).not.toContain('alert')
  })
  
  it('should escape user-generated content', () => {
    const userContent = '<img src="x" onerror="alert(1)">'
    const escaped = escapeHtml(userContent)
    
    expect(escaped).not.toContain('onerror')
    expect(escaped).toContain('&lt;img')
  })
})

// tests/security/auth.test.ts
describe('Authentication Security', () => {
  it('should redirect unauthenticated users', async () => {
    const { $router } = await setupTest()
    
    await $router.push('/matters')
    
    expect($router.currentRoute.value.path).toBe('/login')
  })
  
  it('should prevent access with invalid token', async () => {
    const response = await $fetch('/api/matters', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    })
    
    expect(response.status).toBe(401)
  })
})
```

## Security Best Practices

### 1. Environment Variables

```bash
# .env (never commit to version control)
DATABASE_URL=postgresql://user:password@localhost:5432/aster
JWT_SECRET=super-secure-random-string-min-256-bits
ENCRYPTION_KEY=another-secure-key-for-data-encryption
API_KEY=third-party-service-api-key
```

### 2. Dependency Security

```bash
# Regular security audits
bun audit

# Fix vulnerabilities
bun audit --fix

# Use tools like Snyk
npx snyk test
npx snyk wizard
```

### 3. Code Security

```typescript
// Never log sensitive data
console.log('User logged in:', {
  id: user.id,
  email: user.email
  // Don't log: password, tokens, etc.
})

// Use secure randomness
const token = crypto.getRandomValues(new Uint8Array(32))

// Validate all inputs
const safeUserId = z.string().uuid().parse(userId)
```

### 4. Security Headers Checklist

- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Strict-Transport-Security
- ✅ Referrer-Policy
- ✅ Permissions-Policy

### 5. Regular Security Practices

- Keep dependencies updated
- Use automated security scanning
- Conduct regular penetration testing
- Implement security code reviews
- Monitor security logs
- Have an incident response plan