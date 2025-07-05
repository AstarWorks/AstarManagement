package dev.ryuzu.astermanagement.auth.service

import dev.ryuzu.astermanagement.auth.dto.UserDto
import dev.ryuzu.astermanagement.auth.dto.UserRoleDto
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.time.LocalDateTime
import java.util.*

/**
 * Custom UserDetails implementation for Spring Security
 * Bridges the User entity with Spring Security's authentication system
 * 
 * This class provides the interface between our domain User model and Spring Security's
 * authentication framework, mapping user roles to granted authorities and handling
 * account status checks.
 */
class UserPrincipal(
    private val user: UserDto
) : UserDetails {

    override fun getAuthorities(): Collection<GrantedAuthority> {
        val authorities = mutableListOf<GrantedAuthority>()
        
        // Add role authority following Spring Security convention
        authorities.add(SimpleGrantedAuthority("ROLE_${user.role.name}"))
        
        // Add permission authorities based on role
        authorities.addAll(getPermissionAuthorities())
        
        return authorities
    }

    /**
     * Maps user roles to specific permission authorities
     * Implements the role-based access control system with granular permissions
     */
    private fun getPermissionAuthorities(): List<GrantedAuthority> {
        return when (user.role) {
            UserRoleDto.LAWYER -> listOf(
                // Matter permissions - full access
                "matter:read", "matter:write", "matter:delete",
                // Document permissions - full access
                "document:read", "document:write", "document:delete",
                // Communication permissions - full access
                "memo:read", "memo:write", "memo:delete",
                // Financial permissions - full access including approval
                "expense:read", "expense:write", "expense:approve",
                // Administrative permissions
                "admin:users", "admin:roles", "export:data"
            )
            UserRoleDto.CLERK -> listOf(
                // Matter permissions - read and write but no delete
                "matter:read", "matter:write",
                // Document permissions - read and write but no delete
                "document:read", "document:write",
                // Communication permissions - read and write but no delete
                "memo:read", "memo:write",
                // Financial permissions - read and write but no approval
                "expense:read", "expense:write"
            )
            UserRoleDto.CLIENT -> listOf(
                // Matter permissions - read only their own
                "matter:read",
                // Document permissions - read only
                "document:read",
                // Communication permissions - read only
                "memo:read"
            )
        }.map { SimpleGrantedAuthority(it) }
    }

    /**
     * Returns the user's password hash for authentication
     */
    override fun getPassword(): String = user.passwordHash ?: ""

    /**
     * Returns the user's email as the username for authentication
     * Following the pattern of using email for login
     */
    override fun getUsername(): String = user.email

    /**
     * Account status checks - all delegated to UserDto
     */
    override fun isAccountNonExpired(): Boolean = true
    override fun isAccountNonLocked(): Boolean = user.isActive
    override fun isCredentialsNonExpired(): Boolean = true
    override fun isEnabled(): Boolean = user.isActive

    /**
     * Additional properties for application use
     */
    val id: UUID? = user.id
    val email: String = user.email
    val fullName: String = user.fullName
    val role: UserRoleDto = user.role
    val firstName: String = user.firstName
    val lastName: String = user.lastName
    val lastLoginAt = user.lastLoginAt

    /**
     * Convenience method to check if user has a specific role
     */
    fun hasRole(role: UserRoleDto): Boolean = this.role == role

    /**
     * Convenience method to check if user has any of the specified roles
     */
    fun hasAnyRole(vararg roles: UserRoleDto): Boolean = roles.contains(this.role)

    /**
     * Check if user has a specific permission
     */
    fun hasPermission(permission: String): Boolean {
        return authorities.any { it.authority == permission }
    }

    /**
     * Get all permissions as string list
     */
    fun getPermissions(): List<String> {
        return authorities
            .map { it.authority }
            .filter { !it.startsWith("ROLE_") }
    }

    /**
     * Factory method to create UserPrincipal from User entity
     */
    companion object {
        fun create(user: UserDto): UserPrincipal {
            return UserPrincipal(user)
        }
    }

    override fun toString(): String {
        return "UserPrincipal(id=$id, email='$email', fullName='$fullName', role=$role, enabled=${isEnabled})"
    }
}