package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RoleTable
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between DynamicRole domain model and RoleTable entity.
 * Handles Discord-style role mapping with tenant relationships.
 */
@Component
class DynamicRoleMapper {
    
    /**
     * Converts a domain DynamicRole to a persistence RoleTable.
     * 
     * @param role The domain DynamicRole
     * @param tenantTable The TenantTable entity for the foreign key relationship (null for system roles)
     * @return RoleTable entity
     */
    fun toEntity(role: DynamicRole, tenantTable: TenantTable?): RoleTable {
        return RoleTable(
            id = role.id,
            tenant = tenantTable,
            name = role.name,
            displayName = role.displayName,
            color = role.color,
            position = role.position,
            isSystem = role.isSystem,
            createdAt = role.createdAt,
            updatedAt = role.updatedAt
        )
    }
    
    /**
     * Converts a persistence RoleTable to a domain DynamicRole.
     * 
     * @param entity The RoleTable entity
     * @return DynamicRole domain model
     */
    fun toDomain(entity: RoleTable): DynamicRole {
        return DynamicRole(
            id = entity.id,
            tenantId = entity.tenant?.id,
            name = entity.name,
            displayName = entity.displayName,
            color = entity.color,
            position = entity.position,
            isSystem = entity.isSystem,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
    
    /**
     * Updates an existing RoleTable with values from a domain DynamicRole.
     * Note: This method does not update the tenant relationship or system flag
     * as these are typically immutable after creation.
     * 
     * @param entity The existing RoleTable entity to update
     * @param role The DynamicRole with new values
     * @return The updated RoleTable entity
     */
    fun updateEntity(entity: RoleTable, role: DynamicRole): RoleTable {
        entity.name = role.name
        entity.displayName = role.displayName
        entity.color = role.color
        entity.position = role.position
        entity.updatedAt = role.updatedAt
        // Note: tenant and isSystem are intentionally not updated
        return entity
    }
    
    /**
     * Converts a list of RoleTable entities to a list of DynamicRole domain models.
     * 
     * @param entities List of RoleTable entities
     * @return List of DynamicRole domain models
     */
    fun toDomainList(entities: List<RoleTable>): List<DynamicRole> {
        return entities.map { toDomain(it) }
    }
    
    /**
     * Extracts tenant ID from a DynamicRole for repository operations.
     * This is a utility method to handle null tenant IDs for system roles.
     * 
     * @param role The DynamicRole
     * @return The tenant ID or null for system roles
     */
    fun extractTenantId(role: DynamicRole): String? {
        return role.tenantId?.toString()
    }
    
    /**
     * Checks if a role is a system role (not tied to any tenant).
     * 
     * @param role The DynamicRole
     * @return true if system role, false otherwise
     */
    fun isSystemRole(role: DynamicRole): Boolean {
        return role.tenantId == null
    }
}