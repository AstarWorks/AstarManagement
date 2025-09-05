package com.astarworks.astarmanagement.core.user.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.SpringDataJdbcUserProfileTable
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserProfileId
import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * Spring Data JDBC repository interface for user profile operations.
 * Provides automatic CRUD operations with custom query methods.
 */
@Repository
interface SpringDataJdbcUserProfileRepository : CrudRepository<SpringDataJdbcUserProfileTable, UserProfileId> {
    
    /**
     * Finds a user profile by user ID.
     * One-to-one relationship means at most one profile per user.
     */
    @Query("SELECT * FROM user_profiles WHERE user_id = :userId")
    fun findByUserId(@Param("userId") userId: UserId): SpringDataJdbcUserProfileTable?
    
    /**
     * Finds all user profiles ordered by creation date.
     */
    @Query("SELECT * FROM user_profiles ORDER BY created_at")
    override fun findAll(): List<SpringDataJdbcUserProfileTable>
    
    /**
     * Checks if a profile exists for the given user ID.
     */
    @Query("SELECT COUNT(*) > 0 FROM user_profiles WHERE user_id = :userId")
    fun existsByUserId(@Param("userId") userId: UserId): Boolean
    
    /**
     * Deletes a user profile by user ID.
     */
    @Query("DELETE FROM user_profiles WHERE user_id = :userId")
    fun deleteByUserId(@Param("userId") userId: UserId)
    
    /**
     * Finds user profiles with display names matching the pattern (case-insensitive).
     */
    @Query("SELECT * FROM user_profiles WHERE LOWER(display_name) LIKE LOWER(CONCAT('%', :pattern, '%')) ORDER BY created_at")
    fun findByDisplayNameContainingIgnoreCase(@Param("pattern") pattern: String): List<SpringDataJdbcUserProfileTable>
}