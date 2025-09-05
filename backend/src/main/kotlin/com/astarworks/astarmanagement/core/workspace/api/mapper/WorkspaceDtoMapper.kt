package com.astarworks.astarmanagement.core.workspace.api.mapper

import com.astarworks.astarmanagement.core.workspace.api.dto.*
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.shared.domain.value.*
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.UUID

/**
 * Mapper for converting between Workspace domain models and DTOs.
 * Handles transformations for API layer communication.
 */
@Component
class WorkspaceDtoMapper {
    
    /**
     * Converts a Workspace domain model to WorkspaceResponse DTO.
     * 
     * @param workspace The Workspace domain model
     * @param tableCount Optional table count
     * @param recordCount Optional total record count
     * @return The corresponding WorkspaceResponse DTO
     */
    fun toResponse(
        workspace: Workspace,
        tableCount: Int? = null,
        recordCount: Long? = null
    ): WorkspaceResponse {
        return WorkspaceResponse(
            id = workspace.id.value,
            tenantId = workspace.tenantId?.value,
            name = workspace.name,
            description = null, // Description field not in domain model yet
            createdBy = workspace.createdBy?.value,
            teamId = workspace.teamId?.value,
            tableCount = tableCount,
            recordCount = recordCount,
            settings = null, // Settings field not in domain model yet
            createdAt = workspace.createdAt,
            updatedAt = workspace.updatedAt
        )
    }
    
    /**
     * Converts a list of Workspace domain models to WorkspaceResponse DTOs.
     * 
     * @param workspaces List of Workspace domain models
     * @return List of corresponding WorkspaceResponse DTOs
     */
    fun toResponseList(workspaces: List<Workspace>): List<WorkspaceResponse> {
        return workspaces.map { toResponse(it) }
    }
    
    /**
     * Converts a Workspace to WorkspaceSummaryResponse.
     * 
     * @param workspace The Workspace domain model
     * @return The corresponding WorkspaceSummaryResponse DTO
     */
    fun toSummaryResponse(workspace: Workspace): WorkspaceSummaryResponse {
        return WorkspaceSummaryResponse(
            id = workspace.id.value,
            name = workspace.name,
            description = null, // Description field not in domain model yet
            createdAt = workspace.createdAt
        )
    }
    
    /**
     * Converts a list of Workspaces to WorkspaceSummaryResponse DTOs.
     * 
     * @param workspaces List of Workspace domain models
     * @return List of corresponding WorkspaceSummaryResponse DTOs
     */
    fun toSummaryResponseList(workspaces: List<Workspace>): List<WorkspaceSummaryResponse> {
        return workspaces.map { toSummaryResponse(it) }
    }
    
    /**
     * Creates a WorkspaceListResponse from a list of Workspaces.
     * 
     * @param workspaces List of Workspace domain models
     * @param tableCounts Optional map of workspace ID to table count
     * @param recordCounts Optional map of workspace ID to record count
     * @return WorkspaceListResponse DTO
     */
    fun toListResponse(
        workspaces: List<Workspace>,
        tableCounts: Map<UUID, Int>? = null,
        recordCounts: Map<UUID, Long>? = null
    ): WorkspaceListResponse {
        val responses = workspaces.map { workspace ->
            toResponse(
                workspace = workspace,
                tableCount = tableCounts?.get(workspace.id.value),
                recordCount = recordCounts?.get(workspace.id.value)
            )
        }
        return WorkspaceListResponse.of(responses)
    }
    
    /**
     * Creates a WorkspaceDetailResponse with full details.
     * 
     * @param workspace The Workspace domain model
     * @param statistics Optional statistics
     * @param recentTables Optional list of recent tables
     * @param permissions Optional list of user permissions
     * @return WorkspaceDetailResponse DTO
     */
    fun toDetailResponse(
        workspace: Workspace,
        statistics: WorkspaceStatistics? = null,
        recentTables: List<Table>? = null,
        permissions: List<PermissionRule>? = null
    ): WorkspaceDetailResponse {
        val workspaceResponse = toResponse(
            workspace = workspace,
            tableCount = statistics?.totalTables,
            recordCount = statistics?.totalRecords
        )
        
        val tableSummaries = recentTables?.map { table ->
            TableSummary(
                id = table.id.value,
                name = table.name,
                recordCount = 0, // Would need to be fetched from repository
                lastModified = table.updatedAt
            )
        }
        
        return WorkspaceDetailResponse(
            workspace = workspaceResponse,
            statistics = statistics,
            recentTables = tableSummaries,
            permissions = permissions
        )
    }
    
    /**
     * Creates WorkspaceStatistics from counts.
     * 
     * @param totalTables Total number of tables
     * @param totalRecords Total number of records
     * @param totalUsers Total number of users with access
     * @param storageUsed Optional storage used in bytes
     * @param lastActivity Optional last activity timestamp
     * @return WorkspaceStatistics DTO
     */
    fun createStatistics(
        totalTables: Int,
        totalRecords: Long,
        totalUsers: Int,
        storageUsed: Long? = null,
        lastActivity: Instant? = null
    ): WorkspaceStatistics {
        return WorkspaceStatistics(
            totalTables = totalTables,
            totalRecords = totalRecords,
            totalUsers = totalUsers,
            storageUsed = storageUsed,
            lastActivity = lastActivity
        )
    }
    
    /**
     * Extracts workspace name from WorkspaceCreateRequest.
     * 
     * @param request The WorkspaceCreateRequest DTO
     * @return The workspace name
     */
    fun extractName(request: WorkspaceCreateRequest): String {
        return request.name
    }
    
    /**
     * Extracts workspace name from WorkspaceUpdateRequest.
     * 
     * @param request The WorkspaceUpdateRequest DTO
     * @return The workspace name or null if not provided
     */
    fun extractName(request: WorkspaceUpdateRequest): String? {
        return request.name
    }
    
    /**
     * Creates a Workspace domain model from a create request.
     * Note: This creates a basic workspace. Additional fields may need to be set by the service.
     * 
     * @param request The WorkspaceCreateRequest DTO
     * @param tenantId The tenant ID
     * @param createdBy The user ID who creates the workspace
     * @return A new Workspace domain model
     */
    fun fromCreateRequest(
        request: WorkspaceCreateRequest,
        tenantId: UUID,
        createdBy: UUID? = null
    ): Workspace {
        return Workspace(
            tenantId = TenantId(tenantId),
            name = request.name,
            createdBy = createdBy?.let { UserId(it) }
        )
    }
    
    /**
     * Updates a Workspace domain model from an update request.
     * Only updates non-null fields from the request.
     * 
     * @param workspace The existing Workspace domain model
     * @param request The WorkspaceUpdateRequest DTO
     * @return Updated Workspace domain model
     */
    fun updateFromRequest(
        workspace: Workspace,
        request: WorkspaceUpdateRequest
    ): Workspace {
        return workspace.copy(
            name = request.name ?: workspace.name,
            updatedAt = Instant.now()
        )
    }
    
    /**
     * Creates an empty WorkspaceListResponse.
     * 
     * @return Empty WorkspaceListResponse DTO
     */
    fun emptyListResponse(): WorkspaceListResponse {
        return WorkspaceListResponse.empty()
    }
}