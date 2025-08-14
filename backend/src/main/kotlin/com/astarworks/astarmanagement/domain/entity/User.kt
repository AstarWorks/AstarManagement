package com.astarworks.astarmanagement.domain.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "users")
class User(
    @Column(name = "tenant_id", nullable = false)
    var tenantId: UUID,
    
    @Column(unique = true, nullable = false)
    var username: String,
    
    @Column(unique = true, nullable = false)
    var email: String,
    
    @Column(name = "password_hash", nullable = false)
    var password: String,
    
    @Column(name = "first_name", nullable = false)
    var firstName: String,
    
    @Column(name = "last_name", nullable = false)
    var lastName: String,
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    var role: UserRole = UserRole.USER,
    
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,
    
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
    
    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
    
    @Column(name = "created_by")
    var createdBy: UUID? = null,
    
    @Column(name = "updated_by")
    var updatedBy: UUID? = null,
    
    @Column(name = "last_login_at")
    var lastLoginAt: LocalDateTime? = null
) {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null
    
    // JPA requires a no-arg constructor
    constructor() : this(
        tenantId = UUID.randomUUID(), // dummy value, will be overridden
        username = "",
        email = "",
        password = "",
        firstName = "",
        lastName = ""
    )
}

enum class UserRole {
    USER,
    ADMIN,
    LAWYER,
    STAFF
}