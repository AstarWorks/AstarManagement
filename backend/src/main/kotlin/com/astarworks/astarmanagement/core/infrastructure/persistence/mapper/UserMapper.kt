package com.astarworks.astarmanagement.core.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.domain.model.User
import com.astarworks.astarmanagement.core.infrastructure.persistence.entity.UserEntity
import org.springframework.stereotype.Component

/**
 * Mapper for converting between User domain model and UserEntity.
 * Simplified mapping without synchronization fields.
 */
@Component
class UserMapper {
    
    /**
     * Converts a domain User to a persistence UserEntity.
     */
    fun toEntity(user: User): UserEntity {
        return UserEntity(
            id = user.id,
            auth0Sub = user.auth0Sub,
            email = user.email,
            name = user.name,
            passwordHash = user.passwordHash,
            profilePictureUrl = user.profilePictureUrl,
            // No lastAuth0SyncAt - removed synchronization
            role = user.role,
            tenantId = user.tenantId,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt
        )
    }
    
    /**
     * Converts a persistence UserEntity to a domain User.
     */
    fun toDomain(entity: UserEntity): User {
        return User(
            id = entity.id,
            auth0Sub = entity.auth0Sub,
            email = entity.email,
            name = entity.name,
            passwordHash = entity.passwordHash,
            profilePictureUrl = entity.profilePictureUrl,
            // No lastAuth0SyncAt - removed synchronization
            role = entity.role,
            tenantId = entity.tenantId,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
    
    /**
     * Updates an existing UserEntity with values from a domain User.
     */
    fun updateEntity(entity: UserEntity, user: User): UserEntity {
        entity.auth0Sub = user.auth0Sub
        entity.email = user.email
        entity.name = user.name
        entity.passwordHash = user.passwordHash
        entity.profilePictureUrl = user.profilePictureUrl
        // No lastAuth0SyncAt - removed synchronization
        entity.role = user.role
        entity.tenantId = user.tenantId
        entity.updatedAt = user.updatedAt
        return entity
    }
}