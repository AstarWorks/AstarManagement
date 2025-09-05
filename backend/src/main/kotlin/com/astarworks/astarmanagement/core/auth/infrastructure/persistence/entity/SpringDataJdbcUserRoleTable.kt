package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity

import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * Spring Data JDBC entity for user_roles table.
 * Represents role assignments to users within a tenant context.
 * 
 * Uses composite primary key object (UserRoleId) following Spring Data JDBC
 * composite key support pattern. The composite key is automatically embedded.
 * 
 * A user can have multiple roles within their tenant context,
 * but cannot have the same role assigned twice.
 */
@Table("user_roles")
data class SpringDataJdbcUserRoleTable(
    @Id
    val id: UserRoleId,  // Composite primary key object
    
    @Version
    val version: Long? = null,  // Spring Data JDBC: null = new entity
    
    @Column("assigned_at")
    val assignedAt: Instant,
    
    @Column("assigned_by")
    val assignedBy: UserId? = null  // User who assigned the role
)