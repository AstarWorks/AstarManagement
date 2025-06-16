package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.service.base.BaseService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.*

/**
 * Security service for matter-level authorization checks.
 * Provides methods for validating user access to specific matters based on roles and assignments.
 */
@Service("matterSecurityService")
class MatterSecurityService(
    private val matterRepository: MatterRepository,
    private val userRepository: UserRepository
) : BaseService() {

    companion object {
        private val logger = LoggerFactory.getLogger(MatterSecurityService::class.java)
    }

    /**
     * Checks if a client user has access to a specific matter.
     * 
     * For client access, this method verifies that the authenticated client's 
     * full name matches the matter's client name field.
     * 
     * @param matterId the UUID of the matter to check
     * @param username the username of the currently authenticated user
     * @return true if the user is a client and has access to the matter, false otherwise
     */
    fun isClientMatter(matterId: UUID, username: String): Boolean {
        return try {
            logger.debug("Checking client matter access for user: $username, matter: $matterId")
            
            // Get the authenticated user
            val user = userRepository.findByUsername(username) ?: run {
                logger.warn("User not found: $username")
                return false
            }
            
            // Only apply this check for client users
            if (!user.isClient) {
                logger.debug("User $username is not a client, skipping client matter check")
                return false
            }
            
            // Get the matter
            val matter = matterRepository.findById(matterId).orElse(null) ?: run {
                logger.warn("Matter not found: $matterId")
                return false
            }
            
            // Check if client's full name matches the matter's client name
            val hasAccess = user.fullName.equals(matter.clientName, ignoreCase = true) ||
                          // Also check username in case client name is stored as username
                          user.username.equals(matter.clientName, ignoreCase = true)
            
            logger.debug("Client matter access check result for user $username, matter $matterId: $hasAccess")
            hasAccess
            
        } catch (exception: Exception) {
            logger.error("Error checking client matter access for user: $username, matter: $matterId", exception)
            false
        }
    }

    /**
     * Checks if a clerk user is assigned to a specific matter.
     * 
     * @param matterId the UUID of the matter to check
     * @param username the username of the currently authenticated user
     * @return true if the user is the assigned clerk for the matter, false otherwise
     */
    fun isAssignedClerk(matterId: UUID, username: String): Boolean {
        return try {
            logger.debug("Checking assigned clerk access for user: $username, matter: $matterId")
            
            // Get the authenticated user
            val user = userRepository.findByUsername(username) ?: run {
                logger.warn("User not found: $username")
                return false
            }
            
            // Only apply this check for clerk users
            if (!user.isClerk) {
                logger.debug("User $username is not a clerk, skipping assigned clerk check")
                return false
            }
            
            // Get the matter
            val matter = matterRepository.findById(matterId).orElse(null) ?: run {
                logger.warn("Matter not found: $matterId")
                return false
            }
            
            // Check if user is the assigned clerk
            val hasAccess = matter.assignedClerk?.id == user.id
            
            logger.debug("Assigned clerk access check result for user $username, matter $matterId: $hasAccess")
            hasAccess
            
        } catch (exception: Exception) {
            logger.error("Error checking assigned clerk access for user: $username, matter: $matterId", exception)
            false
        }
    }

    /**
     * Checks if a lawyer user is assigned to a specific matter.
     * 
     * @param matterId the UUID of the matter to check
     * @param username the username of the currently authenticated user
     * @return true if the user is the assigned lawyer for the matter, false otherwise
     */
    fun isAssignedLawyer(matterId: UUID, username: String): Boolean {
        return try {
            logger.debug("Checking assigned lawyer access for user: $username, matter: $matterId")
            
            // Get the authenticated user
            val user = userRepository.findByUsername(username) ?: run {
                logger.warn("User not found: $username")
                return false
            }
            
            // Only apply this check for lawyer users
            if (!user.isLawyer) {
                logger.debug("User $username is not a lawyer, skipping assigned lawyer check")
                return false
            }
            
            // Get the matter
            val matter = matterRepository.findById(matterId).orElse(null) ?: run {
                logger.warn("Matter not found: $matterId")
                return false
            }
            
            // Check if user is the assigned lawyer
            val hasAccess = matter.assignedLawyer?.id == user.id
            
            logger.debug("Assigned lawyer access check result for user $username, matter $matterId: $hasAccess")
            hasAccess
            
        } catch (exception: Exception) {
            logger.error("Error checking assigned lawyer access for user: $username, matter: $matterId", exception)
            false
        }
    }

    /**
     * Comprehensive access check that combines all role-based permissions.
     * 
     * @param matterId the UUID of the matter to check
     * @param username the username of the currently authenticated user
     * @return true if the user has any valid access to the matter, false otherwise
     */
    fun hasAccessToMatter(matterId: UUID, username: String): Boolean {
        return try {
            logger.debug("Checking general matter access for user: $username, matter: $matterId")
            
            val user = userRepository.findByUsername(username) ?: run {
                logger.warn("User not found: $username")
                return false
            }
            
            // Lawyers have access to all matters they're assigned to (or all matters based on business rules)
            if (user.isLawyer) {
                return isAssignedLawyer(matterId, username)
            }
            
            // Clerks have access to matters they're assigned to
            if (user.isClerk) {
                return isAssignedClerk(matterId, username)
            }
            
            // Clients have access to their own matters
            if (user.isClient) {
                return isClientMatter(matterId, username)
            }
            
            false
            
        } catch (exception: Exception) {
            logger.error("Error checking general matter access for user: $username, matter: $matterId", exception)
            false
        }
    }
}