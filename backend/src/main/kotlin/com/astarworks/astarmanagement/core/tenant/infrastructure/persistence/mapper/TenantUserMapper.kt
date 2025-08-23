package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.tenant.domain.model.TenantUser
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantUserTable
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantTable
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between TenantUser domain model and TenantUserTable entity.
 * Handles multi-tenant user membership mapping with tenant and user relationships.
 */
@Component
class TenantUserMapper {
    
    /**
     * Converts a domain TenantUser to a persistence TenantUserTable.
     * 
     * @param tenantUser The domain TenantUser
     * @param tenantTable The TenantTable entity for the foreign key relationship
     * @param userTable The UserTable entity for the foreign key relationship
     * @return TenantUserTable entity
     */
    fun toEntity(tenantUser: TenantUser, tenantTable: TenantTable, userTable: UserTable): TenantUserTable {
        return TenantUserTable(
            id = tenantUser.id,
            tenant = tenantTable,
            user = userTable,
            isActive = tenantUser.isActive,
            joinedAt = tenantUser.joinedAt,
            lastAccessedAt = tenantUser.lastAccessedAt
        )
    }
    
    /**
     * Converts a persistence TenantUserTable to a domain TenantUser.
     * 
     * @param entity The TenantUserTable entity
     * @return TenantUser domain model
     */
    fun toDomain(entity: TenantUserTable): TenantUser {
        return TenantUser(
            id = entity.id,
            tenantId = entity.tenant.id,
            userId = entity.user.id,
            isActive = entity.isActive,
            joinedAt = entity.joinedAt,
            lastAccessedAt = entity.lastAccessedAt
        )
    }
    
    /**
     * Updates an existing TenantUserTable with values from a domain TenantUser.
     * Note: This method does not update the tenant or user relationships
     * as these are typically immutable after creation.
     * 
     * @param entity The existing TenantUserTable entity to update
     * @param tenantUser The TenantUser with new values
     * @return The updated TenantUserTable entity
     */
    fun updateEntity(entity: TenantUserTable, tenantUser: TenantUser): TenantUserTable {
        entity.isActive = tenantUser.isActive
        entity.lastAccessedAt = tenantUser.lastAccessedAt
        // Note: tenant, user, id, and joinedAt are intentionally not updated
        return entity
    }
    
    /**
     * Converts a list of TenantUserTable entities to a list of TenantUser domain models.
     * 
     * @param entities List of TenantUserTable entities
     * @return List of TenantUser domain models
     */
    fun toDomainList(entities: List<TenantUserTable>): List<TenantUser> {
        return entities.map { toDomain(it) }
    }
    
    /**
     * Extracts tenant ID from a TenantUser for repository operations.
     * This is a utility method to handle tenant ID extraction.
     * 
     * @param tenantUser The TenantUser
     * @return The tenant ID as string
     */
    fun extractTenantId(tenantUser: TenantUser): String {
        return tenantUser.tenantId.toString()
    }
    
    /**
     * Extracts user ID from a TenantUser for repository operations.
     * This is a utility method to handle user ID extraction.
     * 
     * @param tenantUser The TenantUser
     * @return The user ID as string
     */
    fun extractUserId(tenantUser: TenantUser): String {
        return tenantUser.userId.toString()
    }
    
    /**
     * Checks if a tenant user is active.
     * 
     * @param tenantUser The TenantUser
     * @return true if active, false otherwise
     */
    fun isActive(tenantUser: TenantUser): Boolean {
        return tenantUser.isActive
    }
    
    /**
     * Checks if a tenant user has accessed within specified days.
     * 
     * @param tenantUser The TenantUser
     * @param withinDays Number of days to check
     * @return true if accessed within the specified days, false otherwise
     */
    fun hasAccessedWithin(tenantUser: TenantUser, withinDays: Long): Boolean {
        return tenantUser.hasAccessedWithin(withinDays)
    }
}