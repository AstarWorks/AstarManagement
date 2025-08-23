package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper.DynamicRoleMapper
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.repository.JpaTenantRepository
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Implementation of DynamicRoleRepository using Spring Data JPA.
 * Handles Discord-style dynamic role system persistence operations.
 * Uses Row Level Security (RLS) for multi-tenant data isolation.
 */
@Component
@Transactional
class DynamicRoleRepositoryImpl(
    private val jpaDynamicRoleRepository: JpaDynamicRoleRepository,
    private val jpaTenantRepository: JpaTenantRepository,
    private val dynamicRoleMapper: DynamicRoleMapper
) : DynamicRoleRepository {
    
    override fun save(role: DynamicRole): DynamicRole {
        // Get TenantTable entity for foreign key relationship (null for system roles)
        val tenantTable = role.tenantId?.let { tenantId ->
            jpaTenantRepository.findById(tenantId)
                .orElseThrow {
                    IllegalArgumentException("Tenant not found with id: $tenantId")
                }
        }
        
        // Check if role already exists by ID
        val existingRole = jpaDynamicRoleRepository.findById(role.id)
        
        val savedEntity = if (existingRole.isPresent) {
            // Update existing role
            val updatedEntity = dynamicRoleMapper.updateEntity(existingRole.get(), role)
            jpaDynamicRoleRepository.save(updatedEntity)
        } else {
            // Create new role
            val entity = dynamicRoleMapper.toEntity(role, tenantTable)
            jpaDynamicRoleRepository.save(entity)
        }
        
        return dynamicRoleMapper.toDomain(savedEntity)
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: UUID): DynamicRole? {
        return jpaDynamicRoleRepository.findById(id)
            .map { dynamicRoleMapper.toDomain(it) }
            .orElse(null)
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<DynamicRole> {
        return jpaDynamicRoleRepository.findAll()
            .map { dynamicRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantId(tenantId: UUID): List<DynamicRole> {
        return jpaDynamicRoleRepository.findByTenantId(tenantId)
            .map { dynamicRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findSystemRoles(): List<DynamicRole> {
        return jpaDynamicRoleRepository.findByTenantIsNull()
            .map { dynamicRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantIdAndName(tenantId: UUID?, name: String): DynamicRole? {
        val tenantTable = tenantId?.let { id ->
            jpaTenantRepository.findById(id).orElse(null)
        }
        
        return jpaDynamicRoleRepository.findByTenantAndName(tenantTable, name)
            ?.let { dynamicRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun existsByTenantIdAndName(tenantId: UUID?, name: String): Boolean {
        val tenantTable = tenantId?.let { id ->
            jpaTenantRepository.findById(id).orElse(null)
        }
        
        return jpaDynamicRoleRepository.existsByTenantAndName(tenantTable, name)
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantIdOrderByPositionDesc(tenantId: UUID): List<DynamicRole> {
        return jpaDynamicRoleRepository.findByTenantIdOrderByPositionDesc(tenantId)
            .map { dynamicRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findSystemRolesOrderByPositionDesc(): List<DynamicRole> {
        return jpaDynamicRoleRepository.findByTenantIsNullOrderByPositionDesc()
            .map { dynamicRoleMapper.toDomain(it) }
    }
    
    override fun deleteById(id: UUID) {
        jpaDynamicRoleRepository.deleteById(id)
    }
    
    override fun deleteByTenantId(tenantId: UUID) {
        val tenantTable = jpaTenantRepository.findById(tenantId)
            .orElseThrow {
                IllegalArgumentException("Tenant not found with id: $tenantId")
            }
        
        jpaDynamicRoleRepository.deleteByTenant(tenantTable)
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jpaDynamicRoleRepository.count()
    }
    
    @Transactional(readOnly = true)
    override fun countByTenantId(tenantId: UUID): Long {
        return jpaDynamicRoleRepository.countByTenantId(tenantId)
    }
    
    @Transactional(readOnly = true)
    override fun countSystemRoles(): Long {
        return jpaDynamicRoleRepository.countByTenantIsNull()
    }
}