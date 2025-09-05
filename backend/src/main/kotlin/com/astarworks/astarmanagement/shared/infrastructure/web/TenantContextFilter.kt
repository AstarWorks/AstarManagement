package com.astarworks.astarmanagement.shared.infrastructure.web

import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.JwtClaimsExtractor
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.core.annotation.Order
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse

/**
 * Tenant context filter that extracts tenant information from requests
 * and sets it in TenantContextService for Row Level Security (RLS).
 * 
 * This filter extracts tenant ID from multiple sources with the following priority:
 * 1. URL path patterns (/api/tenants/{tenantId}/...)
 * 2. HTTP headers (X-Tenant-Id)
 * 3. JWT claims (tenant_id)
 * 
 * The filter also extracts user ID from JWT claims and sets both values
 * in TenantContextService for use by RLS policies.
 */
@Component
@Order(1)
class TenantContextFilter(
    private val tenantContextService: TenantContextService,
    private val jwtClaimsExtractor: JwtClaimsExtractor,
    private val userRepository: UserRepository
) : OncePerRequestFilter() {
    
    private val logger = LoggerFactory.getLogger(TenantContextFilter::class.java)
    
    companion object {
        private val TENANT_PATH_PATTERN = "/api/tenants/([^/]+)".toRegex()
        private const val TENANT_HEADER = "X-Tenant-Id"
        private const val TENANT_CLAIM = "tenant_id"
    }
    
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val authentication = SecurityContextHolder.getContext().authentication
            
            if (authentication?.principal is Jwt) {
                val jwt = authentication.principal as Jwt
                
                // Extract user ID from JWT
                val userId = extractUserIdFromJwt(jwt)
                
                // Extract tenant ID with priority order
                val tenantId = extractTenantId(request, jwt)
                
                // Set context if both values are available
                if (tenantId != null && userId != null) {
                    logger.debug("Setting tenant context: tenant={}, user={}", tenantId, userId)
                    tenantContextService.setTenantContext(tenantId)
                    // Note: User context will be handled by RLSInterceptor
                } else {
                    logger.debug("Incomplete context: tenant={}, user={}", tenantId, userId)
                }
            } else {
                logger.debug("No JWT authentication found, skipping tenant context")
            }
            
            filterChain.doFilter(request, response)
            
        } catch (e: Exception) {
            logger.error("Error in TenantContextFilter", e)
            // Continue with request even if context setting fails
            filterChain.doFilter(request, response)
        } finally {
            // Important: Clear context after request to prevent leakage
            tenantContextService.clearTenantContext()
            logger.debug("Cleared tenant context")
        }
    }
    
    /**
     * Extracts tenant ID from request with priority order:
     * 1. URL path pattern
     * 2. HTTP header
     * 3. JWT claim
     */
    private fun extractTenantId(request: HttpServletRequest, jwt: Jwt): UUID? {
        // Priority 1: URL path pattern (/api/tenants/{tenantId}/...)
        val pathTenantId = extractTenantFromPath(request.requestURI)
        if (pathTenantId != null) {
            logger.debug("Tenant ID from path: {}", pathTenantId)
            return pathTenantId
        }
        
        // Priority 2: HTTP header
        val headerTenantId = extractTenantFromHeader(request)
        if (headerTenantId != null) {
            logger.debug("Tenant ID from header: {}", headerTenantId)
            return headerTenantId
        }
        
        // Priority 3: JWT claim
        val claimTenantId = extractTenantFromJwt(jwt)
        if (claimTenantId != null) {
            logger.debug("Tenant ID from JWT claim: {}", claimTenantId)
            return claimTenantId
        }
        
        logger.debug("No tenant ID found in request")
        return null
    }
    
    /**
     * Extracts tenant ID from URL path pattern.
     */
    private fun extractTenantFromPath(requestURI: String): UUID? {
        return try {
            val matchResult = TENANT_PATH_PATTERN.find(requestURI)
            matchResult?.groupValues?.get(1)?.let { UUID.fromString(it) }
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid UUID in path: {}", requestURI)
            null
        }
    }
    
    /**
     * Extracts tenant ID from HTTP header.
     */
    private fun extractTenantFromHeader(request: HttpServletRequest): UUID? {
        return try {
            request.getHeader(TENANT_HEADER)?.let { UUID.fromString(it) }
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid UUID in header {}: {}", TENANT_HEADER, request.getHeader(TENANT_HEADER))
            null
        }
    }
    
    /**
     * Extracts tenant ID from JWT claim.
     */
    private fun extractTenantFromJwt(jwt: Jwt): UUID? {
        return try {
            jwt.getClaimAsString(TENANT_CLAIM)?.let { UUID.fromString(it) }
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid UUID in JWT claim {}: {}", TENANT_CLAIM, jwt.getClaimAsString(TENANT_CLAIM))
            null
        }
    }
    
    /**
     * Extracts user ID from JWT claims.
     * Converts Auth0 sub to internal user UUID.
     */
    private fun extractUserIdFromJwt(jwt: Jwt): UUID? {
        return try {
            val auth0Sub = jwt.subject
            if (auth0Sub.isNullOrBlank()) {
                logger.warn("No subject (sub) claim found in JWT")
                return null
            }
            
            // Find user by Auth0 sub
            val user = userRepository.findByAuth0Sub(auth0Sub)
            if (user == null) {
                logger.warn("No user found for Auth0 sub: {}", auth0Sub)
                return null
            }
            
            logger.debug("User ID from Auth0 sub: {} -> {}", auth0Sub, user.id)
            user.id.value
            
        } catch (e: Exception) {
            logger.error("Error extracting user ID from JWT", e)
            null
        }
    }
    
    /**
     * Checks if the request should be processed by this filter.
     * Skips certain paths like health checks, static resources, etc.
     */
    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        
        return path.startsWith("/actuator/") ||
               path.startsWith("/health") ||
               path.startsWith("/static/") ||
               path.startsWith("/public/") ||
               path.endsWith(".js") ||
               path.endsWith(".css") ||
               path.endsWith(".png") ||
               path.endsWith(".jpg") ||
               path.endsWith(".ico")
    }
}