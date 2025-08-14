package com.astarworks.astarmanagement.infrastructure.security

import com.astarworks.astarmanagement.domain.entity.User
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Service for accessing security context information.
 * Provides utilities for getting the current authenticated user and their details.
 */
@Service
class SecurityContextService {
    
    /**
     * Gets the current authenticated user ID from the security context.
     * 
     * @return The current user's ID, or null if no user is authenticated
     */
    fun getCurrentUserId(): UUID? {
        return getCurrentUser()?.id
    }
    
    /**
     * Gets the current authenticated user from the security context.
     * 
     * @return The current user, or null if no user is authenticated
     */
    fun getCurrentUser(): User? {
        val authentication = SecurityContextHolder.getContext().authentication
        return if (authentication?.principal is User) {
            authentication.principal as User
        } else {
            null
        }
    }
    
    /**
     * Gets the current authenticated user's tenant ID from the security context.
     * 
     * @return The current user's tenant ID, or null if no user is authenticated
     */
    fun getCurrentTenantId(): UUID? {
        return getCurrentUser()?.tenantId
    }
    
    /**
     * Requires the current user to be authenticated and returns their ID.
     * 
     * @return The current user's ID
     * @throws IllegalStateException if no user is authenticated
     */
    fun requireCurrentUserId(): UUID {
        return getCurrentUserId() 
            ?: throw IllegalStateException("No authenticated user found in security context")
    }
    
    /**
     * Requires the current user to be authenticated and returns the user.
     * 
     * @return The current user
     * @throws IllegalStateException if no user is authenticated
     */
    fun requireCurrentUser(): User {
        return getCurrentUser() 
            ?: throw IllegalStateException("No authenticated user found in security context")
    }
    
    /**
     * Requires the current user to be authenticated and returns their tenant ID.
     * 
     * @return The current user's tenant ID
     * @throws IllegalStateException if no user is authenticated
     */
    fun requireCurrentTenantId(): UUID {
        return getCurrentTenantId() 
            ?: throw IllegalStateException("No authenticated user found or user has no tenant ID")
    }
}