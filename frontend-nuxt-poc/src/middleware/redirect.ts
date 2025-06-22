/**
 * Redirect Middleware
 * 
 * @description Handles legacy route redirects and URL normalization.
 * Maps old React Router paths to new Nuxt routes.
 */

const legacyRouteMap: Record<string, string> = {
  // Legacy React routes to new Nuxt routes
  '/app': '/',
  '/app/dashboard': '/',
  '/app/matters': '/matters',
  '/app/kanban': '/matters/kanban',
  '/app/documents': '/documents',
  '/app/clients': '/clients',
  '/app/calendar': '/calendar',
  '/app/reports': '/reports',
  '/app/admin': '/admin',
  '/app/admin/users': '/admin/users',
  '/app/admin/settings': '/admin/settings',
  '/app/profile': '/profile',
  '/app/settings': '/settings',
  
  // Demo routes
  '/demo/kanban': '/matters/kanban',
  '/demo/matters': '/matters',
  
  // API documentation routes
  '/docs': '/help',
  '/documentation': '/help',
  
  // Old authentication routes
  '/auth/login': '/login',
  '/auth/register': '/register',
  '/auth/logout': '/logout',
  '/auth/forgot': '/forgot-password',
  '/auth/reset': '/reset-password'
}

export default defineNuxtRouteMiddleware((to, from) => {
  const path = to.path
  
  // Check if this is a legacy route that needs redirection
  if (legacyRouteMap[path]) {
    const newPath = legacyRouteMap[path]
    
    return navigateTo({
      path: newPath,
      query: to.query, // Preserve query parameters
      hash: to.hash    // Preserve hash fragment
    }, {
      redirectCode: 301 // Permanent redirect
    })
  }
  
  // Handle trailing slashes - redirect to non-trailing slash version
  if (path.length > 1 && path.endsWith('/')) {
    const cleanPath = path.slice(0, -1)
    
    return navigateTo({
      path: cleanPath,
      query: to.query,
      hash: to.hash
    }, {
      redirectCode: 301
    })
  }
  
  // Handle case-insensitive redirects for common mistyped routes
  const lowercasePath = path.toLowerCase()
  if (path !== lowercasePath) {
    // Only redirect if the lowercase version is different and exists
    const commonRoutes = [
      '/',
      '/matters',
      '/documents',
      '/clients',
      '/calendar',
      '/reports',
      '/admin',
      '/profile',
      '/settings',
      '/help'
    ]
    
    if (commonRoutes.includes(lowercasePath)) {
      return navigateTo({
        path: lowercasePath,
        query: to.query,
        hash: to.hash
      }, {
        redirectCode: 301
      })
    }
  }
})