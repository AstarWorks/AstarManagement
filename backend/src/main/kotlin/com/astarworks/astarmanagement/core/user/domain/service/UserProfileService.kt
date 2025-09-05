package com.astarworks.astarmanagement.core.user.domain.service

import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.user.domain.repository.UserProfileRepository
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserProfileId
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing user profiles.
 * 
 * This service handles all user profile operations including:
 * - Profile creation and initialization
 * - Display name and avatar management
 * - Profile updates and deletion
 * - Profile retrieval and search
 * 
 * Each user has exactly one profile that stores display information.
 */
@Service
@Transactional
class UserProfileService(
    private val userProfileRepository: UserProfileRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(UserProfileService::class.java)
    
    /**
     * Creates a new user profile.
     * 
     * @param userId The user ID
     * @param displayName Optional display name
     * @param avatarUrl Optional avatar URL
     * @return The created profile
     * @throws IllegalArgumentException if user not found or profile already exists
     */
    fun createProfile(
        userId: UUID,
        displayName: String? = null,
        avatarUrl: String? = null
    ): UserProfile {
        logger.info("Creating profile for user: $userId")
        
        // Verify user exists
        val user = userRepository.findById(UserId(userId))
            ?: throw IllegalArgumentException("User not found: $userId")
        
        // Check if profile already exists
        if (userProfileRepository.existsByUserId(UserId(userId))) {
            throw IllegalArgumentException("Profile already exists for user: $userId")
        }
        
        val profile = UserProfile(
            userId = UserId(userId),
            displayName = displayName,
            avatarUrl = avatarUrl
        )
        
        val savedProfile = userProfileRepository.save(profile)
        logger.info("Created profile with ID: ${savedProfile.id}")
        
        return savedProfile
    }
    
    /**
     * Gets a user's profile by user ID.
     * 
     * @param userId The user ID
     * @return The user profile if found, null otherwise
     */
    @Transactional(readOnly = true)
    fun getProfileByUserId(userId: UUID): UserProfile? {
        return userProfileRepository.findByUserId(UserId(userId))
    }
    
    /**
     * Gets a user's profile by profile ID.
     * 
     * @param profileId The profile ID
     * @return The user profile if found, null otherwise
     */
    @Transactional(readOnly = true)
    fun getProfileById(profileId: UUID): UserProfile? {
        return userProfileRepository.findById(UserProfileId(profileId))
    }
    
    /**
     * Gets or creates a profile for a user.
     * Creates a default profile if one doesn't exist.
     * 
     * @param userId The user ID
     * @param defaultDisplayName Default display name if creating new profile
     * @param defaultAvatarUrl Default avatar URL if creating new profile
     * @return The existing or newly created profile
     * @throws IllegalArgumentException if user not found
     */
    fun getOrCreateProfile(
        userId: UUID,
        defaultDisplayName: String? = null,
        defaultAvatarUrl: String? = null
    ): UserProfile {
        logger.info("Getting or creating profile for user: $userId")
        
        // Check if profile exists
        val existingProfile = userProfileRepository.findByUserId(UserId(userId))
        if (existingProfile != null) {
            logger.debug("Found existing profile: ${existingProfile.id}")
            return existingProfile
        }
        
        // Create new profile
        logger.info("Creating new profile for user: $userId")
        return createProfile(userId, defaultDisplayName, defaultAvatarUrl)
    }
    
    /**
     * Updates a user's display name.
     * 
     * @param userId The user ID
     * @param displayName New display name (null to clear)
     * @return The updated profile
     * @throws IllegalArgumentException if profile not found
     */
    fun updateDisplayName(userId: UUID, displayName: String?): UserProfile {
        logger.info("Updating display name for user $userId to: $displayName")
        
        val profile = userProfileRepository.findByUserId(UserId(userId))
            ?: throw IllegalArgumentException("Profile not found for user: $userId")
        
        val updatedProfile = profile.updateDisplayName(displayName)
        val savedProfile = userProfileRepository.save(updatedProfile)
        
        logger.info("Updated display name for user: $userId")
        return savedProfile
    }
    
    /**
     * Updates a user's avatar URL.
     * 
     * @param userId The user ID
     * @param avatarUrl New avatar URL (null to clear)
     * @return The updated profile
     * @throws IllegalArgumentException if profile not found
     */
    fun updateAvatarUrl(userId: UUID, avatarUrl: String?): UserProfile {
        logger.info("Updating avatar URL for user: $userId")
        
        val profile = userProfileRepository.findByUserId(UserId(userId))
            ?: throw IllegalArgumentException("Profile not found for user: $userId")
        
        val updatedProfile = profile.updateAvatarUrl(avatarUrl)
        val savedProfile = userProfileRepository.save(updatedProfile)
        
        logger.info("Updated avatar URL for user: $userId")
        return savedProfile
    }
    
    /**
     * Updates both display name and avatar URL for a user.
     * 
     * @param userId The user ID
     * @param displayName New display name (null to keep current)
     * @param avatarUrl New avatar URL (null to keep current)
     * @return The updated profile
     * @throws IllegalArgumentException if profile not found
     */
    fun updateProfile(
        userId: UUID,
        displayName: String? = null,
        avatarUrl: String? = null
    ): UserProfile {
        logger.info("Updating profile for user: $userId")
        
        val profile = userProfileRepository.findByUserId(UserId(userId))
            ?: throw IllegalArgumentException("Profile not found for user: $userId")
        
        val updatedProfile = profile.updateProfile(displayName, avatarUrl)
        val savedProfile = userProfileRepository.save(updatedProfile)
        
        logger.info("Updated profile for user: $userId")
        return savedProfile
    }
    
    /**
     * Updates a profile by profile ID.
     * 
     * @param profileId The profile ID
     * @param displayName New display name (null to keep current)
     * @param avatarUrl New avatar URL (null to keep current)
     * @return The updated profile
     * @throws IllegalArgumentException if profile not found
     */
    fun updateProfileById(
        profileId: UUID,
        displayName: String? = null,
        avatarUrl: String? = null
    ): UserProfile {
        logger.info("Updating profile: $profileId")
        
        val profile = userProfileRepository.findById(UserProfileId(profileId))
            ?: throw IllegalArgumentException("Profile not found: $profileId")
        
        val updatedProfile = profile.updateProfile(displayName, avatarUrl)
        val savedProfile = userProfileRepository.save(updatedProfile)
        
        logger.info("Updated profile: $profileId")
        return savedProfile
    }
    
    /**
     * Initializes a profile from Auth0 data.
     * Updates or creates a profile with Auth0 profile information.
     * 
     * @param userId The user ID
     * @param auth0DisplayName Display name from Auth0
     * @param auth0AvatarUrl Avatar URL from Auth0
     * @return The initialized profile
     */
    fun initializeFromAuth0(
        userId: UUID,
        auth0DisplayName: String? = null,
        auth0AvatarUrl: String? = null
    ): UserProfile {
        logger.info("Initializing profile from Auth0 for user: $userId")
        
        val existingProfile = userProfileRepository.findByUserId(UserId(userId))
        
        return if (existingProfile != null) {
            // Update existing profile only if values are not already set
            val newDisplayName = existingProfile.displayName ?: auth0DisplayName
            val newAvatarUrl = existingProfile.avatarUrl ?: auth0AvatarUrl
            
            if (newDisplayName != existingProfile.displayName || newAvatarUrl != existingProfile.avatarUrl) {
                val updatedProfile = existingProfile.updateProfile(newDisplayName, newAvatarUrl)
                userProfileRepository.save(updatedProfile)
            } else {
                existingProfile
            }
        } else {
            // Create new profile with Auth0 data
            createProfile(userId, auth0DisplayName, auth0AvatarUrl)
        }
    }
    
    /**
     * Deletes a user's profile by user ID.
     * 
     * @param userId The user ID
     * @throws IllegalArgumentException if profile not found
     */
    fun deleteProfileByUserId(userId: UUID) {
        logger.info("Deleting profile for user: $userId")
        
        if (!userProfileRepository.existsByUserId(UserId(userId))) {
            throw IllegalArgumentException("Profile not found for user: $userId")
        }
        
        userProfileRepository.deleteByUserId(UserId(userId))
        logger.info("Deleted profile for user: $userId")
    }
    
    /**
     * Deletes a profile by profile ID.
     * 
     * @param profileId The profile ID
     * @throws IllegalArgumentException if profile not found
     */
    fun deleteProfileById(profileId: UUID) {
        logger.info("Deleting profile: $profileId")
        
        val profile = userProfileRepository.findById(UserProfileId(profileId))
            ?: throw IllegalArgumentException("Profile not found: $profileId")
        
        userProfileRepository.deleteById(UserProfileId(profileId))
        logger.info("Deleted profile: $profileId")
    }
    
    /**
     * Gets all user profiles.
     * 
     * @return List of all profiles
     */
    @Transactional(readOnly = true)
    fun getAllProfiles(): List<UserProfile> {
        return userProfileRepository.findAll()
    }
    
    /**
     * Checks if a user has a profile.
     * 
     * @param userId The user ID
     * @return true if profile exists, false otherwise
     */
    @Transactional(readOnly = true)
    fun hasProfile(userId: UUID): Boolean {
        return userProfileRepository.existsByUserId(UserId(userId))
    }
    
    /**
     * Counts the total number of profiles.
     * 
     * @return Total profile count
     */
    @Transactional(readOnly = true)
    fun countProfiles(): Long {
        return userProfileRepository.count()
    }
    
    /**
     * Clears display name for a user.
     * 
     * @param userId The user ID
     * @return The updated profile
     * @throws IllegalArgumentException if profile not found
     */
    fun clearDisplayName(userId: UUID): UserProfile {
        logger.info("Clearing display name for user: $userId")
        return updateDisplayName(userId, null)
    }
    
    /**
     * Clears avatar URL for a user.
     * 
     * @param userId The user ID
     * @return The updated profile
     * @throws IllegalArgumentException if profile not found
     */
    fun clearAvatarUrl(userId: UUID): UserProfile {
        logger.info("Clearing avatar URL for user: $userId")
        return updateAvatarUrl(userId, null)
    }
    
    /**
     * Clears all profile data (display name and avatar).
     * 
     * @param userId The user ID
     * @return The updated profile
     * @throws IllegalArgumentException if profile not found
     */
    fun clearProfile(userId: UUID): UserProfile {
        logger.info("Clearing profile data for user: $userId")
        return updateProfile(userId, null, null)
    }
    
    /**
     * Validates and sanitizes a display name.
     * 
     * @param displayName The display name to validate
     * @return The sanitized display name
     * @throws IllegalArgumentException if display name is invalid
     */
    fun validateDisplayName(displayName: String?): String? {
        if (displayName == null) return null
        
        val trimmed = displayName.trim()
        if (trimmed.isEmpty()) return null
        
        if (trimmed.length > 255) {
            throw IllegalArgumentException("Display name cannot exceed 255 characters")
        }
        
        return trimmed
    }
    
    /**
     * Validates an avatar URL.
     * 
     * @param avatarUrl The avatar URL to validate
     * @return The validated avatar URL
     * @throws IllegalArgumentException if avatar URL is invalid
     */
    fun validateAvatarUrl(avatarUrl: String?): String? {
        if (avatarUrl == null) return null
        
        val trimmed = avatarUrl.trim()
        if (trimmed.isEmpty()) return null
        
        // Basic URL validation
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            throw IllegalArgumentException("Avatar URL must be a valid HTTP(S) URL")
        }
        
        return trimmed
    }
}