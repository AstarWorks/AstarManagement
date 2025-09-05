package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.UserRoleRepository
import com.astarworks.astarmanagement.shared.domain.value.*
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Caching
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing user role assignments.
 * 
 * This service handles the assignment and management of roles to users,
 * following Discord's model where users can have multiple roles.
 * 
 * Key features:
 * - Multiple role assignments per user
 * - Role assignment tracking (who assigned, when)
 * - Bulk operations for efficiency
 * - Audit trail for role changes
 */
@Service
@Transactional
class UserRoleService(
    private val userRoleRepository: UserRoleRepository,
    private val dynamicRoleRepository: DynamicRoleRepository
) {
    private val logger = LoggerFactory.getLogger(UserRoleService::class.java)
    
    /**
     * Assigns a role to a user.
     * 
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID to assign
     * @param assignedBy Optional ID of the user performing the assignment
     * @return The created user role assignment
     * @throws IllegalArgumentException if role not found or already assigned
     */
    @Caching(evict = [
        CacheEvict(value = ["userRoles"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissions"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissionRules"], key = "#tenantUserId")
    ])
    fun assignRole(
        tenantUserId: UUID,
        roleId: UUID,
        assignedBy: UUID? = null
    ): UserRole {
        logger.info("Assigning role $roleId to user $tenantUserId")
        
        // Verify role exists
        val role = dynamicRoleRepository.findById(RoleId(roleId))
            ?: throw IllegalArgumentException("Role not found: $roleId")
        
        // Check if already assigned
        if (userRoleRepository.existsByTenantUserIdAndRoleId(tenantUserId, roleId)) {
            throw IllegalArgumentException("Role $roleId is already assigned to user $tenantUserId")
        }
        
        val userRole = UserRole.assign(
            tenantUserId = TenantMembershipId(tenantUserId),
            roleId = RoleId(roleId),
            assignedBy = assignedBy?.let { UserId(it) }
        )
        
        val savedUserRole = userRoleRepository.save(userRole)
        logger.info("Assigned role $roleId to user $tenantUserId")
        
        return savedUserRole
    }
    
    /**
     * Assigns multiple roles to a user in a single transaction.
     * 
     * @param tenantUserId The tenant user ID
     * @param roleIds List of role IDs to assign
     * @param assignedBy Optional ID of the user performing the assignment
     * @return List of created user role assignments
     * @throws IllegalArgumentException if any role not found
     */
    @Caching(evict = [
        CacheEvict(value = ["userRoles"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissions"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissionRules"], key = "#tenantUserId")
    ])
    fun assignRoles(
        tenantUserId: UUID,
        roleIds: List<UUID>,
        assignedBy: UUID? = null
    ): List<UserRole> {
        logger.info("Assigning ${roleIds.size} roles to user $tenantUserId")
        
        val assignments = mutableListOf<UserRole>()
        
        roleIds.forEach { roleId ->
            // Verify role exists
            val role = dynamicRoleRepository.findById(RoleId(roleId))
                ?: throw IllegalArgumentException("Role not found: $roleId")
            
            // Skip if already assigned
            if (!userRoleRepository.existsByTenantUserIdAndRoleId(tenantUserId, roleId)) {
                val userRole = UserRole.assign(
                    tenantUserId = TenantMembershipId(tenantUserId),
                    roleId = RoleId(roleId),
                    assignedBy = assignedBy?.let { UserId(it) }
                )
                
                val savedUserRole = userRoleRepository.save(userRole)
                assignments.add(savedUserRole)
            } else {
                logger.debug("Role $roleId already assigned to user $tenantUserId, skipping")
            }
        }
        
        logger.info("Assigned ${assignments.size} new roles to user $tenantUserId")
        return assignments
    }
    
    /**
     * Removes a role from a user.
     * 
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID to remove
     * @throws IllegalArgumentException if assignment not found
     */
    @Caching(evict = [
        CacheEvict(value = ["userRoles"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissions"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissionRules"], key = "#tenantUserId")
    ])
    fun removeRole(tenantUserId: UUID, roleId: UUID) {
        logger.info("Removing role $roleId from user $tenantUserId")
        
        // Check if assignment exists
        if (!userRoleRepository.existsByTenantUserIdAndRoleId(tenantUserId, roleId)) {
            throw IllegalArgumentException("Role $roleId is not assigned to user $tenantUserId")
        }
        
        userRoleRepository.deleteByTenantUserIdAndRoleId(tenantUserId, roleId)
        logger.info("Removed role $roleId from user $tenantUserId")
    }
    
    /**
     * Removes multiple roles from a user.
     * 
     * @param tenantUserId The tenant user ID
     * @param roleIds List of role IDs to remove
     */
    @Caching(evict = [
        CacheEvict(value = ["userRoles"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissions"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissionRules"], key = "#tenantUserId")
    ])
    fun removeRoles(tenantUserId: UUID, roleIds: List<UUID>) {
        logger.info("Removing ${roleIds.size} roles from user $tenantUserId")
        
        var removedCount = 0
        roleIds.forEach { roleId ->
            if (userRoleRepository.existsByTenantUserIdAndRoleId(tenantUserId, roleId)) {
                userRoleRepository.deleteByTenantUserIdAndRoleId(tenantUserId, roleId)
                removedCount++
            }
        }
        
        logger.info("Removed $removedCount roles from user $tenantUserId")
    }
    
    /**
     * Removes all roles from a user.
     * 
     * @param tenantUserId The tenant user ID
     */
    @Caching(evict = [
        CacheEvict(value = ["userRoles"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissions"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissionRules"], key = "#tenantUserId")
    ])
    fun removeAllRoles(tenantUserId: UUID) {
        logger.info("Removing all roles from user $tenantUserId")
        
        userRoleRepository.deleteByTenantUserId(tenantUserId)
        logger.info("Removed all roles from user $tenantUserId")
    }
    
    /**
     * Gets all role assignments for a user.
     * 
     * @param tenantUserId The tenant user ID
     * @return List of user role assignments
     */
    @Transactional(readOnly = true)
    fun getUserRoles(tenantUserId: UUID): List<UserRole> {
        return userRoleRepository.findByTenantUserId(tenantUserId)
    }
    
    /**
     * Gets all roles (DynamicRole objects) assigned to a user.
     * 
     * @param tenantUserId The tenant user ID
     * @return List of DynamicRole objects
     */
    @Transactional(readOnly = true)
    fun getUserDynamicRoles(tenantUserId: UUID): List<DynamicRole> {
        val userRoles = userRoleRepository.findByTenantUserId(tenantUserId)
        return userRoles.mapNotNull { userRole ->
            dynamicRoleRepository.findById(userRole.roleId)
        }
    }
    
    /**
     * Gets all users assigned to a specific role.
     * 
     * @param roleId The role ID
     * @return List of user role assignments for the role
     */
    @Transactional(readOnly = true)
    fun getUsersByRole(roleId: UUID): List<UserRole> {
        return userRoleRepository.findByRoleId(roleId)
    }
    
    /**
     * Gets all role assignments made by a specific user.
     * 
     * @param assignedBy The ID of the user who made the assignments
     * @return List of role assignments made by the user
     */
    @Transactional(readOnly = true)
    fun getAssignmentsByUser(assignedBy: UUID): List<UserRole> {
        return userRoleRepository.findByAssignedBy(assignedBy)
    }
    
    /**
     * Gets all system-assigned roles (no specific assigner).
     * 
     * @return List of system-assigned role assignments
     */
    @Transactional(readOnly = true)
    fun getSystemAssignedRoles(): List<UserRole> {
        return userRoleRepository.findSystemAssigned()
    }
    
    /**
     * Reassigns a role with a new assigner.
     * Updates the assignment timestamp and assigner information.
     * 
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID
     * @param newAssignerId The new assigner's user ID
     * @return The updated user role assignment
     * @throws IllegalArgumentException if assignment not found
     */
    fun reassignRole(
        tenantUserId: UUID,
        roleId: UUID,
        newAssignerId: UUID
    ): UserRole {
        logger.info("Reassigning role $roleId for user $tenantUserId by $newAssignerId")
        
        val existingAssignment = userRoleRepository.findByTenantUserIdAndRoleId(tenantUserId, roleId)
            ?: throw IllegalArgumentException("Role $roleId is not assigned to user $tenantUserId")
        
        val reassignedRole = existingAssignment.reassignBy(UserId(newAssignerId))
        val savedUserRole = userRoleRepository.save(reassignedRole)
        
        logger.info("Reassigned role $roleId for user $tenantUserId")
        return savedUserRole
    }
    
    /**
     * Replaces all roles for a user with a new set of roles.
     * Removes existing roles and assigns new ones in a single transaction.
     * 
     * @param tenantUserId The tenant user ID
     * @param newRoleIds List of new role IDs to assign
     * @param assignedBy Optional ID of the user performing the assignment
     * @return List of new user role assignments
     */
    @Caching(evict = [
        CacheEvict(value = ["userRoles"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissions"], key = "#tenantUserId"),
        CacheEvict(value = ["userPermissionRules"], key = "#tenantUserId")
    ])
    fun replaceUserRoles(
        tenantUserId: UUID,
        newRoleIds: List<UUID>,
        assignedBy: UUID? = null
    ): List<UserRole> {
        logger.info("Replacing all roles for user $tenantUserId with ${newRoleIds.size} new roles")
        
        // Remove all existing roles
        userRoleRepository.deleteByTenantUserId(tenantUserId)
        
        // Assign new roles
        return assignRoles(tenantUserId, newRoleIds, assignedBy)
    }
    
    /**
     * Checks if a user has a specific role.
     * 
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID to check
     * @return true if the user has the role, false otherwise
     */
    @Transactional(readOnly = true)
    fun hasRole(tenantUserId: UUID, roleId: UUID): Boolean {
        return userRoleRepository.existsByTenantUserIdAndRoleId(tenantUserId, roleId)
    }
    
    /**
     * Checks if a user has a role by name.
     * 
     * @param tenantUserId The tenant user ID
     * @param tenantId The tenant ID
     * @param roleName The role name to check
     * @return true if the user has the role, false otherwise
     */
    @Transactional(readOnly = true)
    fun hasRoleByName(tenantUserId: UUID, tenantId: UUID, roleName: String): Boolean {
        val role = dynamicRoleRepository.findByTenantIdAndName(TenantId(tenantId), roleName)
            ?: return false
        
        return hasRole(tenantUserId, role.id.value)
    }
    
    /**
     * Checks if a user has any roles assigned.
     * 
     * @param tenantUserId The tenant user ID
     * @return true if the user has at least one role, false otherwise
     */
    @Transactional(readOnly = true)
    fun hasAnyRole(tenantUserId: UUID): Boolean {
        return userRoleRepository.existsByTenantUserId(tenantUserId)
    }
    
    /**
     * Counts the number of roles assigned to a user.
     * 
     * @param tenantUserId The tenant user ID
     * @return The count of roles assigned to the user
     */
    @Transactional(readOnly = true)
    fun countUserRoles(tenantUserId: UUID): Long {
        return userRoleRepository.countByTenantUserId(tenantUserId)
    }
    
    /**
     * Counts the number of users assigned to a role.
     * 
     * @param roleId The role ID
     * @return The count of users with this role
     */
    @Transactional(readOnly = true)
    fun countUsersWithRole(roleId: UUID): Long {
        return userRoleRepository.countByRoleId(roleId)
    }
    
    /**
     * Gets recent role assignments within a specified number of days.
     * 
     * @param withinDays Number of days to look back
     * @return List of recent role assignments
     */
    @Transactional(readOnly = true)
    fun getRecentAssignments(withinDays: Long): List<UserRole> {
        return userRoleRepository.findAssignedWithin(withinDays)
    }
    
    /**
     * Validates that a role can be assigned to a user.
     * Checks business rules and constraints.
     * 
     * @param tenantUserId The tenant user ID
     * @param roleId The role ID
     * @return true if assignment is valid, false otherwise
     */
    @Transactional(readOnly = true)
    fun canAssignRole(tenantUserId: UUID, roleId: UUID): Boolean {
        // Check if role exists
        val role = dynamicRoleRepository.findById(RoleId(roleId)) ?: return false
        
        // Check if already assigned
        if (userRoleRepository.existsByTenantUserIdAndRoleId(tenantUserId, roleId)) {
            return false
        }
        
        // Additional business rules can be added here
        // For example: maximum roles per user, role exclusivity rules, etc.
        
        return true
    }
}