package dev.ryuzu.astermanagement.modules.user.api

import dev.ryuzu.astermanagement.auth.dto.UserDto
import dev.ryuzu.astermanagement.domain.user.User
import java.util.*

/**
 * User Module API
 * 
 * This service provides the public API for the User module, following Spring Modulith
 * principles for modular architecture. It abstracts the user domain operations and
 * serves as the interface between modules.
 * 
 * This API is designed to:
 * - Provide clean module boundaries
 * - Enable cross-module communication without direct domain dependencies
 * - Support future microservices migration
 * - Maintain loose coupling between modules
 */
interface UserService {
    
    /**
     * Find user by email address
     * 
     * @param email The email address to search for
     * @return User entity if found, null otherwise
     */
    fun findByEmail(email: String): User?
    
    /**
     * Find user by ID
     * 
     * @param userId The UUID of the user to find
     * @return User entity if found, null otherwise
     */
    fun findById(userId: UUID): User?
    
    /**
     * Find user by email address for authentication (returns DTO to break circular dependency)
     * 
     * @param email The email address to search for
     * @return UserDto if found, null otherwise
     */
    fun findUserDtoByEmail(email: String): UserDto?
    
    /**
     * Find user by ID for authentication (returns DTO to break circular dependency)
     * 
     * @param userId The UUID of the user to find
     * @return UserDto if found, null otherwise
     */
    fun findUserDtoById(userId: UUID): UserDto?
    
    /**
     * Check if user exists and is active by email
     * 
     * @param email The email address to check
     * @return true if user exists and is active, false otherwise
     */
    fun isActiveByEmail(email: String): Boolean
    
    /**
     * Check if user exists and is active by ID
     * 
     * @param userId The user ID to check
     * @return true if user exists and is active, false otherwise
     */
    fun isActiveById(userId: UUID): Boolean
    
    /**
     * Create a new user
     * 
     * @param user The user to create
     * @return The created user entity
     */
    fun createUser(user: User): User
    
    /**
     * Update an existing user
     * 
     * @param user The user to update
     * @return The updated user entity
     */
    fun updateUser(user: User): User
    
    /**
     * Get all users (with pagination support in the future)
     * 
     * @return List of all users
     */
    fun getAllUsers(): List<User>
}