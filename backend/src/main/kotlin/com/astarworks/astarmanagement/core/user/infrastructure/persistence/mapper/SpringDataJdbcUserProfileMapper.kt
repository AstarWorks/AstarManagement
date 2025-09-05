package com.astarworks.astarmanagement.core.user.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.SpringDataJdbcUserProfileTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between UserProfile domain model and SpringDataJdbcUserProfileTable entity.
 * Handles bidirectional conversion for Spring Data JDBC operations.
 */
@Component
class SpringDataJdbcUserProfileMapper {
    
    /**
     * Converts from domain model to Spring Data JDBC table entity.
     */
    fun toTable(userProfile: UserProfile): SpringDataJdbcUserProfileTable {
        return SpringDataJdbcUserProfileTable(
            id = userProfile.id,
            version = null,  // null indicates new entity for Spring Data JDBC
            userId = userProfile.userId,
            displayName = userProfile.displayName,
            avatarUrl = userProfile.avatarUrl,
            createdAt = userProfile.createdAt,
            updatedAt = userProfile.updatedAt
        )
    }
    
    /**
     * Converts from Spring Data JDBC table entity to domain model.
     */
    fun toDomain(table: SpringDataJdbcUserProfileTable): UserProfile {
        return UserProfile(
            id = table.id,
            userId = table.userId,
            displayName = table.displayName,
            avatarUrl = table.avatarUrl,
            createdAt = table.createdAt,
            updatedAt = table.updatedAt
        )
    }
    
    /**
     * Converts a list of table entities to domain models.
     */
    fun toDomainList(tables: List<SpringDataJdbcUserProfileTable>): List<UserProfile> {
        return tables.map { toDomain(it) }
    }
    
    /**
     * Converts a list of domain models to table entities.
     */
    fun toTableList(userProfiles: List<UserProfile>): List<SpringDataJdbcUserProfileTable> {
        return userProfiles.map { toTable(it) }
    }
}