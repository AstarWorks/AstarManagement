package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.UserRoleTable
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RoleTable
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantUserTable
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between UserRole domain model and UserRoleTable entity.
 * Handles composite key role assignment mapping with tenant user and role relationships.
 */
@Component
class UserRoleMapper {
    
    /**
     * Converts a domain UserRole to a persistence UserRoleTable.
     * 
     * @param userRole The domain UserRole
     * @param tenantUserTable The TenantUserTable entity for the foreign key relationship
     * @param roleTable The RoleTable entity for the foreign key relationship
     * @param assignedByUserTable The UserTable entity for the assigned_by foreign key (nullable)
     * @return UserRoleTable entity
     */
    fun toEntity(
        userRole: UserRole,
        tenantUserTable: TenantUserTable,
        roleTable: RoleTable,
        assignedByUserTable: UserTable?
    ): UserRoleTable {
        return UserRoleTable(
            tenantUser = tenantUserTable,
            role = roleTable,
            assignedAt = userRole.assignedAt,
            assignedBy = assignedByUserTable
        )
    }
    
    /**
     * Converts a persistence UserRoleTable to a domain UserRole.
     * 
     * @param entity The UserRoleTable entity
     * @return UserRole domain model
     */
    fun toDomain(entity: UserRoleTable): UserRole {
        return UserRole(
            tenantUserId = entity.tenantUser.id,
            roleId = entity.role.id,
            assignedAt = entity.assignedAt,
            assignedBy = entity.assignedBy?.id
        )
    }
    
    /**
     * Updates an existing UserRoleTable with values from a domain UserRole.
     * Note: This method does not update the composite key relationships (tenantUser, role)
     * as these are typically immutable after creation. Only updates assignedBy.
     * 
     * @param entity The existing UserRoleTable entity to update
     * @param userRole The UserRole with new values
     * @param assignedByUserTable The UserTable entity for the assigned_by foreign key (nullable)
     * @return The updated UserRoleTable entity
     */
    fun updateEntity(
        entity: UserRoleTable,
        userRole: UserRole,
        assignedByUserTable: UserTable?
    ): UserRoleTable {
        entity.assignedBy = assignedByUserTable
        // Note: tenantUser, role, and assignedAt are intentionally not updated
        // as composite key and timestamp should be immutable
        return entity
    }
    
    /**
     * Converts a list of UserRoleTable entities to a list of UserRole domain models.
     * 
     * @param entities List of UserRoleTable entities
     * @return List of UserRole domain models
     */
    fun toDomainList(entities: List<UserRoleTable>): List<UserRole> {
        return entities.map { toDomain(it) }
    }
    
    /**
     * Extracts tenant user ID from a UserRole for repository operations.
     * This is a utility method to handle tenant user ID extraction.
     * 
     * @param userRole The UserRole
     * @return The tenant user ID as string
     */
    fun extractTenantUserId(userRole: UserRole): String {
        return userRole.tenantUserId.toString()
    }
    
    /**
     * Extracts role ID from a UserRole for repository operations.
     * This is a utility method to handle role ID extraction.
     * 
     * @param userRole The UserRole
     * @return The role ID as string
     */
    fun extractRoleId(userRole: UserRole): String {
        return userRole.roleId.toString()
    }
    
    /**
     * Extracts assigned by user ID from a UserRole for repository operations.
     * This is a utility method to handle assigned by user ID extraction.
     * 
     * @param userRole The UserRole
     * @return The assigned by user ID as string, or null if system-assigned
     */
    fun extractAssignedBy(userRole: UserRole): String? {
        return userRole.assignedBy?.toString()
    }
    
    /**
     * Checks if a user role was assigned by a specific user.
     * 
     * @param userRole The UserRole
     * @param userId The user ID to check against
     * @return true if assigned by the specified user, false otherwise
     */
    fun wasAssignedBy(userRole: UserRole, userId: String): Boolean {
        return userRole.assignedBy?.toString() == userId
    }
    
    /**
     * Checks if a user role is system-assigned.
     * 
     * @param userRole The UserRole
     * @return true if system-assigned, false otherwise
     */
    fun isSystemAssigned(userRole: UserRole): Boolean {
        return userRole.isSystemAssigned()
    }
    
    /**
     * Checks if a user role was assigned within specified days.
     * 
     * @param userRole The UserRole
     * @param withinDays Number of days to check
     * @return true if assigned within the specified days, false otherwise
     */
    fun wasAssignedWithin(userRole: UserRole, withinDays: Long): Boolean {
        return userRole.wasAssignedWithin(withinDays)
    }
    
    /**
     * Creates a composite key string for logging and debugging purposes.
     * 
     * @param userRole The UserRole
     * @return Composite key as string in format "tenantUserId:roleId"
     */
    fun createCompositeKeyString(userRole: UserRole): String {
        return "${userRole.tenantUserId}:${userRole.roleId}"
    }
}