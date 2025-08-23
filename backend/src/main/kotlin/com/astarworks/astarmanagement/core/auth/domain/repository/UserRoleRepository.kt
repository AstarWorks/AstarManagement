package com.astarworks.astarmanagement.core.auth.domain.repository

import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import java.util.UUID

/**
 * UserRole repository interface for domain layer.
 * Handles role assignments to users within tenant context persistence operations.
 * Supports Discord-style multiple role assignments with composite key management.
 */
interface UserRoleRepository {
    
    /**
     * Saves a user role assignment to the repository.
     * @param userRole The user role to save
     * @return The saved user role with any generated values
     */
    fun save(userRole: UserRole): UserRole
    
    /**
     * Finds a user role by tenant user ID and role ID combination (composite key).
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID
     * @return The user role if found, null otherwise
     */
    fun findByTenantUserIdAndRoleId(tenantUserId: UUID, roleId: UUID): UserRole?
    
    /**
     * Finds all user role assignments.
     * @return List of all user roles
     */
    fun findAll(): List<UserRole>
    
    /**
     * Finds all role assignments for a specific tenant user.
     * @param tenantUserId The tenant user ID
     * @return List of role assignments for the tenant user
     */
    fun findByTenantUserId(tenantUserId: UUID): List<UserRole>
    
    /**
     * Finds all users assigned to a specific role.
     * @param roleId The role ID
     * @return List of user role assignments for the role
     */
    fun findByRoleId(roleId: UUID): List<UserRole>
    
    /**
     * Finds all role assignments assigned by a specific user.
     * @param assignedBy The user ID who assigned the roles
     * @return List of role assignments made by the user
     */
    fun findByAssignedBy(assignedBy: UUID): List<UserRole>
    
    /**
     * Finds all system-assigned role assignments (no specific assigner).
     * @return List of system-assigned role assignments
     */
    fun findSystemAssigned(): List<UserRole>
    
    /**
     * Finds role assignments assigned within a specific time period.
     * @param withinDays Number of days to check
     * @return List of role assignments within the specified days
     */
    fun findAssignedWithin(withinDays: Long): List<UserRole>
    
    /**
     * Finds role assignments for a tenant user assigned by a specific user.
     * @param tenantUserId The tenant user ID
     * @param assignedBy The user ID who assigned the roles
     * @return List of role assignments
     */
    fun findByTenantUserIdAndAssignedBy(tenantUserId: UUID, assignedBy: UUID): List<UserRole>
    
    /**
     * Finds role assignments for a specific role assigned by a specific user.
     * @param roleId The role ID
     * @param assignedBy The user ID who assigned the roles
     * @return List of role assignments
     */
    fun findByRoleIdAndAssignedBy(roleId: UUID, assignedBy: UUID): List<UserRole>
    
    /**
     * Checks if a role assignment exists for the given tenant user and role combination.
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID
     * @return true if assignment exists, false otherwise
     */
    fun existsByTenantUserIdAndRoleId(tenantUserId: UUID, roleId: UUID): Boolean
    
    /**
     * Checks if any role assignments exist for a specific tenant user.
     * @param tenantUserId The tenant user ID
     * @return true if assignments exist, false otherwise
     */
    fun existsByTenantUserId(tenantUserId: UUID): Boolean
    
    /**
     * Checks if any role assignments exist for a specific role.
     * @param roleId The role ID
     * @return true if assignments exist, false otherwise
     */
    fun existsByRoleId(roleId: UUID): Boolean
    
    /**
     * Deletes a role assignment by tenant user ID and role ID combination (composite key).
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID
     */
    fun deleteByTenantUserIdAndRoleId(tenantUserId: UUID, roleId: UUID)
    
    /**
     * Deletes all role assignments for a specific tenant user.
     * @param tenantUserId The tenant user ID
     */
    fun deleteByTenantUserId(tenantUserId: UUID)
    
    /**
     * Deletes all role assignments for a specific role.
     * @param roleId The role ID
     */
    fun deleteByRoleId(roleId: UUID)
    
    /**
     * Deletes all role assignments assigned by a specific user.
     * @param assignedBy The user ID who assigned the roles
     */
    fun deleteByAssignedBy(assignedBy: UUID)
    
    /**
     * Counts the total number of role assignments.
     * @return The total count
     */
    fun count(): Long
    
    /**
     * Counts the number of role assignments for a specific tenant user.
     * @param tenantUserId The tenant user ID
     * @return The count of role assignments for the tenant user
     */
    fun countByTenantUserId(tenantUserId: UUID): Long
    
    /**
     * Counts the number of users assigned to a specific role.
     * @param roleId The role ID
     * @return The count of users assigned to the role
     */
    fun countByRoleId(roleId: UUID): Long
    
    /**
     * Counts the number of role assignments made by a specific user.
     * @param assignedBy The user ID who assigned the roles
     * @return The count of role assignments made by the user
     */
    fun countByAssignedBy(assignedBy: UUID): Long
    
    /**
     * Counts the number of system-assigned role assignments.
     * @return The count of system-assigned role assignments
     */
    fun countSystemAssigned(): Long
}