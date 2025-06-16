package dev.ryuzu.astermanagement.service.base

import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import java.util.*

/**
 * Base service class providing common functionality for all services
 * Including security context access and common business logic patterns
 */
abstract class BaseService {
    
    /**
     * Get the currently authenticated user details
     */
    protected fun getCurrentUser(): UserDetails? {
        val authentication = SecurityContextHolder.getContext().authentication
        return if (authentication?.principal is UserDetails) {
            authentication.principal as UserDetails
        } else {
            null
        }
    }
    
    /**
     * Get the current user's ID from security context
     * For MVP implementation, extracts from UserDetails username assuming it's a UUID
     */
    protected fun getCurrentUserId(): UUID {
        val authentication = SecurityContextHolder.getContext().authentication
        return when (val principal = authentication?.principal) {
            is UserDetails -> {
                try {
                    UUID.fromString(principal.username)
                } catch (e: IllegalArgumentException) {
                    // For demo purposes, if username is not UUID, generate consistent UUID from username
                    UUID.nameUUIDFromBytes(principal.username.toByteArray())
                }
            }
            else -> throw SecurityException("No authenticated user found or invalid principal type")
        }
    }
    
    /**
     * Get the current username
     */
    protected fun getCurrentUsername(): String? {
        return getCurrentUser()?.username
    }
    
    /**
     * Check if current user has a specific role
     */
    protected fun hasRole(role: String): Boolean {
        val user = getCurrentUser()
        return user?.authorities?.any { it.authority == "ROLE_$role" } ?: false
    }
    
    /**
     * Check if current user is a lawyer
     */
    protected fun isLawyer(): Boolean {
        return hasRole("LAWYER")
    }
    
    /**
     * Check if current user is a clerk
     */
    protected fun isClerk(): Boolean {
        return hasRole("CLERK")
    }
    
    /**
     * Check if current user is a client
     */
    protected fun isClient(): Boolean {
        return hasRole("CLIENT")
    }
}