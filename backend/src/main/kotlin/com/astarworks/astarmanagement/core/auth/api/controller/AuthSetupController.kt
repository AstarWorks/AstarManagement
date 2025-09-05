package com.astarworks.astarmanagement.core.auth.api.controller

import com.astarworks.astarmanagement.core.auth.api.dto.*
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeAuthentication
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeContext
import com.astarworks.astarmanagement.core.auth.domain.service.UserResolverService
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.core.user.domain.service.UserService
import com.astarworks.astarmanagement.shared.domain.value.TenantUserId
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

/**
 * Controller for handling user setup flow.
 * 
 * This controller handles the initial setup process for new users who don't have
 * an org_id in their JWT yet. It allows them to:
 * 1. Create their default workspace (tenant)
 * 2. Set up their user profile
 * 3. Transition to normal authenticated state
 * 
 * After successful setup, users must re-authenticate with the proper org_id
 * to access the full system functionality.
 */
@RestController
@RequestMapping("/api/v1/auth/setup")
class AuthSetupController(
    private val userService: UserService,
    private val tenantService: TenantService,
    private val tenantMembershipRepository: TenantMembershipRepository,
    private val userResolverService: UserResolverService
) {
    private val logger = LoggerFactory.getLogger(AuthSetupController::class.java)
    
    /**
     * Creates default workspace (tenant) for first-time users.
     * 
     * This endpoint:
     * 1. Creates a new user record if not exists
     * 2. Creates a default tenant for the user
     * 3. Creates tenant membership with admin role
     * 4. Returns setup completion information
     * 
     * @param setupRequest The setup request containing tenant and user profile information
     * @param authentication The setup mode authentication
     * @return SetupResponse with created entities information
     */
    @PostMapping
    @Transactional
    fun completeSetup(
        @RequestBody setupRequest: SetupRequest,
        authentication: Authentication
    ): SetupResponse {
        // Verify this is a setup mode authentication
        if (authentication !is SetupModeAuthentication) {
            throw ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "This endpoint is only accessible in setup mode"
            )
        }
        
        val setupContext = authentication.principal as SetupModeContext
        logger.info("Starting setup process for user: ${setupContext.auth0Sub}")
        
        // Use JIT provisioning to create user and default tenant
        val authenticatedContext = userResolverService.createUserWithDefaultTenant(
            auth0Sub = setupContext.auth0Sub,
            email = setupContext.email ?: setupRequest.userProfile.email,
            tenantName = setupRequest.tenantName
        )
        
        // Get the created entities for response
        val user = userService.findById(com.astarworks.astarmanagement.shared.domain.value.UserId(authenticatedContext.userId))
            ?: throw IllegalStateException("User not found after creation")
        val tenant = tenantService.findById(com.astarworks.astarmanagement.shared.domain.value.TenantId(authenticatedContext.tenantId))
            ?: throw IllegalStateException("Tenant not found after creation")
            
        logger.info("Setup completed via JIT provisioning - User: ${user.id}, Tenant: ${tenant.id}")
        
        // Prepare response using the authenticated context
        val response = SetupResponse(
            userId = authenticatedContext.userId,
            tenantId = authenticatedContext.tenantId,
            tenantUserId = authenticatedContext.tenantUserId,
            tenant = TenantDto(
                id = tenant.id.value,
                name = tenant.name,
                type = when (setupRequest.tenantType) {
                    TenantTypeDto.PERSONAL -> TenantTypeDto.PERSONAL
                    TenantTypeDto.TEAM -> TenantTypeDto.TEAM
                    TenantTypeDto.ENTERPRISE -> TenantTypeDto.ENTERPRISE
                },
                orgId = tenant.auth0OrgId ?: "",
                isActive = tenant.isActive
            ),
            user = UserDto(
                id = user.id.value,
                auth0Sub = user.auth0Sub,
                email = user.email,
                displayName = setupRequest.userProfile.displayName,
                avatarUrl = setupRequest.userProfile.avatarUrl,
                isActive = true
            )
        )
        
        logger.info("Setup completed successfully for user: ${user.id}")
        return response
    }
    
    /**
     * Creates a simple default workspace with minimal setup.
     * 
     * This is a simplified version of the setup flow for users who just want
     * to get started quickly with default settings. Creates:
     * - User account if not exists
     * - Default workspace named "My Workspace"
     * - Tenant membership with default permissions
     * 
     * @param authentication The setup mode authentication
     * @return SimpleSetupResponse with essential information
     */
    @PostMapping("/create-default-workspace")
    @Transactional
    fun createDefaultWorkspace(authentication: Authentication): SimpleSetupResponse {
        // Verify this is a setup mode authentication
        if (authentication !is SetupModeAuthentication) {
            throw ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "This endpoint is only accessible in setup mode"
            )
        }
        
        val setupContext = authentication.principal as SetupModeContext
        logger.info("Creating default workspace for user: ${setupContext.auth0Sub}")
        
        // Use JIT provisioning to create user and default workspace
        val authenticatedContext = userResolverService.createUserWithDefaultTenant(
            auth0Sub = setupContext.auth0Sub,
            email = setupContext.email ?: throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Email is required for workspace creation"
            ),
            tenantName = "My Workspace"
        )
        
        val response = SimpleSetupResponse(
            userId = authenticatedContext.userId,
            tenantId = authenticatedContext.tenantId,
            tenantName = "My Workspace",
            success = true,
            message = "Default workspace created successfully"
        )
        
        logger.info("Default workspace created successfully for user: ${authenticatedContext.userId}")
        return response
    }
    
    /**
     * Lists all tenants that the current user belongs to.
     * 
     * This endpoint is accessible in both setup mode and normal mode.
     * In setup mode, it will typically return an empty list.
     * 
     * @param authentication The current authentication
     * @return MyTenantsResponse with list of user's tenants
     */
    @GetMapping("/my-tenants")
    @Transactional(readOnly = true)
    fun getMyTenants(authentication: Authentication): MyTenantsResponse {
        val auth0Sub = when (authentication) {
            is SetupModeAuthentication -> {
                val setupContext = authentication.principal as SetupModeContext
                setupContext.auth0Sub
            }
            else -> {
                authentication.name
            }
        }
        
        logger.info("Fetching tenants for user: $auth0Sub")
        
        // Find user by auth0Sub
        val user = userService.findByAuth0Sub(auth0Sub)
        if (user == null) {
            logger.info("User not found, returning empty tenant list")
            return MyTenantsResponse(
                tenants = emptyList(),
                defaultTenantId = null
            )
        }
        
        // Get all tenant memberships for the user
        val memberships = tenantMembershipRepository.findByUserId(user.id)
        
        val userTenants = memberships.map { membership ->
            val tenant = tenantService.findById(membership.tenantId)
                ?: throw IllegalStateException("Tenant not found: ${membership.tenantId}")
            
            UserTenantDto(
                tenantId = tenant.id.value,
                tenantName = tenant.name,
                orgId = tenant.auth0OrgId ?: "",
                roles = emptyList(), // TODO: Fetch actual roles
                joinedAt = membership.joinedAt.toString(),
                isActive = membership.isActive
            )
        }
        
        // For now, the first tenant is the default
        val defaultTenantId = userTenants.firstOrNull()?.tenantId
        
        return MyTenantsResponse(
            tenants = userTenants,
            defaultTenantId = defaultTenantId
        )
    }
    
    /**
     * Generates a URL-friendly slug from a tenant name.
     * 
     * @param name The tenant name
     * @return URL-friendly slug
     */
    private fun generateSlugFromName(name: String): String {
        return name
            .lowercase()
            .replace(Regex("[^a-z0-9]+"), "-")
            .trim('-')
            .take(50) // Limit length
    }
}