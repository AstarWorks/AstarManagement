package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity

import jakarta.persistence.*
import java.io.Serializable
import java.time.LocalDateTime
import java.util.UUID

/**
 * JPA entity for role_permissions table.
 * Represents permissions assigned to roles.
 * Uses composite primary key (role_id, permission_rule).
 * Permission rules follow the format: resource.action.scope (e.g., "table.edit.all")
 */
@Entity
@Table(name = "role_permissions")
@IdClass(RolePermissionId::class)
class RolePermissionTable(
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    var role: RoleTable,

    @Id
    @Column(name = "permission_rule", nullable = false, length = 255)
    var permissionRule: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

/**
 * Composite primary key for RolePermissionTable.
 * Required for JPA @IdClass annotation.
 */
data class RolePermissionId(
    val role: UUID = UUID.randomUUID(),
    val permissionRule: String = ""
) : Serializable {
    companion object {
        private const val serialVersionUID = 1L
    }
}