package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.domain.repository.UserRoleRepository
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper.UserRoleMapper
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.repository.JpaTenantUserRepository
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository.JpaDynamicRoleRepository
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.repository.JpaUserRepository
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.*

/**
 * Implementation of UserRoleRepository using Spring Data JPA.
 * Handles role assignments to users within tenant context with composite key operations.
 * Uses Row Level Security (RLS) for multi-tenant data isolation.
 */
@Component
@Transactional
class UserRoleRepositoryImpl(
    private val jpaUserRoleRepository: JpaUserRoleRepository,
    private val jpaTenantUserRepository: JpaTenantUserRepository,
    private val jpaDynamicRoleRepository: JpaDynamicRoleRepository,
    private val jpaUserRepository: JpaUserRepository,
    private val userRoleMapper: UserRoleMapper
) : UserRoleRepository {
    
    override fun save(userRole: UserRole): UserRole {
        // Get TenantUserTable entity for composite key relationship
        val tenantUserTable = jpaTenantUserRepository.findById(userRole.tenantUserId)
            .orElseThrow {
                IllegalArgumentException("TenantUser not found with id: ${userRole.tenantUserId}")
            }
        
        // Get RoleTable entity for composite key relationship
        val roleTable = jpaDynamicRoleRepository.findById(userRole.roleId)
            .orElseThrow {
                IllegalArgumentException("Role not found with id: ${userRole.roleId}")
            }
        
        // Get UserTable entity for assignedBy relationship (nullable)
        val assignedByUserTable = userRole.assignedBy?.let { assignedById ->
            jpaUserRepository.findById(assignedById)
                .orElseThrow {
                    IllegalArgumentException("AssignedBy user not found with id: $assignedById")
                }
        }
        
        // Check if user role already exists by composite key
        val existingUserRole = jpaUserRoleRepository.findByTenantUserAndRole(tenantUserTable, roleTable)
        
        val savedEntity = if (existingUserRole != null) {
            // Update existing user role
            val updatedEntity = userRoleMapper.updateEntity(existingUserRole, userRole, assignedByUserTable)
            jpaUserRoleRepository.save(updatedEntity)
        } else {
            // Create new user role
            val entity = userRoleMapper.toEntity(userRole, tenantUserTable, roleTable, assignedByUserTable)
            jpaUserRoleRepository.save(entity)
        }
        
        return userRoleMapper.toDomain(savedEntity)
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantUserIdAndRoleId(tenantUserId: UUID, roleId: UUID): UserRole? {
        return jpaUserRoleRepository.findByTenantUserIdAndRoleId(tenantUserId, roleId)
            ?.let { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<UserRole> {
        return jpaUserRoleRepository.findAll()
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantUserId(tenantUserId: UUID): List<UserRole> {
        return jpaUserRoleRepository.findByTenantUserId(tenantUserId)
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByRoleId(roleId: UUID): List<UserRole> {
        return jpaUserRoleRepository.findByRoleId(roleId)
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByAssignedBy(assignedBy: UUID): List<UserRole> {
        return jpaUserRoleRepository.findByAssignedById(assignedBy)
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findSystemAssigned(): List<UserRole> {
        return jpaUserRoleRepository.findSystemAssignedRoles()
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findAssignedWithin(withinDays: Long): List<UserRole> {
        val cutoffDate = LocalDateTime.now().minusDays(withinDays)
        return jpaUserRoleRepository.findAssignedAfterDate(cutoffDate)
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantUserIdAndAssignedBy(tenantUserId: UUID, assignedBy: UUID): List<UserRole> {
        return jpaUserRoleRepository.findByTenantUserIdAndAssignedById(tenantUserId, assignedBy)
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByRoleIdAndAssignedBy(roleId: UUID, assignedBy: UUID): List<UserRole> {
        return jpaUserRoleRepository.findByRoleIdAndAssignedById(roleId, assignedBy)
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun existsByTenantUserIdAndRoleId(tenantUserId: UUID, roleId: UUID): Boolean {
        return jpaUserRoleRepository.existsByTenantUserIdAndRoleId(tenantUserId, roleId)
    }
    
    @Transactional(readOnly = true)
    override fun existsByTenantUserId(tenantUserId: UUID): Boolean {
        return jpaUserRoleRepository.existsByTenantUserId(tenantUserId)
    }
    
    @Transactional(readOnly = true)
    override fun existsByRoleId(roleId: UUID): Boolean {
        return jpaUserRoleRepository.existsByRoleId(roleId)
    }
    
    override fun deleteByTenantUserIdAndRoleId(tenantUserId: UUID, roleId: UUID) {
        jpaUserRoleRepository.deleteByTenantUserIdAndRoleId(tenantUserId, roleId)
    }
    
    override fun deleteByTenantUserId(tenantUserId: UUID) {
        val tenantUserTable = jpaTenantUserRepository.findById(tenantUserId)
            .orElseThrow {
                IllegalArgumentException("TenantUser not found with id: $tenantUserId")
            }
        
        jpaUserRoleRepository.deleteByTenantUser(tenantUserTable)
    }
    
    override fun deleteByRoleId(roleId: UUID) {
        val roleTable = jpaDynamicRoleRepository.findById(roleId)
            .orElseThrow {
                IllegalArgumentException("Role not found with id: $roleId")
            }
        
        jpaUserRoleRepository.deleteByRole(roleTable)
    }
    
    override fun deleteByAssignedBy(assignedBy: UUID) {
        val userTable = jpaUserRepository.findById(assignedBy)
            .orElseThrow {
                IllegalArgumentException("AssignedBy user not found with id: $assignedBy")
            }
        
        jpaUserRoleRepository.deleteByAssignedBy(userTable)
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jpaUserRoleRepository.count()
    }
    
    @Transactional(readOnly = true)
    override fun countByTenantUserId(tenantUserId: UUID): Long {
        return jpaUserRoleRepository.countByTenantUserId(tenantUserId)
    }
    
    @Transactional(readOnly = true)
    override fun countByRoleId(roleId: UUID): Long {
        return jpaUserRoleRepository.countByRoleId(roleId)
    }
    
    @Transactional(readOnly = true)
    override fun countByAssignedBy(assignedBy: UUID): Long {
        return jpaUserRoleRepository.countByAssignedById(assignedBy)
    }
    
    @Transactional(readOnly = true)
    override fun countSystemAssigned(): Long {
        return jpaUserRoleRepository.countSystemAssignedRoles()
    }
}