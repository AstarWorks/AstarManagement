package com.astarworks.astarmanagement.core.user.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.user.domain.repository.UserProfileRepository
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.mapper.UserProfileMapper
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Implementation of UserProfileRepository using Spring Data JPA.
 * Handles user profile information persistence operations.
 * Uses Row Level Security (RLS) for multi-tenant data isolation.
 */
@Component
@Transactional
class UserProfileRepositoryImpl(
    private val jpaUserProfileRepository: JpaUserProfileRepository,
    private val jpaUserRepository: JpaUserRepository,
    private val userProfileMapper: UserProfileMapper
) : UserProfileRepository {
    
    override fun save(userProfile: UserProfile): UserProfile {
        // Get the UserTable entity for the foreign key relationship
        val userTable = jpaUserRepository.findById(userProfile.userId)
            .orElseThrow { 
                IllegalArgumentException("User not found with id: ${userProfile.userId}") 
            }
        
        // Check if profile already exists
        val existingProfile = jpaUserProfileRepository.findByUserId(userProfile.userId)
        
        val savedEntity = if (existingProfile != null) {
            // Update existing profile
            val updatedEntity = userProfileMapper.updateEntity(existingProfile, userProfile)
            jpaUserProfileRepository.save(updatedEntity)
        } else {
            // Create new profile
            val entity = userProfileMapper.toEntity(userProfile, userTable)
            jpaUserProfileRepository.save(entity)
        }
        
        return userProfileMapper.toDomain(savedEntity)
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: UUID): UserProfile? {
        return jpaUserProfileRepository.findById(id)
            .map { userProfileMapper.toDomain(it) }
            .orElse(null)
    }
    
    @Transactional(readOnly = true)
    override fun findByUserId(userId: UUID): UserProfile? {
        return jpaUserProfileRepository.findByUserId(userId)
            ?.let { userProfileMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun existsByUserId(userId: UUID): Boolean {
        return jpaUserProfileRepository.existsByUserId(userId)
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<UserProfile> {
        return jpaUserProfileRepository.findAll()
            .map { userProfileMapper.toDomain(it) }
    }
    
    override fun deleteById(id: UUID) {
        jpaUserProfileRepository.deleteById(id)
    }
    
    override fun deleteByUserId(userId: UUID) {
        jpaUserProfileRepository.deleteByUserId(userId)
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jpaUserProfileRepository.count()
    }
}