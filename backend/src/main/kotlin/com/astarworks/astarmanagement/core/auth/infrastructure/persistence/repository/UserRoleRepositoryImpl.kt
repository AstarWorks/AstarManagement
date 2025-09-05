package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.domain.repository.UserRoleRepository
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper.SpringDataJdbcUserRoleMapper
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserRoleId
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Implementation of UserRoleRepository using Spring Data JDBC.
 * Handles role assignments to users within tenant context.
 * Uses Row Level Security (RLS) for multi-tenant data isolation.
 */
@Component
class UserRoleRepositoryImpl(
    private val jdbcUserRoleRepository: SpringDataJdbcUserRoleRepository,
    private val userRoleMapper: SpringDataJdbcUserRoleMapper
) : UserRoleRepository {
    
    @Transactional
    override fun save(userRole: UserRole): UserRole {
        // Check if the user role already exists to handle version properly
        val existingEntity = jdbcUserRoleRepository.findByTenantUserIdAndRoleId(
            userRole.tenantUserId,
            userRole.roleId
        )
        
        return if (existingEntity != null) {
            // For updates: preserve version and update fields
            val updatedEntity = existingEntity.copy(
                assignedAt = userRole.assignedAt,
                assignedBy = userRole.assignedBy
            )
            val savedEntity = jdbcUserRoleRepository.save(updatedEntity)
            userRoleMapper.toDomain(savedEntity)
        } else {
            // For new entities: create from domain model
            val entity = userRoleMapper.toTable(userRole)
            val savedEntity = jdbcUserRoleRepository.save(entity)
            userRoleMapper.toDomain(savedEntity)
        }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantUserIdAndRoleId(tenantUserId: UUID, roleId: UUID): UserRole? {
        return jdbcUserRoleRepository.findByTenantUserIdAndRoleId(
            TenantMembershipId(tenantUserId),
            RoleId(roleId)
        )?.let { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<UserRole> {
        return jdbcUserRoleRepository.findAll()
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantUserId(tenantUserId: UUID): List<UserRole> {
        return jdbcUserRoleRepository.findByTenantUserId(TenantMembershipId(tenantUserId))
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByRoleId(roleId: UUID): List<UserRole> {
        return jdbcUserRoleRepository.findByRoleId(RoleId(roleId))
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByAssignedBy(assignedBy: UUID): List<UserRole> {
        return jdbcUserRoleRepository.findByAssignedBy(UserId(assignedBy))
            .map { userRoleMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findSystemAssigned(): List<UserRole> {
        // Find all user roles where assignedBy is null
        return jdbcUserRoleRepository.findAll()
            .map { userRoleMapper.toDomain(it) }
            .filter { it.assignedBy == null }
    }
    
    @Transactional(readOnly = true)
    override fun findAssignedWithin(withinDays: Long): List<UserRole> {
        val cutoffDate = Instant.now().minus(java.time.Duration.ofDays(withinDays))
        return jdbcUserRoleRepository.findAll()
            .map { userRoleMapper.toDomain(it) }
            .filter { it.assignedAt.isAfter(cutoffDate) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantUserIdAndAssignedBy(tenantUserId: UUID, assignedBy: UUID): List<UserRole> {
        return jdbcUserRoleRepository.findByTenantUserId(TenantMembershipId(tenantUserId))
            .map { userRoleMapper.toDomain(it) }
            .filter { it.assignedBy == UserId(assignedBy) }
    }
    
    @Transactional(readOnly = true)
    override fun findByRoleIdAndAssignedBy(roleId: UUID, assignedBy: UUID): List<UserRole> {
        return jdbcUserRoleRepository.findByRoleId(RoleId(roleId))
            .map { userRoleMapper.toDomain(it) }
            .filter { it.assignedBy == UserId(assignedBy) }
    }
    
    @Transactional(readOnly = true)
    override fun existsByTenantUserIdAndRoleId(tenantUserId: UUID, roleId: UUID): Boolean {
        return jdbcUserRoleRepository.existsByTenantUserIdAndRoleId(
            TenantMembershipId(tenantUserId),
            RoleId(roleId)
        )
    }
    
    @Transactional(readOnly = true)
    override fun existsByTenantUserId(tenantUserId: UUID): Boolean {
        return jdbcUserRoleRepository.countByTenantUserId(TenantMembershipId(tenantUserId)) > 0
    }
    
    @Transactional(readOnly = true)
    override fun existsByRoleId(roleId: UUID): Boolean {
        return jdbcUserRoleRepository.countByRoleId(RoleId(roleId)) > 0
    }
    
    @Transactional
    override fun deleteByTenantUserIdAndRoleId(tenantUserId: UUID, roleId: UUID) {
        jdbcUserRoleRepository.deleteByTenantUserIdAndRoleId(
            TenantMembershipId(tenantUserId),
            RoleId(roleId)
        )
    }
    
    @Transactional
    override fun deleteByTenantUserId(tenantUserId: UUID) {
        jdbcUserRoleRepository.deleteByTenantUserId(TenantMembershipId(tenantUserId))
    }
    
    @Transactional
    override fun deleteByRoleId(roleId: UUID) {
        jdbcUserRoleRepository.deleteByRoleId(RoleId(roleId))
    }
    
    @Transactional
    override fun deleteByAssignedBy(assignedBy: UUID) {
        // Delete all roles assigned by a specific user
        jdbcUserRoleRepository.findByAssignedBy(UserId(assignedBy))
            .forEach { jdbcUserRoleRepository.delete(it) }
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jdbcUserRoleRepository.count()
    }
    
    @Transactional(readOnly = true)
    override fun countByTenantUserId(tenantUserId: UUID): Long {
        return jdbcUserRoleRepository.countByTenantUserId(TenantMembershipId(tenantUserId))
    }
    
    @Transactional(readOnly = true)
    override fun countByRoleId(roleId: UUID): Long {
        return jdbcUserRoleRepository.countByRoleId(RoleId(roleId))
    }
    
    @Transactional(readOnly = true)
    override fun countByAssignedBy(assignedBy: UUID): Long {
        return jdbcUserRoleRepository.findByAssignedBy(UserId(assignedBy)).size.toLong()
    }
    
    @Transactional(readOnly = true)
    override fun countSystemAssigned(): Long {
        // Count all user roles where assignedBy is null
        return jdbcUserRoleRepository.findAll()
            .map { userRoleMapper.toDomain(it) }
            .count { it.assignedBy == null }.toLong()
    }
}