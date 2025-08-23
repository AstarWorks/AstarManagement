package com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.*

/**
 * JPA entity for users table.
 * Auth0-only authentication with multi-tenant support.
 * Same email can exist in different tenants (no unique constraint on email).
 */
@Entity
@Table(name = "users")
class UserTable(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "auth0_sub", nullable = false, unique = true)
    var auth0Sub: String,

    @Column(name = "email", nullable = false)
    var email: String,

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