package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.SpringDataJdbcUserRoleTable
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.UserRoleId
import org.springframework.stereotype.Component

/**
 * Mapper for converting between UserRole domain model and SpringDataJdbcUserRoleTable entity.
 * Handles bidirectional conversion for Spring Data JDBC operations with composite primary key.
 */
@Component
class SpringDataJdbcUserRoleMapper {
    
    /**
     * Converts from domain model to Spring Data JDBC table entity.
     * Creates composite key object from tenant_user_id and role_id.
     */
    fun toTable(userRole: UserRole): SpringDataJdbcUserRoleTable {
        return SpringDataJdbcUserRoleTable(
            id = UserRoleId(
                tenantUserId = userRole.tenantUserId,
                roleId = userRole.roleId
            ),
            assignedAt = userRole.assignedAt,
            assignedBy = userRole.assignedBy
        )
    }
    
    /**
     * Converts from Spring Data JDBC table entity to domain model.
     * Extracts values from composite key object.
     */
    fun toDomain(table: SpringDataJdbcUserRoleTable): UserRole {
        return UserRole(
            tenantUserId = table.id.tenantUserId,
            roleId = table.id.roleId,
            assignedAt = table.assignedAt,
            assignedBy = table.assignedBy
        )
    }
    
    /**
     * Converts a list of table entities to domain models.
     */
    fun toDomainList(tables: List<SpringDataJdbcUserRoleTable>): List<UserRole> {
        return tables.map { toDomain(it) }
    }
    
    /**
     * Converts a list of domain models to table entities.
     */
    fun toTableList(userRoles: List<UserRole>): List<SpringDataJdbcUserRoleTable> {
        return userRoles.map { toTable(it) }
    }
}