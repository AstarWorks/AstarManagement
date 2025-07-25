# T04_S02 - Route Protection Verification

## Task Overview
**Duration**: 2 hours  
**Priority**: High  
**Dependencies**: T01_S02_AuthStore_API_Integration, T03_S02_Token_Refresh_Implementation  
**Sprint**: S02_M001_INTEGRATION  

## Objective
Verify and enhance route protection middleware to work with real authentication, implement role-based access control (RBAC), and ensure secure access to protected routes.

## Background
The current middleware provides basic authentication checks using mock data. With real backend integration, we need to:
- Verify JWT tokens with backend
- Implement proper RBAC based on user permissions
- Handle edge cases (token expiry, permission changes)
- Provide proper error handling and redirects
- Support different authentication states

## Technical Requirements

### 1. Enhanced Authentication Middleware
Update the main authentication middleware:

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, tokens, isLoading } = useAuthStore()
  const { getValidToken } = useTokenRefresh()
  
  // Skip middleware during SSR
  if (process.server) {
    return
  }
  
  // Don't check auth on public routes
  if (to.meta.public) {
    return
  }
  
  // Set loading state
  isLoading.value = true
  
  try {
    // Get valid token (will refresh if needed)
    const token = await getValidToken()
    
    if (!token) {
      console.log('No valid token found, redirecting to login')
      return navigateTo('/login', { replace: true })
    }
    
    // If no user data, fetch current user
    if (!user.value) {
      await fetchCurrentUser()
    }
    
    // Check if user still exists and is active
    if (!user.value) {
      console.log('User data not available, redirecting to login')
      return navigateTo('/login', { replace: true })
    }
    
    // Check route-specific permissions
    if (to.meta.permission && !hasPermission(to.meta.permission)) {
      console.log(`Access denied: missing permission ${to.meta.permission}`)
      throw createError({
        statusCode: 403,
        statusMessage: 'この操作を実行する権限がありません'
      })
    }
    
    // Check role-based access
    if (to.meta.roles && !hasAnyRole(to.meta.roles)) {
      console.log(`Access denied: user lacks required roles`)
      throw createError({
        statusCode: 403,
        statusMessage: 'この機能にアクセスする権限がありません'
      })
    }
    
  } catch (error) {
    console.error('Authentication middleware error:', error)
    
    if (error.statusCode === 403) {
      throw error // Re-throw 403 errors
    }
    
    // For other errors, redirect to login
    return navigateTo('/login', { replace: true })
  } finally {
    isLoading.value = false
  }
})

// Helper functions
async function fetchCurrentUser() {
  const authStore = useAuthStore()
  
  try {
    const user = await $fetch('/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
      }
    })
    
    authStore.setUser(user)
  } catch (error) {
    console.error('Failed to fetch current user:', error)
    authStore.logout()
    throw error
  }
}

function hasPermission(permission: string): boolean {
  const { user } = useAuthStore()
  
  if (!user.value?.permissions) {
    return false
  }
  
  return user.value.permissions.some(p => p.name === permission)
}

function hasAnyRole(roles: string[]): boolean {
  const { user } = useAuthStore()
  
  if (!user.value?.roles) {
    return false
  }
  
  return user.value.roles.some(role => roles.includes(role.name))
}
```

### 2. Permission-Based Route Protection
Create specialized middleware for different permission levels:

```typescript
// middleware/admin.ts
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuthStore()
  
  if (!user.value) {
    return navigateTo('/login')
  }
  
  const isAdmin = user.value.roles?.some(role => role.name === 'ADMIN')
  
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: '管理者権限が必要です'
    })
  }
})

// middleware/lawyer.ts
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuthStore()
  
  if (!user.value) {
    return navigateTo('/login')
  }
  
  const isLawyerOrAdmin = user.value.roles?.some(role => 
    ['LAWYER', 'ADMIN'].includes(role.name)
  )
  
  if (!isLawyerOrAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: '弁護士権限が必要です'
    })
  }
})

// middleware/guest.ts - Redirect authenticated users away from login/register
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuthStore()
  
  if (user.value) {
    return navigateTo('/dashboard')
  }
})
```

### 3. Permission Checking Composable
Create a reusable composable for permission checks:

```typescript
// composables/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuthStore()
  
  const hasPermission = (permission: string): boolean => {
    if (!user.value?.permissions) {
      return false
    }
    
    return user.value.permissions.some(p => p.name === permission)
  }
  
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }
  
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }
  
  const hasRole = (role: string): boolean => {
    if (!user.value?.roles) {
      return false
    }
    
    return user.value.roles.some(r => r.name === role)
  }
  
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }
  
  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every(role => hasRole(role))
  }
  
  // Check if user can perform action on resource
  const canPerformAction = (
    resource: string, 
    action: string, 
    context?: Record<string, any>
  ): boolean => {
    const permissionName = `${resource.toUpperCase()}_${action.toUpperCase()}`
    
    if (!hasPermission(permissionName)) {
      return false
    }
    
    // Additional context-based checks
    if (context) {
      // Example: Check if user owns the resource
      if (context.ownerId && user.value?.id !== context.ownerId) {
        return hasPermission(`${resource.toUpperCase()}_${action.toUpperCase()}_ALL`)
      }
    }
    
    return true
  }
  
  // Get user's effective permissions (including role permissions)
  const getUserPermissions = computed(() => {
    if (!user.value) {
      return []
    }
    
    const directPermissions = user.value.permissions || []
    const rolePermissions = user.value.roles?.flatMap(role => role.permissions || []) || []
    
    // Combine and deduplicate permissions
    const allPermissions = [...directPermissions, ...rolePermissions]
    const uniquePermissions = allPermissions.filter((permission, index, array) => 
      array.findIndex(p => p.name === permission.name) === index
    )
    
    return uniquePermissions
  })
  
  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canPerformAction,
    userPermissions: getUserPermissions
  }
}
```

### 4. Page Route Configuration
Update pages with proper route metadata:

```vue
<!-- pages/dashboard.vue -->
<script setup lang="ts">
// Require authentication
definePageMeta({
  middleware: 'auth'
})
</script>

<!-- pages/admin/index.vue -->
<script setup lang="ts">
// Require admin role
definePageMeta({
  middleware: ['auth', 'admin']
})
</script>

<!-- pages/matters/index.vue -->
<script setup lang="ts">
// Require matter read permission
definePageMeta({
  middleware: 'auth',
  permission: 'MATTER_READ'
})
</script>

<!-- pages/clients/create.vue -->
<script setup lang="ts">
// Require client write permission
definePageMeta({
  middleware: 'auth',
  permission: 'CLIENT_WRITE'
})
</script>

<!-- pages/reports/financial.vue -->
<script setup lang="ts">
// Require lawyer role and financial read permission
definePageMeta({
  middleware: 'auth',
  roles: ['LAWYER', 'ADMIN'],
  permission: 'FINANCIAL_READ'
})
</script>

<!-- pages/login.vue -->
<script setup lang="ts">
// Redirect authenticated users
definePageMeta({
  middleware: 'guest',
  public: true
})
</script>
```

### 5. Component-Level Permission Checks
Create permission checking components:

```vue
<!-- components/ProtectedContent.vue -->
<script setup lang="ts">
interface Props {
  permission?: string
  permissions?: string[]
  role?: string
  roles?: string[]
  requireAll?: boolean
  fallback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  requireAll: false,
  fallback: false
})

const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = usePermissions()

const canAccess = computed(() => {
  // Check permissions
  if (props.permission) {
    if (!hasPermission(props.permission)) return false
  }
  
  if (props.permissions) {
    const checkFn = props.requireAll ? hasAllPermissions : hasAnyPermission
    if (!checkFn(props.permissions)) return false
  }
  
  // Check roles
  if (props.role) {
    if (!hasRole(props.role)) return false
  }
  
  if (props.roles) {
    if (!hasAnyRole(props.roles)) return false
  }
  
  return true
})
</script>

<template>
  <div v-if="canAccess">
    <slot />
  </div>
  <div v-else-if="fallback">
    <slot name="fallback">
      <div class="text-gray-500 text-sm">
        この機能にアクセスする権限がありません
      </div>
    </slot>
  </div>
</template>
```

### 6. Error Handling for Route Protection
Create proper error pages for authentication failures:

```vue
<!-- error.vue -->
<script setup lang="ts">
interface Props {
  error: {
    statusCode: number
    statusMessage: string
    stack?: string
  }
}

const props = defineProps<Props>()

const handleRetry = () => {
  clearError({ redirect: '/' })
}

const handleLogin = () => {
  navigateTo('/login')
}

const isAuthError = computed(() => 
  props.error.statusCode === 401 || props.error.statusCode === 403
)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full text-center">
      <div v-if="error.statusCode === 401" class="space-y-4">
        <h1 class="text-2xl font-bold text-gray-900">認証が必要です</h1>
        <p class="text-gray-600">
          この機能を使用するにはログインが必要です
        </p>
        <Button @click="handleLogin">
          ログイン
        </Button>
      </div>
      
      <div v-else-if="error.statusCode === 403" class="space-y-4">
        <h1 class="text-2xl font-bold text-gray-900">アクセス権限がありません</h1>
        <p class="text-gray-600">
          {{ error.statusMessage || 'この機能にアクセスする権限がありません' }}
        </p>
        <Button @click="handleRetry" variant="outline">
          戻る
        </Button>
      </div>
      
      <div v-else class="space-y-4">
        <h1 class="text-2xl font-bold text-gray-900">
          エラーが発生しました ({{ error.statusCode }})
        </h1>
        <p class="text-gray-600">
          {{ error.statusMessage }}
        </p>
        <Button @click="handleRetry">
          再試行
        </Button>
      </div>
    </div>
  </div>
</template>
```

## Implementation Steps

1. **Middleware enhancement** (1 hour)
   - Update auth middleware with real token validation
   - Add role-based and permission-based middleware
   - Implement proper error handling

2. **Permission system** (0.5 hours)
   - Create usePermissions composable
   - Add component-level permission checks
   - Update page metadata

3. **Error handling** (0.5 hours)
   - Create error pages for auth failures
   - Add proper redirects and messaging
   - Test edge cases

## Testing Requirements

### Unit Tests
```typescript
// composables/__tests__/usePermissions.test.ts
describe('usePermissions', () => {
  const mockUser = {
    id: '1',
    email: 'lawyer@example.com',
    roles: [
      {
        name: 'LAWYER',
        permissions: [
          { name: 'MATTER_READ' },
          { name: 'MATTER_WRITE' },
          { name: 'CLIENT_READ' }
        ]
      }
    ],
    permissions: []
  }

  beforeEach(() => {
    const authStore = useAuthStore()
    authStore.setUser(mockUser)
  })

  it('should check permissions correctly', () => {
    const { hasPermission } = usePermissions()
    
    expect(hasPermission('MATTER_READ')).toBe(true)
    expect(hasPermission('MATTER_DELETE')).toBe(false)
  })

  it('should check roles correctly', () => {
    const { hasRole } = usePermissions()
    
    expect(hasRole('LAWYER')).toBe(true)
    expect(hasRole('ADMIN')).toBe(false)
  })

  it('should check action permissions with context', () => {
    const { canPerformAction } = usePermissions()
    
    expect(canPerformAction('matter', 'read')).toBe(true)
    expect(canPerformAction('matter', 'delete')).toBe(false)
  })
})
```

### Integration Tests
```typescript
// middleware/__tests__/auth.test.ts
describe('auth middleware', () => {
  it('should redirect to login when no token', async () => {
    sessionStorage.clear()
    
    const to = { meta: {} }
    const result = await authMiddleware(to)
    
    expect(result).toEqual(
      expect.objectContaining({
        path: '/login',
        replace: true
      })
    )
  })

  it('should allow access with valid token and permissions', async () => {
    sessionStorage.setItem('access_token', 'valid-token')
    
    const to = { 
      meta: { 
        permission: 'MATTER_READ' 
      } 
    }
    
    const result = await authMiddleware(to)
    expect(result).toBeUndefined() // No redirect
  })

  it('should throw 403 for insufficient permissions', async () => {
    sessionStorage.setItem('access_token', 'valid-token')
    
    const to = { 
      meta: { 
        permission: 'ADMIN_DELETE' 
      } 
    }
    
    await expect(authMiddleware(to)).rejects.toThrow('403')
  })
})
```

### E2E Tests
- Route protection with different user roles
- Redirect behavior on authentication failure
- Permission-based UI elements
- Token refresh during navigation

## Success Criteria

- [ ] Unauthenticated users are redirected to login
- [ ] Users without permissions receive 403 errors
- [ ] Token refresh works during route navigation
- [ ] Role-based access control functions correctly
- [ ] Component-level permissions hide/show content
- [ ] Error pages display appropriate messages
- [ ] All route metadata works as expected

## Security Considerations

1. **Server-Side Validation**: Never rely solely on client-side permission checks
2. **Token Validation**: Always validate tokens with backend
3. **Permission Sync**: Keep permissions up-to-date with backend changes
4. **Error Information**: Don't expose sensitive information in error messages
5. **Audit Logging**: Log authentication and authorization events

## Files to Create/Modify

- `middleware/auth.ts` - Enhanced auth middleware
- `middleware/admin.ts` - Admin role middleware
- `middleware/lawyer.ts` - Lawyer role middleware
- `middleware/guest.ts` - Guest redirect middleware
- `composables/usePermissions.ts` - Permission checking composable
- `components/ProtectedContent.vue` - Permission-based content
- `error.vue` - Enhanced error handling

## Technical References

### Architecture Guidelines
- Reference: `/archived-2025-07-23/frontend/docs/developer-guide/architecture.md` - Route protection patterns and middleware implementation
- Reference: `/archived-2025-07-23/frontend/CLAUDE.md` - Nuxt 3 middleware patterns and definePageMeta usage
- Reference: `frontend/app/mocks/handlers/auth.ts` - RBAC permission structure and role definitions

### Design Patterns
- Follow Nuxt 3 middleware patterns with proper error handling
- Use the established RBAC permission checking patterns from mock handlers
- Implement permission-based UI components following Vue 3 composition patterns
- Use the error page patterns from architecture documentation

## Related Tasks

- T01_S02_AuthStore_API_Integration
- T03_S02_Token_Refresh_Implementation
- T05_S02_LoginForm_Storybook_Stories

---

**Note**: Test route protection thoroughly with different user roles and permission combinations. Ensure backend APIs also validate permissions to prevent client-side bypass attacks.