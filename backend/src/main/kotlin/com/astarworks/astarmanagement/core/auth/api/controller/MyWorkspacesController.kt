package com.astarworks.astarmanagement.core.auth.api.controller

import com.astarworks.astarmanagement.core.auth.api.dto.MyWorkspacesResponse
import com.astarworks.astarmanagement.core.auth.api.dto.WorkspaceDto
import com.astarworks.astarmanagement.core.auth.domain.model.MultiTenantAuthentication
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeAuthentication
import com.astarworks.astarmanagement.core.auth.domain.service.UserResolverService
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.shared.domain.value.UserId
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * Controller for multi-tenant workspace access (Slack/Discord style).
 * 
 * This controller provides endpoints for users to discover and access
 * multiple tenants/workspaces without requiring JWT regeneration.
 * 
 * Key features:
 * - List accessible workspaces for authenticated users
 * - Support both MultiTenantAuthentication and normal JWT authentication
 * - Enable workspace switching without re-authentication
 * - Compatible with Slack/Discord-style UX patterns
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "My Workspaces", description = "Multi-tenant workspace access endpoints")
class MyWorkspacesController(
    private val userResolverService: UserResolverService,
    private val tenantService: TenantService
) {
    private val logger = LoggerFactory.getLogger(MyWorkspacesController::class.java)
    
    /**
     * Gets all workspaces/tenants accessible to the current user.
     * 
     * This endpoint supports both MultiTenantAuthentication and normal
     * JwtAuthenticationToken, allowing users to discover all their accessible
     * workspaces regardless of their current authentication context.
     * 
     * @param authentication The current authentication (MultiTenant or normal JWT)
     * @return List of accessible workspaces with basic information
     */
    @GetMapping("/my-workspaces")
    @Operation(
        summary = "List my workspaces", 
        description = "Gets all workspaces/tenants accessible to the authenticated user"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved accessible workspaces"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        ApiResponse(responseCode = "403", description = "Forbidden - setup mode users cannot access workspaces")
    )
    fun getMyWorkspaces(authentication: Authentication): MyWorkspacesResponse {
        logger.debug("Getting accessible workspaces for authentication: ${authentication.javaClass.simpleName}")
        
        // Deny access for setup mode users
        if (authentication is SetupModeAuthentication) {
            logger.warn("Setup mode user attempted to access workspaces: ${authentication.auth0Sub}")
            throw IllegalAccessException("Setup mode users cannot access workspaces. Complete setup first.")
        }
        
        val userId = extractUserId(authentication)
        logger.debug("Getting workspaces for user: $userId")
        
        // Get all tenant memberships for the user
        val tenantMemberships = userResolverService.getUserTenants(userId)
        logger.debug("Found ${tenantMemberships.size} tenant memberships for user: $userId")
        
        // Convert to workspace DTOs
        val workspaces = tenantMemberships.map { membership ->
            val tenant = tenantService.findById(membership.tenantId)
                ?: throw IllegalStateException("Tenant not found: ${membership.tenantId}")
            
            WorkspaceDto(
                id = tenant.id.value,
                name = tenant.name,
                displayName = tenant.name, // Use name as displayName for now
                isActive = membership.isActive,
                role = "Member", // Could be enhanced with role information from membership
                lastAccessedAt = membership.lastAccessedAt
            )
        }.sortedByDescending { it.lastAccessedAt }
        
        val response = MyWorkspacesResponse(
            workspaces = workspaces,
            totalCount = workspaces.size,
            activeCount = workspaces.count { it.isActive }
        )
        
        logger.debug("Returning ${response.totalCount} workspaces (${response.activeCount} active)")
        return response
    }
    
    /**
     * Alternative endpoint with legacy naming for backward compatibility.
     * Maps to the same functionality as /my-workspaces.
     */
    @GetMapping("/my-tenants")
    @Operation(
        summary = "List my tenants", 
        description = "Legacy endpoint - use /my-workspaces instead"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved accessible tenants"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Forbidden")
    )
    fun getMyTenants(authentication: Authentication): MyWorkspacesResponse {
        logger.debug("Legacy /my-tenants endpoint called - redirecting to /my-workspaces logic")
        return getMyWorkspaces(authentication)
    }
    
    /**
     * Extracts user ID from various authentication types.
     * 
     * Supports:
     * - MultiTenantAuthentication (Phase 2 multi-tenant access)
     * - JwtAuthenticationToken (normal tenant-specific JWT)
     * - SetupModeAuthentication (blocked with exception)
     * 
     * @param authentication The current authentication
     * @return The user ID
     * @throws IllegalStateException if authentication type is not supported
     */
    private fun extractUserId(authentication: Authentication): UUID {
        return when (authentication) {
            is MultiTenantAuthentication -> {
                logger.debug("Extracting user ID from MultiTenantAuthentication")
                authentication.userId
            }
            is org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken -> {
                logger.debug("Extracting user ID from JwtAuthenticationToken")
                // For normal JWT authentication, the principal should be AuthenticatedUserContext
                when (val principal = authentication.principal) {
                    is com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext -> {
                        principal.userId
                    }
                    else -> {
                        throw IllegalStateException("Unexpected principal type in JWT authentication: ${principal?.javaClass?.name}")
                    }
                }
            }
            is SetupModeAuthentication -> {
                throw IllegalAccessException("Setup mode users cannot access workspaces")
            }
            else -> {
                throw IllegalStateException("Unsupported authentication type: ${authentication.javaClass.name}")
            }
        }
    }
}