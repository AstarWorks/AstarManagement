package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.RolePermission
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RolePermissionId
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.SpringDataJdbcRolePermissionTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between RolePermission domain model and SpringDataJdbcRolePermissionTable entity.
 * Handles conversion between PermissionRule objects and string representation.
 */
@Component
class SpringDataJdbcRolePermissionMapper {
    
    /**
     * Converts from domain model to Spring Data JDBC table entity.
     * Creates composite key object and converts PermissionRule to string.
     */
    fun toTable(rolePermission: RolePermission): SpringDataJdbcRolePermissionTable {
        return SpringDataJdbcRolePermissionTable(
            id = RolePermissionId(
                roleId = rolePermission.roleId,
                permissionRule = rolePermission.permissionRule.toDatabaseString()
            ),
            createdAt = rolePermission.createdAt
        )
    }
    
    /**
     * Converts from Spring Data JDBC table entity to domain model.
     * Extracts values from composite key and parses PermissionRule.
     */
    fun toDomain(table: SpringDataJdbcRolePermissionTable): RolePermission {
        return RolePermission(
            roleId = table.id.roleId,
            permissionRule = PermissionRule.fromDatabaseString(table.id.permissionRule),
            createdAt = table.createdAt
        )
    }
    
    /**
     * Converts a list of table entities to domain models.
     */
    fun toDomainList(tables: List<SpringDataJdbcRolePermissionTable>): List<RolePermission> {
        return tables.map { toDomain(it) }
    }
    
    /**
     * Converts a list of domain models to table entities.
     */
    fun toTableList(rolePermissions: List<RolePermission>): List<SpringDataJdbcRolePermissionTable> {
        return rolePermissions.map { toTable(it) }
    }
}