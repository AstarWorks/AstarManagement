package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity

import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import org.springframework.data.annotation.PersistenceCreator
import org.springframework.data.relational.core.mapping.Column

/**
 * Composite primary key for user_roles table.
 * Represents the unique combination of tenant_user_id and role_id.
 * 
 * This follows Spring Data JDBC 4.0+ composite key support pattern.
 * A user can have multiple roles within their tenant context,
 * but cannot have the same role twice.
 */
data class UserRoleId @PersistenceCreator constructor(
    @Column("tenant_user_id")
    val tenantUserId: TenantMembershipId,
    
    @Column("role_id")
    val roleId: RoleId
)