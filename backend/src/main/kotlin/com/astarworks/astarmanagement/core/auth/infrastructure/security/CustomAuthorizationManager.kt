package com.astarworks.astarmanagement.core.auth.infrastructure.security

import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeAuthentication
import com.astarworks.astarmanagement.core.auth.domain.model.MultiTenantAuthentication
import org.slf4j.LoggerFactory
import org.springframework.security.authorization.AuthorizationDecision
import org.springframework.security.authorization.AuthorizationResult
import org.springframework.security.authorization.AuthorizationManager
import org.springframework.security.core.Authentication
import org.springframework.security.web.access.intercept.RequestAuthorizationContext
import org.springframework.stereotype.Component
import java.util.function.Supplier

/**
 * Custom authorization manager for flexible authentication handling.
 * 
 * This manager provides different authorization rules based on the endpoint and authentication type:
 * - Setup endpoints: Allow SetupModeAuthentication only
 * - /auth/me endpoint: Allow all authentication types
 * - Workspace endpoints: Allow MultiTenantAuthentication and normal authentication
 * - Other API endpoints: Require normal authentication or MultiTenantAuthentication
 * 
 * This enables the system to support:
 * 1. First-time users without org_id (setup mode)
 * 2. Existing users with org_id (normal mode with specific tenant)
 * 3. Existing users without org_id (multi-tenant mode)
 * 4. Seamless transition between modes
 */
@Component
class CustomAuthorizationManager : AuthorizationManager<RequestAuthorizationContext> {
    
    private val logger = LoggerFactory.getLogger(CustomAuthorizationManager::class.java)
    
    /**
     * Authorizes based on authentication and request context.
     * This is the new Spring Security 6.4+ method signature.
     * 
     * @param authentication The current authentication
     * @param context The request context
     * @return Authorization result
     */
    override fun authorize(
        authentication: Supplier<Authentication>,
        context: RequestAuthorizationContext
    ): AuthorizationResult? {
        val auth = authentication.get()
        
        if (auth == null || !auth.isAuthenticated) {
            logger.debug("No authentication found or not authenticated - denying access")
            return AuthorizationDecision(false)
        }
        
        val request = context.request
        val path = request.requestURI
        val method = request.method
        
        logger.debug("Checking authorization for path: $path, method: $method, auth type: ${auth.javaClass.simpleName}")
        
        // Determine authentication type
        val isSetupMode = auth is SetupModeAuthentication
        val isMultiTenant = auth is MultiTenantAuthentication
        
        return when {
            // Special case: my-tenants endpoint under setup - allow both setup and normal auth
            path == "/api/v1/auth/setup/my-tenants" -> {
                val decision = auth.isAuthenticated
                logger.debug("My-tenants endpoint access: $decision for path: $path")
                AuthorizationDecision(decision)
            }
            
            // Setup endpoints - allow setup mode only (except my-tenants handled above)
            path.startsWith("/api/v1/auth/setup") -> {
                val decision = isSetupMode && auth.isAuthenticated
                logger.debug("Setup endpoint access: $decision for path: $path (setup mode: $isSetupMode)")
                AuthorizationDecision(decision)
            }
            
            // Test data endpoints - deny setup mode
            path.startsWith("/api/v1/test-data") -> {
                val decision = !isSetupMode && auth.isAuthenticated
                logger.warn("Test-data endpoint access: $decision for path: $path (setup mode: $isSetupMode, authenticated: ${auth.isAuthenticated}, auth type: ${auth.javaClass.simpleName})")
                AuthorizationDecision(decision)
            }
            
            // My tenants endpoint - allow all authenticated users
            path.startsWith("/api/v1/my-tenants") ||
            path.startsWith("/api/v1/my-workspaces") -> {
                val decision = auth.isAuthenticated
                logger.debug("My tenants/workspaces endpoint access: $decision for path: $path")
                AuthorizationDecision(decision)
            }
            
            // /auth/me endpoint - allow all authentication types
            path == "/api/v1/auth/me" -> {
                val decision = auth.isAuthenticated
                logger.debug("/auth/me endpoint access: $decision, setup mode: $isSetupMode, multi-tenant: $isMultiTenant")
                AuthorizationDecision(decision)
            }
            
            // Workspace-specific endpoints - allow multi-tenant and normal auth
            path.matches(Regex("/api/v1/workspaces/[^/]+/.*")) ||
            path.matches(Regex("/api/v1/tenants/[^/]+/.*")) -> {
                val decision = (isMultiTenant || !isSetupMode) && auth.isAuthenticated
                logger.debug("Workspace endpoint access: $decision for path: $path")
                AuthorizationDecision(decision)
            }
            
            // Invitation endpoints - allow all except setup mode
            path.matches(Regex("/api/v1/invitations/[^/]+/accept")) -> {
                val decision = !isSetupMode && auth.isAuthenticated
                logger.debug("Invitation endpoint access: $decision for path: $path")
                AuthorizationDecision(decision)
            }
            
            // All other API endpoints - deny setup mode, allow others
            path.startsWith("/api/") -> {
                val decision = !isSetupMode && auth.isAuthenticated
                if (!decision) {
                    logger.debug("API endpoint access denied: setup mode=$isSetupMode, authenticated=${auth.isAuthenticated}")
                }
                AuthorizationDecision(decision)
            }
            
            // Non-API paths (health checks, etc.) - use default rules
            else -> {
                logger.debug("Non-API path, delegating to default rules: $path")
                AuthorizationDecision(auth.isAuthenticated)
            }
        }
    }
}