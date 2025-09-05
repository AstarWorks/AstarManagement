package com.astarworks.astarmanagement.core.workspace.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.workspace.infrastructure.persistence.entity.SpringDataJdbcWorkspaceTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between Workspace domain model and SpringDataJdbcWorkspaceTable entity.
 * Handles bidirectional conversion for Spring Data JDBC operations.
 */
@Component
class SpringDataJdbcWorkspaceMapper {
    
    /**
     * Converts from domain model to Spring Data JDBC table entity.
     */
    fun toTable(workspace: Workspace): SpringDataJdbcWorkspaceTable {
        return SpringDataJdbcWorkspaceTable(
            id = workspace.id,
            version = null,  // null indicates new entity for Spring Data JDBC
            tenantId = workspace.tenantId,
            name = workspace.name,
            createdBy = workspace.createdBy,
            teamId = workspace.teamId,
            createdAt = workspace.createdAt,
            updatedAt = workspace.updatedAt
        )
    }
    
    /**
     * Converts from Spring Data JDBC table entity to domain model.
     */
    fun toDomain(table: SpringDataJdbcWorkspaceTable): Workspace {
        return Workspace(
            id = table.id,
            tenantId = table.tenantId,
            name = table.name,
            createdBy = table.createdBy,
            teamId = table.teamId,
            createdAt = table.createdAt,
            updatedAt = table.updatedAt
        )
    }
    
    /**
     * Converts a list of table entities to domain models.
     */
    fun toDomainList(tables: List<SpringDataJdbcWorkspaceTable>): List<Workspace> {
        return tables.map { toDomain(it) }
    }
    
    /**
     * Converts a list of domain models to table entities.
     */
    fun toTableList(workspaces: List<Workspace>): List<SpringDataJdbcWorkspaceTable> {
        return workspaces.map { toTable(it) }
    }
}