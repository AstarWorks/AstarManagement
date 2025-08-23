package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity

import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantTable
import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

/**
 * JPA entity for roles table.
 * Represents roles within a tenant (Discord-style role system).
 * No default roles - all roles are explicitly created and assigned.
 */
@Entity
@Table(
    name = "roles",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["tenant_id", "name"])
    ]
)
class RoleTable(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    var tenant: TenantTable?,

    @Column(name = "name", nullable = false, length = 100)
    var name: String,

    @Column(name = "display_name")
    var displayName: String? = null,

    @Column(name = "color", length = 7)
    var color: String? = null,

    @Column(name = "position")
    var position: Int = 0,

    @Column(name = "is_system", nullable = false)
    var isSystem: Boolean = false,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PreUpdate
    fun preUpdate() {
        updatedAt = LocalDateTime.now()
    }
}