package com.astarworks.astarmanagement.core.membership.infrastructure.persistence.entity

import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * Spring Data JDBC entity for tenant_users table.
 * Represents the membership relationship between users and tenants.
 * Unique constraint on (tenant_id, user_id) is enforced at database level.
 */
@Table("tenant_users")
data class SpringDataJdbcTenantMembershipTable(
    @Id
    val id: TenantMembershipId,
    
    @Version
    val version: Long? = null,  // Spring Data JDBC: null = new entity
    
    @Column("tenant_id")
    val tenantId: TenantId,
    
    @Column("user_id")
    val userId: UserId,
    
    @Column("is_active")
    val isActive: Boolean = true,
    
    @Column("joined_at")
    val joinedAt: Instant,
    
    @Column("last_accessed_at")
    val lastAccessedAt: Instant? = null
)