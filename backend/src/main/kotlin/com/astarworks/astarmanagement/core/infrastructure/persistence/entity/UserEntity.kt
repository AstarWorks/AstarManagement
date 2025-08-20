package com.astarworks.astarmanagement.core.infrastructure.persistence.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.*

/**
 * JPA entity for users table.
 * Simplified schema with Auth0 reference only.
 * No user provisioning or synchronization.
 */
@Entity
@Table(name = "users")
class UserEntity(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "auth0_sub")  // No unique constraint - Auth0 manages uniqueness
    var auth0Sub: String? = null,
    
    @Column(name = "email", nullable = false, unique = true)
    var email: String,
    
    @Column(name = "name")
    var name: String? = null,
    
    @Column(name = "password_hash")
    var passwordHash: String? = null,
    
    @Column(name = "profile_picture_url")
    var profilePictureUrl: String? = null,
    
    // No last_auth0_sync_at - no synchronization needed
    
    @Column(name = "role")
    var role: String = "USER",
    
    @Column(name = "tenant_id")
    var tenantId: UUID? = null,
    
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