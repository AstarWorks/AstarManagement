package com.astarworks.astarmanagement.core.user.api.dto

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import java.time.Instant
import java.util.UUID
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * Response DTO for user information.
 * Contains basic user data without authentication details.
 */
@Serializable
data class UserResponse(
    @Contextual val id: UUID,
    
    val auth0Sub: String,
    
    val email: String,
    
    @Contextual
    val createdAt: Instant,
    
    @Contextual
    val updatedAt: Instant
)

/**
 * Response DTO for user profile information.
 */
@Serializable
data class UserProfileResponse(
    @Contextual val id: UUID,
    
    @Contextual val userId: UUID,
    
    val displayName: String? = null,
    
    val avatarUrl: String? = null,
    
    @Contextual
    val createdAt: Instant,
    
    @Contextual
    val updatedAt: Instant
)

/**
 * Detailed response DTO combining user and profile information.
 * Used for complete user information retrieval.
 */
@Serializable
data class UserDetailResponse(
    @Contextual val id: UUID,
    
    val auth0Sub: String,
    
    val email: String,
    
    val profile: UserProfileResponse? = null,
    
    val tenantCount: Int? = null,
    
    val roleCount: Int? = null,
    
    @Contextual
    val createdAt: Instant,
    
    @Contextual
    val updatedAt: Instant
)

/**
 * Request DTO for updating user information.
 * Currently only email can be updated (rare operation).
 */
@Serializable
data class UserUpdateRequest(
    @field:Email
    @field:NotBlank
    val email: String? = null
)

/**
 * Request DTO for updating user profile.
 */
@Serializable
data class UserProfileUpdateRequest(
    @field:Size(max = 255)
    val displayName: String? = null,
    
    @field:Size(max = 500)
    val avatarUrl: String? = null
) {
    /**
     * Checks if the request has any updates.
     */
    fun hasUpdates(): Boolean {
        return displayName != null || avatarUrl != null
    }
}

/**
 * Request DTO for creating a user profile.
 * Used when initializing a profile for an existing user.
 */
@Serializable
data class UserProfileCreateRequest(
    @field:Size(max = 255)
    val displayName: String? = null,
    
    @field:Size(max = 500)
    val avatarUrl: String? = null
)

/**
 * Response DTO for user search results.
 */
@Serializable
data class UserSearchResponse(
    val users: List<UserResponse>,
    
    val totalCount: Long,
    
    val hasMore: Boolean = false
) {
    companion object {
        /**
         * Creates a search response from a list of users.
         */
        fun of(users: List<UserResponse>): UserSearchResponse {
            return UserSearchResponse(
                users = users,
                totalCount = users.size.toLong(),
                hasMore = false
            )
        }
        
        /**
         * Creates an empty search response.
         */
        fun empty(): UserSearchResponse {
            return UserSearchResponse(
                users = emptyList(),
                totalCount = 0,
                hasMore = false
            )
        }
    }
}

/**
 * Response DTO for current user information.
 * Includes additional context like current tenant.
 */
@Serializable
data class CurrentUserResponse(
    val user: UserDetailResponse,
    
    @Contextual
    val currentTenantId: UUID? = null,
    
    val permissions: List<PermissionRule>? = null
)