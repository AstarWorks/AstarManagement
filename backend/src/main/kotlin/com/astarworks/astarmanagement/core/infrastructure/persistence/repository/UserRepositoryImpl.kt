package com.astarworks.astarmanagement.core.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.domain.model.User
import com.astarworks.astarmanagement.core.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.infrastructure.persistence.entity.UserEntity
import com.astarworks.astarmanagement.core.infrastructure.persistence.mapper.UserMapper
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Implementation of UserRepository using Spring Data JPA.
 * Simplified implementation focusing on business data operations.
 * No user provisioning or synchronization logic.
 */
@Component
@Transactional
class UserRepositoryImpl(
    private val jpaUserRepository: JpaUserRepository,
    private val userMapper: UserMapper
) : UserRepository {
    
    override fun save(user: User): User {
        val entity = userMapper.toEntity(user)
        val savedEntity = jpaUserRepository.save(entity)
        return userMapper.toDomain(savedEntity)
    }
    
    override fun findById(id: UUID): User? {
        return jpaUserRepository.findById(id)
            .map { userMapper.toDomain(it) }
            .orElse(null)
    }
    
    @Transactional(readOnly = true)
    override fun findByAuth0Sub(auth0Sub: String): User? {
        return jpaUserRepository.findByAuth0Sub(auth0Sub)
            ?.let { userMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByEmail(email: String): User? {
        return jpaUserRepository.findByEmail(email)
            ?.let { userMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun existsByEmail(email: String): Boolean {
        return jpaUserRepository.existsByEmail(email)
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantId(tenantId: UUID): List<User> {
        return jpaUserRepository.findByTenantId(tenantId)
            .map { userMapper.toDomain(it) }
    }
    
    override fun deleteById(id: UUID) {
        jpaUserRepository.deleteById(id)
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<User> {
        return jpaUserRepository.findAll()
            .map { userMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jpaUserRepository.count()
    }
}