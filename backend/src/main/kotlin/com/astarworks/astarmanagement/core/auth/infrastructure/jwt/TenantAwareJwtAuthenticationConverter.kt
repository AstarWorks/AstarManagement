package com.astarworks.astarmanagement.core.auth.infrastructure.jwt

import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.JwtClaimsExtractor
import com.astarworks.astarmanagement.core.auth.domain.service.PermissionService
import org.springframework.core.convert.converter.Converter
import org.springframework.security.authentication.AbstractAuthenticationToken
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
     * Converts JWT to authentication token with both roles and permissions as authorities.
     * 
     * The authorities list will include:
     * 1. Role authorities (ROLE_ADMIN, ROLE_USER, etc.) for backward compatibility
     * 2. Permission authorities (table.view.all, document.edit.own, etc.) for fine-grained control
     * 
     * This dual approach allows gradual migration from role-based to permission-based authorization
     * while maintaining backward compatibility with existing @PreAuthorize annotations.
     */
    override fun convert(jwt: Jwt): AbstractAuthenticationToken {
        val context = jwtClaimsExtractor.extractBusinessContext(jwt)
        
        // Convert roles to authorities (includes both roles and permissions)
        val authorities = permissionService.convertRolesToAuthorities(context.roles)
        
        return JwtAuthenticationToken(
            jwt,
            authorities,
            jwt.subject
        )
    }
}