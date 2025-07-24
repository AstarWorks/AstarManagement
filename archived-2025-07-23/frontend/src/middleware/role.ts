/**
 * Role-based Access Control Middleware
 * 
 * @description Provides role-specific access control for routes.
 * This middleware should be used in combination with the auth middleware.
 */

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  const authStore = useAuthStore()
  
  // Ensure user is authenticated first
  if (!authStore.isAuthenticated || !authStore.user) {
    return navigateTo('/login')
  }
  
  const userRole = authStore.user.role
  
  // Define role-based route access rules
  const roleBasedRoutes: Record<string, string[]> = {
    // Admin-only routes
    '/admin': ['admin'],
    '/settings/system': ['admin'],
    '/users/management': ['admin'],
    '/audit/logs': ['admin'],
    
    // Lawyer-only routes
    '/matters/create': ['lawyer', 'admin'],
    '/matters/delete': ['lawyer', 'admin'],
    '/clients/create': ['lawyer', 'admin'],
    '/billing/create': ['lawyer', 'admin'],
    '/reports/financial': ['lawyer', 'admin'],
    
    // Lawyer and Clerk routes
    '/documents/upload': ['lawyer', 'clerk', 'admin'],
    '/matters/edit': ['lawyer', 'clerk', 'admin'],
    '/clients/edit': ['lawyer', 'clerk', 'admin'],
    
    // Client-accessible routes (most restrictive)
    '/matters/view': ['lawyer', 'clerk', 'client', 'admin'],
    '/documents/view': ['lawyer', 'clerk', 'client', 'admin'],
    '/communication': ['lawyer', 'clerk', 'client', 'admin']
  }
  
  // Check if current route has role restrictions
  const currentPath = to.path
  
  // Find the most specific route match
  const matchingRoute = Object.keys(roleBasedRoutes)
    .filter(route => currentPath.startsWith(route))
    .sort((a, b) => b.length - a.length)[0] // Get the longest match (most specific)
  
  if (matchingRoute) {
    const allowedRoles = roleBasedRoutes[matchingRoute]
    
    if (!allowedRoles.includes(userRole)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient Role Permissions',
        data: {
          message: `Access denied. This page requires one of the following roles: ${allowedRoles.join(', ')}`,
          userRole,
          allowedRoles,
          path: currentPath
        }
      })
    }
  }
  
  // Additional dynamic role checks based on route params
  if (to.params.id) {
    // Check if user can access specific resource
    const resourceId = to.params.id as string
    
    if (userRole === 'client') {
      // Clients can only access their own resources
      // This would typically involve an API call to verify ownership
      // For now, we'll implement a basic check
      
      if (currentPath.includes('/matters/') && !authStore.hasPermission('matter.read.own')) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Resource Access Denied',
          data: {
            message: 'You can only access your own matters.',
            resourceId,
            userRole
          }
        })
      }
    }
  }
})