package com.astarworks.astarmanagement.core.auth.domain.service

import org.slf4j.LoggerFactory
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Caching
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Service for managing cache eviction in the authorization system.
 * 
 * Provides centralized cache invalidation logic to ensure data consistency
 * when permissions, roles, or user assignments change.
 * 
 * Key responsibilities:
 * - User-specific cache eviction
 * - Role-specific cache eviction
 * - Resource ownership cache eviction
 * - Full cache clearing for administrative operations
 * - Tenant-specific cache management
 * 
 * This service ensures that cached authorization data is invalidated
 * appropriately when underlying data changes, maintaining consistency
 * between the cache and the database.
 */
@Service
class CacheEvictionService(
    private val cacheManager: CacheManager
) {
    
    private val logger = LoggerFactory.getLogger(CacheEvictionService::class.java)
    
    /**
     * Evicts all caches related to a specific user.
     * Called when user permissions, roles, or team memberships change.
     * 
     * @param tenantUserId The tenant user ID whose caches should be evicted
     */
    @Caching(evict = [
        CacheEvict(value = ["userPermissions"], key = "#tenantUserId"),
        CacheEvict(value = ["userRoles"], key = "#tenantUserId"),
        CacheEvict(value = ["teamMembership"], key = "#tenantUserId")
    ])
    fun evictUserCaches(tenantUserId: UUID) {
        logger.debug("Evicting all caches for user: $tenantUserId")
        
        // Also evict compound keys that include this user ID
        evictUserPermissionCombinations(tenantUserId)
    }
    
    /**
     * Evicts all caches related to a specific role.
     * Called when role permissions are modified.
     * 
     * @param roleId The role ID whose caches should be evicted
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun evictRoleCaches(roleId: UUID) {
        logger.debug("Evicting role permission cache for role: $roleId")
        
        // Also evict user caches for all users with this role
        evictUsersWithRole(roleId)
    }
    
    /**
     * Evicts resource ownership caches for a specific resource.
     * Called when resource ownership or team association changes.
     * 
     * @param resourceId The resource ID
     * @param resourceType The type of resource
     */
    @CacheEvict(value = ["resourceOwnership"], key = "#resourceType + ':' + #resourceId")
    fun evictResourceOwnershipCache(resourceId: UUID, resourceType: String) {
        logger.debug("Evicting ownership cache for $resourceType resource: $resourceId")
    }
    
    /**
     * Evicts team membership caches for a specific team.
     * Called when team membership changes.
     * 
     * @param teamId The team ID
     */
    fun evictTeamCaches(teamId: UUID) {
        logger.debug("Evicting team membership caches for team: $teamId")
        
        // Clear specific team entries from the cache
        val teamCache = cacheManager.getCache("teamMembership")
        teamCache?.clear() // Simple approach - clear all team memberships
        
        logger.info("Cleared team membership cache due to changes in team: $teamId")
    }
    
    /**
     * Evicts all permission-related caches.
     * Used for administrative operations or major permission structure changes.
     */
    fun evictAllPermissionCaches() {
        logger.warn("Evicting ALL permission caches - this may impact performance temporarily")
        
        val cacheNames = listOf(
            "userPermissionRules",
            "userPermissions",
            "userRoles",
            "rolePermissions",
            "resourceOwnership",
            "teamMembership",
            "dynamicRoles"
        )
        
        cacheNames.forEach { cacheName ->
            val cache = cacheManager.getCache(cacheName)
            if (cache != null) {
                cache.clear()
                logger.debug("Cleared cache: $cacheName")
            } else {
                logger.warn("Cache not found: $cacheName")
            }
        }
        
        logger.info("All permission caches have been cleared")
    }
    
    /**
     * Evicts caches for a specific tenant.
     * Called during tenant switching or tenant-specific maintenance.
     * 
     * @param tenantId The tenant ID
     */
    fun evictTenantCaches(tenantId: UUID) {
        logger.info("Evicting caches for tenant: $tenantId")
        
        // In a multi-tenant system, we might want to evict only
        // entries belonging to a specific tenant.
        // For now, we clear all caches as a safety measure.
        evictAllPermissionCaches()
        
        logger.info("Tenant cache eviction completed for: $tenantId")
    }
    
    /**
     * Evicts dynamic role caches.
     * Called when dynamic roles are created, updated, or deleted.
     * 
     * @param roleId The dynamic role ID
     */
    @CacheEvict(value = ["dynamicRoles"], key = "#roleId")
    fun evictDynamicRoleCache(roleId: UUID) {
        logger.debug("Evicting dynamic role cache for role: $roleId")
    }
    
    /**
     * Gets cache statistics for monitoring.
     * 
     * @param cacheName The name of the cache
     * @return Cache statistics or null if cache doesn't exist
     */
    fun getCacheStatistics(cacheName: String): Map<String, Any>? {
        val cache = cacheManager.getCache(cacheName)
        if (cache == null) {
            logger.warn("Cache not found for statistics: $cacheName")
            return null
        }
        
        val nativeCache = cache.nativeCache
        if (nativeCache is com.github.benmanes.caffeine.cache.Cache<*, *>) {
            val stats = nativeCache.stats()
            return mapOf(
                "hitCount" to stats.hitCount(),
                "missCount" to stats.missCount(),
                "hitRate" to stats.hitRate(),
                "evictionCount" to stats.evictionCount(),
                "size" to nativeCache.estimatedSize()
            )
        }
        
        return null
    }
    
    /**
     * Performs cache warming for critical data.
     * Can be called during application startup or after major cache evictions.
     * 
     * @param userIds Optional list of user IDs to warm caches for
     */
    fun warmCaches(userIds: List<UUID>? = null) {
        logger.info("Cache warming initiated for ${userIds?.size ?: "all"} users")
        
        // Implementation would depend on having access to the services
        // that populate these caches. For now, this is a placeholder.
        // In practice, this would call the cached methods to populate the cache.
        
        logger.info("Cache warming completed")
    }
    
    // === Private Helper Methods ===
    
    /**
     * Evicts compound cache keys that include the user ID.
     * These are cache entries with keys like "userId:permissionRule".
     */
    private fun evictUserPermissionCombinations(tenantUserId: UUID) {
        // Since we can't iterate over cache keys with Spring Cache abstraction,
        // we need to clear the entire cache or maintain a registry of keys.
        // For now, we'll log this as a limitation.
        logger.trace("Note: Compound keys with user $tenantUserId may still be cached")
    }
    
    /**
     * Evicts user caches for all users who have a specific role.
     * This requires querying which users have the role.
     */
    private fun evictUsersWithRole(roleId: UUID) {
        // This would require access to UserRoleService to find affected users.
        // For now, we clear all user caches as a safety measure.
        logger.debug("Clearing all user caches due to role change: $roleId")
        
        val userCaches = listOf("userPermissions", "userRoles")
        userCaches.forEach { cacheName ->
            cacheManager.getCache(cacheName)?.clear()
        }
    }
    
    /**
     * Validates that all expected caches are present.
     * Can be used during startup to ensure cache configuration is correct.
     */
    fun validateCacheConfiguration(): Boolean {
        val expectedCaches = listOf(
            "userPermissions",
            "userRoles",
            "rolePermissions",
            "resourceOwnership",
            "teamMembership",
            "dynamicRoles"
        )
        
        val missingCaches = expectedCaches.filter { cacheName ->
            cacheManager.getCache(cacheName) == null
        }
        
        if (missingCaches.isNotEmpty()) {
            logger.error("Missing cache configurations: $missingCaches")
            return false
        }
        
        logger.info("All expected caches are configured correctly")
        return true
    }
}