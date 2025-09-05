package com.astarworks.astarmanagement.core.user.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.SpringDataJdbcUserTable
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * Spring Data JDBC repository interface for user operations.
 * Provides automatic CRUD operations with custom query methods.
 */
@Repository
interface SpringDataJdbcUserRepository : CrudRepository<SpringDataJdbcUserTable, UserId> {
    
    /**
     * Finds a user by Auth0 subject identifier.
     */
    @Query("SELECT * FROM users WHERE auth0_sub = :auth0Sub")
    fun findByAuth0Sub(@Param("auth0Sub") auth0Sub: String): SpringDataJdbcUserTable?
    
    /**
     * Finds a user by email address.
     */
    @Query("SELECT * FROM users WHERE email = :email")
    fun findByEmail(@Param("email") email: String): SpringDataJdbcUserTable?
    
    /**
     * Finds users by email pattern (case-insensitive).
     */
    @Query("SELECT * FROM users WHERE LOWER(email) LIKE LOWER(CONCAT('%', :emailPattern, '%')) ORDER BY created_at")
    fun findByEmailContainingIgnoreCase(@Param("emailPattern") emailPattern: String): List<SpringDataJdbcUserTable>
    
    /**
     * Finds all users ordered by creation date.
     */
    @Query("SELECT * FROM users ORDER BY created_at")
    override fun findAll(): List<SpringDataJdbcUserTable>
    
    /**
     * Checks if a user with the given Auth0 subject exists.
     */
    @Query("SELECT COUNT(*) > 0 FROM users WHERE auth0_sub = :auth0Sub")
    fun existsByAuth0Sub(@Param("auth0Sub") auth0Sub: String): Boolean
    
    /**
     * Checks if a user with the given email exists.
     */
    @Query("SELECT COUNT(*) > 0 FROM users WHERE email = :email")
    fun existsByEmail(@Param("email") email: String): Boolean
}