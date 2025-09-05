package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity

import com.astarworks.astarmanagement.shared.domain.value.RoleId
import org.springframework.data.annotation.PersistenceCreator
import org.springframework.data.relational.core.mapping.Column

/**
 * Composite primary key for role_permissions table.
 * Represents the unique combination of role_id and permission_rule.
 * 
 * This follows Spring Data JDBC 4.0+ composite key support pattern.
 * Each role can have multiple permission rules, but cannot have
 * the same permission rule assigned twice.
 */
data class RolePermissionId @PersistenceCreator constructor(
    @Column("role_id")
    val roleId: RoleId,
    
    @Column("permission_rule")
    val permissionRule: String
)