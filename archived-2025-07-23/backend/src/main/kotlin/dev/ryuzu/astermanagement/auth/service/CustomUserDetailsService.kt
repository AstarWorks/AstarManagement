package dev.ryuzu.astermanagement.auth.service

import dev.ryuzu.astermanagement.domain.user.mapper.UserDtoMapper
import dev.ryuzu.astermanagement.domain.user.UserRepository
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Custom UserDetailsService implementation for Spring Security
 * 
 * This service bridges Spring Security's authentication system with our User domain model.
 * It loads user details from the database and creates UserPrincipal objects that implement
 * Spring Security's UserDetails interface.
 * 
 * This implementation supports:
 * - Email-based authentication (username is actually email)
 * - Role-based authorities mapping
 * - User account status validation
 * - Integration with existing User entity and repository
 */
@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    /**
     * Load user by username (email) for Spring Security authentication
     * 
     * This method is called by Spring Security during the authentication process.
     * The username parameter is actually the user's email address.
     * 
     * @param username The email address of the user to authenticate
     * @return UserDetails implementation (UserPrincipal) containing user data and authorities
     * @throws UsernameNotFoundException if user is not found or account is disabled
     */
    @Transactional(readOnly = true)
    override fun loadUserByUsername(username: String): UserDetails {
        // Find user by email (username in our system is email)
        val user = userRepository.findByEmail(username)
            ?: throw UsernameNotFoundException("User not found with email: $username")
        
        // Check if user account is active
        if (!user.isActive) {
            throw UsernameNotFoundException("User account is disabled for email: $username")
        }
        
        // Create and return UserPrincipal with user data and authorities
        return UserPrincipal.create(UserDtoMapper.toDto(user))
    }

    /**
     * Load user by ID for internal application use
     * 
     * This method is used when we need to load user details by ID rather than email,
     * such as when validating JWT tokens that contain user ID in the subject claim.
     * 
     * @param userId The UUID of the user to load
     * @return UserDetails implementation (UserPrincipal) containing user data and authorities
     * @throws UsernameNotFoundException if user is not found with the given ID
     */
    @Transactional(readOnly = true)
    fun loadUserById(userId: UUID): UserDetails {
        val user = userRepository.findById(userId)
            .orElseThrow { UsernameNotFoundException("User not found with id: $userId") }
        
        // Note: We don't check isActive here as this is for existing authenticated users
        // The JWT token validation should handle session validity
        
        return UserPrincipal.create(UserDtoMapper.toDto(user))
    }

    /**
     * Load user by email with detailed error information
     * 
     * Enhanced version of loadUserByUsername that provides more detailed error information
     * for security audit logging.
     * 
     * @param email The email address of the user
     * @return UserPrincipal if user exists and is active
     * @throws UsernameNotFoundException with detailed reason
     */
    @Transactional(readOnly = true)
    fun loadUserByEmailWithDetails(email: String): UserPrincipal {
        val user = userRepository.findByEmail(email)
            ?: throw UsernameNotFoundException("No user found with email address: $email")
        
        if (!user.isActive) {
            throw UsernameNotFoundException("User account is disabled or suspended: $email")
        }
        
        return UserPrincipal.create(UserDtoMapper.toDto(user))
    }

    /**
     * Check if user exists and is active without loading full details
     * 
     * Utility method for quick user existence and status checks without
     * creating full UserPrincipal objects.
     * 
     * @param email The email address to check
     * @return true if user exists and is active, false otherwise
     */
    @Transactional(readOnly = true)
    fun isUserActiveByEmail(email: String): Boolean {
        return userRepository.findByEmail(email)?.isActive ?: false
    }

    /**
     * Check if user exists and is active by ID
     * 
     * @param userId The user ID to check
     * @return true if user exists and is active, false otherwise
     */
    @Transactional(readOnly = true)
    fun isUserActiveById(userId: UUID): Boolean {
        return userRepository.findById(userId).map { it.isActive }.orElse(false)
    }
}