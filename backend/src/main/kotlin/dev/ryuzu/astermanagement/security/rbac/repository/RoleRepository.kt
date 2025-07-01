package dev.ryuzu.astermanagement.security.rbac.repository

import dev.ryuzu.astermanagement.security.rbac.entity.Role
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Repository interface for Role entity operations.
 * Provides standard CRUD operations and custom queries for role management
 * in the Discord-style RBAC system.
 */
@Repository
interface RoleRepository : JpaRepository<Role, UUID> {

    /**
     * Find role by unique name (case-insensitive)
     */
    fun findByNameIgnoreCase(name: String): Role?

    /**
     * Find role by unique name (case-sensitive)
     */
    fun findByName(name: String): Role?

    /**
     * Find all active roles
     */
    fun findByIsActiveTrue(): List<Role>

    /**
     * Find all active roles with pagination
     */
    fun findByIsActiveTrue(pageable: Pageable): Page<Role>

    /**
     * Find all system-defined roles
     */
    fun findByIsSystemRoleTrue(): List<Role>

    /**
     * Find all custom (non-system) roles
     */
    fun findByIsSystemRoleFalse(): List<Role>

    /**
     * Find roles by hierarchy level range
     */
    fun findByHierarchyLevelBetween(minLevel: Int, maxLevel: Int): List<Role>

    /**
     * Find roles with hierarchy level greater than or equal to specified level
     */
    fun findByHierarchyLevelGreaterThanEqual(minLevel: Int): List<Role>

    /**
     * Find roles with hierarchy level less than or equal to specified level
     */
    fun findByHierarchyLevelLessThanEqual(maxLevel: Int): List<Role>

    /**
     * Find roles ordered by hierarchy level (descending - highest first)
     */
    fun findAllByOrderByHierarchyLevelDesc(): List<Role>

    /**
     * Find roles ordered by hierarchy level (ascending - lowest first)
     */
    fun findAllByOrderByHierarchyLevelAsc(): List<Role>

    /**
     * Find roles that have a specific permission
     */
    @Query("""
        SELECT r FROM Role r 
        WHERE (r.permissions & :permissionValue) = :permissionValue
        AND r.isActive = true
    """)
    fun findRolesWithPermission(@Param("permissionValue") permissionValue: Long): List<Role>

    /**
     * Find roles that have all of the specified permissions
     */
    @Query("""
        SELECT r FROM Role r 
        WHERE (r.permissions & :permissionMask) = :permissionMask
        AND r.isActive = true
    """)
    fun findRolesWithAllPermissions(@Param("permissionMask") permissionMask: Long): List<Role>

    /**
     * Find roles that have any of the specified permissions
     */
    @Query("""
        SELECT r FROM Role r 
        WHERE (r.permissions & :permissionMask) > 0
        AND r.isActive = true
    """)
    fun findRolesWithAnyPermissions(@Param("permissionMask") permissionMask: Long): List<Role>

    /**
     * Find roles with display name containing search term (case-insensitive)
     */
    fun findByDisplayNameContainingIgnoreCase(searchTerm: String): List<Role>

    /**
     * Find roles with display name containing search term with pagination
     */
    fun findByDisplayNameContainingIgnoreCase(searchTerm: String, pageable: Pageable): Page<Role>

    /**
     * Search roles by name or display name
     */
    @Query("""
        SELECT r FROM Role r 
        WHERE (LOWER(r.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
        OR LOWER(r.displayName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        AND r.isActive = true
        ORDER BY r.hierarchyLevel DESC
    """)
    fun searchRoles(@Param("searchTerm") searchTerm: String): List<Role>

    /**
     * Search roles by name or display name with pagination
     */
    @Query("""
        SELECT r FROM Role r 
        WHERE (LOWER(r.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
        OR LOWER(r.displayName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        AND r.isActive = true
        ORDER BY r.hierarchyLevel DESC
    """)
    fun searchRoles(@Param("searchTerm") searchTerm: String, pageable: Pageable): Page<Role>

    /**
     * Find roles that can perform all actions that another role can perform
     * (roles with equal or greater permissions)
     */
    @Query("""
        SELECT r FROM Role r 
        WHERE r.id != :excludeRoleId
        AND (r.permissions & :requiredPermissions) = :requiredPermissions
        AND r.isActive = true
        ORDER BY r.hierarchyLevel DESC
    """)
    fun findRolesThatCanPerformAllActionsOf(
        @Param("requiredPermissions") requiredPermissions: Long,
        @Param("excludeRoleId") excludeRoleId: UUID
    ): List<Role>

    /**
     * Get role hierarchy statistics
     */
    @Query("""
        SELECT 
            r.hierarchyLevel as level,
            COUNT(r) as count,
            AVG(CAST(r.permissions AS DOUBLE)) as avgPermissions
        FROM Role r 
        WHERE r.isActive = true
        GROUP BY r.hierarchyLevel
        ORDER BY r.hierarchyLevel DESC
    """)
    fun getRoleHierarchyStatistics(): List<RoleHierarchyStats>

    /**
     * Count roles by active status
     */
    fun countByIsActive(isActive: Boolean): Long

    /**
     * Count system roles
     */
    fun countByIsSystemRole(isSystemRole: Boolean): Long

    /**
     * Check if role name exists (case-insensitive)
     */
    fun existsByNameIgnoreCase(name: String): Boolean

    /**
     * Check if display name exists (case-insensitive)
     */
    fun existsByDisplayNameIgnoreCase(displayName: String): Boolean

    /**
     * Find roles suitable for a specific hierarchy level
     * (roles with equal or lower hierarchy level)
     */
    @Query("""
        SELECT r FROM Role r 
        WHERE r.hierarchyLevel <= :maxHierarchyLevel
        AND r.isActive = true
        ORDER BY r.hierarchyLevel DESC
    """)
    fun findRolesSuitableForHierarchy(@Param("maxHierarchyLevel") maxHierarchyLevel: Int): List<Role>

    /**
     * Find the highest hierarchy role
     */
    @Query("""
        SELECT r FROM Role r 
        WHERE r.isActive = true
        ORDER BY r.hierarchyLevel DESC
        LIMIT 1
    """)
    fun findHighestHierarchyRole(): Role?

    /**
     * Find the lowest hierarchy role
     */
    @Query("""
        SELECT r FROM Role r 
        WHERE r.isActive = true
        ORDER BY r.hierarchyLevel ASC
        LIMIT 1
    """)
    fun findLowestHierarchyRole(): Role?

    /**
     * Get permission usage statistics across all roles
     */
    @Query("""
        SELECT 
            COUNT(CASE WHEN (r.permissions & :permissionValue) = :permissionValue THEN 1 END) as roleCount,
            COUNT(*) as totalRoles
        FROM Role r 
        WHERE r.isActive = true
    """)
    fun getPermissionUsageStats(@Param("permissionValue") permissionValue: Long): PermissionUsageStats

    /**
     * Projection interface for role hierarchy statistics
     */
    interface RoleHierarchyStats {
        val level: Int
        val count: Long
        val avgPermissions: Double
    }

    /**
     * Projection interface for permission usage statistics
     */
    interface PermissionUsageStats {
        val roleCount: Long
        val totalRoles: Long
        
        /**
         * Calculate percentage of roles that have this permission
         */
        fun getUsagePercentage(): Double {
            return if (totalRoles > 0) {
                (roleCount.toDouble() / totalRoles.toDouble()) * 100.0
            } else {
                0.0
            }
        }
    }
}