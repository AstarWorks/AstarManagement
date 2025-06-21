/**
 * Authentication Middleware
 * 
 * @description Protects routes that require authentication. Redirects
 * unauthenticated users to the login page with return URL.
 */

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip auth check for public routes
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  if (publicRoutes.includes(to.path)) {
    return
  }
  
  // Skip if route explicitly allows anonymous access
  if (to.meta.requiresAuth === false) {
    return
  }
  
  // Get authentication status from auth store with proper Nuxt context
  const { $pinia } = useNuxtApp()
  const authStore = useAuthStore($pinia)
  const isAuthenticated = authStore.isAuthenticated
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    // Store the intended destination
    const redirectTo = to.fullPath
    
    // Redirect to login with return URL
    return navigateTo({
      path: '/login',
      query: { redirect: redirectTo }
    })
  }
  
  // Check route-specific permissions if defined
  const requiredPermissions = to.meta.permissions as string[] | undefined
  if (requiredPermissions && requiredPermissions.length > 0) {
    // Check permissions using auth store
    const hasPermission = authStore.hasAnyPermission(requiredPermissions)
    
    if (!hasPermission) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access Denied',
        data: {
          message: 'You do not have permission to access this page.',
          requiredPermissions,
          userPermissions: authStore.permissions
        }
      })
    }
  }
})