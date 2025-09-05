package com.astarworks.astarmanagement.core.user.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.mapper.SpringDataJdbcUserMapper
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Implementation of UserRepository using Spring Data JDBC.
 * Simplified implementation focusing on business data operations.
 * No user provisioning or synchronization logic.
 */
@Component
class UserRepositoryImpl(
    private val springDataJdbcUserRepository: SpringDataJdbcUserRepository,
    private val mapper: SpringDataJdbcUserMapper
) : UserRepository {
    
    @Transactional
    override fun save(user: User): User {
        // Check if the user already exists to handle version properly
        val existingEntity = springDataJdbcUserRepository.findByIdOrNull(user.id)
        
        return if (existingEntity != null) {
            // For updates: preserve version and update fields
            val updatedEntity = existingEntity.copy(
                auth0Sub = user.auth0Sub,
                email = user.email,
                createdAt = user.createdAt,
                updatedAt = user.updatedAt
            )
            val savedEntity = springDataJdbcUserRepository.save(updatedEntity)
            mapper.toDomain(savedEntity)
        } else {
            // For new entities: create from domain model
            val tableEntity = mapper.toTable(user)
            val savedEntity = springDataJdbcUserRepository.save(tableEntity)
            mapper.toDomain(savedEntity)
        }
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: UserId): User? {
        return springDataJdbcUserRepository.findByIdOrNull(id)?.let { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByAuth0Sub(auth0Sub: String): User? {
        return springDataJdbcUserRepository.findByAuth0Sub(auth0Sub)?.let { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByEmail(email: String): User? {
        return springDataJdbcUserRepository.findByEmail(email)?.let { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun existsByEmail(email: String): Boolean {
        return springDataJdbcUserRepository.existsByEmail(email)
    }
    
    @Transactional(readOnly = true)
    override fun existsByAuth0Sub(auth0Sub: String): Boolean {
        return springDataJdbcUserRepository.existsByAuth0Sub(auth0Sub)
    }
    
    @Transactional
    override fun deleteById(id: UserId) {
        springDataJdbcUserRepository.deleteById(id)
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<User> {
        return mapper.toDomainList(springDataJdbcUserRepository.findAll())
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return springDataJdbcUserRepository.count()
    }
}