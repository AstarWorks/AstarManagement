package dev.ryuzu.astermanagement.auth.repository

import dev.ryuzu.astermanagement.auth.dto.UserDto
import java.util.*

/**
 * Repository interface for authentication operations
 * 
 * This interface breaks the circular dependency by allowing the auth package
 * to define its data access needs without depending on domain entities.
 * The implementation is provided by the domain layer.
 */
interface AuthUserRepository {
    
    /**
     * Find user by email for authentication
     * Returns UserDto to avoid domain dependency
     */
    fun findByEmailForAuth(email: String): UserDto?
    
    /**
     * Find user by ID for authentication
     * Returns UserDto to avoid domain dependency
     */
    fun findByIdForAuth(id: UUID): UserDto?
}