/**
 * Authentication middleware - Industry standard implementation
 * Pure authentication check using @sidebase/nuxt-auth
 */

export default defineNuxtRouteMiddleware((to, _from) => {
    const { status } = useAuth()

    // Skip auth check on server-side (SPA mode)
    if (import.meta.server) {
        return
    }

    // Check authentication status
    if (status.value !== 'authenticated') {
        // Redirect to login page if not authenticated
        return navigateTo({
            path: '/login',
            query: {
                redirect: to.fullPath,
                reason: status.value === 'loading' ? 'session_expired' : 'unauthenticated'
            }
        })
    }

    // Continue if authenticated
})