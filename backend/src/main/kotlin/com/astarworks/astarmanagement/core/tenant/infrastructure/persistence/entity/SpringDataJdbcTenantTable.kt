package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity

import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * Spring Data JDBC entity for tenant table operations.
 * This entity maps directly to the database table structure.
 */
@Table("tenants")
data class SpringDataJdbcTenantTable(
    @Id
    val id: TenantId,
    
    @Version
    val version: Long? = null,  // Spring Data JDBC: null = new entity
    
    val slug: String,
    
    val name: String,
    
    @Column("auth0_org_id")
    val auth0OrgId: String? = null,
    
    @Column("is_active")
    val isActive: Boolean = true,
    
    @Column("created_at")
    val createdAt: Instant,
    
    @Column("updated_at")
    val updatedAt: Instant
)