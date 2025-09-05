package com.astarworks.astarmanagement.core.user.api.controller
import org.springframework.web.server.ResponseStatusException

import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.core.user.api.dto.*
import com.astarworks.astarmanagement.core.user.api.mapper.UserDtoMapper
import com.astarworks.astarmanagement.core.user.domain.service.UserProfileService
import com.astarworks.astarmanagement.core.user.domain.service.UserService
import com.astarworks.astarmanagement.shared.domain.value.UserId
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for user management.
 * Provides endpoints for user information retrieval and profile management.
 * Authentication is handled exclusively through Auth0 JWT tokens.
 */
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User management and profile operations")
@PreAuthorize("isAuthenticated()")
class UserController(
    private val userService: UserService,
    private val userProfileService: UserProfileService,
    private val tenantMembershipRepository: TenantMembershipRepository,
    private val tenantContextService: TenantContextService,
    private val dtoMapper: UserDtoMapper
) {
    private val logger = LoggerFactory.getLogger(UserController::class.java)
    
    // === Current User Endpoints (/me) ===
    
    /**
     * Gets the current user's information.
     * Returns user details including profile and tenant information.
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user information", description = "Retrieves the authenticated user's details including profile")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "User information retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing JWT token"),
        ApiResponse(responseCode = "404", description = "User not found")
    )
    fun getCurrentUser(
        @AuthenticationPrincipal principal: AuthenticatedUserContext
    ): CurrentUserResponse {
        logger.debug("Getting current user information for: ${principal.userId}")
        
        // Get user from database
        val user = userService.findById(UserId(principal.userId))
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        
        // Get user profile
        val profile = userProfileService.getProfileByUserId(principal.userId)
        
        // Get tenant count
        val tenantCount = tenantMembershipRepository.countByUserId(UserId(principal.userId))
            .toInt()
        
        // Get current tenant ID
        val currentTenantId = tenantContextService.getTenantContext()
        
        // Create response
        val response = dtoMapper.toCurrentUserResponse(
            user = user,
            profile = profile,
            currentTenantId = currentTenantId,
            tenantCount = tenantCount
        )
        
        return response
    }
    
    /**
     * Updates the current user's information.
     * Currently only email updates are supported (rare operation).
     */
    @PutMapping("/me")
    @Operation(summary = "Update current user information", description = "Updates the authenticated user's information")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "User updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "404", description = "User not found"),
        ApiResponse(responseCode = "409", description = "Email already in use")
    )
    fun updateCurrentUser(
        @AuthenticationPrincipal principal: AuthenticatedUserContext,
        @Valid @RequestBody request: UserUpdateRequest
    ): UserResponse {
        logger.info("Updating current user: ${principal.userId}")
        
        // Only email can be updated
        val email = dtoMapper.extractEmail(request)
        if (email == null) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST)
        }
        
        return try {
            val updatedUser = userService.updateEmail(UserId(principal.userId), email)
            val response = dtoMapper.toResponse(updatedUser)
            response
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to update user: ${e.message}")
            if (e.message?.contains("already in use") == true) {
                throw ResponseStatusException(HttpStatus.CONFLICT)
            } else {
                throw ResponseStatusException(HttpStatus.NOT_FOUND)
            }
        }
    }
    
    /**
     * Gets the current user's profile.
     */
    @GetMapping("/me/profile")
    @Operation(summary = "Get current user profile", description = "Retrieves the authenticated user's profile information")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Profile retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "404", description = "Profile not found")
    )
    fun getCurrentUserProfile(
        @AuthenticationPrincipal principal: AuthenticatedUserContext
    ): UserProfileResponse {
        logger.debug("Getting profile for current user: ${principal.userId}")
        
        val profile = userProfileService.getProfileByUserId(principal.userId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        
        val response = dtoMapper.toProfileResponse(profile)
        return response
    }
    
    /**
     * Updates the current user's profile.
     * Creates a profile if it doesn't exist.
     */
    @PutMapping("/me/profile")
    @Operation(
        summary = "Update current user profile",
        description = "Updates or creates the authenticated user's profile information"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Profile updated successfully"),
        ApiResponse(responseCode = "201", description = "Profile created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    fun updateCurrentUserProfile(
        @AuthenticationPrincipal principal: AuthenticatedUserContext,
        @Valid @RequestBody request: UserProfileUpdateRequest
    ): UserProfileResponse {
        logger.info("Updating profile for current user: ${principal.userId}")
        
        if (!request.hasUpdates()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST)
        }
        
        // Check if profile exists
        val existingProfile = userProfileService.getProfileByUserId(principal.userId)
        
        val profile = if (existingProfile != null) {
            // Update existing profile
            userProfileService.updateProfile(
                userId = principal.userId,
                displayName = dtoMapper.extractDisplayName(request),
                avatarUrl = dtoMapper.extractAvatarUrl(request)
            )
        } else {
            // Create new profile
            logger.info("Creating new profile for user: ${principal.userId}")
            userProfileService.createProfile(
                userId = principal.userId,
                displayName = dtoMapper.extractDisplayName(request),
                avatarUrl = dtoMapper.extractAvatarUrl(request)
            )
        }
        
        return dtoMapper.toProfileResponse(profile)
    }
    
    // === User Management Endpoints (Phase 2 - to be implemented) ===
    
    /**
     * Gets all users in the current tenant.
     * Requires appropriate permissions.
     */
    @GetMapping
    @Operation(
        summary = "List users in tenant",
        description = "Retrieves all users in the current tenant (admin only)"
    )
    @PreAuthorize("hasPermissionRule('user.view.all')")
    fun listUsers(): UserSearchResponse {
        logger.info("Listing users in current tenant")
        
        // Phase 2 implementation
        // Will retrieve users filtered by current tenant
        return dtoMapper.emptySearchResponse()
    }
    
    /**
     * Gets a specific user by ID.
     * Requires appropriate permissions or self-access.
     */
    @GetMapping("/{userId}")
    @Operation(
        summary = "Get user by ID",
        description = "Retrieves a specific user's information"
    )
    @PreAuthorize("hasPermissionRule('user.view.all') or #userId == authentication.principal.userId")
    fun getUserById(
        @Parameter(description = "User ID") @PathVariable userId: UUID
    ): UserDetailResponse {
        logger.info("Getting user by ID: $userId")
        
        val user = userService.findById(UserId(userId))
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        
        val profile = userProfileService.getProfileByUserId(userId)
        val tenantCount = tenantMembershipRepository.countByUserId(UserId(userId)).toInt()
        
        val response = dtoMapper.toDetailResponse(
            user = user,
            profile = profile,
            tenantCount = tenantCount
        )
        
        return response
    }
    
    /**
     * Gets a user's profile by user ID.
     * Requires appropriate permissions or self-access.
     */
    @GetMapping("/{userId}/profile")
    @Operation(
        summary = "Get user profile",
        description = "Retrieves a specific user's profile information"
    )
    @PreAuthorize("hasPermissionRule('user.view.all') or #userId == authentication.principal.userId")
    fun getUserProfile(
        @Parameter(description = "User ID") @PathVariable userId: UUID
    ): UserProfileResponse {
        logger.info("Getting profile for user: $userId")
        
        val profile = userProfileService.getProfileByUserId(userId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        
        val response = dtoMapper.toProfileResponse(profile)
        return response
    }
    
    // === Auth0 Sync Endpoints (Phase 3 - to be implemented) ===
    
    /**
     * Synchronizes user data with Auth0.
     * Admin operation for manual sync when needed.
     */
    @PostMapping("/sync-auth0")
    @Operation(
        summary = "Sync users with Auth0",
        description = "Manually synchronizes user data with Auth0 (admin only)"
    )
    @PreAuthorize("hasPermissionRule('user.sync.auth0')")
    fun syncWithAuth0(): Map<String, Any> {
        logger.info("Manual Auth0 sync requested")
        
        // Phase 3 implementation
        // Will sync user data with Auth0
        return mapOf(
            "status" to "pending",
            "message" to "Auth0 sync functionality not yet implemented"
        )
    }
}