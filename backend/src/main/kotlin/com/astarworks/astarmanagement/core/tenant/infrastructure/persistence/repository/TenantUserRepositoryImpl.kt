package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.tenant.domain.model.TenantUser
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantUserRepository
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.mapper.TenantUserMapper
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.repository.JpaUserRepository
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Implementation of TenantUserRepository using Spring Data JPA.
 * Handles multi-tenant user membership persistence operations.
 * Uses Row Level Security (RLS) for multi-tenant data isolation.
 */
@Component
@Transactional
class TenantUserRepositoryImpl(
    private val jpaTenantUserRepository: JpaTenantUserRepository,
    private val jpaTenantRepository: JpaTenantRepository,
    private val jpaUserRepository: JpaUserRepository,
    private val tenantUserMapper: TenantUserMapper
) : TenantUserRepository {
    
    override fun save(tenantUser: TenantUser): TenantUser {
        // Get TenantTable entity for foreign key relationship
        val tenantTable = jpaTenantRepository.findById(tenantUser.tenantId)
            .orElseThrow {
                IllegalArgumentException("Tenant not found with id: ${tenantUser.tenantId}")
            }
        
        // Get UserTable entity for foreign key relationship
        val userTable = jpaUserRepository.findById(tenantUser.userId)
            .orElseThrow {
                IllegalArgumentException("User not found with id: ${tenantUser.userId}")
            }
        
        // Check if tenant user already exists by ID
        val existingTenantUser = jpaTenantUserRepository.findById(tenantUser.id)
        
        val savedEntity = if (existingTenantUser.isPresent) {
            // Update existing tenant user
            val updatedEntity = tenantUserMapper.updateEntity(existingTenantUser.get(), tenantUser)
            jpaTenantUserRepository.save(updatedEntity)
        } else {
            // Create new tenant user
            val entity = tenantUserMapper.toEntity(tenantUser, tenantTable, userTable)
            jpaTenantUserRepository.save(entity)
        }
        
        return tenantUserMapper.toDomain(savedEntity)
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: UUID): TenantUser? {
        return jpaTenantUserRepository.findById(id)
            .map { tenantUserMapper.toDomain(it) }
            .orElse(null)
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<TenantUser> {
        return jpaTenantUserRepository.findAll()
            .map { tenantUserMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantIdAndUserId(tenantId: UUID, userId: UUID): TenantUser? {
        return jpaTenantUserRepository.findByTenantIdAndUserId(tenantId, userId)
            ?.let { tenantUserMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantId(tenantId: UUID): List<TenantUser> {
        return jpaTenantUserRepository.findByTenantId(tenantId)
            .map { tenantUserMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByUserId(userId: UUID): List<TenantUser> {
        return jpaTenantUserRepository.findByUserId(userId)
            .map { tenantUserMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findActiveByTenantId(tenantId: UUID): List<TenantUser> {
        return jpaTenantUserRepository.findByTenantIdAndIsActive(tenantId, true)
            .map { tenantUserMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findActiveByUserId(userId: UUID): List<TenantUser> {
        return jpaTenantUserRepository.findByUserIdAndIsActive(userId, true)
            .map { tenantUserMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun existsByTenantIdAndUserId(tenantId: UUID, userId: UUID): Boolean {
        return jpaTenantUserRepository.existsByTenantIdAndUserId(tenantId, userId)
    }
    
    @Transactional(readOnly = true)
    override fun existsActiveByTenantIdAndUserId(tenantId: UUID, userId: UUID): Boolean {
        return jpaTenantUserRepository.existsByTenantIdAndUserIdAndIsActive(tenantId, userId, true)
    }
    
    override fun deleteById(id: UUID) {
        jpaTenantUserRepository.deleteById(id)
    }
    
    override fun deleteByTenantId(tenantId: UUID) {
        val tenantTable = jpaTenantRepository.findById(tenantId)
            .orElseThrow {
                IllegalArgumentException("Tenant not found with id: $tenantId")
            }
        
        jpaTenantUserRepository.deleteByTenant(tenantTable)
    }
    
    override fun deleteByUserId(userId: UUID) {
        val userTable = jpaUserRepository.findById(userId)
            .orElseThrow {
                IllegalArgumentException("User not found with id: $userId")
            }
        
        jpaTenantUserRepository.deleteByUser(userTable)
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jpaTenantUserRepository.count()
    }
    
    @Transactional(readOnly = true)
    override fun countByTenantId(tenantId: UUID): Long {
        return jpaTenantUserRepository.countByTenantId(tenantId)
    }
    
    @Transactional(readOnly = true)
    override fun countActiveByTenantId(tenantId: UUID): Long {
        return jpaTenantUserRepository.countByTenantIdAndIsActive(tenantId, true)
    }
    
    @Transactional(readOnly = true)
    override fun countByUserId(userId: UUID): Long {
        return jpaTenantUserRepository.countByUserId(userId)
    }
    
    @Transactional(readOnly = true)
    override fun countActiveByUserId(userId: UUID): Long {
        return jpaTenantUserRepository.countByUserIdAndIsActive(userId, true)
    }
}