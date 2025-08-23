package com.astarworks.astarmanagement.core.user.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserProfileTable
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between UserProfile domain model and UserProfileTable entity.
 * Handles user profile information mapping (display name, avatar).
 */
@Component
class UserProfileMapper {
    
    /**
     * Converts a domain UserProfile to a persistence UserProfileTable.
     * Note: This method requires a UserTable reference for the foreign key relationship.
     * 
     * @param userProfile The domain UserProfile
     * @param userTable The UserTable entity for the foreign key relationship
     * @return UserProfileTable entity
     */
    fun toEntity(userProfile: UserProfile, userTable: UserTable): UserProfileTable {
        return UserProfileTable(
            id = userProfile.id,
            user = userTable,
            displayName = userProfile.displayName,
            avatarUrl = userProfile.avatarUrl,
            createdAt = userProfile.createdAt,
            updatedAt = userProfile.updatedAt
        )
    }
    
    /**
     * Converts a persistence UserProfileTable to a domain UserProfile.
     * 
     * @param entity The UserProfileTable entity
     * @return UserProfile domain model
     */
    fun toDomain(entity: UserProfileTable): UserProfile {
        return UserProfile(
            id = entity.id,
            userId = entity.user.id,
            displayName = entity.displayName,
            avatarUrl = entity.avatarUrl,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
    
    /**
     * Updates an existing UserProfileTable with values from a domain UserProfile.
     * 
     * @param entity The existing UserProfileTable entity to update
     * @param userProfile The UserProfile with new values
     * @return The updated UserProfileTable entity
     */
    fun updateEntity(entity: UserProfileTable, userProfile: UserProfile): UserProfileTable {
        entity.displayName = userProfile.displayName
        entity.avatarUrl = userProfile.avatarUrl
        entity.updatedAt = userProfile.updatedAt
        return entity
    }
}