package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.RolePermissionRepository
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper.SpringDataJdbcRolePermissionMapper
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.RolePermissionId
import com.astarworks.astarmanagement.shared.domain.value.ResourceGroupId
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Implementation of RolePermissionRepository using Spring Data JDBC.
 * Manages role-permission mappings with fine-grained access control.
 * Handles resource-level, group-level, and scope-based permissions.
 */
@Component
class RolePermissionRepositoryImpl(
    private val jdbcRolePermissionRepository: SpringDataJdbcRolePermissionRepository,
    private val rolePermissionMapper: SpringDataJdbcRolePermissionMapper
) : RolePermissionRepository {
    
    @Transactional
    override fun save(rolePermission: RolePermission): RolePermission {
        // Check if the role permission already exists to handle version properly
        val existingEntity = jdbcRolePermissionRepository.findByRoleIdAndPermissionRule(
            rolePermission.roleId, 
            rolePermission.permissionRule.toDatabaseString()
        )
        
        return if (existingEntity != null) {
            // For updates: preserve version and update fields
            val updatedEntity = existingEntity.copy(
                createdAt = rolePermission.createdAt
            )
            val savedEntity = jdbcRolePermissionRepository.save(updatedEntity)
            rolePermissionMapper.toDomain(savedEntity)
        } else {
            // For new entities: create from domain model
            val entity = rolePermissionMapper.toTable(rolePermission)
            val savedEntity = jdbcRolePermissionRepository.save(entity)
            rolePermissionMapper.toDomain(savedEntity)
        }
    }
    
    @Transactional(readOnly = true)
    override fun findByRoleIdAndPermissionRule(roleId: RoleId, permissionRule: PermissionRule): RolePermission? {
        return jdbcRolePermissionRepository.findByRoleIdAndPermissionRule(roleId, permissionRule.toDatabaseString())
            ?.let { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<RolePermission> {
        return jdbcRolePermissionRepository.findAll()
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByRoleId(roleId: RoleId): List<RolePermission> {
        return jdbcRolePermissionRepository.findByRoleId(roleId)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByResourceType(resourceType: ResourceType): List<RolePermission> {
        return jdbcRolePermissionRepository.findByResourceType(resourceType.name.lowercase())
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByAction(action: Action): List<RolePermission> {
        return jdbcRolePermissionRepository.findByAction(action.name.lowercase())
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByScope(scope: Scope): List<RolePermission> {
        return jdbcRolePermissionRepository.findByScope(scope.name.lowercase())
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByResourceTypeAndAction(resourceType: ResourceType, action: Action): List<RolePermission> {
        return jdbcRolePermissionRepository.findByResourceTypeAndAction(
            resourceType.name.lowercase(),
            action.name.lowercase()
        ).map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByResourceTypeAndActionAndScope(
        resourceType: ResourceType,
        action: Action,
        scope: Scope
    ): List<RolePermission> {
        val pattern = "${resourceType.name.lowercase()}.${action.name.lowercase()}.${scope.name.lowercase()}"
        return jdbcRolePermissionRepository.findByPermissionRuleStartingWith(pattern)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findCreatedWithin(withinDays: Long): List<RolePermission> {
        val cutoffDate = Instant.now().minusSeconds(withinDays * 24 * 60 * 60)
        return jdbcRolePermissionRepository.findByCreatedAtAfter(cutoffDate)
            .map { rolePermissionMapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findGrantingAccessTo(
        resourceType: ResourceType,
        action: Action,
        scope: Scope
    ): List<RolePermission> {
        return findAll().filter { rolePermission ->
            val rule = rolePermission.permissionRule
            rule.resourceType == resourceType &&
                    (rule.action == action || rule.action == Action.MANAGE) &&
                    rule.scope == scope
        }
    }
    
    @Transactional(readOnly = true)
    override fun findByResourceGroupId(groupId: ResourceGroupId): List<RolePermission> {
        // Find all permissions for a specific resource group
        return findAll().filter { permission ->
            permission.permissionRule is PermissionRule.ResourceGroupRule &&
                    (permission.permissionRule as PermissionRule.ResourceGroupRule).groupId == groupId.value
        }
    }
    
    @Transactional(readOnly = true)
    override fun findByResourceId(resourceId: UUID): List<RolePermission> {
        // Find all permissions for a specific resource ID
        return findAll().filter { permission ->
            permission.permissionRule is PermissionRule.ResourceIdRule &&
                    (permission.permissionRule as PermissionRule.ResourceIdRule).resourceId == resourceId
        }
    }
    
    @Transactional(readOnly = true)
    override fun existsByRoleIdAndPermissionRule(roleId: RoleId, permissionRule: PermissionRule): Boolean {
        return jdbcRolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, permissionRule.toDatabaseString())
    }
    
    @Transactional(readOnly = true)
    override fun existsByRoleId(roleId: RoleId): Boolean {
        return jdbcRolePermissionRepository.existsByRoleId(roleId)
    }
    
    @Transactional(readOnly = true)
    override fun existsByResourceType(resourceType: ResourceType): Boolean {
        return jdbcRolePermissionRepository.countByResourceType(resourceType.name.lowercase()) > 0
    }
    
    @Transactional
    override fun deleteByRoleIdAndPermissionRule(roleId: RoleId, permissionRule: PermissionRule) {
        jdbcRolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, permissionRule.toDatabaseString())
    }
    
    @Transactional
    override fun deleteByRoleId(roleId: RoleId) {
        jdbcRolePermissionRepository.deleteByRoleId(roleId)
    }
    
    @Transactional
    override fun deleteByResourceType(resourceType: ResourceType) {
        jdbcRolePermissionRepository.deleteByResourceType(resourceType.name.lowercase())
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jdbcRolePermissionRepository.count()
    }
    
    @Transactional(readOnly = true)
    override fun countByRoleId(roleId: RoleId): Long {
        return jdbcRolePermissionRepository.countByRoleId(roleId)
    }
    
    @Transactional(readOnly = true)
    override fun countByResourceType(resourceType: ResourceType): Long {
        return jdbcRolePermissionRepository.countByResourceType(resourceType.name.lowercase())
    }
    
    @Transactional(readOnly = true)
    override fun countByScope(scope: Scope): Long {
        return jdbcRolePermissionRepository.countByScope(scope.name.lowercase())
    }
}