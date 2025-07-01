package dev.ryuzu.astermanagement.security.rbac.util

import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import dev.ryuzu.astermanagement.security.rbac.entity.Role
import dev.ryuzu.astermanagement.security.rbac.entity.UserRole

/**
 * Utility class providing common permission operations and helper methods
 * for the Discord-style RBAC system. This class contains static methods
 * for permission manipulation, validation, and analysis.
 */
object PermissionUtils {

    /**
     * Check if a permission flag set contains a specific permission
     */
    fun hasPermission(permissions: Long, permission: Permission): Boolean {
        return Permission.hasPermission(permissions, permission)
    }

    /**
     * Check if a permission flag set contains all of the specified permissions
     */
    fun hasAllPermissions(permissions: Long, vararg requiredPermissions: Permission): Boolean {
        return requiredPermissions.all { hasPermission(permissions, it) }
    }

    /**
     * Check if a permission flag set contains any of the specified permissions
     */
    fun hasAnyPermission(permissions: Long, vararg requiredPermissions: Permission): Boolean {
        return requiredPermissions.any { hasPermission(permissions, it) }
    }

    /**
     * Grant a permission to a permission flag set
     */
    fun grantPermission(permissions: Long, permission: Permission): Long {
        return Permission.grantPermission(permissions, permission)
    }

    /**
     * Grant multiple permissions to a permission flag set
     */
    fun grantPermissions(permissions: Long, vararg permissionsToGrant: Permission): Long {
        return permissionsToGrant.fold(permissions) { acc, permission -> 
            grantPermission(acc, permission) 
        }
    }

    /**
     * Revoke a permission from a permission flag set
     */
    fun revokePermission(permissions: Long, permission: Permission): Long {
        return Permission.revokePermission(permissions, permission)
    }

    /**
     * Revoke multiple permissions from a permission flag set
     */
    fun revokePermissions(permissions: Long, vararg permissionsToRevoke: Permission): Long {
        return permissionsToRevoke.fold(permissions) { acc, permission -> 
            revokePermission(acc, permission) 
        }
    }

    /**
     * Get all permissions that are set in a permission flag set
     */
    fun getPermissionsList(permissions: Long): List<Permission> {
        return Permission.getPermissionsList(permissions)
    }

    /**
     * Get permissions organized by category
     */
    fun getPermissionsByCategory(permissions: Long): Map<String, List<Permission>> {
        return getPermissionsList(permissions).groupBy { it.category }
    }

    /**
     * Combine multiple permission flag sets using OR operation
     */
    fun combinePermissions(vararg permissionSets: Long): Long {
        return permissionSets.fold(0L) { acc, permissions -> acc or permissions }
    }

    /**
     * Get the intersection of multiple permission flag sets (common permissions)
     */
    fun getCommonPermissions(vararg permissionSets: Long): Long {
        return if (permissionSets.isEmpty()) {
            0L
        } else {
            permissionSets.fold(permissionSets.first()) { acc, permissions -> acc and permissions }
        }
    }

    /**
     * Get permissions that are in the first set but not in the second set
     */
    fun getPermissionDifference(permissions1: Long, permissions2: Long): Long {
        return permissions1 and permissions2.inv()
    }

    /**
     * Calculate effective permissions for a user based on all their active roles
     */
    fun calculateEffectivePermissions(userRoles: Collection<UserRole>): Long {
        return userRoles
            .filter { it.isCurrentlyValid() }
            .map { it.getEffectivePermissions() }
            .fold(0L) { acc, permissions -> acc or permissions }
    }

    /**
     * Get the highest hierarchy level from a collection of user roles
     */
    fun getHighestHierarchyLevel(userRoles: Collection<UserRole>): Int {
        return userRoles
            .filter { it.isCurrentlyValid() }
            .maxOfOrNull { it.getHierarchyLevel() } ?: 0
    }

    /**
     * Check if user roles contain a role with sufficient hierarchy level
     */
    fun hasMinimumHierarchy(userRoles: Collection<UserRole>, minimumLevel: Int): Boolean {
        return getHighestHierarchyLevel(userRoles) >= minimumLevel
    }

    /**
     * Get all valid roles from user role assignments
     */
    fun getValidRoles(userRoles: Collection<UserRole>): List<Role> {
        return userRoles
            .filter { it.isCurrentlyValid() && it.role != null }
            .mapNotNull { it.role }
    }

    /**
     * Check if any of the user's roles has a specific permission
     */
    fun userHasPermission(userRoles: Collection<UserRole>, permission: Permission): Boolean {
        return userRoles.any { it.hasPermission(permission) }
    }

    /**
     * Check if user has all required permissions
     */
    fun userHasAllPermissions(
        userRoles: Collection<UserRole>, 
        vararg requiredPermissions: Permission
    ): Boolean {
        val effectivePermissions = calculateEffectivePermissions(userRoles)
        return hasAllPermissions(effectivePermissions, *requiredPermissions)
    }

    /**
     * Check if user has any of the required permissions
     */
    fun userHasAnyPermission(
        userRoles: Collection<UserRole>, 
        vararg requiredPermissions: Permission
    ): Boolean {
        val effectivePermissions = calculateEffectivePermissions(userRoles)
        return hasAnyPermission(effectivePermissions, *requiredPermissions)
    }

    /**
     * Get user's primary role (marked as primary or highest hierarchy)
     */
    fun getPrimaryRole(userRoles: Collection<UserRole>): Role? {
        val validRoles = userRoles.filter { it.isCurrentlyValid() && it.role != null }
        
        // First try to find explicitly marked primary role
        val primaryRole = validRoles.find { it.isPrimary }?.role
        if (primaryRole != null) {
            return primaryRole
        }
        
        // Otherwise return role with highest hierarchy
        return validRoles.maxByOrNull { it.getHierarchyLevel() }?.role
    }

    /**
     * Create a human-readable summary of user permissions
     */
    fun createPermissionSummary(userRoles: Collection<UserRole>): PermissionSummary {
        val validRoles = getValidRoles(userRoles)
        val effectivePermissions = calculateEffectivePermissions(userRoles)
        val permissionsList = getPermissionsList(effectivePermissions)
        val permissionsByCategory = getPermissionsByCategory(effectivePermissions)
        val highestHierarchy = getHighestHierarchyLevel(userRoles)
        val primaryRole = getPrimaryRole(userRoles)

        return PermissionSummary(
            roles = validRoles,
            primaryRole = primaryRole,
            effectivePermissions = effectivePermissions,
            permissionsList = permissionsList,
            permissionsByCategory = permissionsByCategory,
            highestHierarchyLevel = highestHierarchy,
            totalPermissionCount = permissionsList.size
        )
    }

    /**
     * Validate that a permission value is within valid bounds
     */
    fun isValidPermissionValue(permissions: Long): Boolean {
        // Check that no bits are set beyond the highest defined permission
        val maxValidPermission = Permission.values().maxOfOrNull { it.value } ?: 0L
        val maxAllowedValue = (maxValidPermission shl 1) - 1
        return permissions >= 0 && permissions <= maxAllowedValue
    }

    /**
     * Convert permission names to permission flag value
     */
    fun parsePermissionNames(permissionNames: Collection<String>): Long {
        return Permission.parsePermissions(permissionNames.toList())
    }

    /**
     * Convert permission flag value to permission names
     */
    fun getPermissionNames(permissions: Long): List<String> {
        return getPermissionsList(permissions).map { it.name }
    }

    /**
     * Create a permission mask for a specific category
     */
    fun createCategoryMask(category: String): Long {
        return Permission.getAllPermissionsForCategory(category)
    }

    /**
     * Check if permissions contain any permissions from a specific category
     */
    fun hasAnyPermissionInCategory(permissions: Long, category: String): Boolean {
        val categoryMask = createCategoryMask(category)
        return (permissions and categoryMask) != 0L
    }

    /**
     * Check if permissions contain all permissions from a specific category
     */
    fun hasAllPermissionsInCategory(permissions: Long, category: String): Boolean {
        val categoryMask = createCategoryMask(category)
        return (permissions and categoryMask) == categoryMask
    }

    /**
     * Data class representing a comprehensive summary of user permissions
     */
    data class PermissionSummary(
        val roles: List<Role>,
        val primaryRole: Role?,
        val effectivePermissions: Long,
        val permissionsList: List<Permission>,
        val permissionsByCategory: Map<String, List<Permission>>,
        val highestHierarchyLevel: Int,
        val totalPermissionCount: Int
    ) {
        fun hasPermission(permission: Permission): Boolean {
            return permission in permissionsList
        }

        fun hasAnyPermissionInCategory(category: String): Boolean {
            return permissionsByCategory.containsKey(category)
        }

        fun getPermissionsInCategory(category: String): List<Permission> {
            return permissionsByCategory[category] ?: emptyList()
        }

        fun getDescription(): String {
            return "User has ${totalPermissionCount} permissions across ${permissionsByCategory.size} categories " +
                    "with highest hierarchy level $highestHierarchyLevel. " +
                    "Primary role: ${primaryRole?.displayName ?: "None"}"
        }
    }
}