package com.astarworks.astarmanagement.core.workspace.domain.service

import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.workspace.domain.repository.WorkspaceRepository
import com.astarworks.astarmanagement.core.workspace.api.exception.*
import com.astarworks.astarmanagement.core.table.domain.repository.TableRepository
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.shared.exception.common.ResourceNotFoundException
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TeamId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Service for managing workspaces within the flexible table system.
 * 
 * Handles workspace lifecycle operations including:
 * - Workspace creation and initialization
 * - Multi-tenant workspace management
 * - Workspace limits and quotas
 * - Cascade operations for related entities
 */
@Service
@Transactional
class WorkspaceService(
    private val workspaceRepository: WorkspaceRepository,
    private val tableRepository: TableRepository,
    private val tenantService: TenantService,
    private val tenantContextService: TenantContextService
) {
    private val logger = LoggerFactory.getLogger(WorkspaceService::class.java)
    
    companion object {
        const val MAX_WORKSPACES_PER_TENANT = 10
        const val DEFAULT_WORKSPACE_NAME = "Default Workspace"
    }
    
    /**
     * Creates a new workspace for a tenant with ownership.
     * 
     * @param tenantId The tenant ID
     * @param name The workspace name
     * @param createdBy The user ID who creates the workspace (owner)
     * @return The created workspace
     * @throws DuplicateWorkspaceNameException if workspace name already exists for tenant
     * @throws WorkspaceLimitExceededException if workspace limit exceeded
     * @throws ResourceNotFoundException if tenant not found
     */
    fun createWorkspace(tenantId: TenantId, name: String, createdBy: UserId? = null): Workspace {
        logger.info("Creating workspace '$name' for tenant: $tenantId, created by: $createdBy")
        
        // Validate tenant exists
        val tenant = tenantService.findById(tenantId)
            ?: throw ResourceNotFoundException.tenant(tenantId.value)
        
        // Check workspace limit
        val currentCount = workspaceRepository.countByTenantId(tenantId)
        if (currentCount >= MAX_WORKSPACES_PER_TENANT) {
            throw WorkspaceLimitExceededException.of(tenantId, currentCount.toInt(), MAX_WORKSPACES_PER_TENANT)
        }
        
        // Check for duplicate name
        if (workspaceRepository.existsByTenantIdAndName(tenantId, name)) {
            throw DuplicateWorkspaceNameException.of(name, tenantId)
        }
        
        val workspace = Workspace.create(
            name = name,
            tenantId = tenantId,
            createdBy = createdBy
        )
        
        val savedWorkspace = workspaceRepository.save(workspace)
        logger.info("Created workspace with ID: ${savedWorkspace.id}")
        
        return savedWorkspace
    }
    
    /**
     * Creates a default workspace for a new tenant.
     * This is typically called during tenant onboarding.
     * 
     * @param tenantId The tenant ID
     * @param createdBy The user ID who creates the workspace
     * @return The created default workspace
     */
    fun createDefaultWorkspace(tenantId: TenantId, createdBy: UserId? = null): Workspace {
        logger.info("Creating default workspace for tenant: $tenantId, created by: $createdBy")
        return createWorkspace(tenantId, DEFAULT_WORKSPACE_NAME, createdBy)
    }
    
    /**
     * Gets a workspace by ID.
     * Enforces tenant isolation by throwing 404 if workspace belongs to different tenant.
     * 
     * @param id The workspace ID
     * @return The workspace
     * @throws WorkspaceNotFoundException if workspace not found or not accessible by current tenant
     */
    @Transactional(readOnly = true)
    fun getWorkspaceById(id: WorkspaceId): Workspace {
        val workspace = workspaceRepository.findById(id)
            ?: throw WorkspaceNotFoundException.of(id)
        
        // Check tenant access
        val currentTenantId = tenantContextService.getTenantContext()
        if (currentTenantId != null && workspace.tenantId != null) {
            if (workspace.tenantId != TenantId(currentTenantId)) {
                // Workspace belongs to different tenant, return 404 for security
                throw WorkspaceNotFoundException.of(id)
            }
        }
        
        return workspace
    }
    
    /**
     * Gets a workspace by ID, returning null if not found.
     * 
     * @param id The workspace ID
     * @return The workspace or null
     */
    @Transactional(readOnly = true)
    fun findWorkspaceById(id: WorkspaceId): Workspace? {
        return workspaceRepository.findById(id)
    }
    
    /**
     * Gets a workspace by ID within tenant scope, returning null if not found or not in tenant.
     * This enforces tenant isolation by only searching within the specified tenant's workspaces.
     * 
     * @param id The workspace ID
     * @param tenantId The tenant ID
     * @return The workspace or null if not found or belongs to different tenant
     */
    @Transactional(readOnly = true)
    fun getWorkspaceByIdForTenant(id: WorkspaceId, tenantId: TenantId): Workspace? {
        return workspaceRepository.findByIdAndTenantId(id, tenantId)
    }
    
    /**
     * Gets all workspaces for a tenant.
     * 
     * @param tenantId The tenant ID
     * @return List of workspaces
     */
    @Transactional(readOnly = true)
    fun getWorkspacesByTenant(tenantId: TenantId): List<Workspace> {
        return workspaceRepository.findByTenantId(tenantId)
    }
    
    /**
     * Updates a workspace.
     * 
     * @param id The workspace ID
     * @param name The new name
     * @return The updated workspace
     * @throws WorkspaceNotFoundException if workspace not found
     * @throws DuplicateWorkspaceNameException if name already exists
     */
    fun updateWorkspace(id: WorkspaceId, name: String): Workspace {
        logger.info("Updating workspace $id with name: $name")
        
        val workspace = getWorkspaceById(id)
        
        // Check for duplicate name within the same tenant
        workspace.tenantId?.let { tenantId ->
            val existing = workspaceRepository.findByTenantIdAndName(tenantId, name)
            if (existing != null && existing.id != id) {
                throw DuplicateWorkspaceNameException.of(name, tenantId)
            }
        }
        
        val updatedWorkspace = workspace.update(name = name)
        val savedWorkspace = workspaceRepository.save(updatedWorkspace)
        
        logger.info("Updated workspace $id")
        return savedWorkspace
    }
    
    /**
     * Deletes a workspace and all its associated data.
     * This will cascade delete all tables and records within the workspace.
     * 
     * @param id The workspace ID
     * @throws WorkspaceNotFoundException if workspace not found
     */
    fun deleteWorkspace(id: WorkspaceId) {
        logger.info("Deleting workspace: $id")
        
        val workspace = getWorkspaceById(id)
        
        // Delete all tables in the workspace (this will cascade to records)
        tableRepository.deleteByWorkspaceId(id)
        
        // Delete the workspace
        workspaceRepository.deleteById(id)
        
        logger.info("Deleted workspace $id and all associated data")
    }
    
    /**
     * Deletes all workspaces for a tenant.
     * This is typically called when deleting a tenant.
     * 
     * @param tenantId The tenant ID
     */
    fun deleteWorkspacesByTenant(tenantId: TenantId) {
        logger.info("Deleting all workspaces for tenant: $tenantId")
        
        val workspaces = workspaceRepository.findByTenantId(tenantId)
        workspaces.forEach { workspace ->
            deleteWorkspace(workspace.id)
        }
        
        logger.info("Deleted ${workspaces.size} workspaces for tenant $tenantId")
    }
    
    /**
     * Checks if a tenant can create more workspaces.
     * 
     * @param tenantId The tenant ID
     * @return true if under the limit, false otherwise
     */
    @Transactional(readOnly = true)
    fun canCreateWorkspace(tenantId: TenantId): Boolean {
        val currentCount = workspaceRepository.countByTenantId(tenantId)
        return currentCount < MAX_WORKSPACES_PER_TENANT
    }
    
    /**
     * Gets the workspace count for a tenant.
     * 
     * @param tenantId The tenant ID
     * @return The number of workspaces
     */
    @Transactional(readOnly = true)
    fun getWorkspaceCount(tenantId: TenantId): Long {
        return workspaceRepository.countByTenantId(tenantId)
    }
    
    /**
     * Checks if a workspace exists.
     * 
     * @param id The workspace ID
     * @return true if exists, false otherwise
     */
    @Transactional(readOnly = true)
    fun workspaceExists(id: WorkspaceId): Boolean {
        return workspaceRepository.existsById(id)
    }
    
    /**
     * Gets all workspaces created by a specific user.
     * 
     * @param userId The user ID
     * @return List of workspaces owned by the user
     */
    @Transactional(readOnly = true)
    fun getWorkspacesByOwner(userId: UserId): List<Workspace> {
        return workspaceRepository.findByCreatedBy(userId)
    }
    
    /**
     * Gets workspaces created by a user within a specific tenant.
     * 
     * @param tenantId The tenant ID
     * @param userId The user ID
     * @return List of workspaces
     */
    @Transactional(readOnly = true)
    fun getWorkspacesByTenantAndOwner(tenantId: TenantId, userId: UserId): List<Workspace> {
        return workspaceRepository.findByTenantIdAndCreatedBy(tenantId, userId)
    }
    
    /**
     * Checks if a user is the owner of a workspace.
     * 
     * @param workspaceId The workspace ID
     * @param userId The user ID
     * @return true if the user owns the workspace, false otherwise
     */
    @Transactional(readOnly = true)
    fun isWorkspaceOwner(workspaceId: WorkspaceId, userId: UserId): Boolean {
        val workspace = workspaceRepository.findById(workspaceId)
        return workspace?.isOwnedBy(userId) == true
    }
    
    /**
     * Transfers ownership of a workspace to another user.
     * 
     * @param workspaceId The workspace ID
     * @param newOwnerId The new owner's user ID
     * @return The updated workspace
     * @throws WorkspaceNotFoundException if workspace not found
     */
    fun transferOwnership(workspaceId: WorkspaceId, newOwnerId: UserId): Workspace {
        logger.info("Transferring ownership of workspace $workspaceId to user $newOwnerId")
        
        val workspace = getWorkspaceById(workspaceId)
        val updatedWorkspace = workspace.changeOwner(newOwnerId)
        val savedWorkspace = workspaceRepository.save(updatedWorkspace)
        
        logger.info("Transferred ownership of workspace $workspaceId to user $newOwnerId")
        return savedWorkspace
    }
    
    /**
     * Assigns a workspace to a team.
     * 
     * @param workspaceId The workspace ID
     * @param teamId The team ID
     * @return The updated workspace
     * @throws WorkspaceNotFoundException if workspace not found
     */
    fun assignToTeam(workspaceId: WorkspaceId, teamId: TeamId): Workspace {
        logger.info("Assigning workspace $workspaceId to team $teamId")
        
        val workspace = getWorkspaceById(workspaceId)
        val updatedWorkspace = workspace.assignToTeam(teamId)
        val savedWorkspace = workspaceRepository.save(updatedWorkspace)
        
        logger.info("Assigned workspace $workspaceId to team $teamId")
        return savedWorkspace
    }
}