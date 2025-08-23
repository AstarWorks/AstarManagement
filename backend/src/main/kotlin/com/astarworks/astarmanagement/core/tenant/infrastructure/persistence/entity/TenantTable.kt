package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime
import java.util.UUID

/**
 * JPA entity for tenants table.
 * Represents an organization in the multi-tenant system.
 */
@Entity
@Table(name = "tenants")
class TenantTable(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(unique = true, nullable = false, length = 100)
    var slug: String,

    @Column(nullable = false)
    var name: String,

    @Column(name = "auth0_org_id", unique = true)
    var auth0OrgId: String? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}