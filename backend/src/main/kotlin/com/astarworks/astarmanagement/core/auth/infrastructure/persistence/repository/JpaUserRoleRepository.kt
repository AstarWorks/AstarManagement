package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.UserRoleTable
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.UserRoleId
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RoleTable
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantUserTable
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserTable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.*

/**
 * Spring Data JPA repository for UserRoleTable (UserRole persistence).
 * Handles role assignments to users within tenant context with composite key operations.
 */
@Repository
interface JpaUserRoleRepository : JpaRepository<UserRoleTable, UserRoleId> {
    
    /**
     * Find a user role by tenant user and role combination (composite key lookup).
     * @param tenantUser The tenant user entity
     * @param role The role entity
     * @return The user role table if found, null otherwise
     */
    fun findByTenantUserAndRole(tenantUser: TenantUserTable, role: RoleTable): UserRoleTable?
    
    /**
     * Find all role assignments for a specific tenant user.
     * @param tenantUser The tenant user entity
     * @return List of user role tables for the tenant user
     */
    fun findByTenantUser(tenantUser: TenantUserTable): List<UserRoleTable>
    
    /**
     * Find all users assigned to a specific role.
     * @param role The role entity
     * @return List of user role tables for the role
     */
    fun findByRole(role: RoleTable): List<UserRoleTable>
    
    /**
     * Find all role assignments assigned by a specific user.
     * @param assignedBy The user entity who assigned the roles
     * @return List of user role tables assigned by the user
     */
    fun findByAssignedBy(assignedBy: UserTable): List<UserRoleTable>
    
    /**
     * Find all system-assigned role assignments (no specific assigner).
     * @return List of system-assigned user role tables
     */
    fun findByAssignedByIsNull(): List<UserRoleTable>
    
    /**
     * Find role assignments for a tenant user assigned by a specific user.
     * @param tenantUser The tenant user entity
     * @param assignedBy The user entity who assigned the roles
     * @return List of user role tables
     */
    fun findByTenantUserAndAssignedBy(tenantUser: TenantUserTable, assignedBy: UserTable): List<UserRoleTable>
    
    /**
     * Find role assignments for a specific role assigned by a specific user.
     * @param role The role entity
     * @param assignedBy The user entity who assigned the roles
     * @return List of user role tables
     */
    fun findByRoleAndAssignedBy(role: RoleTable, assignedBy: UserTable): List<UserRoleTable>
    
    /**
     * Find role assignments assigned after a specific date.
     * @param assignedAfter The date to compare against
     * @return List of user role tables assigned after the date
     */
    fun findByAssignedAtAfter(assignedAfter: LocalDateTime): List<UserRoleTable>
    
    /**
     * Check if a role assignment exists for the given tenant user and role combination.
     * @param tenantUser The tenant user entity
     * @param role The role entity
     * @return true if assignment exists, false otherwise
     */
    fun existsByTenantUserAndRole(tenantUser: TenantUserTable, role: RoleTable): Boolean
    
    /**
     * Check if any role assignments exist for a specific tenant user.
     * @param tenantUser The tenant user entity
     * @return true if assignments exist, false otherwise
     */
    fun existsByTenantUser(tenantUser: TenantUserTable): Boolean
    
    /**
     * Check if any role assignments exist for a specific role.
     * @param role The role entity
     * @return true if assignments exist, false otherwise
     */
    fun existsByRole(role: RoleTable): Boolean
    
    /**
     * Delete all role assignments for a specific tenant user.
     * @param tenantUser The tenant user entity
     */
    fun deleteByTenantUser(tenantUser: TenantUserTable)
    
    /**
     * Delete all role assignments for a specific role.
     * @param role The role entity
     */
    fun deleteByRole(role: RoleTable)
    
    /**
     * Delete all role assignments assigned by a specific user.
     * @param assignedBy The user entity who assigned the roles
     */
    fun deleteByAssignedBy(assignedBy: UserTable)
    
    /**
     * Count the number of role assignments for a specific tenant user.
     * @param tenantUser The tenant user entity
     * @return The count of role assignments for the tenant user
     */
    fun countByTenantUser(tenantUser: TenantUserTable): Long
    
    /**
     * Count the number of users assigned to a specific role.
     * @param role The role entity
     * @return The count of users assigned to the role
     */
    fun countByRole(role: RoleTable): Long
    
    /**
     * Count the number of role assignments made by a specific user.
     * @param assignedBy The user entity who assigned the roles
     * @return The count of role assignments made by the user
     */
    fun countByAssignedBy(assignedBy: UserTable): Long
    
    /**
     * Count the number of system-assigned role assignments.
     * @return The count of system-assigned role assignments
     */
    fun countByAssignedByIsNull(): Long
    
    /**
     * Find user role by tenant user ID and role ID using JPQL query for better performance with RLS.
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID
     * @return The user role table if found, null otherwise
     */
    @Query("SELECT ur FROM UserRoleTable ur WHERE ur.tenantUser.id = :tenantUserId AND ur.role.id = :roleId")
    fun findByTenantUserIdAndRoleId(@Param("tenantUserId") tenantUserId: UUID, @Param("roleId") roleId: UUID): UserRoleTable?
    
    /**
     * Find user roles by tenant user ID using JPQL query for better performance with RLS.
     * @param tenantUserId The tenant user ID
     * @return List of user role tables
     */
    @Query("SELECT ur FROM UserRoleTable ur WHERE ur.tenantUser.id = :tenantUserId")
    fun findByTenantUserId(@Param("tenantUserId") tenantUserId: UUID): List<UserRoleTable>
    
    /**
     * Find user roles by role ID using JPQL query for better performance with RLS.
     * @param roleId The role ID
     * @return List of user role tables
     */
    @Query("SELECT ur FROM UserRoleTable ur WHERE ur.role.id = :roleId")
    fun findByRoleId(@Param("roleId") roleId: UUID): List<UserRoleTable>
    
    /**
     * Find user roles by assigned by user ID using JPQL query.
     * @param assignedBy The user ID who assigned the roles
     * @return List of user role tables
     */
    @Query("SELECT ur FROM UserRoleTable ur WHERE ur.assignedBy.id = :assignedBy")
    fun findByAssignedById(@Param("assignedBy") assignedBy: UUID): List<UserRoleTable>
    
    /**
     * Find system-assigned user roles using JPQL query.
     * @return List of system-assigned user role tables
     */
    @Query("SELECT ur FROM UserRoleTable ur WHERE ur.assignedBy IS NULL")
    fun findSystemAssignedRoles(): List<UserRoleTable>
    
    /**
     * Find user roles assigned within specified days using JPQL query.
     * @param cutoffDate The cutoff date to compare against
     * @return List of user role tables assigned after the cutoff date
     */
    @Query("SELECT ur FROM UserRoleTable ur WHERE ur.assignedAt > :cutoffDate")
    fun findAssignedAfterDate(@Param("cutoffDate") cutoffDate: LocalDateTime): List<UserRoleTable>
    
    /**
     * Find user roles for a tenant user assigned by a specific user using JPQL query.
     * @param tenantUserId The tenant user ID
     * @param assignedBy The user ID who assigned the roles
     * @return List of user role tables
     */
    @Query("SELECT ur FROM UserRoleTable ur WHERE ur.tenantUser.id = :tenantUserId AND ur.assignedBy.id = :assignedBy")
    fun findByTenantUserIdAndAssignedById(@Param("tenantUserId") tenantUserId: UUID, @Param("assignedBy") assignedBy: UUID): List<UserRoleTable>
    
    /**
     * Find user roles for a specific role assigned by a specific user using JPQL query.
     * @param roleId The role ID
     * @param assignedBy The user ID who assigned the roles
     * @return List of user role tables
     */
    @Query("SELECT ur FROM UserRoleTable ur WHERE ur.role.id = :roleId AND ur.assignedBy.id = :assignedBy")
    fun findByRoleIdAndAssignedById(@Param("roleId") roleId: UUID, @Param("assignedBy") assignedBy: UUID): List<UserRoleTable>
    
    /**
     * Check if user role exists by tenant user ID and role ID using JPQL query.
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID
     * @return true if exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(ur) > 0 THEN true ELSE false END FROM UserRoleTable ur WHERE ur.tenantUser.id = :tenantUserId AND ur.role.id = :roleId")
    fun existsByTenantUserIdAndRoleId(@Param("tenantUserId") tenantUserId: UUID, @Param("roleId") roleId: UUID): Boolean
    
    /**
     * Check if user roles exist by tenant user ID using JPQL query.
     * @param tenantUserId The tenant user ID
     * @return true if exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(ur) > 0 THEN true ELSE false END FROM UserRoleTable ur WHERE ur.tenantUser.id = :tenantUserId")
    fun existsByTenantUserId(@Param("tenantUserId") tenantUserId: UUID): Boolean
    
    /**
     * Check if user roles exist by role ID using JPQL query.
     * @param roleId The role ID
     * @return true if exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(ur) > 0 THEN true ELSE false END FROM UserRoleTable ur WHERE ur.role.id = :roleId")
    fun existsByRoleId(@Param("roleId") roleId: UUID): Boolean
    
    /**
     * Delete user role by tenant user ID and role ID using JPQL query.
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID
     */
    @Query("DELETE FROM UserRoleTable ur WHERE ur.tenantUser.id = :tenantUserId AND ur.role.id = :roleId")
    fun deleteByTenantUserIdAndRoleId(@Param("tenantUserId") tenantUserId: UUID, @Param("roleId") roleId: UUID)
    
    /**
     * Count user roles by tenant user ID using JPQL query.
     * @param tenantUserId The tenant user ID
     * @return The count of role assignments for the tenant user
     */
    @Query("SELECT COUNT(ur) FROM UserRoleTable ur WHERE ur.tenantUser.id = :tenantUserId")
    fun countByTenantUserId(@Param("tenantUserId") tenantUserId: UUID): Long
    
    /**
     * Count user roles by role ID using JPQL query.
     * @param roleId The role ID
     * @return The count of users assigned to the role
     */
    @Query("SELECT COUNT(ur) FROM UserRoleTable ur WHERE ur.role.id = :roleId")
    fun countByRoleId(@Param("roleId") roleId: UUID): Long
    
    /**
     * Count user roles by assigned by user ID using JPQL query.
     * @param assignedBy The user ID who assigned the roles
     * @return The count of role assignments made by the user
     */
    @Query("SELECT COUNT(ur) FROM UserRoleTable ur WHERE ur.assignedBy.id = :assignedBy")
    fun countByAssignedById(@Param("assignedBy") assignedBy: UUID): Long
    
    /**
     * Count system-assigned user roles using JPQL query.
     * @return The count of system-assigned role assignments
     */
    @Query("SELECT COUNT(ur) FROM UserRoleTable ur WHERE ur.assignedBy IS NULL")
    fun countSystemAssignedRoles(): Long
}