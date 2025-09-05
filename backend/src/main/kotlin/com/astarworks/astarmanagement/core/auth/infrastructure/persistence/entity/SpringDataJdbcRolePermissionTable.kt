package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * Spring Data JDBC entity for role_permissions table.
 * Represents permissions assigned to roles.
 * 
 * Uses composite primary key object (RolePermissionId) following Spring Data JDBC
 * composite key support pattern. The composite key is automatically embedded.
 * 
 * Permission rules follow one of these formats:
 * - General: "resource.action.scope" (e.g., "table.edit.all", "document.view.team")
 * - ResourceGroup: "resource.action.resource_group:UUID" (e.g., "table.edit.resource_group:123e4567-...")
 * - ResourceId: "resource.action.resource_id:UUID" (e.g., "document.delete.resource_id:987f6543-...")
 */
@Table("role_permissions")
data class SpringDataJdbcRolePermissionTable(
    @Id
    val id: RolePermissionId,  // Composite primary key object
    
    @Version
    val version: Long? = null,  // Spring Data JDBC: null = new entity
    
    @Column("created_at")
    val createdAt: Instant
)