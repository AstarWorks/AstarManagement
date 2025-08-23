package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.domain.model.RolePermission
import com.astarworks.astarmanagement.core.auth.domain.repository.RolePermissionRepository
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper.RolePermissionMapper
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.*

/**
 * Implementation of RolePermissionRepository using Spring Data JPA.
 * Handles permission assignments to roles with composite key operations and advanced permission rule matching.
 * Uses Row Level Security (RLS) for multi-tenant data isolation.
 */
@Component
@Transactional
class RolePermissionRepositoryImpl(
    private val jpaRolePermissionRepository: JpaRolePermissionRepository,
    private val jpaDynamicRoleRepository: JpaDynamicRoleRepository,
    private val rolePermissionMapper: RolePermissionMapper
) : RolePermissionRepository {
    
    override fun save(rolePermission: RolePermission): RolePermission {
        // Get RoleTable entity for composite key relationship
        val roleTable = jpaDynamicRoleRepository.findById(rolePermission.roleId)
            .orElseThrow {
                IllegalArgumentException("Role not found with id: ${rolePermission.roleId}")
            }
        
        // Check if role permission already exists by composite key
        val existingRolePermission = jpaRolePermissionRepository.findByRoleAndPermissionRule(roleTable, rolePermission.permissionRule)
        
        val savedEntity = if (existingRolePermission != null) {
            // Update existing role permission (though typically immutable)
            val updatedEntity = rolePermissionMapper.updateEntity(existingRolePermission, rolePermission)
            jpaRolePermissionRepository.save(updatedEntity)
        } else {
            // Create new role permission
            val entity = rolePermissionMapper.toEntity(rolePermission, roleTable)
            jpaRolePermissionRepository.save(entity)
        }
        
        return rolePermissionMapper.toDomain(savedEntity)
    }
    
    @Transactional(readOnly = true)
    override fun findByRoleIdAndPermissionRule(roleId: UUID, permissionRule: String): RolePermission? {
        return jpaRolePermissionRepository.findByRoleIdAndPermissionRule(roleId, permissionRule)
            ?.let { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<RolePermission> {
        return jpaRolePermissionRepository.findAll()
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByRoleId(roleId: UUID): List<RolePermission> {
        return jpaRolePermissionRepository.findByRoleId(roleId)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByPermissionRule(permissionRule: String): List<RolePermission> {
        return jpaRolePermissionRepository.findByPermissionRule(permissionRule)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByPermissionRuleContaining(pattern: String): List<RolePermission> {
        return jpaRolePermissionRepository.findByPermissionRuleContainingPattern(pattern)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findWildcardPermissions(): List<RolePermission> {
        return jpaRolePermissionRepository.findWildcardPermissions()
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findFullAccessPermissions(): List<RolePermission> {
        return jpaRolePermissionRepository.findFullAccessPermissions()
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByResource(resource: String): List<RolePermission> {
        return jpaRolePermissionRepository.findByResource(resource)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByResourceAndAction(resource: String, action: String): List<RolePermission> {
        return jpaRolePermissionRepository.findByResourceAndAction(resource, action)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByResourceAndActionAndScope(resource: String, action: String, scope: String): List<RolePermission> {
        return jpaRolePermissionRepository.findByResourceAndActionAndScope(resource, action, scope)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByScope(scope: String): List<RolePermission> {
        return jpaRolePermissionRepository.findByScope(scope)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findCreatedWithin(withinDays: Long): List<RolePermission> {
        val cutoffDate = LocalDateTime.now().minusDays(withinDays)
        return jpaRolePermissionRepository.findCreatedAfterDate(cutoffDate)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findGrantingAccessTo(resource: String, action: String, scope: String): List<RolePermission> {
        return findAll().filter { rolePermission ->
            rolePermission.grantsAccessTo(resource, action, scope)
        }
    }
    
    @Transactional(readOnly = true)
    override fun existsByRoleIdAndPermissionRule(roleId: UUID, permissionRule: String): Boolean {
        return jpaRolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, permissionRule)
    }
    
    @Transactional(readOnly = true)
    override fun existsByRoleId(roleId: UUID): Boolean {
        return jpaRolePermissionRepository.existsByRoleId(roleId)
    }
    
    @Transactional(readOnly = true)
    override fun existsByPermissionRule(permissionRule: String): Boolean {
        return jpaRolePermissionRepository.existsByPermissionRule(permissionRule)
    }
    
    @Transactional(readOnly = true)
    override fun existsWildcardPermissions(): Boolean {
        return jpaRolePermissionRepository.existsWildcardPermissions()
    }
    
    @Transactional(readOnly = true)
    override fun existsFullAccessPermissions(): Boolean {
        return jpaRolePermissionRepository.existsFullAccessPermissions()
    }
    
    override fun deleteByRoleIdAndPermissionRule(roleId: UUID, permissionRule: String) {
        jpaRolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, permissionRule)
    }
    
    override fun deleteByRoleId(roleId: UUID) {
        val roleTable = jpaDynamicRoleRepository.findById(roleId)
            .orElseThrow {
                IllegalArgumentException("Role not found with id: $roleId")
            }
        
        jpaRolePermissionRepository.deleteByRole(roleTable)
    }
    
    override fun deleteByPermissionRule(permissionRule: String) {
        jpaRolePermissionRepository.deleteByPermissionRule(permissionRule)
    }
    
    override fun deleteWildcardPermissions() {
        jpaRolePermissionRepository.deleteWildcardPermissions()
    }
    
    override fun deleteFullAccessPermissions() {
        jpaRolePermissionRepository.deleteFullAccessPermissions()
    }
    
    override fun deleteByResource(resource: String) {
        jpaRolePermissionRepository.deleteByResource(resource)
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jpaRolePermissionRepository.count()
    }
    
    @Transactional(readOnly = true)
    override fun countByRoleId(roleId: UUID): Long {
        return jpaRolePermissionRepository.countByRoleId(roleId)
    }
    
    @Transactional(readOnly = true)
    override fun countByPermissionRule(permissionRule: String): Long {
        return jpaRolePermissionRepository.countByPermissionRule(permissionRule)
    }
    
    @Transactional(readOnly = true)
    override fun countWildcardPermissions(): Long {
        return jpaRolePermissionRepository.countWildcardPermissions()
    }
    
    @Transactional(readOnly = true)
    override fun countFullAccessPermissions(): Long {
        return jpaRolePermissionRepository.countFullAccessPermissions()
    }
    
    @Transactional(readOnly = true)
    override fun countByResource(resource: String): Long {
        return jpaRolePermissionRepository.countByResource(resource)
    }
    
    @Transactional(readOnly = true)
    override fun countByScope(scope: String): Long {
        return jpaRolePermissionRepository.countByScope(scope)
    }
}