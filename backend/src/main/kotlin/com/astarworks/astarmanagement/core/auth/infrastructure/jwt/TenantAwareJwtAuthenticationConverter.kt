package com.astarworks.astarmanagement.core.auth.infrastructure.jwt

import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.JwtClaimsExtractor
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeAuthentication
import com.astarworks.astarmanagement.core.auth.domain.model.MultiTenantAuthentication
import com.astarworks.astarmanagement.core.auth.domain.service.PermissionService
import org.springframework.core.convert.converter.Converter
import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Component

/**
 * Tenant-aware JWT authentication converter for multi-tenant Spring Security integration.
 * Extracts tenant context from Auth0 Organization claims and converts JWT tokens 
 * to authentication tokens with business context.
 * 
 * Key features:
 * - Maps Auth0 Organization ID to internal tenant ID
 * - Sets tenant context for Row Level Security (RLS)
 * - Converts roles to both role authorities (ROLE_*) and permission authorities
 * - Supports fine-grained permission-based access control
 */
@Component
class TenantAwareJwtAuthenticationConverter(
    private val jwtClaimsExtractor: JwtClaimsExtractor,
    private val permissionService: PermissionService
) : Converter<Jwt, AbstractAuthenticationToken> {
    
    /**
     * Converts JWT to authentication token with authenticated user context as principal.
     * 
     * The authentication token will contain:
     * 1. The complete AuthenticatedUserContext as the principal
     * 2. Authorities derived from the user's dynamic roles and permissions
     * 3. The JWT token itself for reference
     * 
     * This enables CustomMethodSecurityExpressionRoot to access tenant_user_id and
     * other user context directly from the authentication principal.
     */
    override fun convert(jwt: Jwt): AbstractAuthenticationToken {
        println("=== TenantAwareJwtAuthenticationConverter.convert() started ===")
        
        // Extract auth0 subject
        val auth0Sub = jwt.subject
        
        // Check if org_id exists in JWT (optional for new architecture)
        val orgId = jwt.getClaimAsString("org_id")
            ?: jwt.getClaimAsString("https://your-app.com/tenant_id")
        
        if (orgId.isNullOrBlank()) {
            // No org_id in JWT - determine authentication type based on user existence
            val userExists = jwtClaimsExtractor.userExists(auth0Sub)
            val accessibleTenants = jwtClaimsExtractor.getUserAccessibleTenants(auth0Sub)
            
            if (!userExists || accessibleTenants.isEmpty()) {
                // New user or user without tenants - needs setup
                println("User needs setup. Creating SetupModeAuthentication.")
                return createSetupModeAuthentication(jwt)
            }
            
            // Existing user with tenants - create multi-tenant authentication
            println("Creating MultiTenantAuthentication for user with ${accessibleTenants.size} accessible tenants.")
            return createMultiTenantAuthentication(jwt, auth0Sub, accessibleTenants)
        }
        
        // org_id exists - proceed with normal tenant-aware authentication
        try {
            val authenticatedContext = jwtClaimsExtractor.extractAuthenticatedContext(jwt)
            
            // Convert dynamic roles and permissions to Spring Security authorities
            val authorities = mutableSetOf<GrantedAuthority>()
            
            // Add role authorities
            authenticatedContext.roles.forEach { role ->
                authorities.add(SimpleGrantedAuthority("ROLE_${role.name.uppercase()}"))
            }
            
            // Add permission authorities
            authenticatedContext.permissions.forEach { permissionRule ->
                authorities.add(SimpleGrantedAuthority(permissionRule.toDatabaseString()))
            }
            
            println("JWT Conversion successful. Authorities: ${authorities.map { it.authority }}")
            
            // Create authentication token with AuthenticatedUserContext as principal
            return object : JwtAuthenticationToken(jwt, authorities, jwt.subject) {
                override fun getPrincipal(): Any {
                    return authenticatedContext
                }
                
                override fun getName(): String {
                    return authenticatedContext.auth0Sub
                }
            }
        } catch (e: Exception) {
            println("=== TenantAwareJwtAuthenticationConverter FAILED ===")
            println("Error: ${e.message}")
            e.printStackTrace()
            throw e
        }
    }
    
    /**
     * Creates a SetupModeAuthentication for users without org_id.
     * 
     * This is used for first-time users who haven't created their default tenant yet.
     * The authentication provides limited authorities for setup operations only.
     * 
     * @param jwt The JWT token without org_id
     * @return SetupModeAuthentication with limited authorities
     */
    private fun createSetupModeAuthentication(jwt: Jwt): SetupModeAuthentication {
        val auth0Sub = jwt.subject
        val email = jwt.getClaimAsString("email")
            ?: jwt.getClaimAsString("https://your-app.com/email")
            ?: jwt.getClaimAsString("preferred_username")
        
        // Limited authorities for setup mode
        val authorities = listOf(
            SimpleGrantedAuthority("ROLE_SETUP_MODE"),
            SimpleGrantedAuthority("SCOPE_auth.setup"),
            SimpleGrantedAuthority("SCOPE_auth.view_my_tenants"),
            SimpleGrantedAuthority("SCOPE_auth.create_default_tenant")
        )
        
        println("Created SetupModeAuthentication for user: $auth0Sub with email: $email")
        
        return SetupModeAuthentication(
            jwt = jwt,
            auth0Sub = auth0Sub,
            email = email,
            authorities = authorities
        )
    }
    
    /**
     * Creates a MultiTenantAuthentication for users without org_id in JWT.
     * 
     * This allows users to access multiple tenants based on URL or request parameters,
     * following the Slack/Discord model of workspace selection.
     * 
     * @param jwt The JWT token
     * @param auth0Sub The Auth0 subject identifier
     * @param accessibleTenants List of tenant IDs the user can access
     * @return MultiTenantAuthentication with user's authorities
     */
    private fun createMultiTenantAuthentication(
        jwt: Jwt,
        auth0Sub: String,
        accessibleTenants: List<java.util.UUID>
    ): MultiTenantAuthentication {
        val email = jwt.getClaimAsString("email")
            ?: jwt.getClaimAsString("https://your-app.com/email")
            ?: jwt.getClaimAsString("preferred_username")
        
        // Get user ID from database
        val userId = jwtClaimsExtractor.getUserId(auth0Sub)
            ?: throw IllegalStateException("User not found for auth0Sub: $auth0Sub")
        
        // Create authorities for multi-tenant access
        val authorities = mutableListOf<GrantedAuthority>()
        authorities.add(SimpleGrantedAuthority("ROLE_USER"))
        authorities.add(SimpleGrantedAuthority("SCOPE_multi_tenant_access"))
        
        // Add tenant-specific authorities if needed
        accessibleTenants.forEach { tenantId ->
            authorities.add(SimpleGrantedAuthority("TENANT_${tenantId}"))
        }
        
        println("Created MultiTenantAuthentication for user: $auth0Sub with email: $email")
        
        return MultiTenantAuthentication(
            jwt = jwt,
            auth0Sub = auth0Sub,
            userId = userId,
            email = email,
            accessibleTenantIds = accessibleTenants,
            authorities = authorities
        )
    }
}