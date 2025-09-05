package com.astarworks.astarmanagement.core.user.domain.repository

import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserProfileId

/**
 * User profile repository interface for domain layer.
 * Handles user profile information persistence (display name, avatar).
 * One-to-one relationship with User entity.
 */
interface UserProfileRepository {
    
    /**
     * Saves a user profile to the repository.
     * @param userProfile The user profile to save
     * @return The saved user profile with any generated values
     */
    fun save(userProfile: UserProfile): UserProfile
    
    /**
     * Finds a user profile by its ID.
     * @param id The user profile ID
     * @return The user profile if found, null otherwise
     */
    fun findById(id: UserProfileId): UserProfile?
    
    /**
     * Finds a user profile by the associated user ID.
     * @param userId The user ID
     * @return The user profile if found, null otherwise
     */
    fun findByUserId(userId: UserId): UserProfile?
    
    /**
     * Checks if a user profile exists for the given user ID.
     * @param userId The user ID to check
     * @return true if a profile exists, false otherwise
     */
    fun existsByUserId(userId: UserId): Boolean
    
    /**
     * Finds all user profiles.
     * @return List of all user profiles
     */
    fun findAll(): List<UserProfile>
    
    /**
     * Deletes a user profile by its ID.
     * @param id The user profile ID
     */
    fun deleteById(id: UserProfileId)
    
    /**
     * Deletes a user profile by the associated user ID.
     * @param userId The user ID
     */
    fun deleteByUserId(userId: UserId)
    
    /**
     * Counts the total number of user profiles.
     * @return The total count
     */
    fun count(): Long
}