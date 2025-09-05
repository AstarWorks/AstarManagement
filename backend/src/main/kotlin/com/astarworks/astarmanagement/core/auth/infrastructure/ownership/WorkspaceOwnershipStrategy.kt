package com.astarworks.astarmanagement.core.auth.infrastructure.ownership

import com.astarworks.astarmanagement.core.auth.domain.service.ResourceOwnershipStrategy
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.workspace.domain.repository.WorkspaceRepository
import com.astarworks.astarmanagement.shared.domain.value.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * Ownership strategy for workspace resources.
 * 
 * This strategy determines ownership and team association for workspace-type resources.
 * Workspaces are logical containers for organizing tables, documents, and other resources
 * within a tenant.
 * 
 * Workspace ownership model:
 * - Individual owners (creator/admin of the workspace)
 * - Team association through workspace membership
 * - Shared ownership for collaborative workspaces
 * 
 * Future implementation will:
 * - Connect to the actual workspace management system
 * - Support workspace membership and collaboration features
 * - Implement workspace-based team associations
 */
@Component
class WorkspaceOwnershipStrategy(
    private val workspaceRepository: WorkspaceRepository,
    private val tenantMembershipRepository: TenantMembershipRepository
) : ResourceOwnershipStrategy {
    
    private val logger = LoggerFactory.getLogger(WorkspaceOwnershipStrategy::class.java)
    
    /**
     * Gets the owner of a workspace.
     * 
     * Converts the workspace's created_by (users.id) to the corresponding tenant_users.id
     * for proper authorization checks.
     * 
     * @param resourceId The workspace ID
     * @return The owner's tenant user ID, or null if not found
     */
    override fun getOwner(resourceId: UUID): UUID? {
        logger.debug("Getting owner for workspace $resourceId")
        
        return try {
            val workspace = workspaceRepository.findById(WorkspaceId(resourceId))
            if (workspace?.createdBy == null || workspace.tenantId == null) {
                logger.debug("No owner or tenant found for workspace $resourceId")
                return null
            }
            
            // Convert users.id to tenant_users.id for authorization system
            val tenantMembership = tenantMembershipRepository.findByUserIdAndTenantId(
                UserId(workspace.createdBy!!.value),
                TenantId(workspace.tenantId!!.value)
            )
            
            if (tenantMembership != null) {
                logger.debug("Converted user ID ${workspace.createdBy} to tenant membership ID ${tenantMembership.id} for workspace $resourceId")
                tenantMembership.id.value  // Convert EntityId to UUID
            } else {
                logger.warn("Could not find tenant membership for user ${workspace.createdBy} in tenant ${workspace.tenantId}")
                null
            }
        } catch (e: Exception) {
            logger.error("Error getting workspace owner: ${e.message}", e)
            null
        }
    }
    
    /**
     * Gets the team associated with a workspace.
     * 
     * For MVP implementation:
     * - Uses explicit team assignment if available (workspace.teamId)
     * - Falls back to tenant ID as team (MVP approach: tenant = team)
     * 
     * Future implementation will support:
     * - Explicit team assignment to the workspace
     * - Workspace membership (all members form a team)
     * - Department or project team association
     * 
     * @param resourceId The workspace ID
     * @return The team ID (teamId or tenantId), or null if not found
     */
    override fun getTeam(resourceId: UUID): UUID? {
        logger.debug("Getting team for workspace $resourceId")
        
        return try {
            val workspace = workspaceRepository.findById(WorkspaceId(resourceId))
            // MVP approach: Use explicit teamId if available, fallback to tenantId
            val team = workspace?.teamId?.value ?: workspace?.tenantId?.value  // Convert EntityId to UUID
            
            if (team != null) {
                logger.debug("Found team $team for workspace $resourceId")
            } else {
                logger.debug("No team found for workspace $resourceId")
            }
            
            team
        } catch (e: Exception) {
            logger.error("Error getting workspace team: ${e.message}", e)
            null
        }
    }
    
    /**
     * Returns "workspace" as the resource type.
     * 
     * @return The string "workspace"
     */
    override fun getResourceType(): String = "workspace"
    
    /**
     * Checks if a workspace exists.
     * 
     * @param resourceId The workspace ID
     * @return true if the workspace exists, false otherwise
     */
    override fun exists(resourceId: UUID): Boolean {
        logger.debug("Checking existence of workspace $resourceId")
        
        return try {
            val exists = workspaceRepository.existsById(WorkspaceId(resourceId))
            logger.debug("Workspace $resourceId ${if (exists) "exists" else "does not exist"}")
            exists
        } catch (e: Exception) {
            logger.error("Error checking workspace existence: ${e.message}", e)
            // In case of error, assume it doesn't exist for security
            false
        }
    }
}