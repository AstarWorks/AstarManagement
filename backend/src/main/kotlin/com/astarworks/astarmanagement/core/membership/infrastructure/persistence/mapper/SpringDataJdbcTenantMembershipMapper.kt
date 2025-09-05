package com.astarworks.astarmanagement.core.membership.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.infrastructure.persistence.entity.SpringDataJdbcTenantMembershipTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between TenantMembership domain model and SpringDataJdbcTenantMembershipTable entity.
 * Handles bidirectional conversion for Spring Data JDBC operations.
 */
@Component
class SpringDataJdbcTenantMembershipMapper {
    
    /**
     * Converts from domain model to Spring Data JDBC table entity.
     */
    fun toTable(membership: TenantMembership): SpringDataJdbcTenantMembershipTable {
        return SpringDataJdbcTenantMembershipTable(
            id = membership.id,
            version = null,  // null indicates new entity for Spring Data JDBC
            tenantId = membership.tenantId,
            userId = membership.userId,
            isActive = membership.isActive,
            joinedAt = membership.joinedAt,
            lastAccessedAt = membership.lastAccessedAt
        )
    }
    
    /**
     * Converts from Spring Data JDBC table entity to domain model.
     */
    fun toDomain(table: SpringDataJdbcTenantMembershipTable): TenantMembership {
        return TenantMembership(
            id = table.id,
            tenantId = table.tenantId,
            userId = table.userId,
            isActive = table.isActive,
            joinedAt = table.joinedAt,
            lastAccessedAt = table.lastAccessedAt
        )
    }
    
    /**
     * Converts a list of table entities to domain models.
     */
    fun toDomainList(tables: List<SpringDataJdbcTenantMembershipTable>): List<TenantMembership> {
        return tables.map { toDomain(it) }
    }
    
    /**
     * Converts a list of domain models to table entities.
     */
    fun toTableList(memberships: List<TenantMembership>): List<SpringDataJdbcTenantMembershipTable> {
        return memberships.map { toTable(it) }
    }
}