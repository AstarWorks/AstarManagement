package com.astarworks.astarmanagement.core.user.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.SpringDataJdbcUserTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between User domain model and SpringDataJdbcUserTable entity.
 * Handles bidirectional conversion for Spring Data JDBC operations.
 */
@Component
class SpringDataJdbcUserMapper {
    
    /**
     * Converts from domain model to Spring Data JDBC table entity.
     */
    fun toTable(user: User): SpringDataJdbcUserTable {
        return SpringDataJdbcUserTable(
            id = user.id,
            auth0Sub = user.auth0Sub,
            email = user.email,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt
        )
    }
    
    /**
     * Converts from Spring Data JDBC table entity to domain model.
     */
    fun toDomain(table: SpringDataJdbcUserTable): User {
        return User(
            id = table.id,
            auth0Sub = table.auth0Sub,
            email = table.email,
            createdAt = table.createdAt,
            updatedAt = table.updatedAt
        )
    }
    
    /**
     * Converts a list of table entities to domain models.
     */
    fun toDomainList(tables: List<SpringDataJdbcUserTable>): List<User> {
        return tables.map { toDomain(it) }
    }
    
    /**
     * Converts a list of domain models to table entities.
     */
    fun toTableList(users: List<User>): List<SpringDataJdbcUserTable> {
        return users.map { toTable(it) }
    }
}