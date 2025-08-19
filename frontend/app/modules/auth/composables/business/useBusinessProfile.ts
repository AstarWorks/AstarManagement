/**
 * Business-specific profile composable
 * Handles domain-specific user information separate from authentication
 */

import type { IBusinessProfile } from '@modules/auth/types/business-profile'

export const useBusinessProfile = () => {
  const { currentUser, isAuthenticated } = useAuthSession()
  
  // Business profile state
  const profile = useState<IBusinessProfile | null>('business-profile', () => null)
  const profileLoading = useState<boolean>('business-profile-loading', () => false)
  const profileError = useState<string | null>('business-profile-error', () => null)

  /**
   * Fetch business profile from backend
   */
  const fetchProfile = async () => {
    // Only fetch if authenticated
    const user = currentUser.value
    const userEmail = (user && typeof user === 'object' && 'email' in user) ? user.email : null
    if (!isAuthenticated.value || !userEmail) {
      profile.value = null
      return
    }

    profileLoading.value = true
    profileError.value = null

    try {
      // Fetch business-specific profile data
      const response = await $fetch<IBusinessProfile>('/api/v1/users/profile', {
        headers: useRequestHeaders(['cookie'])
      })
      profile.value = response
    } catch (error) {
      console.error('Failed to fetch business profile:', error)
      profileError.value = 'Failed to load profile'
      profile.value = null
    } finally {
      profileLoading.value = false
    }
  }

  /**
   * Business-specific permission checks
   */
  const hasPermission = (permission: string): boolean => {
    return profile.value?.permissions?.includes(permission) || false
  }

  const hasRole = (role: string): boolean => {
    return profile.value?.roles?.some(r => r.name === role) || false
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p))
  }

  // Auto-fetch profile when authentication changes
  watch(isAuthenticated, async (authenticated) => {
    if (authenticated) {
      await fetchProfile()
    } else {
      profile.value = null
    }
  }, { immediate: true })

  return {
    // State
    profile: readonly(profile),
    loading: readonly(profileLoading),
    error: readonly(profileError),
    
    // Actions
    fetchProfile,
    
    // Permission helpers (business-specific)
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions
  }
}