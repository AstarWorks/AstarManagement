/**
 * Guest Middleware
 * 
 * @description Redirects authenticated users away from auth pages.
 * Used for login, register, and other auth-related pages that
 * should not be accessible to authenticated users.
 */

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  const authStore = useAuthStore()
  
  // If user is authenticated and not pending 2FA, redirect to dashboard
  if (authStore.isAuthenticated && !authStore.pendingTwoFactor) {
    // Check if there's a redirect URL in query params
    const redirect = to.query.redirect as string
    
    if (redirect && redirect.startsWith('/')) {
      // Redirect to the intended destination
      return navigateTo(redirect)
    }
    
    // Default redirect based on user role
    const userRole = authStore.user?.role
    
    switch (userRole) {
      case 'lawyer':
        return navigateTo('/dashboard')
      case 'clerk':
        return navigateTo('/dashboard')
      case 'client':
        return navigateTo('/client/dashboard')
      default:
        return navigateTo('/dashboard')
    }
  }
  
  // If user is pending 2FA and not on the verification page, redirect
  if (authStore.pendingTwoFactor && to.path !== '/auth/verify-2fa') {
    return navigateTo('/auth/verify-2fa')
  }
})