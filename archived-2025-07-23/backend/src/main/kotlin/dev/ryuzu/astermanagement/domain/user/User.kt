package dev.ryuzu.astermanagement.domain.user

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import jakarta.persistence.*
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

/**
 * User entity representing system users with role-based access
 * Supports authentication and authorization for the legal case management system
 */
@Entity
@Table(
    name = "users",
    indexes = [
        Index(name = "idx_users_username", columnList = "username"),
        Index(name = "idx_users_email", columnList = "email"),
        Index(name = "idx_users_role", columnList = "role"),
        Index(name = "idx_users_active", columnList = "is_active"),
        Index(name = "idx_users_created_at", columnList = "created_at")
    ]
)
class User : BaseEntity() {

    @Column(name = "username", nullable = false, unique = true, length = 255)
    @field:NotBlank(message = "Username is required")
    @field:Size(min = 3, max = 255, message = "Username must be between 3 and 255 characters")
    var username: String = ""

    @Column(name = "email", nullable = false, unique = true, length = 255)
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    @field:Size(max = 255, message = "Email must not exceed 255 characters")
    var email: String = ""

    @Column(name = "password_hash", length = 255)
    var passwordHash: String? = null

    @Column(name = "first_name", nullable = false, length = 255)
    @field:NotBlank(message = "First name is required")
    @field:Size(max = 255, message = "First name must not exceed 255 characters")
    var firstName: String = ""

    @Column(name = "last_name", nullable = false, length = 255)
    @field:NotBlank(message = "Last name is required")
    @field:Size(max = 255, message = "Last name must not exceed 255 characters")
    var lastName: String = ""

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 50)
    var role: UserRole = UserRole.CLIENT

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

    @Column(name = "last_login_at")
    var lastLoginAt: LocalDateTime? = null

    /**
     * Get full name of the user
     */
    val fullName: String
        get() = "$firstName $lastName"

    /**
     * Check if user has a specific role
     */
    fun hasRole(role: UserRole): Boolean = this.role == role

    /**
     * Check if user has any of the specified roles
     */
    fun hasAnyRole(vararg roles: UserRole): Boolean = roles.contains(this.role)

    /**
     * Check if user is a lawyer
     */
    val isLawyer: Boolean
        get() = role == UserRole.LAWYER

    /**
     * Check if user is a clerk
     */
    val isClerk: Boolean
        get() = role == UserRole.CLERK

    /**
     * Check if user is a client
     */
    val isClient: Boolean
        get() = role == UserRole.CLIENT

    override fun toString(): String {
        return "User(id=$id, username='$username', email='$email', fullName='$fullName', role=$role, isActive=$isActive)"
    }
}

/**
 * User roles supported by the system
 * Corresponds to the database CHECK constraint
 */
enum class UserRole {
    /**
     * Lawyers have full access to all matters and system functions
     */
    LAWYER,
    
    /**
     * Clerks have limited access focused on administrative tasks
     */
    CLERK,
    
    /**
     * Clients have read-only access to their own matters
     */
    CLIENT
}