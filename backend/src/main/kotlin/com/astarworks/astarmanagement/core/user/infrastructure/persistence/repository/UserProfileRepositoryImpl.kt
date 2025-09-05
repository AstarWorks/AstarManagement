package com.astarworks.astarmanagement.core.user.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.user.domain.repository.UserProfileRepository
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.mapper.SpringDataJdbcUserProfileMapper
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserProfileId
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Implementation of UserProfileRepository using Spring Data JDBC.
 * Handles user profile information persistence operations.
 * Uses Row Level Security (RLS) for multi-tenant data isolation.
 */
@Component
@Transactional
class UserProfileRepositoryImpl(
    private val springDataJdbcUserProfileRepository: SpringDataJdbcUserProfileRepository,
    private val mapper: SpringDataJdbcUserProfileMapper
) : UserProfileRepository {
    
    override fun save(userProfile: UserProfile): UserProfile {
        // Check if the user profile already exists to handle version properly
        val existingEntity = springDataJdbcUserProfileRepository.findByUserId(userProfile.userId)
        
        return if (existingEntity != null) {
            // For updates: preserve version and update fields
            val updatedEntity = existingEntity.copy(
                userId = userProfile.userId,
                displayName = userProfile.displayName,
                avatarUrl = userProfile.avatarUrl,
                updatedAt = userProfile.updatedAt
            )
            val savedEntity = springDataJdbcUserProfileRepository.save(updatedEntity)
            mapper.toDomain(savedEntity)
        } else {
            // For new entities: create from domain model
            val tableEntity = mapper.toTable(userProfile)
            val savedEntity = springDataJdbcUserProfileRepository.save(tableEntity)
            mapper.toDomain(savedEntity)
        }
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: UserProfileId): UserProfile? {
        return springDataJdbcUserProfileRepository.findByIdOrNull(id)?.let { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByUserId(userId: UserId): UserProfile? {
        return springDataJdbcUserProfileRepository.findByUserId(userId)?.let { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun existsByUserId(userId: UserId): Boolean {
        return springDataJdbcUserProfileRepository.existsByUserId(userId)
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<UserProfile> {
        return mapper.toDomainList(springDataJdbcUserProfileRepository.findAll())
    }
    
    override fun deleteById(id: UserProfileId) {
        springDataJdbcUserProfileRepository.deleteById(id)
    }
    
    override fun deleteByUserId(userId: UserId) {
        springDataJdbcUserProfileRepository.deleteByUserId(userId)
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return springDataJdbcUserProfileRepository.count()
    }
}