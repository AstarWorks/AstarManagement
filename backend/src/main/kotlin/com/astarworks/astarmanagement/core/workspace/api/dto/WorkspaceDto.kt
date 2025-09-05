package com.astarworks.astarmanagement.core.workspace.api.dto

import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

/**
 * Request DTO for creating a new workspace.
 */
@Serializable
data class WorkspaceCreateRequest(
    @field:NotBlank
    @field:Size(min = 1, max = 255)
    val name: String,
    
    @field:Size(max = 1000)
    val description: String? = null,
    
    val settings: JsonObject? = null
) {
    /**
     * Validates the workspace name.
     */
    fun isValidName(): Boolean {
        return name.isNotBlank() && name.length <= 255
    }
}

/**
 * Request DTO for updating a workspace.
 */
@Serializable
data class WorkspaceUpdateRequest(
    @field:Size(min = 1, max = 255)
    val name: String? = null,
    
    @field:Size(max = 1000)
    val description: String? = null,
    
    val settings: JsonObject? = null
) {
    /**
     * Checks if the request has any updates.
     */
    fun hasUpdates(): Boolean {
        return name != null || description != null || settings != null
    }
}

/**
 * Response DTO for workspace information.
 */
@Serializable
data class WorkspaceResponse(
    @Contextual
    val id: UUID,
    
    @Contextual
    val tenantId: UUID?,
    
    val name: String,
    
    val description: String? = null,
    
    @Contextual
    val createdBy: UUID? = null,
    
    @Contextual
    val teamId: UUID? = null,
    
    val tableCount: Int? = null,
    
    val recordCount: Long? = null,
    
    val settings: JsonObject? = null,
    
    @Contextual
    val createdAt: Instant,
    
    @Contextual
    val updatedAt: Instant
) {
    /**
     * Creates a summary view without counts.
     */
    fun toSummary(): WorkspaceSummaryResponse {
        return WorkspaceSummaryResponse(
            id = id,
            name = name,
            description = description,
            createdAt = createdAt
        )
    }
}

/**
 * Summary response DTO for workspace listing.
 * Contains minimal information for list views.
 */
@Serializable
data class WorkspaceSummaryResponse(
    @Contextual
    val id: UUID,
    
    val name: String,
    
    val description: String? = null,
    
    @Contextual
    val createdAt: Instant
)

/**
 * Response DTO for workspace list with metadata.
 */
@Serializable
data class WorkspaceListResponse(
    val workspaces: List<WorkspaceResponse>,
    
    val totalCount: Long,
    
    val hasMore: Boolean = false
) {
    companion object {
        /**
         * Creates a workspace list response from a list of workspaces.
         */
        fun of(workspaces: List<WorkspaceResponse>): WorkspaceListResponse {
            return WorkspaceListResponse(
                workspaces = workspaces,
                totalCount = workspaces.size.toLong(),
                hasMore = false
            )
        }
        
        /**
         * Creates an empty workspace list response.
         */
        fun empty(): WorkspaceListResponse {
            return WorkspaceListResponse(
                workspaces = emptyList(),
                totalCount = 0,
                hasMore = false
            )
        }
    }
}

/**
 * Response DTO for detailed workspace information.
 * Includes statistics and related entities.
 */
@Serializable
data class WorkspaceDetailResponse(
    val workspace: WorkspaceResponse,
    
    val statistics: WorkspaceStatistics? = null,
    
    val recentTables: List<TableSummary>? = null,
    
    val permissions: List<PermissionRule>? = null
)

/**
 * Statistics for a workspace.
 */
@Serializable
data class WorkspaceStatistics(
    val totalTables: Int,
    
    val totalRecords: Long,
    
    val totalUsers: Int,
    
    val storageUsed: Long? = null,
    
    @Contextual
    val lastActivity: Instant? = null
)

/**
 * Summary of a table for workspace detail view.
 */
@Serializable
data class TableSummary(
    @Contextual
    val id: UUID,
    
    val name: String,
    
    val recordCount: Long,
    
    @Contextual
    val lastModified: Instant
)