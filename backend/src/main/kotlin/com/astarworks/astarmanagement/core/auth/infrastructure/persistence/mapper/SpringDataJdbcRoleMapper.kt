package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.SpringDataJdbcRoleTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between DynamicRole domain model and SpringDataJdbcRoleTable entity.
 * Handles bidirectional conversion for Spring Data JDBC operations.
 */
@Component
class SpringDataJdbcRoleMapper {
    
    /**
     * Converts from domain model to Spring Data JDBC table entity.
     */
    fun toTable(role: DynamicRole): SpringDataJdbcRoleTable {
        return SpringDataJdbcRoleTable(
            id = role.id,
            tenantId = role.tenantId,
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
     * Converts from Spring Data JDBC table entity to domain model.
     */
    fun toDomain(table: SpringDataJdbcRoleTable): DynamicRole {
        return DynamicRole(
            id = table.id,
            tenantId = table.tenantId,
            name = table.name,
            displayName = table.displayName,
            color = table.color,
            position = table.position,
            isSystem = table.isSystem,
            createdAt = table.createdAt,
            updatedAt = table.updatedAt
        )
    }
    
    /**
     * Converts a list of table entities to domain models.
     */
    fun toDomainList(tables: List<SpringDataJdbcRoleTable>): List<DynamicRole> {
        return tables.map { toDomain(it) }
    }
    
    /**
     * Converts a list of domain models to table entities.
     */
    fun toTableList(roles: List<DynamicRole>): List<SpringDataJdbcRoleTable> {
        return roles.map { toTable(it) }
    }
}