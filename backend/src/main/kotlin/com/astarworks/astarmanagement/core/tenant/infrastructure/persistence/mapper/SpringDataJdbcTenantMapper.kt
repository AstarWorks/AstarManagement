package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.SpringDataJdbcTenantTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between Tenant domain model and SpringDataJdbcTenantTable entity.
 * Handles bidirectional conversion for Spring Data JDBC operations.
 */
@Component
class SpringDataJdbcTenantMapper {
    
    /**
     * Converts from domain model to Spring Data JDBC table entity.
     */
    fun toTable(tenant: Tenant): SpringDataJdbcTenantTable {
        return SpringDataJdbcTenantTable(
            id = tenant.id,
            slug = tenant.slug,
            name = tenant.name,
            auth0OrgId = tenant.auth0OrgId,
            isActive = tenant.isActive,
            createdAt = tenant.createdAt,
            updatedAt = tenant.updatedAt
        )
    }
    
    /**
     * Converts from Spring Data JDBC table entity to domain model.
     */
    fun toDomain(table: SpringDataJdbcTenantTable): Tenant {
        return Tenant(
            id = table.id,
            slug = table.slug,
            name = table.name,
            auth0OrgId = table.auth0OrgId,
            isActive = table.isActive,
            createdAt = table.createdAt,
            updatedAt = table.updatedAt
        )
    }
    
    /**
     * Converts a list of table entities to domain models.
     */
    fun toDomainList(tables: List<SpringDataJdbcTenantTable>): List<Tenant> {
        return tables.map { toDomain(it) }
    }
    
    /**
     * Converts a list of domain models to table entities.
     */
    fun toTableList(tenants: List<Tenant>): List<SpringDataJdbcTenantTable> {
        return tenants.map { toTable(it) }
    }
}