package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper.SpringDataJdbcRoleMapper
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Implementation of DynamicRoleRepository using Spring Data JDBC.
 * Handles Discord-style dynamic role system persistence operations.
 * Uses Row Level Security (RLS) for multi-tenant data isolation.
 */
@Component
class DynamicRoleRepositoryImpl(
    private val jdbcRoleRepository: SpringDataJdbcRoleRepository,
    private val roleMapper: SpringDataJdbcRoleMapper
) : DynamicRoleRepository {
    
    @Transactional
    override fun save(role: DynamicRole): DynamicRole {
        // Check if the role already exists to handle version properly
        val existingEntity = jdbcRoleRepository.findById(role.id).orElse(null)
        
        return if (existingEntity != null) {
            // For updates: preserve version and update fields
            val updatedEntity = existingEntity.copy(
                tenantId = role.tenantId,
                name = role.name,
                displayName = role.displayName,
                color = role.color,
                position = role.position,
                isSystem = role.isSystem,
                createdAt = role.createdAt,
                updatedAt = role.updatedAt
            )
            val savedEntity = jdbcRoleRepository.save(updatedEntity)
            roleMapper.toDomain(savedEntity)
        } else {
            // For new entities: create from domain model
            val entity = roleMapper.toTable(role)
            val savedEntity = jdbcRoleRepository.save(entity)
            roleMapper.toDomain(savedEntity)
        }
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: RoleId): DynamicRole? {
        return jdbcRoleRepository.findById(id)
            .map { roleMapper.toDomain(it) }
            .orElse(null)
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<DynamicRole> {
        return jdbcRoleRepository.findAll()
            .map { roleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantId(tenantId: TenantId): List<DynamicRole> {
        return jdbcRoleRepository.findByTenantId(tenantId)
            .map { roleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findSystemRoles(): List<DynamicRole> {
        return jdbcRoleRepository.findSystemRoles()
            .map { roleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantIdAndName(tenantId: TenantId?, name: String): DynamicRole? {
        return if (tenantId != null) {
            jdbcRoleRepository.findByTenantIdAndName(tenantId, name)
        } else {
            jdbcRoleRepository.findSystemRoleByName(name)
        }?.let { roleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun existsByTenantIdAndName(tenantId: TenantId?, name: String): Boolean {
        return if (tenantId != null) {
            jdbcRoleRepository.existsByTenantIdAndName(tenantId, name)
        } else {
            jdbcRoleRepository.existsSystemRoleByName(name)
        }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantIdOrderByPositionDesc(tenantId: TenantId): List<DynamicRole> {
        return jdbcRoleRepository.findByTenantIdOrderByPositionDesc(tenantId)
            .map { roleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findSystemRolesOrderByPositionDesc(): List<DynamicRole> {
        return jdbcRoleRepository.findSystemRolesOrderByPositionDesc()
            .map { roleMapper.toDomain(it) }
    }
    
    @Transactional
    override fun deleteById(id: RoleId) {
        jdbcRoleRepository.deleteById(id)
    }
    
    @Transactional
    override fun deleteByTenantId(tenantId: TenantId) {
        jdbcRoleRepository.deleteByTenantId(tenantId)
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jdbcRoleRepository.count()
    }
    
    @Transactional(readOnly = true)
    override fun countByTenantId(tenantId: TenantId): Long {
        return jdbcRoleRepository.countByTenantId(tenantId)
    }
    
    @Transactional(readOnly = true)
    override fun countSystemRoles(): Long {
        return jdbcRoleRepository.countSystemRoles()
    }
}