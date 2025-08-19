/**
 * Pure authentication session composable
 * Industry-standard implementation using @sidebase/nuxt-auth
 */

export const useAuthSession = () => {
  // useAuth is auto-imported by @sidebase/nuxt-auth
  const { data: session, status, signIn, signOut, refresh } = useAuth()
  
  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => status.value === 'authenticated')
  
  /**
   * Get current user from session
   */
  const currentUser = computed(() => {
    if (!session.value) return null
    // Safe access with optional chaining
    return ('user' in session.value ? session.value.user : null) ?? null
  })
  
  /**
   * Helper to get user ID
   */
  const userId = computed(() => {
    const user = currentUser.value
    return (user && typeof user === 'object' && 'id' in user) ? user.id : null
  })
  
  /**
   * Helper to get user email
   */
  const userEmail = computed(() => {
    const user = currentUser.value
    return (user && typeof user === 'object' && 'email' in user) ? user.email : null
  })
  
  return {
    // State
    session: readonly(session),
    status: readonly(status),
    isAuthenticated: readonly(isAuthenticated),
    currentUser: readonly(currentUser),
    userId: readonly(userId),
    userEmail: readonly(userEmail),
    
    // Actions (pass through from useAuth)
    signIn,
    signOut,
    refresh
  }
}