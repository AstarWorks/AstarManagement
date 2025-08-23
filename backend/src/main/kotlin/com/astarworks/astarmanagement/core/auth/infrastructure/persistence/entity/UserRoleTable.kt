package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity

import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantUserTable
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserTable
import jakarta.persistence.*
import java.io.Serializable
import java.time.LocalDateTime
import java.util.UUID

/**
 * JPA entity for user_roles table.
 * Represents role assignments to users within a tenant context.
 * Uses composite primary key (tenant_user_id, role_id).
 */
@Entity
@Table(name = "user_roles")
@IdClass(UserRoleId::class)
class UserRoleTable(
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_user_id", nullable = false)
    var tenantUser: TenantUserTable,

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    var role: RoleTable,

    @Column(name = "assigned_at", nullable = false)
    val assignedAt: LocalDateTime = LocalDateTime.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    var assignedBy: UserTable? = null
)

/**
 * Composite primary key for UserRoleTable.
 * Required for JPA @IdClass annotation.
 */
data class UserRoleId(
    val tenantUser: UUID = UUID.randomUUID(),
    val role: UUID = UUID.randomUUID()
) : Serializable {
    companion object {
        private const val serialVersionUID = 1L
    }
}