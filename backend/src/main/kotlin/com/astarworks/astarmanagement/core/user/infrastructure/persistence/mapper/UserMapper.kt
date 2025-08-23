package com.astarworks.astarmanagement.core.user.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between User domain model and UserTable entity.
 * Handles Auth0-only user mapping.
 */
@Component
class UserMapper {
    
    /**
     * Converts a domain User to a persistence UserTable.
     */
    fun toEntity(user: User): UserTable {
        return UserTable(
            id = user.id,
            auth0Sub = user.auth0Sub,
            email = user.email,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt
        )
    }
    
    /**
     * Converts a persistence UserTable to a domain User.
     */
    fun toDomain(entity: UserTable): User {
        return User(
            id = entity.id,
            auth0Sub = entity.auth0Sub,
            email = entity.email,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
    
    /**
     * Updates an existing UserTable with values from a domain User.
     */
    fun updateEntity(entity: UserTable, user: User): UserTable {
        entity.auth0Sub = user.auth0Sub
        entity.email = user.email
        entity.updatedAt = user.updatedAt
        return entity
    }
}