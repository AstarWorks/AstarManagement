package dev.ryuzu.astermanagement.security.rbac.repository

import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.security.rbac.entity.Role
import dev.ryuzu.astermanagement.security.rbac.entity.UserRole
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.*

/**
 * Repository interface for UserRole entity operations.
 * Provides methods for managing user-role assignments with audit trail
 * and expiration support in the Discord-style RBAC system.
 */
@Repository
interface UserRoleRepository : JpaRepository<UserRole, UUID> {

    /**
     * Find all role assignments for a specific user
     */
    fun findByUser(user: User): List<UserRole>

    /**
     * Find all role assignments for a specific user by user ID
     */
    fun findByUserId(userId: UUID): List<UserRole>

    /**
     * Find all active role assignments for a specific user
     */
    fun findByUserAndIsActiveTrue(user: User): List<UserRole>

    /**
     * Find all active role assignments for a specific user by user ID
     */
    fun findByUserIdAndIsActiveTrue(userId: UUID): List<UserRole>

    /**
     * Find all currently valid role assignments for a user (active and not expired)
     */
    @Query("""
        SELECT ur FROM UserRole ur 
        WHERE ur.user.id = :userId
        AND ur.isActive = true
        AND (ur.expiresAt IS NULL OR ur.expiresAt > :currentTime)
    """)
    fun findValidRolesByUserId(
        @Param("userId") userId: UUID,
        @Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now()
    ): List<UserRole>

    /**
     * Find all currently valid role assignments for a user (active and not expired)
     */
    @Query("""
        SELECT ur FROM UserRole ur 
        WHERE ur.user = :user
        AND ur.isActive = true
        AND (ur.expiresAt IS NULL OR ur.expiresAt > :currentTime)
    """)
    fun findValidRolesByUser(
        @Param("user") user: User,
        @Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now()
    ): List<UserRole>

    /**
     * Find all users assigned to a specific role
     */
    fun findByRole(role: Role): List<UserRole>

    /**
     * Find all users assigned to a specific role by role ID
     */
    fun findByRoleId(roleId: UUID): List<UserRole>

    /**
     * Find all active users assigned to a specific role
     */
    fun findByRoleAndIsActiveTrue(role: Role): List<UserRole>

    /**
     * Find specific user-role assignment
     */
    fun findByUserAndRole(user: User, role: Role): UserRole?

    /**
     * Find specific user-role assignment by IDs
     */
    fun findByUserIdAndRoleId(userId: UUID, roleId: UUID): UserRole?

    /**
     * Find primary role for a user
     */
    fun findByUserAndIsPrimaryTrue(user: User): UserRole?

    /**
     * Find primary role for a user by user ID
     */
    fun findByUserIdAndIsPrimaryTrue(userId: UUID): UserRole?

    /**
     * Find all expired role assignments
     */
    @Query("""
        SELECT ur FROM UserRole ur 
        WHERE ur.expiresAt IS NOT NULL 
        AND ur.expiresAt < :currentTime
        AND ur.isActive = true
    """)
    fun findExpiredRoles(@Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now()): List<UserRole>

    /**
     * Find role assignments expiring soon
     */
    @Query("""
        SELECT ur FROM UserRole ur 
        WHERE ur.expiresAt IS NOT NULL 
        AND ur.expiresAt BETWEEN :currentTime AND :expirationThreshold
        AND ur.isActive = true
    """)
    fun findRolesExpiringSoon(
        @Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now(),
        @Param("expirationThreshold") expirationThreshold: LocalDateTime
    ): List<UserRole>

    /**
     * Find role assignments granted by a specific user
     */
    fun findByGrantedBy(grantedBy: UUID): List<UserRole>

    /**
     * Find role assignments granted within a date range
     */
    fun findByGrantedAtBetween(startDate: LocalDateTime, endDate: LocalDateTime): List<UserRole>

    /**
     * Check if a user has a specific role (active)
     */
    fun existsByUserAndRoleAndIsActiveTrue(user: User, role: Role): Boolean

    /**
     * Check if a user has a specific role by IDs (active)
     */
    fun existsByUserIdAndRoleIdAndIsActiveTrue(userId: UUID, roleId: UUID): Boolean

    /**
     * Count active role assignments for a user
     */
    fun countByUserAndIsActiveTrue(user: User): Long

    /**
     * Count active role assignments for a user by user ID
     */
    fun countByUserIdAndIsActiveTrue(userId: UUID): Long

    /**
     * Count users with a specific role (active assignments)
     */
    fun countByRoleAndIsActiveTrue(role: Role): Long

    /**
     * Get role assignment statistics for a user
     */
    @Query("""
        SELECT 
            COUNT(ur) as totalAssignments,
            COUNT(CASE WHEN ur.isActive = true THEN 1 END) as activeAssignments,
            COUNT(CASE WHEN ur.isPrimary = true THEN 1 END) as primaryAssignments,
            COUNT(CASE WHEN ur.expiresAt IS NOT NULL AND ur.expiresAt < :currentTime THEN 1 END) as expiredAssignments
        FROM UserRole ur 
        WHERE ur.user.id = :userId
    """)
    fun getUserRoleStatistics(
        @Param("userId") userId: UUID,
        @Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now()
    ): UserRoleStatistics

    /**
     * Get role usage statistics
     */
    @Query("""
        SELECT 
            r.name as roleName,
            r.displayName as roleDisplayName,
            COUNT(ur) as totalAssignments,
            COUNT(CASE WHEN ur.isActive = true THEN 1 END) as activeAssignments
        FROM UserRole ur 
        JOIN ur.role r
        GROUP BY r.id, r.name, r.displayName
        ORDER BY activeAssignments DESC
    """)
    fun getRoleUsageStatistics(): List<RoleUsageStatistics>

    /**
     * Deactivate all role assignments for a user
     */
    @Modifying
    @Query("""
        UPDATE UserRole ur 
        SET ur.isActive = false, ur.updatedAt = :currentTime
        WHERE ur.user.id = :userId
    """)
    fun deactivateAllRolesForUser(
        @Param("userId") userId: UUID,
        @Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now()
    )

    /**
     * Deactivate a specific role assignment
     */
    @Modifying
    @Query("""
        UPDATE UserRole ur 
        SET ur.isActive = false, ur.updatedAt = :currentTime
        WHERE ur.user.id = :userId AND ur.role.id = :roleId
    """)
    fun deactivateUserRole(
        @Param("userId") userId: UUID,
        @Param("roleId") roleId: UUID,
        @Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now()
    )

    /**
     * Set primary role for a user (deactivates other primary roles)
     */
    @Modifying
    @Query("""
        UPDATE UserRole ur 
        SET ur.isPrimary = CASE WHEN ur.id = :userRoleId THEN true ELSE false END,
            ur.updatedAt = :currentTime
        WHERE ur.user.id = :userId
    """)
    fun setPrimaryRole(
        @Param("userId") userId: UUID,
        @Param("userRoleId") userRoleId: UUID,
        @Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now()
    )

    /**
     * Automatically deactivate expired role assignments
     */
    @Modifying
    @Query("""
        UPDATE UserRole ur 
        SET ur.isActive = false, ur.updatedAt = :currentTime
        WHERE ur.expiresAt IS NOT NULL 
        AND ur.expiresAt < :currentTime
        AND ur.isActive = true
    """)
    fun deactivateExpiredRoles(@Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now()): Int

    /**
     * Find users with a specific permission through their roles
     */
    @Query("""
        SELECT DISTINCT ur FROM UserRole ur 
        JOIN ur.role r
        WHERE ur.isActive = true
        AND (ur.expiresAt IS NULL OR ur.expiresAt > :currentTime)
        AND (r.permissions & :permissionValue) = :permissionValue
    """)
    fun findUsersWithPermission(
        @Param("permissionValue") permissionValue: Long,
        @Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now()
    ): List<UserRole>

    /**
     * Find users with minimum hierarchy level
     */
    @Query("""
        SELECT DISTINCT ur FROM UserRole ur 
        JOIN ur.role r
        WHERE ur.isActive = true
        AND (ur.expiresAt IS NULL OR ur.expiresAt > :currentTime)
        AND r.hierarchyLevel >= :minimumLevel
    """)
    fun findUsersWithMinimumHierarchy(
        @Param("minimumLevel") minimumLevel: Int,
        @Param("currentTime") currentTime: LocalDateTime = LocalDateTime.now()
    ): List<UserRole>

    /**
     * Get all role assignments with pagination
     */
    fun findAllByOrderByGrantedAtDesc(pageable: Pageable): Page<UserRole>

    /**
     * Get role assignments for a user with pagination
     */
    fun findByUserIdOrderByGrantedAtDesc(userId: UUID, pageable: Pageable): Page<UserRole>

    /**
     * Projection interface for user role statistics
     */
    interface UserRoleStatistics {
        val totalAssignments: Long
        val activeAssignments: Long
        val primaryAssignments: Long
        val expiredAssignments: Long
    }

    /**
     * Projection interface for role usage statistics
     */
    interface RoleUsageStatistics {
        val roleName: String
        val roleDisplayName: String
        val totalAssignments: Long
        val activeAssignments: Long
        
        /**
         * Calculate active assignment percentage
         */
        fun getActivePercentage(): Double {
            return if (totalAssignments > 0) {
                (activeAssignments.toDouble() / totalAssignments.toDouble()) * 100.0
            } else {
                0.0
            }
        }
    }
}