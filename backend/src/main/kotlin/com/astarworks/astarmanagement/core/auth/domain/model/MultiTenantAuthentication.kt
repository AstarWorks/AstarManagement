package com.astarworks.astarmanagement.core.auth.domain.model

import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt

/**
 * Authentication for users accessing the system without a specific tenant context.
 * 
 * This authentication type is used when:
 * - Users have existing tenant memberships but JWT doesn't contain org_id
 * - Users want to access resources across multiple tenants (Slack/Discord style)
 * - The specific tenant is determined by the URL or request parameter
 * 
 * Unlike SetupModeAuthentication, this provides full user authorities
 * but requires explicit tenant specification in API calls.
 */
class MultiTenantAuthentication(
    val jwt: Jwt,
    val auth0Sub: String,
    val userId: java.util.UUID,
    val email: String?,
    val accessibleTenantIds: List<java.util.UUID>,
    authorities: Collection<GrantedAuthority>
) : AbstractAuthenticationToken(authorities) {
    
    init {
        super.setAuthenticated(true)
    }
    
    /**
     * Returns the multi-tenant context as principal.
     */
    override fun getPrincipal(): Any = MultiTenantContext(
        auth0Sub = auth0Sub,
        userId = userId,
        email = email,
        accessibleTenantIds = accessibleTenantIds
    )
    
    /**
     * Returns the JWT as credentials.
     */
    override fun getCredentials(): Any = jwt
    
    /**
     * Returns the Auth0 subject as the name.
     */
    override fun getName(): String = auth0Sub
    
    /**
     * Returns the JWT token as details for traceability.
     */
    override fun getDetails(): Any = jwt
    
    /**
     * Checks if the user has access to a specific tenant.
     */
    fun hasAccessToTenant(tenantId: java.util.UUID): Boolean {
        return accessibleTenantIds.contains(tenantId)
    }
}

/**
 * Context information for multi-tenant access.
 * 
 * Contains user information and list of accessible tenants.
 * 
 * @property auth0Sub The Auth0 subject identifier
 * @property userId The internal user ID
 * @property email The user's email address (optional)
 * @property accessibleTenantIds List of tenant IDs the user can access
 */
data class MultiTenantContext(
    val auth0Sub: String,
    val userId: java.util.UUID,
    val email: String?,
    val accessibleTenantIds: List<java.util.UUID>
)