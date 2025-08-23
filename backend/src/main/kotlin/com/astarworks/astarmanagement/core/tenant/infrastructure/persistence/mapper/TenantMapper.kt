package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between Tenant domain model and TenantEntity.
 * Handles the translation between domain and persistence layers.
 */
@Component
class TenantMapper {
    
    /**
     * Converts a TenantEntity to a Tenant domain model.
     */
    fun toDomain(entity: TenantTable): Tenant {
        return Tenant(
            id = entity.id,
            slug = entity.slug,
            name = entity.name,
            auth0OrgId = entity.auth0OrgId,
            isActive = entity.isActive,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
    
    /**
     * Converts a Tenant domain model to a TenantEntity.
     */
    fun toEntity(domain: Tenant): TenantTable {
        return TenantTable(
            id = domain.id,
            slug = domain.slug,
            name = domain.name,
            auth0OrgId = domain.auth0OrgId,
            isActive = domain.isActive,
            createdAt = domain.createdAt,
            updatedAt = domain.updatedAt
        )
    }
    
    /**
     * Updates an existing TenantEntity with values from a Tenant domain model.
     */
    fun updateEntity(entity: TenantTable, domain: Tenant): TenantTable {
        entity.slug = domain.slug
        entity.name = domain.name
        entity.auth0OrgId = domain.auth0OrgId
        entity.isActive = domain.isActive
        entity.updatedAt = domain.updatedAt
        return entity
    }
    
    /**
     * Converts a list of TenantEntities to a list of Tenant domain models.
     */
    fun toDomainList(entities: List<TenantTable>): List<Tenant> {
        return entities.map { toDomain(it) }
    }
}