/**
 * Role-Based Access Control Middleware
 * 
 * @description Enforces role-based permissions for routes. Checks if the
 * current user has the required roles to access specific pages.
 */

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  // Skip RBAC check for public routes
  if (to.meta.requiresAuth === false) {
    return
  }
  
  // Get required roles from route meta
  const requiredRoles = to.meta.roles as string[] | undefined
  const requiredPermissions = to.meta.permissions as string[] | undefined
  
  // Skip if no role or permission requirements
  if (!requiredRoles && !requiredPermissions) {
    return
  }
  
  // Get user roles and permissions from auth store with proper Nuxt context
  const { $pinia } = useNuxtApp()
  const authStore = useAuthStore($pinia)
  const userRoles: string[] = authStore.user?.role ? [authStore.user.role] : []
  const userPermissions: readonly string[] = authStore.permissions
  
  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role =>
      userRoles.includes(role)
    )
    
    if (!hasRequiredRole) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient Role Permissions',
        data: {
          message: 'Your role does not have access to this page.',
          requiredRoles,
          userRoles
        }
      })
    }
  }
  
  // Check permission requirements
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    )
    
    if (!hasRequiredPermission) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient Permissions',
        data: {
          message: 'You do not have the required permissions to access this page.',
          requiredPermissions,
          userPermissions
        }
      })
    }
  }
})