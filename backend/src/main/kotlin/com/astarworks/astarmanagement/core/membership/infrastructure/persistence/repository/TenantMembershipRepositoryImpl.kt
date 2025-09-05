package com.astarworks.astarmanagement.core.membership.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.membership.infrastructure.persistence.mapper.SpringDataJdbcTenantMembershipMapper
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

/**
 * Implementation of TenantMembershipRepository using Spring Data JDBC.
 * 
 * This is the unified implementation that replaces the previously duplicated
 * TenantUserRepository implementations in core.user and core.tenant packages.
 * 
 * Uses the existing tenant_users table with Spring Data JDBC for persistence.
 */
@Component
class TenantMembershipRepositoryImpl(
    private val jdbcRepository: SpringDataJdbcTenantMembershipRepository,
    private val mapper: SpringDataJdbcTenantMembershipMapper
) : TenantMembershipRepository {
    
    @Transactional
    override fun save(membership: TenantMembership): TenantMembership {
        val entity = mapper.toTable(membership)
        val saved = jdbcRepository.save(entity)
        return mapper.toDomain(saved)
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: TenantMembershipId): TenantMembership? {
        return jdbcRepository.findById(id)
            .map { mapper.toDomain(it) }
            .orElse(null)
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<TenantMembership> {
        return jdbcRepository.findAll()
            .map { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByUserIdAndTenantId(userId: UserId, tenantId: TenantId): TenantMembership? {
        return jdbcRepository.findByTenantIdAndUserId(tenantId, userId)
            ?.let { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByUserId(userId: UserId): List<TenantMembership> {
        return jdbcRepository.findByUserId(userId)
            .map { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findActiveByUserId(userId: UserId): List<TenantMembership> {
        return jdbcRepository.findByUserIdAndIsActiveTrue(userId)
            .map { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantId(tenantId: TenantId): List<TenantMembership> {
        return jdbcRepository.findByTenantId(tenantId)
            .map { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findActiveByTenantId(tenantId: TenantId): List<TenantMembership> {
        return jdbcRepository.findByTenantIdAndIsActiveTrue(tenantId)
            .map { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun existsByUserIdAndTenantId(userId: UserId, tenantId: TenantId): Boolean {
        return jdbcRepository.existsByTenantIdAndUserId(tenantId, userId)
    }
    
    @Transactional(readOnly = true)
    override fun existsActiveByUserIdAndTenantId(userId: UserId, tenantId: TenantId): Boolean {
        return jdbcRepository.existsByTenantIdAndUserIdAndIsActiveTrue(tenantId, userId)
    }
    
    @Transactional
    override fun updateLastAccessedAt(id: TenantMembershipId) {
        jdbcRepository.findById(id).ifPresent { membership ->
            val updated = membership.copy(lastAccessedAt = Instant.now())
            jdbcRepository.save(updated)
        }
    }
    
    @Transactional
    override fun deleteById(id: TenantMembershipId) {
        jdbcRepository.deleteById(id)
    }
    
    @Transactional
    override fun deleteByTenantId(tenantId: TenantId) {
        jdbcRepository.deleteByTenantId(tenantId)
    }
    
    @Transactional
    override fun deleteByUserId(userId: UserId) {
        jdbcRepository.deleteByUserId(userId)
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jdbcRepository.count()
    }
    
    @Transactional(readOnly = true)
    override fun countByTenantId(tenantId: TenantId): Long {
        return jdbcRepository.countByTenantId(tenantId)
    }
    
    @Transactional(readOnly = true)
    override fun countActiveByTenantId(tenantId: TenantId): Long {
        return jdbcRepository.countByTenantIdAndIsActiveTrue(tenantId)
    }
    
    @Transactional(readOnly = true)
    override fun countByUserId(userId: UserId): Long {
        return jdbcRepository.countByUserId(userId)
    }
    
    @Transactional(readOnly = true)
    override fun countActiveByUserId(userId: UserId): Long {
        return jdbcRepository.countByUserIdAndIsActiveTrue(userId)
    }
}