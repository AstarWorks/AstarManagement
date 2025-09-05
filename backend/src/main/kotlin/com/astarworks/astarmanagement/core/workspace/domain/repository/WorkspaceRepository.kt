package com.astarworks.astarmanagement.core.workspace.domain.repository

import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TeamId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId

/**
 * Repository interface for Workspace domain entity.
 * Manages logical workspaces within tenants.
 */
interface WorkspaceRepository {
    
    /**
     * Save or update a workspace.
     */
    fun save(workspace: Workspace): Workspace
    
    /**
     * Find a workspace by its ID.
     */
    fun findById(id: WorkspaceId): Workspace?
    
    /**
     * Find a workspace by its ID within a specific tenant scope.
     * This enforces tenant isolation by only searching within the tenant's workspaces.
     */
    fun findByIdAndTenantId(id: WorkspaceId, tenantId: TenantId): Workspace?
    
    /**
     * Find all workspaces belonging to a tenant.
     */
    fun findByTenantId(tenantId: TenantId): List<Workspace>
    
    /**
     * Find workspaces by name (across all tenants).
     * Note: Name is not unique across tenants.
     */
    fun findByName(name: String): List<Workspace>
    
    /**
     * Find a workspace by tenant ID and name.
     */
    fun findByTenantIdAndName(tenantId: TenantId, name: String): Workspace?
    
    /**
     * Find all workspaces.
     */
    fun findAll(): List<Workspace>
    
    /**
     * Check if a workspace exists by ID.
     */
    fun existsById(id: WorkspaceId): Boolean
    
    /**
     * Check if a workspace exists for a tenant with a specific name.
     */
    fun existsByTenantIdAndName(tenantId: TenantId, name: String): Boolean
    
    /**
     * Delete a workspace by ID.
     */
    fun deleteById(id: WorkspaceId)
    
    /**
     * Delete all workspaces for a tenant.
     */
    fun deleteByTenantId(tenantId: TenantId)
    
    /**
     * Count all workspaces.
     */
    fun count(): Long
    
    /**
     * Count workspaces for a specific tenant.
     */
    fun countByTenantId(tenantId: TenantId): Long
    
    /**
     * Find all workspaces created by a specific user.
     */
    fun findByCreatedBy(userId: UserId): List<Workspace>
    
    /**
     * Find all workspaces belonging to a specific team.
     */
    fun findByTeamId(teamId: TeamId): List<Workspace>
    
    /**
     * Find workspaces by tenant and created by user.
     */
    fun findByTenantIdAndCreatedBy(tenantId: TenantId, userId: UserId): List<Workspace>
    
    /**
     * Count workspaces created by a specific user.
     */
    fun countByCreatedBy(userId: UserId): Long
    
    /**
     * Count workspaces belonging to a specific team.
     */
    fun countByTeamId(teamId: TeamId): Long
}