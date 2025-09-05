/**
 * User Profile Composable
 *
 * Provides user profile data and permission/role checking utilities
 * Integrates session data with repository for complete user information
 */

import { useApiClient, useIsMockMode } from '@shared/api/composables/useApiClient'
import { UserApiRepository } from '../repositories/UserApiRepository'
import { UserMockRepository } from '../repositories/UserMockRepository'
import type { IUserRepository } from '../repositories/IUserRepository'
import type { UserProfile, IUserStats, IUpdateUserProfileDto } from '../types'

/**
 * User profile composable for managing user data and permissions
 */
export const useUserProfile = () => {
    const {data: session, status} = useAuth()
    const client = useApiClient()
    const isMockMode = useIsMockMode()
    
    // Create appropriate repository based on mode
    const repository = computed<IUserRepository>(() => {
        console.log(`[useUserProfile] Creating ${isMockMode ? 'mock' : 'API'} repository`)
        return isMockMode
            ? new UserMockRepository(client)
            : new UserApiRepository(client)
    })
    
    // Compute profile from session data with repository enrichment
    const profile = computed(() => {
        if (!session.value?.user) return null
        
        const user = session.value.user
        
        // Base profile from session
        return {
            id: user.id,
            email: user.email || '',
            name: user.name || '',
            displayName: user.name || undefined,
            avatar: undefined, // Will be fetched from repository
            roles: user.roles || [],
            permissions: user.permissions || [],
            isActive: user.isActive ?? true,
            
            // Optional fields from session
            organizationId: (user as Record<string, unknown>).tenantId as string | undefined,
            organizationName: (user as Record<string, unknown>).tenantSlug as string | undefined,
            tenantId: (user as Record<string, unknown>).tenantId as string | undefined,
            tenantUserId: (user as Record<string, unknown>).tenantUserId as string | undefined,
            
            // Default preferences (will be replaced by repository data)
            preferences: {
                language: 'ja',
                timezone: 'Asia/Tokyo',
                theme: 'light' as const,
                notifications: {
                    email: true,
                    browser: true,
                    mobile: false
                }
            }
        }
    })
    
    // Fetch detailed profile data from repository
    const { data: detailedProfile, refresh: refreshProfile } = useAsyncData(
        'user:profile:detail',
        async () => {
            if (!profile.value?.id) return null
            try {
                return await repository.value.getProfile(profile.value.id)
            } catch (error) {
                console.error('[useUserProfile] Failed to fetch detailed profile:', error)
                return null
            }
        },
        { 
            server: false,
            lazy: true,
            watch: [() => profile.value?.id]
        }
    )
    
    // Fetch user statistics
    const { data: stats, refresh: refreshStats } = useAsyncData(
        'user:stats',
        async () => {
            if (!profile.value?.id) return null
            try {
                return await repository.value.getStats(profile.value.id)
            } catch (error) {
                console.error('[useUserProfile] Failed to fetch stats:', error)
                // Return default stats on error
                return {
                    activeCases: 0,
                    tasksToday: 0,
                    unreadMessages: 0
                } as IUserStats
            }
        },
        { 
            server: false,
            lazy: true,
            watch: [() => profile.value?.id]
        }
    )
    
    // Merge session profile with detailed profile
    const enrichedProfile = computed<UserProfile | null>(() => {
        if (!profile.value) return null
        
        // If we have detailed data from repository, merge it
        if (detailedProfile.value) {
            return {
                ...profile.value,
                ...detailedProfile.value,
                // Keep session auth data as source of truth
                roles: profile.value.roles,
                permissions: profile.value.permissions
            }
        }
        
        // Otherwise return base profile from session
        return profile.value as UserProfile
    })
    
    // Loading state from auth status
    const loading = computed(() => status.value === 'loading')
    
    // Error state
    const error = ref<Error | null>(null)
    
    /**
     * Check if user has a specific role
     */
    const hasRole = (roleName: string): boolean => {
        if (!enrichedProfile.value?.roles) return false
        return enrichedProfile.value.roles.some(role => role.name === roleName)
    }
    
    /**
     * Check if user has all specified roles
     */
    const hasAllRoles = (roleNames: string[]): boolean => {
        if (!enrichedProfile.value?.roles || roleNames.length === 0) return false
        return roleNames.every(name => hasRole(name))
    }
    
    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission: string): boolean => {
        if (!enrichedProfile.value?.permissions) return false
        return enrichedProfile.value.permissions.includes(permission)
    }
    
    /**
     * Check if user has all specified permissions
     */
    const hasAllPermissions = (permissions: string[]): boolean => {
        if (!enrichedProfile.value?.permissions || permissions.length === 0) return false
        return permissions.every(perm => hasPermission(perm))
    }
    
    /**
     * Check if user has any of the specified roles
     */
    const hasAnyRole = (roleNames: string[]): boolean => {
        if (!enrichedProfile.value?.roles || roleNames.length === 0) return false
        return roleNames.some(name => hasRole(name))
    }
    
    /**
     * Check if user has any of the specified permissions
     */
    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!enrichedProfile.value?.permissions || permissions.length === 0) return false
        return permissions.some(perm => hasPermission(perm))
    }
    
    /**
     * Update user profile
     */
    const updateProfile = async (data: IUpdateUserProfileDto): Promise<void> => {
        if (!profile.value?.id) {
            throw new Error('No user profile to update')
        }
        
        try {
            error.value = null
            const updated = await repository.value.updateProfile(profile.value.id, data)
            
            // Update local state
            detailedProfile.value = updated
            
            // Refresh from server
            await refreshProfile()
        } catch (err) {
            error.value = err as Error
            throw err
        }
    }
    
    /**
     * Upload user avatar
     */
    const uploadAvatar = async (file: File): Promise<string> => {
        if (!profile.value?.id) {
            throw new Error('No user profile for avatar upload')
        }
        
        try {
            error.value = null
            const url = await repository.value.uploadAvatar(profile.value.id, file)
            
            // Refresh profile to get updated avatar
            await refreshProfile()
            
            return url
        } catch (err) {
            error.value = err as Error
            throw err
        }
    }
    
    /**
     * Remove user avatar
     */
    const removeAvatar = async (): Promise<void> => {
        if (!profile.value?.id) {
            throw new Error('No user profile for avatar removal')
        }
        
        try {
            error.value = null
            await repository.value.removeAvatar(profile.value.id)
            
            // Refresh profile
            await refreshProfile()
        } catch (err) {
            error.value = err as Error
            throw err
        }
    }
    
    /**
     * Refresh all user data
     */
    const refresh = async () => {
        const {getSession} = useAuth()
        await Promise.all([
            getSession(),
            refreshProfile(),
            refreshStats()
        ])
    }
    
    return {
        // State
        profile: readonly(enrichedProfile),
        stats: readonly(stats),
        loading: readonly(loading),
        error: readonly(error),
        
        // Role checking methods
        hasRole,
        hasAllRoles,
        hasAnyRole,
        
        // Permission checking methods
        hasPermission,
        hasAllPermissions,
        hasAnyPermission,
        
        // Actions
        updateProfile,
        uploadAvatar,
        removeAvatar,
        refresh
    }
}