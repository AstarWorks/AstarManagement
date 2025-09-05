package com.astarworks.astarmanagement.core.auth.infrastructure.jwt

import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.service.UserResolverService
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import org.slf4j.LoggerFactory
import org.springframework.security.core.AuthenticationException
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * JWT claims extractor for Auth0 tokens.
 * Extracts authenticated user context from JWT claims for existing users only.
 * 
 * Key responsibilities:
 * - Extract auth0_sub from JWT
 * - Resolve tenant from Auth0 Organization ID
 * - Delegate to UserResolverService for existing user context
 * - Set tenant context for RLS
 * 
 * Note: Only pre-existing users and tenant memberships are supported.
 * Authentication will fail if user or membership does not exist.
 */
@Component
class JwtClaimsExtractor(
    private val tenantContextService: TenantContextService,
    private val tenantService: TenantService,
    private val userResolverService: UserResolverService
) {
    private val logger = LoggerFactory.getLogger(JwtClaimsExtractor::class.java)
    
    /**
     * Extracts authenticated user context from JWT claims.
     * Only works with pre-existing users and tenant memberships.
     * 
     * @param jwt The JWT token from Auth0
     * @return Complete authenticated user context
     * @throws MissingTenantException if tenant cannot be resolved
     * @throws UserNotFoundException if user doesn't exist
     * @throws TenantMembershipNotFoundException if membership doesn't exist
     */
    fun extractAuthenticatedContext(jwt: Jwt): AuthenticatedUserContext {
        logger.debug("=== JWT Claims Extraction Started ===")
        
        try {
            val auth0Sub = jwt.subject
            val email = extractEmail(jwt)
            val tenantId = extractAndResolveTenantId(jwt)
                ?: throw MissingTenantException("No tenant context found in JWT. Auth0 Organization ID is required.")
            
            logger.debug("Extracting context for auth0_sub: $auth0Sub, tenant: $tenantId, email: $email")
            
            // Set tenant context for RLS (Row Level Security) BEFORE calling UserResolverService
            // This is critical: UserResolverService is @Transactional and needs tenant context for RLS
            tenantContextService.setTenantContext(tenantId)
            logger.debug("Tenant context set successfully")
            
            // Delegate to UserResolverService for complete user resolution
            logger.debug("Calling UserResolverService.resolveAuthenticatedContext...")
            val authenticatedContext = userResolverService.resolveAuthenticatedContext(
                auth0Sub = auth0Sub,
                tenantId = tenantId,
                email = email
            )
            
            logger.debug("Successfully extracted context for user: ${authenticatedContext.userId}")
            logger.debug("=== JWT Claims Extraction Completed ===")
            return authenticatedContext
        } catch (e: Exception) {
            logger.error("=== JWT Claims Extraction FAILED ===", e)
            logger.error("JWT subject: ${jwt.subject}")
            logger.error("JWT claims: ${jwt.claims}")
            throw e
        }
    }
    
    /**
     * Extracts email from JWT claims.
     * Tries multiple possible claim names.
     */
    private fun extractEmail(jwt: Jwt): String? {
        return jwt.getClaimAsString("email")
            ?: jwt.getClaimAsString("https://your-app.com/email")
            ?: jwt.getClaimAsString("preferred_username")
    }
    
    /**
     * Extracts Auth0 Organization ID from JWT and resolves to internal tenant ID.
     * Returns null if no organization is found or if tenant doesn't exist.
     */
    private fun extractAndResolveTenantId(jwt: Jwt): UUID? {
        val auth0OrgId = jwt.getClaimAsString("org_id")
            ?: jwt.getClaimAsString("https://your-app.com/tenant_id")
        
        if (auth0OrgId == null) {
            logger.debug("No Auth0 Organization ID found in JWT claims")
            return null
        }
        
        logger.debug("Resolving tenant for Auth0 org: $auth0OrgId")
        
        return try {
            // Look up the tenant by Auth0 Organization ID
            val tenant = tenantService.findByAuth0OrgId(auth0OrgId)
            
            if (tenant == null) {
                logger.warn("No tenant found for Auth0 org: $auth0OrgId. " +
                    "Consider creating a test tenant with: POST /api/v1/test-data/tenants/default")
                return null
            }
            
            logger.debug("Resolved to tenant: ${tenant.id}")
            tenant.id.value
        } catch (e: Exception) {
            logger.error("Error resolving tenant for Auth0 org: $auth0OrgId", e)
            null
        }
    }
    
    /**
     * Checks if a user exists by auth0Sub.
     * Used for determining if this is a new user needing setup.
     * 
     * @param auth0Sub The Auth0 subject identifier
     * @return true if user exists, false otherwise
     */
    fun userExists(auth0Sub: String): Boolean {
        return try {
            userResolverService.findUserByAuth0Sub(auth0Sub) != null
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Gets the user ID for an auth0Sub.
     * 
     * @param auth0Sub The Auth0 subject identifier
     * @return The user ID if user exists, null otherwise
     */
    fun getUserId(auth0Sub: String): java.util.UUID? {
        return try {
            userResolverService.findUserByAuth0Sub(auth0Sub)?.id?.value
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Gets all accessible tenant IDs for a user.
     * 
     * @param auth0Sub The Auth0 subject identifier
     * @return List of tenant IDs the user can access
     */
    fun getUserAccessibleTenants(auth0Sub: String): List<java.util.UUID> {
        return try {
            val user = userResolverService.findUserByAuth0Sub(auth0Sub)
                ?: return emptyList()
            userResolverService.getUserTenants(user.id.value).map { it.tenantId.value }
        } catch (e: Exception) {
            logger.warn("Failed to get accessible tenants for user: $auth0Sub", e)
            emptyList()
        }
    }
}

/**
 * Exception thrown when JWT lacks required tenant context.
 * Extends AuthenticationException to trigger proper 401 handling.
 */
class MissingTenantException(message: String) : AuthenticationException(message)