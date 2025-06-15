package dev.ryuzu.astermanagement.domain.user

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Repository interface for User entity operations
 * Provides standard CRUD operations and custom queries
 */
@Repository
interface UserRepository : JpaRepository<User, UUID> {

    /**
     * Find user by username
     */
    fun findByUsername(username: String): User?

    /**
     * Find user by email
     */
    fun findByEmail(email: String): User?

    /**
     * Find users by role
     */
    fun findByRole(role: UserRole): List<User>

    /**
     * Find active users by role
     */
    fun findByRoleAndIsActiveTrue(role: UserRole): List<User>

    /**
     * Find all active users
     */
    fun findByIsActiveTrue(): List<User>

    /**
     * Find users by role with pagination
     */
    fun findByRole(role: UserRole, pageable: Pageable): Page<User>

    /**
     * Check if username exists
     */
    fun existsByUsername(username: String): Boolean

    /**
     * Check if email exists
     */
    fun existsByEmail(email: String): Boolean

    /**
     * Search users by name or username
     */
    @Query("""
        SELECT u FROM User u 
        WHERE u.isActive = true 
        AND (
            LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) 
            OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
            OR LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
            OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
        )
        ORDER BY u.lastName, u.firstName
    """)
    fun searchByNameOrUsername(@Param("searchTerm") searchTerm: String): List<User>

    /**
     * Find all lawyers (active only)
     */
    @Query("SELECT u FROM User u WHERE u.role = 'LAWYER' AND u.isActive = true ORDER BY u.lastName, u.firstName")
    fun findAllLawyers(): List<User>

    /**
     * Find all clerks (active only)
     */
    @Query("SELECT u FROM User u WHERE u.role = 'CLERK' AND u.isActive = true ORDER BY u.lastName, u.firstName")
    fun findAllClerks(): List<User>

    /**
     * Find all clients (active only)
     */
    @Query("SELECT u FROM User u WHERE u.role = 'CLIENT' AND u.isActive = true ORDER BY u.lastName, u.firstName")
    fun findAllClients(): List<User>

    /**
     * Count users by role
     */
    fun countByRole(role: UserRole): Long

    /**
     * Count active users by role
     */
    fun countByRoleAndIsActiveTrue(role: UserRole): Long
}