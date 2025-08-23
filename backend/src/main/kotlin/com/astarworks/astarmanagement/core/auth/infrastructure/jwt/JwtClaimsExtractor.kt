package com.astarworks.astarmanagement.core.auth.infrastructure.jwt

import com.astarworks.astarmanagement.shared.infrastructure.context.BusinessContext
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.core.auth.domain.model.Role
import org.slf4j.LoggerFactory
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * JWT claims extractor for Auth0 tokens.
 * Extracts business context from JWT claims to establish tenant information,
 * roles, and user identity for authorization decisions.
 */
@Component
class JwtClaimsExtractor(
    private val tenantContextService: TenantContextService,
    private val tenantService: TenantService
) {
    private val logger = LoggerFactory.getLogger(JwtClaimsExtractor::class.java)
    
    /**
     * Extracts business context from JWT claims.
     * Maps Auth0 Organizations to tenant context and transforms Auth0 roles to business roles.
     */
    fun extractBusinessContext(jwt: Jwt): BusinessContext {
        val auth0Sub = jwt.subject
        val tenantId = extractAndResolveTenantId(jwt)
        val roles = extractRoles(jwt)
        
        // Set tenant context for authorization (if present)
        tenantId?.let {
            tenantContextService.setTenantContext(it)
        }
        
        return BusinessContext(
            userId = auth0Sub,
            tenantId = tenantId,
            roles = roles
        )
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
            tenant.id
        } catch (e: Exception) {
            logger.error("Error resolving tenant for Auth0 org: $auth0OrgId", e)
            null
        }
    }
    
    /**
     * Extracts and maps Auth0 roles to business roles.
     */
    private fun extractRoles(jwt: Jwt): Set<Role> {
        val auth0Roles = jwt.getClaimAsStringList("https://your-app.com/roles")
            ?: jwt.getClaimAsStringList("roles")
            ?: emptyList()
        
        return auth0Roles.mapNotNull { mapToBusinessRole(it) }.toSet()
    }
    
    /**
     * Maps Auth0 role strings to business role enum values.
     * Unknown roles are ignored.
     */
    private fun mapToBusinessRole(auth0Role: String): Role? {
        return when(auth0Role.uppercase()) {
            "ADMIN" -> Role.ADMIN
            "USER" -> Role.USER
            "VIEWER" -> Role.VIEWER
            else -> null // Unknown roles are ignored
        }
    }
}