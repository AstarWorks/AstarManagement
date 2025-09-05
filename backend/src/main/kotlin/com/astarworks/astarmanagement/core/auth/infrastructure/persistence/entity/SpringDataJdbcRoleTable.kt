package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity

import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * Spring Data JDBC entity for roles table.
 * Represents roles within a tenant (Discord-style role system).
 * No default roles - all roles are explicitly created and assigned.
 */
@Table("roles")
data class SpringDataJdbcRoleTable(
    @Id
    val id: RoleId,
    
    @Version
    val version: Long? = null,  // Spring Data JDBC: null = new entity
    
    @Column("tenant_id")
    val tenantId: TenantId? = null,  // null = system-wide role
    
    val name: String,
    
    @Column("display_name")
    val displayName: String? = null,
    
    val color: String? = null,  // Hex color code (e.g., "#FF5733")
    
    val position: Int = 0,  // Display order (higher = higher priority)
    
    @Column("is_system")
    val isSystem: Boolean = false,  // System-defined roles cannot be deleted
    
    @Column("created_at")
    val createdAt: Instant,
    
    @Column("updated_at")
    val updatedAt: Instant
)