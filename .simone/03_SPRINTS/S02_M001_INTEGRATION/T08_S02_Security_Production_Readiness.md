# T08_S02 - Security & Production Readiness

## Task Overview
**Duration**: 3 hours  
**Priority**: High  
**Dependencies**: All previous tasks in S02_M001_INTEGRATION  
**Sprint**: S02_M001_INTEGRATION  

## Objective
Implement security hardening measures and production readiness checks for the authentication system, including CSRF protection, security headers, audit logging, and vulnerability assessments.

## Background
Before deploying to production, the authentication system must be secured against common attacks and meet security compliance requirements for a legal practice management system. This includes:
- CSRF protection
- Security headers
- Audit logging
- Input sanitization
- Rate limiting
- Vulnerability assessment

## Technical Requirements

### 1. CSRF Protection Implementation
Implement comprehensive CSRF protection:

```typescript
// plugins/csrf-protection.client.ts
export default defineNuxtPlugin(async () => {
  const { $fetch } = useNuxtApp()
  
  // Get CSRF token on app initialization
  let csrfToken: string | null = null
  
  try {
    const response = await $fetch<{ token: string }>('/api/v1/auth/csrf-token')
    csrfToken = response.token
    
    // Store in cookie for future requests
    const csrfCookie = useCookie('csrf-token', {
      httpOnly: false,
      secure: true,
      sameSite: 'strict'
    })
    csrfCookie.value = csrfToken
  } catch (error) {
    console.error('Failed to get CSRF token:', error)
  }
  
  // Add CSRF token to all state-changing requests
  const api = $fetch.create({
    onRequest({ options }) {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
        const token = csrfToken || useCookie('csrf-token').value
        if (token) {
          options.headers = {
            ...options.headers,
            'X-CSRF-Token': token
          }
        }
      }
    },
    
    onResponseError({ response }) {
      // Handle CSRF token mismatch
      if (response.status === 403 && response._data?.error?.code === 'CSRF_TOKEN_MISMATCH') {
        // Refresh CSRF token and retry
        return refreshCSRFTokenAndRetry(response)
      }
    }
  })
  
  return {
    provide: {
      secureApi: api
    }
  }
})

async function refreshCSRFTokenAndRetry(response: any) {
  try {
    const newToken = await $fetch<{ token: string }>('/api/v1/auth/csrf-token')
    const csrfCookie = useCookie('csrf-token')
    csrfCookie.value = newToken.token
    
    // Retry original request with new token
    return $fetch(response.request.url, {
      ...response.request.options,
      headers: {
        ...response.request.options.headers,
        'X-CSRF-Token': newToken.token
      }
    })
  } catch (error) {
    console.error('Failed to refresh CSRF token:', error)
    throw response._data
  }
}
```

### 2. Security Headers Configuration
Configure security headers for production:

```typescript
// nuxt.config.ts (security additions)
export default defineNuxtConfig({
  // ... existing config
  
  nitro: {
    routeRules: {
      // Security headers for all routes
      '/**': {
        headers: {
          // Prevent MIME type sniffing
          'X-Content-Type-Options': 'nosniff',
          
          // Enable XSS protection
          'X-XSS-Protection': '1; mode=block',
          
          // Prevent clickjacking
          'X-Frame-Options': 'DENY',
          
          // Strict transport security (HTTPS only)
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
          
          // Content Security Policy
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'", // For Nuxt hydration
            "style-src 'self' 'unsafe-inline'", // For component styling
            "img-src 'self' data: https:",
            "font-src 'self' https:",
            "connect-src 'self' https://api.astermanagement.com",
            "frame-ancestors 'none'"
          ].join('; '),
          
          // Referrer policy
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          
          // Permissions policy
          'Permissions-Policy': [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()'
          ].join(', ')
        }
      },
      
      // Additional security for API routes
      '/api/**': {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    }
  },
  
  // Runtime config for security settings
  runtimeConfig: {
    public: {
      security: {
        csrfProtection: true,
        rateLimiting: true,
        auditLogging: true
      }
    }
  }
})
```

### 3. Audit Logging System
Implement comprehensive audit logging:

```typescript
// composables/useAuditLog.ts
export interface AuditLogEntry {
  eventType: 'AUTH_LOGIN' | 'AUTH_LOGOUT' | 'AUTH_FAILED' | 'TOKEN_REFRESH' | 'PERMISSION_DENIED'
  userId?: string
  email?: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  details: Record<string, any>
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export const useAuditLog = () => {
  const logSecurityEvent = async (entry: Omit<AuditLogEntry, 'timestamp' | 'ipAddress' | 'userAgent'>) => {
    try {
      const headers = useRequestHeaders()
      
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date(),
        ipAddress: getClientIP(headers),
        userAgent: headers['user-agent'] || 'Unknown'
      }
      
      // Send to backend audit service
      await $fetch('/api/v1/audit/log', {
        method: 'POST',
        body: auditEntry
      })
      
      // Also log locally for development
      if (process.dev) {
        console.log('Security Event:', auditEntry)
      }
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }
  
  const logLoginAttempt = async (email: string, success: boolean, details?: Record<string, any>) => {
    await logSecurityEvent({
      eventType: success ? 'AUTH_LOGIN' : 'AUTH_FAILED',
      email,
      details: {
        success,
        ...details
      },
      riskLevel: success ? 'LOW' : 'MEDIUM'
    })
  }
  
  const logLogout = async (userId: string) => {
    await logSecurityEvent({
      eventType: 'AUTH_LOGOUT',
      userId,
      details: {},
      riskLevel: 'LOW'
    })
  }
  
  const logTokenRefresh = async (userId: string, success: boolean) => {
    await logSecurityEvent({
      eventType: 'TOKEN_REFRESH',
      userId,
      details: { success },
      riskLevel: success ? 'LOW' : 'MEDIUM'
    })
  }
  
  const logPermissionDenied = async (userId: string, resource: string, action: string) => {
    await logSecurityEvent({
      eventType: 'PERMISSION_DENIED',
      userId,
      details: { resource, action },
      riskLevel: 'HIGH'
    })
  }
  
  return {
    logLoginAttempt,
    logLogout,
    logTokenRefresh,
    logPermissionDenied
  }
}

// Utility function to get client IP
function getClientIP(headers: Record<string, string>): string {
  return headers['x-forwarded-for']?.split(',')[0] ||
         headers['x-real-ip'] ||
         headers['cf-connecting-ip'] ||
         'unknown'
}
```

### 4. Input Sanitization and Validation
Implement robust input sanitization:

```typescript
// utils/security.ts
import DOMPurify from 'isomorphic-dompurify'

export const sanitizeInput = (input: string): string => {
  // Remove HTML tags and potentially dangerous content
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

export const sanitizeEmail = (email: string): string => {
  // Basic email sanitization
  return email.toLowerCase().trim()
}

export const validateSecurePassword = (password: string): boolean => {
  // Strong password requirements for legal practice
  const minLength = 12
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const noCommonPatterns = !/(123456|password|qwerty|admin)/i.test(password)
  
  return password.length >= minLength &&
         hasUppercase &&
         hasLowercase &&
         hasNumbers &&
         hasSpecialChars &&
         noCommonPatterns
}

export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized = {} as T
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value
    }
  }
  
  return sanitized
}

// Rate limiting utilities
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, { count: number; resetTime: number }>()
  
  return {
    isAllowed: (identifier: string): boolean => {
      const now = Date.now()
      const userAttempts = attempts.get(identifier)
      
      if (!userAttempts || now > userAttempts.resetTime) {
        attempts.set(identifier, { count: 1, resetTime: now + windowMs })
        return true
      }
      
      if (userAttempts.count >= maxAttempts) {
        return false
      }
      
      userAttempts.count++
      return true
    },
    
    getRemainingAttempts: (identifier: string): number => {
      const userAttempts = attempts.get(identifier)
      if (!userAttempts || Date.now() > userAttempts.resetTime) {
        return maxAttempts
      }
      return Math.max(0, maxAttempts - userAttempts.count)
    }
  }
}
```

### 5. Enhanced AuthStore with Security
Update AuthStore with security measures:

```typescript
// stores/auth.ts (security additions)
export const useAuthStore = defineStore('auth', () => {
  // ... existing code ...
  
  const { logLoginAttempt, logLogout, logPermissionDenied } = useAuditLog()
  
  // Rate limiter for login attempts
  const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000) // 5 attempts per 15 minutes
  
  const login = async (credentials: LoginForm) => {
    const clientId = getClientFingerprint()
    
    // Check rate limiting
    if (!loginRateLimiter.isAllowed(clientId)) {
      const error = new Error('Too many login attempts. Please try again later.')
      await logLoginAttempt(credentials.email, false, { 
        reason: 'RATE_LIMITED',
        clientId 
      })
      throw error
    }
    
    // Sanitize input
    const sanitizedCredentials = {
      email: sanitizeEmail(credentials.email),
      password: credentials.password, // Don't sanitize password
      rememberMe: credentials.rememberMe
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: sanitizedCredentials
      })
      
      if (response.requiresTwoFactor) {
        await logLoginAttempt(sanitizedCredentials.email, false, { 
          reason: '2FA_REQUIRED' 
        })
        return { requiresTwoFactor: true, challenge: response.twoFactorChallenge }
      }
      
      // Successful login
      user.value = response.user
      tokens.value = response.tokens
      
      await storeTokens(response.tokens)
      initializeTokenRefresh()
      
      await logLoginAttempt(sanitizedCredentials.email, true, {
        userId: response.user.id,
        sessionId: response.tokens.accessToken.substring(0, 8) // Log partial token for tracking
      })
      
      return { success: true }
    } catch (err) {
      const errorMessage = handleApiError(err)
      error.value = errorMessage
      
      await logLoginAttempt(sanitizedCredentials.email, false, {
        error: errorMessage,
        clientId
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const logout = async () => {
    const currentUserId = user.value?.id
    
    try {
      await $fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      // Clean up regardless of API success
      user.value = null
      tokens.value = null
      
      if (tokenRefreshService) {
        tokenRefreshService.cleanup()
        tokenRefreshService = null
      }
      
      sessionStorage.clear()
      
      if (currentUserId) {
        await logLogout(currentUserId)
      }
      
      await navigateTo('/login')
    }
  }
  
  // ... rest of existing code ...
})

// Client fingerprinting for rate limiting
function getClientFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx?.fillText('fingerprint', 10, 10)
  const canvasFingerprint = canvas.toDataURL()
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvasFingerprint.substring(0, 50)
  ].join('|')
  
  // Simple hash function
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return hash.toString(36)
}
```

### 6. Security Testing Suite
Create automated security tests:

```typescript
// tests/security/auth-security.test.ts
import { test, expect } from '@playwright/test'
import { setupTestData, cleanupTestData } from '../e2e/utils/auth-helpers'

test.describe('Authentication Security', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestData(page)
  })

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page)
  })

  test('should prevent CSRF attacks', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit login without CSRF token
    const response = await page.request.post('/api/v1/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    expect(response.status()).toBe(403)
    const error = await response.json()
    expect(error.error.code).toBe('CSRF_TOKEN_MISSING')
  })

  test('should enforce rate limiting', async ({ page }) => {
    await page.goto('/login')
    
    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      await page.click('[data-testid="login-button"]')
      
      if (i < 5) {
        await expect(page.locator('[data-testid="error-message"]')).toContainText('メールアドレスまたはパスワードが正しくありません')
      } else {
        await expect(page.locator('[data-testid="error-message"]')).toContainText('ログイン試行回数が多すぎます')
      }
    }
  })

  test('should sanitize input data', async ({ page }) => {
    await page.goto('/login')
    
    // Try XSS attack in email field
    const maliciousEmail = '<script>alert("xss")</script>@example.com'
    await page.fill('[data-testid="email-input"]', maliciousEmail)
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Should not execute script
    const alerts = []
    page.on('dialog', dialog => {
      alerts.push(dialog.message())
      dialog.dismiss()
    })
    
    await page.waitForTimeout(1000)
    expect(alerts).toHaveLength(0)
  })

  test('should set secure headers', async ({ page }) => {
    const response = await page.goto('/login')
    
    const headers = response?.headers() || {}
    
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-xss-protection']).toBe('1; mode=block')
    expect(headers['strict-transport-security']).toContain('max-age=31536000')
    expect(headers['content-security-policy']).toContain("default-src 'self'")
  })

  test('should validate password strength', async ({ page }) => {
    await page.goto('/register') // Assuming there's a registration page
    
    const weakPasswords = [
      '123456',
      'password',
      'qwerty',
      'admin',
      'short'
    ]
    
    for (const password of weakPasswords) {
      await page.fill('[data-testid="password-input"]', password)
      await page.blur('[data-testid="password-input"]')
      
      await expect(page.locator('[data-testid="password-error"]')).toContainText('パスワードが弱すぎます')
    }
  })

  test('should prevent session fixation', async ({ page }) => {
    // Get initial session
    await page.goto('/login')
    const initialCookies = await page.context().cookies()
    
    // Login
    await page.fill('[data-testid="email-input"]', 'lawyer@test.com')
    await page.fill('[data-testid="password-input"]', 'Password123!')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Verify session ID changed after login
    const postLoginCookies = await page.context().cookies()
    const sessionCookie = postLoginCookies.find(c => c.name.includes('session'))
    const initialSessionCookie = initialCookies.find(c => c.name.includes('session'))
    
    if (sessionCookie && initialSessionCookie) {
      expect(sessionCookie.value).not.toBe(initialSessionCookie.value)
    }
  })
})
```

### 7. Production Environment Configuration
Create production-specific security configuration:

```typescript
// utils/security-config.ts
export const getSecurityConfig = () => {
  const config = useRuntimeConfig()
  
  return {
    // HTTPS enforcement
    enforceHttps: config.public.NODE_ENV === 'production',
    
    // Session configuration
    session: {
      secure: config.public.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    
    // CSRF protection
    csrf: {
      enabled: true,
      cookieName: 'csrf-token',
      headerName: 'X-CSRF-Token'
    },
    
    // Rate limiting
    rateLimit: {
      login: {
        max: 5,
        windowMs: 15 * 60 * 1000 // 15 minutes
      },
      api: {
        max: 100,
        windowMs: 15 * 60 * 1000 // 15 minutes
      }
    },
    
    // Password policy
    password: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true
    },
    
    // Audit logging
    audit: {
      enabled: true,
      logLevel: 'INFO',
      retentionDays: 90
    }
  }
}
```

## Implementation Steps

1. **CSRF protection and security headers** (1 hour)
   - Implement CSRF token handling
   - Configure security headers
   - Add input sanitization

2. **Audit logging system** (1 hour)
   - Create audit logging composable
   - Integrate with authentication flows
   - Add security event tracking

3. **Security testing and validation** (1 hour)
   - Create security test suite
   - Vulnerability assessment
   - Production configuration review

## Testing Requirements

### Security Test Checklist
- [ ] CSRF protection works correctly
- [ ] Rate limiting prevents brute force attacks
- [ ] Input sanitization prevents XSS
- [ ] Security headers are properly set
- [ ] Password strength requirements enforced
- [ ] Session management is secure
- [ ] Audit logging captures all events
- [ ] No sensitive data in client logs

### Vulnerability Assessment
- OWASP Top 10 compliance check
- SQL injection prevention
- XSS protection verification
- CSRF protection validation
- Session security review
- Authentication bypass attempts

## Success Criteria

- [ ] All security headers properly configured
- [ ] CSRF protection implemented and tested
- [ ] Rate limiting prevents abuse
- [ ] Audit logging captures security events
- [ ] Input sanitization prevents attacks
- [ ] Security tests pass
- [ ] Vulnerability assessment clean
- [ ] Production configuration secure

## Security Compliance

### Legal Industry Requirements
- Client data protection (attorney-client privilege)
- Access logging for compliance audits
- Secure authentication for sensitive data
- Data breach prevention measures
- Regulatory compliance (depending on jurisdiction)

### Security Standards
- Follow OWASP security guidelines
- Implement defense in depth
- Use principle of least privilege
- Regular security assessments
- Incident response procedures

## Files to Create/Modify

- `plugins/csrf-protection.client.ts` - CSRF protection
- `composables/useAuditLog.ts` - Audit logging system
- `utils/security.ts` - Security utilities
- `utils/security-config.ts` - Production security config
- `stores/auth.ts` - Enhanced AuthStore with security
- `nuxt.config.ts` - Security headers configuration
- `tests/security/auth-security.test.ts` - Security tests

## Technical References

### Architecture Guidelines
- Reference: `/archived-2025-07-23/frontend/docs/developer-guide/architecture.md` - Security architecture patterns and production deployment considerations
- Reference: `/archived-2025-07-23/frontend/docs/api/error-handling.md` - Security-focused error handling and information disclosure prevention
- Reference: `CLAUDE.md` - Security requirements for legal practice management systems

### Security Standards
- OWASP Top 10 compliance requirements
- Legal industry data protection standards (attorney-client privilege)
- Japanese data protection regulations compliance
- Multi-tenant security patterns from project architecture

### Design Patterns
- Implement defense-in-depth security strategy
- Use established CSRF protection patterns
- Follow audit logging patterns for legal compliance
- Implement rate limiting patterns for abuse prevention

## Related Tasks

- All previous tasks in S02_M001_INTEGRATION sprint
- Future security reviews and updates
- Compliance auditing tasks

---

**Note**: Security is an ongoing process. Regularly review and update security measures, conduct penetration testing, and stay informed about new security threats and best practices.