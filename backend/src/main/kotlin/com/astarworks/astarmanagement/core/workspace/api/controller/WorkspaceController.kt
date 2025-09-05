package com.astarworks.astarmanagement.core.workspace.api.controller

import com.astarworks.astarmanagement.core.workspace.api.dto.*
import com.astarworks.astarmanagement.core.workspace.api.mapper.WorkspaceDtoMapper
import com.astarworks.astarmanagement.core.workspace.domain.service.WorkspaceService
import com.astarworks.astarmanagement.core.table.domain.service.TableService
import com.astarworks.astarmanagement.core.table.domain.service.RecordService
import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.JwtClaimsExtractor
import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.shared.domain.value.*
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for managing workspaces.
 * Provides endpoints for workspace CRUD operations and statistics.
 */
@RestController
@RequestMapping("/api/v1/workspaces")
@Tag(name = "Workspaces", description = "Manage workspaces in the flexible table system")
@PreAuthorize("isAuthenticated()")
class WorkspaceController(
    private val workspaceService: WorkspaceService,
    private val tableService: TableService,
    private val recordService: RecordService,
    private val dtoMapper: WorkspaceDtoMapper,
    private val jwtClaimsExtractor: JwtClaimsExtractor
) {
    private val logger = LoggerFactory.getLogger(WorkspaceController::class.java)
    
    /**
     * Creates a new workspace for the authenticated tenant.
     */
    @PostMapping
    @Operation(summary = "Create workspace", description = "Creates a new workspace for the current tenant")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Workspace created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "409", description = "Workspace name already exists or limit exceeded")
    )
    @PreAuthorize("hasPermissionRule('workspace.create.all') or hasPermissionRule('workspace.create.own')")
    fun createWorkspace(
        @Valid @RequestBody request: WorkspaceCreateRequest,
        authentication: Authentication
    ): WorkspaceResponse {
        val tenantId = extractTenantId(authentication)
        val userId = extractUserId(authentication)
        logger.info("Creating workspace '${request.name}' for tenant: $tenantId, created by: $userId")
        
        val workspace = workspaceService.createWorkspace(TenantId(tenantId), request.name, userId?.let { UserId(it) })
        val response = dtoMapper.toResponse(workspace)
        
        logger.info("Created workspace with ID: ${workspace.id}")
        return response
    }
    
    /**
     * Gets all workspaces for the authenticated tenant.
     */
    @GetMapping
    @Operation(summary = "List workspaces", description = "Retrieves all workspaces for the current tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved workspaces"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    @PreAuthorize("hasPermissionRule('workspace.view.all')")
    fun listWorkspaces(
        authentication: Authentication,
        @Parameter(description = "Include table counts")
        @RequestParam(required = false, defaultValue = "false") includeCounts: Boolean
    ): WorkspaceListResponse {
        val tenantId = extractTenantId(authentication)
        logger.debug("Listing workspaces for tenant: $tenantId")
        
        val workspaces = workspaceService.getWorkspacesByTenant(TenantId(tenantId))
        
        val response = if (includeCounts) {
            val tableCounts = workspaces.associate { workspace ->
                workspace.id.value to tableService.getTablesByWorkspace(workspace.id).size
            }
            val recordCounts = workspaces.associate { workspace ->
                workspace.id.value to tableService.getTablesByWorkspace(workspace.id)
                    .sumOf { recordService.countRecords(it.id.value) }
            }
            dtoMapper.toListResponse(workspaces, tableCounts, recordCounts)
        } else {
            dtoMapper.toListResponse(workspaces)
        }
        
        return response
    }
    
    /**
     * Gets a specific workspace by ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get workspace", description = "Retrieves a specific workspace by ID")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved workspace"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Workspace not found")
    )
    @PreAuthorize("hasPermissionRule('workspace.view.all')")
    fun getWorkspace(
        @Parameter(description = "Workspace ID")
        @PathVariable id: UUID,
        @Parameter(description = "Include detailed information")
        @RequestParam(required = false, defaultValue = "false") detailed: Boolean,
        authentication: Authentication
    ): Any {
        logger.debug("Getting workspace: $id")
        
        val tenantId = extractTenantId(authentication)
        val workspace = workspaceService.getWorkspaceByIdForTenant(WorkspaceId(id), TenantId(tenantId))
            ?: throw com.astarworks.astarmanagement.core.workspace.api.exception.WorkspaceNotFoundException.of(WorkspaceId(id))
        
        return if (detailed) {
            val tables = tableService.getTablesByWorkspace(WorkspaceId(id))
            val totalRecords = tables.sumOf { recordService.countRecords(it.id.value) }
            
            val statistics = dtoMapper.createStatistics(
                totalTables = tables.size,
                totalRecords = totalRecords,
                totalUsers = 0 // Would need user service
            )
            
            val detailResponse = dtoMapper.toDetailResponse(
                workspace = workspace,
                statistics = statistics,
                recentTables = tables.take(5)
            )
            detailResponse
        } else {
            val tableCount = tableService.getTablesByWorkspace(WorkspaceId(id)).size
            val response = dtoMapper.toResponse(workspace, tableCount)
            response
        }
    }
    
    /**
     * Updates a workspace.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update workspace", description = "Updates an existing workspace")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Workspace updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Workspace not found"),
        ApiResponse(responseCode = "409", description = "Workspace name already exists")
    )
    @PreAuthorize("hasPermissionRule('workspace.edit.all') or hasPermissionRule('workspace.edit.own')")
    fun updateWorkspace(
        @Parameter(description = "Workspace ID")
        @PathVariable id: UUID,
        @Valid @RequestBody request: WorkspaceUpdateRequest,
        authentication: Authentication
    ): WorkspaceResponse {
        logger.info("Updating workspace: $id")
        
        val tenantId = extractTenantId(authentication)
        
        // Check if workspace exists in tenant scope first
        val existingWorkspace = workspaceService.getWorkspaceByIdForTenant(WorkspaceId(id), TenantId(tenantId))
            ?: throw com.astarworks.astarmanagement.core.workspace.api.exception.WorkspaceNotFoundException.of(WorkspaceId(id))
        
        if (!request.hasUpdates()) {
            logger.warn("Update request has no changes for workspace: $id")
            return dtoMapper.toResponse(existingWorkspace)
        }
        
        val updatedWorkspace = request.name?.let { name ->
            workspaceService.updateWorkspace(WorkspaceId(id), name)
        } ?: existingWorkspace
        
        val response = dtoMapper.toResponse(updatedWorkspace)
        logger.info("Updated workspace: $id")
        
        return response
    }
    
    /**
     * Deletes a workspace and all its contents.
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete workspace", description = "Permanently deletes a workspace and all its contents")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Workspace deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Workspace not found"),
        ApiResponse(responseCode = "409", description = "Workspace not empty or in use")
    )
    @PreAuthorize("hasPermissionRule('workspace.delete.all')")
    fun deleteWorkspace(
        @Parameter(description = "Workspace ID")
        @PathVariable id: UUID,
        @Parameter(description = "Force delete even if not empty")
        @RequestParam(required = false, defaultValue = "false") force: Boolean,
        authentication: Authentication
    ): Unit {
        logger.info("Deleting workspace: $id (force: $force)")
        
        val tenantId = extractTenantId(authentication)
        
        // Check if workspace exists in tenant scope first
        val workspace = workspaceService.getWorkspaceByIdForTenant(WorkspaceId(id), TenantId(tenantId))
            ?: throw com.astarworks.astarmanagement.core.workspace.api.exception.WorkspaceNotFoundException.of(WorkspaceId(id))
        
        if (!force) {
            val tables = tableService.getTablesByWorkspace(WorkspaceId(id))
            if (tables.isNotEmpty()) {
                logger.warn("Cannot delete non-empty workspace: $id")
                throw com.astarworks.astarmanagement.core.workspace.api.exception.WorkspaceNotEmptyException.of(
                    WorkspaceId(id), tables.size
                )
            }
        }
        
        workspaceService.deleteWorkspace(WorkspaceId(id))
        logger.info("Deleted workspace: $id")
        
        return Unit
    }
    
    /**
     * Gets statistics for a workspace.
     */
    @GetMapping("/{id}/statistics")
    @Operation(summary = "Get workspace statistics", description = "Retrieves detailed statistics for a workspace")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved statistics"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Workspace not found")
    )
    @PreAuthorize("hasPermissionRule('workspace.view.all') and canAccessResource(#id, 'workspace', 'view')")
    fun getWorkspaceStatistics(
        @Parameter(description = "Workspace ID")
        @PathVariable id: UUID
    ): WorkspaceStatistics {
        logger.debug("Getting statistics for workspace: $id")
        
        val workspace = workspaceService.getWorkspaceById(WorkspaceId(id))
        val tables = tableService.getTablesByWorkspace(WorkspaceId(id))
        val totalRecords = tables.sumOf { recordService.countRecords(it.id.value) }
        
        val statistics = dtoMapper.createStatistics(
            totalTables = tables.size,
            totalRecords = totalRecords,
            totalUsers = 0, // Would need user service
            lastActivity = workspace.updatedAt
        )
        
        return statistics
    }
    
    /**
     * Gets the current workspace quota status.
     */
    @GetMapping("/quota")
    @Operation(summary = "Get workspace quota", description = "Retrieves workspace quota information for the tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved quota"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    @PreAuthorize("hasPermissionRule('workspace.view.all')")
    fun getWorkspaceQuota(
        authentication: Authentication
    ): Map<String, Any> {
        val tenantId = extractTenantId(authentication)
        logger.debug("Getting workspace quota for tenant: $tenantId")
        
        val currentCount = workspaceService.getWorkspaceCount(TenantId(tenantId))
        val canCreate = workspaceService.canCreateWorkspace(TenantId(tenantId))
        
        val quota = mapOf(
            "currentCount" to currentCount,
            "maxCount" to 10, // From WorkspaceService.MAX_WORKSPACES_PER_TENANT
            "canCreate" to canCreate,
            "remaining" to (10 - currentCount)
        )
        
        return quota
    }
    
    /**
     * Creates a default workspace for a new tenant.
     * This endpoint is typically used during tenant onboarding.
     */
    @PostMapping("/default")
    @Operation(summary = "Create default workspace", description = "Creates a default workspace for tenant onboarding")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Default workspace created successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "409", description = "Default workspace already exists")
    )
    @PreAuthorize("hasPermissionRule('workspace.create.all') or hasPermissionRule('workspace.create.own')")
    fun createDefaultWorkspace(
        authentication: Authentication
    ): WorkspaceResponse {
        val tenantId = extractTenantId(authentication)
        val userId = extractUserId(authentication)
        logger.info("Creating default workspace for tenant: $tenantId, created by: $userId")
        
        val workspace = workspaceService.createDefaultWorkspace(TenantId(tenantId), userId?.let { UserId(it) })
        val response = dtoMapper.toResponse(workspace)
        
        logger.info("Created default workspace with ID: ${workspace.id}")
        return response
    }
    
    /**
     * Extracts tenant ID from authentication.
     * Handles both JWT (production) and AuthenticatedUserContext (test) principals.
     */
    private fun extractTenantId(authentication: Authentication): UUID {
        return when (val principal = authentication.principal) {
            // Standard Spring Security JWT authentication (production)
            is org.springframework.security.oauth2.jwt.Jwt -> {
                val context = jwtClaimsExtractor.extractAuthenticatedContext(principal)
                context.tenantId
            }
            // Test authentication context (from WithMockJwtSecurityContextFactory)
            is AuthenticatedUserContext -> {
                principal.tenantId
            }
            else -> {
                throw IllegalStateException("Unexpected principal type: ${principal?.javaClass?.name}. Expected JWT or AuthenticatedUserContext but got ${principal?.javaClass?.simpleName}")
            }
        }
    }
    
    /**
     * Extracts user ID from authentication.
     * Handles both JWT (production) and AuthenticatedUserContext (test) principals.
     */
    private fun extractUserId(authentication: Authentication): UUID {
        return when (val principal = authentication.principal) {
            // Standard Spring Security JWT authentication (production)
            is org.springframework.security.oauth2.jwt.Jwt -> {
                val context = jwtClaimsExtractor.extractAuthenticatedContext(principal)
                context.userId
            }
            // Test authentication context (from WithMockJwtSecurityContextFactory)
            is AuthenticatedUserContext -> {
                principal.userId
            }
            else -> {
                throw IllegalStateException("Unexpected principal type: ${principal?.javaClass?.name}. Expected JWT or AuthenticatedUserContext but got ${principal?.javaClass?.simpleName}")
            }
        }
    }
}