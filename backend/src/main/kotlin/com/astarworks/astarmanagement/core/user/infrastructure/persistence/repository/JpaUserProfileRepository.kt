package com.astarworks.astarmanagement.core.user.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserProfileTable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Spring Data JPA repository for UserProfileTable.
 * Handles user profile persistence operations.
 */
@Repository
interface JpaUserProfileRepository : JpaRepository<UserProfileTable, UUID> {
    
    /**
     * Find user profile by the associated user ID.
     * @param userId The user ID
     * @return The user profile table if found, null otherwise
     */
    fun findByUserId(userId: UUID): UserProfileTable?
    
    /**
     * Check if a user profile exists for the given user ID.
     * @param userId The user ID to check
     * @return true if a profile exists, false otherwise
     */
    fun existsByUserId(userId: UUID): Boolean
    
    /**
     * Delete user profile by the associated user ID.
     * @param userId The user ID
     */
    fun deleteByUserId(userId: UUID)
}