package com.astarworks.astarmanagement.core.workspace.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.workspace.domain.repository.WorkspaceRepository
import com.astarworks.astarmanagement.core.workspace.infrastructure.persistence.mapper.SpringDataJdbcWorkspaceMapper
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TeamId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Implementation of WorkspaceRepository using Spring Data JDBC.
 * Manages workspace persistence operations with multi-tenant support.
 */
@Component
@Transactional
class WorkspaceRepositoryImpl(
    private val springDataJdbcWorkspaceRepository: SpringDataJdbcWorkspaceRepository,
    private val mapper: SpringDataJdbcWorkspaceMapper
) : WorkspaceRepository {
    
    override fun save(workspace: Workspace): Workspace {
        // Check if the workspace already exists to handle version properly
        val existingEntity = springDataJdbcWorkspaceRepository.findByIdOrNull(workspace.id)
        
        return if (existingEntity != null) {
            // For updates: preserve version and update fields
            val updatedEntity = existingEntity.copy(
                tenantId = workspace.tenantId,
                name = workspace.name,
                createdBy = workspace.createdBy,
                teamId = workspace.teamId,
                createdAt = workspace.createdAt,
                updatedAt = workspace.updatedAt
            )
            val savedEntity = springDataJdbcWorkspaceRepository.save(updatedEntity)
            mapper.toDomain(savedEntity)
        } else {
            // For new entities: create from domain model
            val tableEntity = mapper.toTable(workspace)
            val savedEntity = springDataJdbcWorkspaceRepository.save(tableEntity)
            mapper.toDomain(savedEntity)
        }
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: WorkspaceId): Workspace? {
        return springDataJdbcWorkspaceRepository.findByIdOrNull(id)?.let { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByIdAndTenantId(id: WorkspaceId, tenantId: TenantId): Workspace? {
        return springDataJdbcWorkspaceRepository.findByIdAndTenantId(id, tenantId)?.let { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantId(tenantId: TenantId): List<Workspace> {
        return mapper.toDomainList(springDataJdbcWorkspaceRepository.findByTenantId(tenantId))
    }
    
    @Transactional(readOnly = true)
    override fun findByName(name: String): List<Workspace> {
        return mapper.toDomainList(springDataJdbcWorkspaceRepository.findByNameContainingIgnoreCase(name))
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantIdAndName(tenantId: TenantId, name: String): Workspace? {
        return springDataJdbcWorkspaceRepository.findByTenantIdAndNameContainingIgnoreCase(tenantId, name)
            .firstOrNull()?.let { mapper.toDomain(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<Workspace> {
        return mapper.toDomainList(springDataJdbcWorkspaceRepository.findAll())
    }
    
    @Transactional(readOnly = true)
    override fun existsById(id: WorkspaceId): Boolean {
        return springDataJdbcWorkspaceRepository.existsById(id)
    }
    
    @Transactional(readOnly = true)
    override fun existsByTenantIdAndName(tenantId: TenantId, name: String): Boolean {
        return springDataJdbcWorkspaceRepository.existsByTenantIdAndNameIgnoreCase(tenantId, name)
    }
    
    override fun deleteById(id: WorkspaceId) {
        springDataJdbcWorkspaceRepository.deleteById(id)
    }
    
    override fun deleteByTenantId(tenantId: TenantId) {
        springDataJdbcWorkspaceRepository.deleteByTenantId(tenantId)
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return springDataJdbcWorkspaceRepository.count()
    }
    
    @Transactional(readOnly = true)
    override fun countByTenantId(tenantId: TenantId): Long {
        return springDataJdbcWorkspaceRepository.countByTenantId(tenantId)
    }
    
    @Transactional(readOnly = true)
    override fun findByCreatedBy(userId: UserId): List<Workspace> {
        return mapper.toDomainList(springDataJdbcWorkspaceRepository.findByCreatedBy(userId))
    }
    
    @Transactional(readOnly = true)
    override fun findByTeamId(teamId: TeamId): List<Workspace> {
        return mapper.toDomainList(springDataJdbcWorkspaceRepository.findByTeamId(teamId))
    }
    
    @Transactional(readOnly = true)
    override fun findByTenantIdAndCreatedBy(tenantId: TenantId, userId: UserId): List<Workspace> {
        return mapper.toDomainList(springDataJdbcWorkspaceRepository.findByTenantIdAndCreatedBy(tenantId, userId))
    }
    
    @Transactional(readOnly = true)
    override fun countByCreatedBy(userId: UserId): Long {
        return springDataJdbcWorkspaceRepository.countByCreatedBy(userId)
    }
    
    @Transactional(readOnly = true)
    override fun countByTeamId(teamId: TeamId): Long {
        // Note: countByTeamId is not available in Spring Data JDBC repository
        // Using findByTeamId and counting manually
        return springDataJdbcWorkspaceRepository.findByTeamId(teamId).size.toLong()
    }
}