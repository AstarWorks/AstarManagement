/**
 * Authentication Middleware
 * 
 * @description Protects routes that require authentication. Redirects
 * unauthenticated users to the login page with return URL.
 * Also handles permission-based access control.
 */

export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  // Skip auth check for public routes
  const publicRoutes = [
    '/login', 
    '/register', 
    '/forgot-password', 
    '/reset-password',
    '/verify-email',
    '/privacy',
    '/terms'
  ]
  
  if (publicRoutes.includes(to.path) || to.path.startsWith('/public/')) {
    return
  }
  
  // Skip if route explicitly allows anonymous access
  if (to.meta.requiresAuth === false) {
    return
  }
  
  // Get authentication status from auth store
  const authStore = useAuthStore()
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Check if we have a stored session that might be valid
    if (authStore.sessionId && authStore.user) {
      try {
        // Attempt to refresh token to validate session
        await authStore.refreshToken()
      } catch (error) {
        // Session is invalid, continue with redirect
        console.warn('Session validation failed:', error)
      }
    }
    
    // If still not authenticated after refresh attempt
    if (!authStore.isAuthenticated) {
      // Store the intended destination
      const redirectTo = to.fullPath
      
      // Clear any stale auth data
      authStore.clearError()
      
      // Redirect to login with return URL
      return navigateTo({
        path: '/login',
        query: { redirect: redirectTo }
      })
    }
  }
  
  // Handle pending two-factor authentication
  if (authStore.pendingTwoFactor) {
    // Only allow access to 2FA verification page
    if (to.path !== '/auth/verify-2fa') {
      return navigateTo('/auth/verify-2fa')
    }
    return
  }
  
  // Check session timeout
  if (authStore.sessionTimeRemaining <= 0) {
    // Session has expired, logout user
    await authStore.logout()
    return navigateTo({
      path: '/login',
      query: { 
        redirect: to.fullPath,
        reason: 'session_expired'
      }
    })
  }
  
  // Check route-specific permissions if defined
  const requiredPermissions = to.meta.permissions as string[] | undefined
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = authStore.canAccessRoute(requiredPermissions)
    
    if (!hasPermission) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access Denied',
        data: {
          message: 'You do not have the required permissions to access this page.',
          requiredPermissions,
          userPermissions: authStore.permissions.value,
          userRole: authStore.user?.role
        }
      })
    }
  }
  
  // Check role-specific access if defined
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = authStore.user?.role
    const hasRole = userRole && requiredRoles.includes(userRole)
    
    if (!hasRole) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access Denied - Role Required',
        data: {
          message: `This page requires one of the following roles: ${requiredRoles.join(', ')}`,
          requiredRoles,
          userRole
        }
      })
    }
  }
  
  // Update last activity timestamp
  authStore.updateActivity()
})