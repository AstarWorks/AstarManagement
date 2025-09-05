package com.astarworks.astarmanagement.core.user.domain.service

import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.user.domain.repository.UserProfileRepository
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Service for managing users with Auth0 integration.
 * 
 * This service handles all user management operations including:
 * - User creation and JIT provisioning from Auth0
 * - User profile initialization
 * - User search and retrieval
 * - User updates and deletion
 * - Multi-tenant user management
 * 
 * Users are authenticated via Auth0 and can belong to multiple tenants.
 */
@Service
@Transactional
class UserService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val tenantMembershipRepository: TenantMembershipRepository
) {
    private val logger = LoggerFactory.getLogger(UserService::class.java)
    
    /**
     * Creates a new user from Auth0 authentication.
     * This is typically called during JIT (Just-In-Time) provisioning
     * when a user logs in for the first time.
     * 
     * @param auth0Sub Auth0 subject identifier
     * @param email User's email address
     * @param displayName Optional display name from Auth0 profile
     * @param avatarUrl Optional avatar URL from Auth0 profile
     * @return The created user with profile
     * @throws IllegalArgumentException if user already exists
     */
    fun createUserFromAuth0(
        auth0Sub: String,
        email: String,
        displayName: String? = null,
        avatarUrl: String? = null
    ): User {
        logger.info("Creating user from Auth0: $auth0Sub")
        
        // Check if user already exists
        if (userRepository.existsByAuth0Sub(auth0Sub)) {
            throw IllegalArgumentException("User with Auth0 sub '$auth0Sub' already exists")
        }
        
        if (userRepository.existsByEmail(email)) {
            logger.warn("User with email '$email' already exists, but with different Auth0 sub")
        }
        
        // Create user
        val user = User.fromAuth0(auth0Sub, email)
        val savedUser = userRepository.save(user)
        logger.info("Created user with ID: ${savedUser.id}")
        
        // Create user profile
        val profile = UserProfile(
            userId = savedUser.id,
            displayName = displayName,
            avatarUrl = avatarUrl
        )
        userProfileRepository.save(profile)
        logger.info("Created profile for user: ${savedUser.id}")
        
        return savedUser
    }
    
    /**
     * Finds or creates a user from Auth0 authentication.
     * Used for JIT provisioning - creates the user if they don't exist.
     * 
     * @param auth0Sub Auth0 subject identifier
     * @param email User's email address
     * @param displayName Optional display name from Auth0 profile
     * @param avatarUrl Optional avatar URL from Auth0 profile
     * @return Existing or newly created user
     */
    fun findOrCreateFromAuth0(
        auth0Sub: String,
        email: String,
        displayName: String? = null,
        avatarUrl: String? = null
    ): User {
        logger.info("Finding or creating user from Auth0: $auth0Sub")
        
        // Check if user exists
        val existingUser = userRepository.findByAuth0Sub(auth0Sub)
        if (existingUser != null) {
            logger.debug("Found existing user: ${existingUser.id}")
            
            // Update email if changed in Auth0
            if (existingUser.email != email) {
                logger.info("Updating email for user ${existingUser.id} from ${existingUser.email} to $email")
                val updatedUser = existingUser.updateEmail(email)
                return userRepository.save(updatedUser)
            }
            
            return existingUser
        }
        
        // Create new user
        logger.info("Creating new user for Auth0 sub: $auth0Sub")
        return createUserFromAuth0(auth0Sub, email, displayName, avatarUrl)
    }
    
    /**
     * Finds a user by ID.
     * 
     * @param id User ID
     * @return The user if found, null otherwise
     */
    @Transactional(readOnly = true)
    fun findById(id: UserId): User? {
        return userRepository.findById(id)
    }
    
    /**
     * Finds a user by Auth0 subject identifier.
     * 
     * @param auth0Sub Auth0 subject identifier
     * @return The user if found, null otherwise
     */
    @Transactional(readOnly = true)
    fun findByAuth0Sub(auth0Sub: String): User? {
        return userRepository.findByAuth0Sub(auth0Sub)
    }
    
    /**
     * Finds a user by email address.
     * Note: Email is not necessarily unique across the system.
     * 
     * @param email Email address
     * @return The user if found, null otherwise
     */
    @Transactional(readOnly = true)
    fun findByEmail(email: String): User? {
        return userRepository.findByEmail(email)
    }
    
    /**
     * Gets all users in the system.
     * 
     * @return List of all users
     */
    @Transactional(readOnly = true)
    fun findAllUsers(): List<User> {
        return userRepository.findAll()
    }
    
    /**
     * Updates a user's email address.
     * This is a rare operation as email is typically managed in Auth0.
     * 
     * @param userId User ID
     * @param newEmail New email address
     * @return The updated user
     * @throws IllegalArgumentException if user not found
     */
    fun updateEmail(userId: UserId, newEmail: String): User {
        logger.info("Updating email for user $userId to: $newEmail")
        
        val user = userRepository.findById(userId)
            ?: throw IllegalArgumentException("User not found: $userId")
        
        // Check if new email is already in use
        val existingUser = userRepository.findByEmail(newEmail)
        if (existingUser != null && existingUser.id != userId) {
            throw IllegalArgumentException("Email '$newEmail' is already in use by another user")
        }
        
        val updatedUser = user.updateEmail(newEmail)
        val savedUser = userRepository.save(updatedUser)
        
        logger.info("Updated email for user: $userId")
        return savedUser
    }
    
    /**
     * Synchronizes user data with Auth0.
     * Updates local user data based on Auth0 profile information.
     * 
     * @param auth0Sub Auth0 subject identifier
     * @param email Current email in Auth0
     * @param displayName Optional display name from Auth0
     * @param avatarUrl Optional avatar URL from Auth0
     * @return The synchronized user
     * @throws IllegalArgumentException if user not found
     */
    fun syncWithAuth0(
        auth0Sub: String,
        email: String,
        displayName: String? = null,
        avatarUrl: String? = null
    ): User {
        logger.info("Syncing user with Auth0: $auth0Sub")
        
        val user = userRepository.findByAuth0Sub(auth0Sub)
            ?: throw IllegalArgumentException("User not found for Auth0 sub: $auth0Sub")
        
        // Update email if changed
        val updatedUser = if (user.email != email) {
            logger.info("Updating email from ${user.email} to $email")
            userRepository.save(user.updateEmail(email))
        } else {
            user
        }
        
        // Update profile if exists
        val profile = userProfileRepository.findByUserId(updatedUser.id)
        if (profile != null) {
            val updatedProfile = profile.updateProfile(displayName, avatarUrl)
            userProfileRepository.save(updatedProfile)
            logger.info("Updated profile for user: ${updatedUser.id}")
        }
        
        return updatedUser
    }
    
    /**
     * Deletes a user and all related data.
     * This includes profile, tenant memberships, and role assignments.
     * 
     * @param userId User ID
     * @throws IllegalArgumentException if user not found
     */
    fun deleteUser(userId: UserId) {
        logger.info("Deleting user: $userId")
        
        val user = userRepository.findById(userId)
            ?: throw IllegalArgumentException("User not found: $userId")
        
        // Delete profile if exists
        if (userProfileRepository.existsByUserId(userId)) {
            userProfileRepository.deleteByUserId(userId)
            logger.info("Deleted profile for user: $userId")
        }
        
        // Delete tenant memberships
        tenantMembershipRepository.deleteByUserId(userId)
        logger.info("Deleted tenant memberships for user: $userId")
        
        // Note: Role assignments should be handled by cascade delete on tenant_users
        
        // Delete user
        userRepository.deleteById(userId)
        logger.info("Deleted user: $userId")
    }
    
    /**
     * Checks if a user exists by ID.
     * 
     * @param userId User ID
     * @return true if user exists, false otherwise
     */
    @Transactional(readOnly = true)
    fun existsById(userId: UserId): Boolean {
        return userRepository.findById(userId) != null
    }
    
    /**
     * Checks if a user exists by Auth0 sub.
     * 
     * @param auth0Sub Auth0 subject identifier
     * @return true if user exists, false otherwise
     */
    @Transactional(readOnly = true)
    fun existsByAuth0Sub(auth0Sub: String): Boolean {
        return userRepository.existsByAuth0Sub(auth0Sub)
    }
    
    /**
     * Checks if a user exists by email.
     * 
     * @param email Email address
     * @return true if user exists, false otherwise
     */
    @Transactional(readOnly = true)
    fun existsByEmail(email: String): Boolean {
        return userRepository.existsByEmail(email)
    }
    
    /**
     * Counts the total number of users.
     * 
     * @return Total user count
     */
    @Transactional(readOnly = true)
    fun countUsers(): Long {
        return userRepository.count()
    }
    
    /**
     * Gets the number of tenants a user belongs to.
     * 
     * @param userId User ID
     * @return Number of tenants
     */
    @Transactional(readOnly = true)
    fun countUserTenants(userId: UserId): Long {
        return tenantMembershipRepository.countByUserId(userId)
    }
    
    /**
     * Gets the number of active tenants a user belongs to.
     * 
     * @param userId User ID
     * @return Number of active tenants
     */
    @Transactional(readOnly = true)
    fun countActiveUserTenants(userId: UserId): Long {
        return tenantMembershipRepository.countActiveByUserId(userId)
    }
    
    /**
     * Checks if a user is a member of a specific tenant.
     * 
     * @param userId User ID
     * @param tenantId Tenant ID
     * @return true if user is a member, false otherwise
     */
    @Transactional(readOnly = true)
    fun isMemberOfTenant(userId: UserId, tenantId: TenantId): Boolean {
        return tenantMembershipRepository.existsByUserIdAndTenantId(userId, tenantId)
    }
    
    /**
     * Checks if a user is an active member of a specific tenant.
     * 
     * @param userId User ID
     * @param tenantId Tenant ID
     * @return true if user is an active member, false otherwise
     */
    @Transactional(readOnly = true)
    fun isActiveMemberOfTenant(userId: UserId, tenantId: TenantId): Boolean {
        return tenantMembershipRepository.existsActiveByUserIdAndTenantId(userId, tenantId)
    }
    
    /**
     * Ensures a user has a profile.
     * Creates a default profile if one doesn't exist.
     * 
     * @param userId User ID
     * @return The existing or newly created profile
     * @throws IllegalArgumentException if user not found
     */
    fun ensureUserProfile(userId: UserId): UserProfile {
        logger.info("Ensuring profile exists for user: $userId")
        
        // Verify user exists
        val user = userRepository.findById(userId)
            ?: throw IllegalArgumentException("User not found: $userId")
        
        // Check if profile exists
        val existingProfile = userProfileRepository.findByUserId(userId)
        if (existingProfile != null) {
            return existingProfile
        }
        
        // Create default profile
        logger.info("Creating default profile for user: $userId")
        val profile = UserProfile(
            userId = userId,
            displayName = null,
            avatarUrl = null
        )
        
        return userProfileRepository.save(profile)
    }
}