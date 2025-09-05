package com.astarworks.astarmanagement.core.user.api.mapper

import com.astarworks.astarmanagement.core.user.api.dto.*
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import org.springframework.stereotype.Component

/**
 * Mapper for converting between User domain models and DTOs.
 * Handles transformations for API layer communication.
 */
@Component
class UserDtoMapper {
    
    /**
     * Converts a User domain model to UserResponse DTO.
     * 
     * @param user The User domain model
     * @return The corresponding UserResponse DTO
     */
    fun toResponse(user: User): UserResponse {
        return UserResponse(
            id = user.id.value,
            auth0Sub = user.auth0Sub,
            email = user.email,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt
        )
    }
    
    /**
     * Converts a UserProfile domain model to UserProfileResponse DTO.
     * 
     * @param profile The UserProfile domain model
     * @return The corresponding UserProfileResponse DTO
     */
    fun toProfileResponse(profile: UserProfile): UserProfileResponse {
        return UserProfileResponse(
            id = profile.id.value,
            userId = profile.userId.value,
            displayName = profile.displayName,
            avatarUrl = profile.avatarUrl,
            createdAt = profile.createdAt,
            updatedAt = profile.updatedAt
        )
    }
    
    /**
     * Converts User and UserProfile to UserDetailResponse DTO.
     * 
     * @param user The User domain model
     * @param profile Optional UserProfile domain model
     * @param tenantCount Optional count of tenants the user belongs to
     * @param roleCount Optional count of roles assigned to the user
     * @return The corresponding UserDetailResponse DTO
     */
    fun toDetailResponse(
        user: User,
        profile: UserProfile? = null,
        tenantCount: Int? = null,
        roleCount: Int? = null
    ): UserDetailResponse {
        return UserDetailResponse(
            id = user.id.value,
            auth0Sub = user.auth0Sub,
            email = user.email,
            profile = profile?.let { toProfileResponse(it) },
            tenantCount = tenantCount,
            roleCount = roleCount,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt
        )
    }
    
    /**
     * Converts a list of User domain models to UserResponse DTOs.
     * 
     * @param users List of User domain models
     * @return List of corresponding UserResponse DTOs
     */
    fun toResponseList(users: List<User>): List<UserResponse> {
        return users.map { toResponse(it) }
    }
    
    /**
     * Creates a UserSearchResponse from a list of Users.
     * 
     * @param users List of User domain models
     * @param totalCount Optional total count for pagination
     * @param hasMore Optional flag indicating more results available
     * @return UserSearchResponse DTO
     */
    fun toSearchResponse(
        users: List<User>,
        totalCount: Long? = null,
        hasMore: Boolean = false
    ): UserSearchResponse {
        val userResponses = toResponseList(users)
        return UserSearchResponse(
            users = userResponses,
            totalCount = totalCount ?: userResponses.size.toLong(),
            hasMore = hasMore
        )
    }
    
    /**
     * Creates a CurrentUserResponse combining user details and context.
     * 
     * @param user The User domain model
     * @param profile Optional UserProfile domain model
     * @param currentTenantId Optional current tenant ID
     * @param permissions Optional list of permissions
     * @param tenantCount Optional count of tenants
     * @param roleCount Optional count of roles
     * @return CurrentUserResponse DTO
     */
    fun toCurrentUserResponse(
        user: User,
        profile: UserProfile? = null,
        currentTenantId: java.util.UUID? = null,
        permissions: List<PermissionRule>? = null,
        tenantCount: Int? = null,
        roleCount: Int? = null
    ): CurrentUserResponse {
        val userDetail = toDetailResponse(
            user = user,
            profile = profile,
            tenantCount = tenantCount,
            roleCount = roleCount
        )
        
        return CurrentUserResponse(
            user = userDetail,
            currentTenantId = currentTenantId,
            permissions = permissions
        )
    }
    
    /**
     * Extracts email from UserUpdateRequest.
     * 
     * @param request The UserUpdateRequest DTO
     * @return The email or null if not provided
     */
    fun extractEmail(request: UserUpdateRequest): String? {
        return request.email
    }
    
    /**
     * Extracts display name from UserProfileUpdateRequest.
     * 
     * @param request The UserProfileUpdateRequest DTO
     * @return The display name or null if not provided
     */
    fun extractDisplayName(request: UserProfileUpdateRequest): String? {
        return request.displayName
    }
    
    /**
     * Extracts avatar URL from UserProfileUpdateRequest.
     * 
     * @param request The UserProfileUpdateRequest DTO
     * @return The avatar URL or null if not provided
     */
    fun extractAvatarUrl(request: UserProfileUpdateRequest): String? {
        return request.avatarUrl
    }
    
    /**
     * Creates an empty UserSearchResponse.
     * 
     * @return Empty UserSearchResponse DTO
     */
    fun emptySearchResponse(): UserSearchResponse {
        return UserSearchResponse.empty()
    }
}