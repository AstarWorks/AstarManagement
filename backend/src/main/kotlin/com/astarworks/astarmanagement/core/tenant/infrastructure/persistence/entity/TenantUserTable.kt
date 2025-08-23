package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity

import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserTable
import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

/**
 * JPA entity for tenant_users table.
 * Represents the many-to-many relationship between tenants and users.
 * A user can belong to multiple tenants (Slack-style multi-tenancy).
 */
@Entity
@Table(
    name = "tenant_users",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["tenant_id", "user_id"])
    ]
)
class TenantUserTable(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    var tenant: TenantTable,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: UserTable,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "joined_at", nullable = false)
    val joinedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "last_accessed_at")
    var lastAccessedAt: LocalDateTime? = null
)