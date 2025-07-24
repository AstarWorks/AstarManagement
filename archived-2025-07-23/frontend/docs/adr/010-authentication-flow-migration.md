# ADR-010: Authentication Flow Migration to Vue/Nuxt

## Status
Accepted

## Context
The Aster Management system requires robust authentication that:
- Integrates with Spring Security OAuth2 backend
- Supports JWT tokens with refresh mechanism
- Handles 2FA (two-factor authentication)
- Works seamlessly with SSR/SPA hybrid approach
- Maintains security best practices
- Provides good UX with minimal authentication friction
- Supports role-based access control (Lawyer, Clerk, Client)
- Handles session management across tabs

The authentication must work across server-side rendered pages and client-side interactive features.

## Decision
We will implement a comprehensive authentication system using:
- Pinia store for auth state management
- Nuxt server middleware for SSR auth
- HTTP-only cookies for refresh tokens
- Memory storage for access tokens
- Composables for auth operations
- Route middleware for protection
- Automatic token refresh

Implementation approach:
- Server-side token validation for SSR pages
- Client-side token management for SPA sections
- Seamless handoff between SSR and CSR
- Secure token storage patterns

## Consequences

### Positive
- Secure token handling with HTTP-only cookies
- Automatic token refresh improves UX
- SSR-compatible authentication
- Protection against XSS attacks
- Consistent auth state across rendering modes
- Type-safe auth operations
- Built-in CSRF protection

### Negative
- Complex token refresh logic
- Need to handle edge cases (expired refresh tokens)
- SSR/CSR synchronization complexity
- Multiple storage mechanisms

### Neutral
- Need comprehensive testing for auth flows
- Documentation for various auth scenarios
- Monitoring for failed auth attempts

## Alternatives Considered

### Alternative 1: Local Storage for Tokens
- **Pros**: Simple implementation, works everywhere
- **Cons**: Vulnerable to XSS, not SSR-compatible
- **Reason for rejection**: Security vulnerabilities

### Alternative 2: Session-Based Auth
- **Pros**: Simple, server manages state
- **Cons**: Not RESTful, scaling issues, CORS complications
- **Reason for rejection**: Doesn't fit microservices architecture

### Alternative 3: Third-Party Auth (Auth0, Clerk)
- **Pros**: Robust features, less maintenance
- **Cons**: External dependency, cost, data sovereignty concerns
- **Reason for rejection**: Need full control for legal compliance

### Alternative 4: Cookie-Only Auth
- **Pros**: Simple, SSR-friendly
- **Cons**: Size limitations, less flexible
- **Reason for rejection**: Need separate access/refresh tokens

## Implementation Notes

### Auth Store Implementation
```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshTokenTimeout = ref<NodeJS.Timeout | null>(null)
  
  const isAuthenticated = computed(() => !!user.value)
  
  const login = async (credentials: LoginCredentials) => {
    const { data } = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    
    user.value = data.user
    accessToken.value = data.accessToken
    
    // Refresh token stored as HTTP-only cookie by server
    scheduleTokenRefresh(data.expiresIn)
    
    await navigateTo('/matters')
  }
  
  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    
    user.value = null
    accessToken.value = null
    clearTokenRefresh()
    
    await navigateTo('/login')
  }
  
  const refreshAccessToken = async () => {
    try {
      const { data } = await $fetch('/api/auth/refresh', {
        method: 'POST'
      })
      
      accessToken.value = data.accessToken
      scheduleTokenRefresh(data.expiresIn)
    } catch (error) {
      await logout()
    }
  }
  
  const scheduleTokenRefresh = (expiresIn: number) => {
    clearTokenRefresh()
    // Refresh 5 minutes before expiry
    const timeout = (expiresIn - 300) * 1000
    refreshTokenTimeout.value = setTimeout(refreshAccessToken, timeout)
  }
  
  const clearTokenRefresh = () => {
    if (refreshTokenTimeout.value) {
      clearTimeout(refreshTokenTimeout.value)
      refreshTokenTimeout.value = null
    }
  }
  
  return {
    user: readonly(user),
    isAuthenticated,
    login,
    logout,
    refreshAccessToken,
    accessToken: readonly(accessToken)
  }
})
```

### Server Middleware for SSR Auth
```typescript
// server/middleware/auth.ts
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  // Only run on SSR page requests
  if (!event.node.req.url?.startsWith('/api') && 
      event.node.req.headers.accept?.includes('text/html')) {
    
    const refreshToken = getCookie(event, 'refresh-token')
    
    if (refreshToken) {
      try {
        // Validate refresh token
        const payload = jwt.verify(refreshToken, process.env.JWT_SECRET)
        
        // Get fresh access token
        const { accessToken, user } = await refreshAuthToken(refreshToken)
        
        // Store in Nuxt context for SSR
        event.context.auth = { accessToken, user }
      } catch (error) {
        // Invalid token, clear it
        deleteCookie(event, 'refresh-token')
      }
    }
  }
})
```

### Plugin for Client-Side Hydration
```typescript
// plugins/auth.client.ts
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  const nuxtApp = useNuxtApp()
  
  // Hydrate auth state from SSR
  if (nuxtApp.payload.auth) {
    authStore.$patch({
      user: nuxtApp.payload.auth.user,
      accessToken: nuxtApp.payload.auth.accessToken
    })
    
    // Schedule token refresh
    authStore.scheduleTokenRefresh(nuxtApp.payload.auth.expiresIn)
  }
  
  // Check auth on route change
  useRouter().beforeEach((to, from) => {
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return navigateTo('/login')
    }
  })
})
```

### API Plugin with Auth Headers
```typescript
// plugins/api.ts
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  
  const api = $fetch.create({
    baseURL: '/api',
    onRequest({ request, options }) {
      const token = authStore.accessToken
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        return authStore.logout()
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

### 2FA Implementation
```vue
<!-- pages/login/2fa.vue -->
<script setup>
const route = useRoute()
const authStore = useAuthStore()
const code = ref('')

const verify2FA = async () => {
  await authStore.verify2FA({
    token: route.query.token,
    code: code.value
  })
}
</script>

<template>
  <form @submit.prevent="verify2FA">
    <h2>Two-Factor Authentication</h2>
    <input
      v-model="code"
      type="text"
      inputmode="numeric"
      pattern="[0-9]{6}"
      maxlength="6"
      placeholder="000000"
      required
    />
    <button type="submit">Verify</button>
  </form>
</template>
```

## References
- [Nuxt 3 Authentication Guide](https://nuxt.com/docs/guide/directory-structure/server)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- Spring Security OAuth2 Documentation
- ADR-002: State Management Solution (Pinia)
- ADR-009: SSR/SPA Hybrid Approach

## History
- **2025-01-02**: Initial draft created
- **2025-01-02**: Decision accepted for secure hybrid authentication