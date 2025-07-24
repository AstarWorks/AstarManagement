package dev.ryuzu.astermanagement.auth.util

import dev.ryuzu.astermanagement.auth.dto.UserRoleDto
import dev.ryuzu.astermanagement.auth.service.UserPrincipal
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import java.util.*

/**
 * Utility class for common authentication operations
 * 
 * Provides convenient methods for accessing current user information,
 * checking permissions, and performing security-related operations
 * throughout the application.
 */
object AuthenticationUtils {

    /**
     * Gets the current authenticated user from SecurityContext
     * 
     * @return UserPrincipal if user is authenticated, null otherwise
     */
    fun getCurrentUser(): UserPrincipal? {
        val authentication = SecurityContextHolder.getContext().authentication
        return when (val principal = authentication?.principal) {
            is UserPrincipal -> principal
            else -> null
        }
    }
    
    /**
     * Gets the current user's ID
     * 
     * @return User ID if authenticated, null otherwise
     */
    fun getCurrentUserId(): UUID? {
        return getCurrentUser()?.id
    }
    
    /**
     * Gets the current user's email
     * 
     * @return User email if authenticated, null otherwise
     */
    fun getCurrentUserEmail(): String? {
        return getCurrentUser()?.email
    }
    
    /**
     * Gets the current user's role
     * 
     * @return User role if authenticated, null otherwise
     */
    fun getCurrentUserRoleDto(): UserRoleDto? {
        return getCurrentUser()?.role
    }
    
    /**
     * Gets the current user's full name
     * 
     * @return User full name if authenticated, null otherwise
     */
    fun getCurrentUserName(): String? {
        return getCurrentUser()?.fullName
    }
    
    /**
     * Checks if the current user is authenticated
     * 
     * @return true if user is authenticated, false otherwise
     */
    fun isAuthenticated(): Boolean {
        val authentication = SecurityContextHolder.getContext().authentication
        return authentication?.isAuthenticated == true && 
               authentication.principal != "anonymousUser"
    }
    
    /**
     * Checks if the current user has a specific role
     * 
     * @param role The role to check
     * @return true if user has the role, false otherwise
     */
    fun hasRole(role: UserRoleDto): Boolean {
        return getCurrentUser()?.hasRole(role) ?: false
    }
    
    /**
     * Checks if the current user has any of the specified roles
     * 
     * @param roles The roles to check
     * @return true if user has any of the roles, false otherwise
     */
    fun hasAnyRole(vararg roles: UserRoleDto): Boolean {
        return getCurrentUser()?.hasAnyRole(*roles) ?: false
    }
    
    /**
     * Checks if the current user has a specific permission
     * 
     * @param permission The permission to check (e.g., "matter:read")
     * @return true if user has the permission, false otherwise
     */
    fun hasPermission(permission: String): Boolean {
        return getCurrentUser()?.hasPermission(permission) ?: false
    }
    
    /**
     * Checks if the current user has any of the specified permissions
     * 
     * @param permissions The permissions to check
     * @return true if user has any of the permissions, false otherwise
     */
    fun hasAnyPermission(vararg permissions: String): Boolean {
        val user = getCurrentUser() ?: return false
        return permissions.any { user.hasPermission(it) }
    }
    
    /**
     * Checks if the current user has all specified permissions
     * 
     * @param permissions The permissions to check
     * @return true if user has all permissions, false otherwise
     */
    fun hasAllPermissions(vararg permissions: String): Boolean {
        val user = getCurrentUser() ?: return false
        return permissions.all { user.hasPermission(it) }
    }
    
    /**
     * Checks if the current user is a lawyer
     * 
     * @return true if user is a lawyer, false otherwise
     */
    fun isLawyer(): Boolean {
        return hasRole(UserRoleDto.LAWYER)
    }
    
    /**
     * Checks if the current user is a clerk
     * 
     * @return true if user is a clerk, false otherwise
     */
    fun isClerk(): Boolean {
        return hasRole(UserRoleDto.CLERK)
    }
    
    /**
     * Checks if the current user is a client
     * 
     * @return true if user is a client, false otherwise
     */
    fun isClient(): Boolean {
        return hasRole(UserRoleDto.CLIENT)
    }
    
    /**
     * Checks if the current user is staff (lawyer or clerk)
     * 
     * @return true if user is staff, false otherwise
     */
    fun isStaff(): Boolean {
        return hasAnyRole(UserRoleDto.LAWYER, UserRoleDto.CLERK)
    }
    
    /**
     * Checks if the current user can access a specific resource
     * based on ownership or role permissions
     * 
     * @param resourceOwnerId The ID of the resource owner
     * @param requiredPermission The permission required for non-owners
     * @return true if user can access the resource, false otherwise
     */
    fun canAccessResource(resourceOwnerId: UUID?, requiredPermission: String): Boolean {
        val currentUserId = getCurrentUserId() ?: return false
        
        // Owner can always access their own resources
        if (resourceOwnerId == currentUserId) {
            return true
        }
        
        // Check if user has the required permission for other users' resources
        return hasPermission(requiredPermission)
    }
    
    /**
     * Checks if the current user can modify a specific resource
     * based on ownership or role permissions
     * 
     * @param resourceOwnerId The ID of the resource owner
     * @param requiredPermission The permission required for modification
     * @return true if user can modify the resource, false otherwise
     */
    fun canModifyResource(resourceOwnerId: UUID?, requiredPermission: String): Boolean {
        val currentUserId = getCurrentUserId() ?: return false
        
        // For clients, they can only modify their own resources
        if (isClient()) {
            return resourceOwnerId == currentUserId
        }
        
        // For staff, check if they have the required permission
        return hasPermission(requiredPermission)
    }
    
    /**
     * Gets the current authentication object
     * 
     * @return Authentication object if available, null otherwise
     */
    fun getCurrentAuthentication(): Authentication? {
        return SecurityContextHolder.getContext().authentication
    }
    
    /**
     * Gets all authorities for the current user
     * 
     * @return List of authority strings
     */
    fun getCurrentUserAuthorities(): List<String> {
        return getCurrentAuthentication()?.authorities?.map { it.authority } ?: emptyList()
    }
    
    /**
     * Extracts the username from an Authentication object
     * 
     * @param authentication The authentication object
     * @return Username string
     */
    fun getUsername(authentication: Authentication): String {
        return when (val principal = authentication.principal) {
            is UserDetails -> principal.username
            is String -> principal
            else -> authentication.name
        }
    }
    
    /**
     * Checks if an authentication represents an anonymous user
     * 
     * @param authentication The authentication object
     * @return true if user is anonymous, false otherwise
     */
    fun isAnonymous(authentication: Authentication?): Boolean {
        return authentication?.principal == "anonymousUser" || 
               authentication?.isAuthenticated != true
    }
    
    /**
     * Creates a user-friendly display name from authentication
     * 
     * @param authentication The authentication object
     * @return Display name string
     */
    fun getDisplayName(authentication: Authentication): String {
        return when (val principal = authentication.principal) {
            is UserPrincipal -> principal.fullName.ifBlank { principal.email }
            is UserDetails -> principal.username
            else -> authentication.name
        }
    }
    
    /**
     * Validates that the current user can perform an action on behalf of another user
     * Typically used for admin operations
     * 
     * @param targetUserId The ID of the target user
     * @return true if current user can act on behalf of target user, false otherwise
     */
    fun canActOnBehalfOf(targetUserId: UUID): Boolean {
        val currentUserId = getCurrentUserId() ?: return false
        
        // Users can always act on behalf of themselves
        if (currentUserId == targetUserId) {
            return true
        }
        
        // Only lawyers can act on behalf of other users
        return isLawyer()
    }
}