package dev.ryuzu.astermanagement.config

import dev.ryuzu.astermanagement.service.JwtService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * JWT Authentication Filter
 * 
 * Processes incoming requests to extract and validate JWT tokens from the Authorization header.
 * Sets up Spring Security context with authenticated user details and authorities.
 */
@Component
class JwtAuthenticationFilter(
    private val jwtService: JwtService,
    private val securityAuditEventListener: SecurityAuditEventListener
) : OncePerRequestFilter() {

    companion object {
        private const val AUTHORIZATION_HEADER = "Authorization"
        private const val BEARER_PREFIX = "Bearer "
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val token = extractTokenFromRequest(request)
            
            if (token != null && SecurityContextHolder.getContext().authentication == null) {
                val jwt = jwtService.validateToken(token)
                
                if (jwt != null) {
                    val userId = jwtService.getUserIdFromToken(token)
                    val username = jwt.subject
                    
                    if (userId != null && username != null) {
                        val userDetails = createUserDetailsFromJwt(token)
                        val authentication = UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.authorities
                        )
                        authentication.details = WebAuthenticationDetailsSource().buildDetails(request)
                        
                        SecurityContextHolder.getContext().authentication = authentication
                        
                        // Record successful JWT validation
                        securityAuditEventListener.recordJwtValidation(userId, username, true)
                    } else {
                        securityAuditEventListener.recordJwtValidation(
                            userId ?: java.util.UUID.randomUUID(), 
                            username ?: "unknown", 
                            false, 
                            "Invalid user ID or username in token"
                        )
                    }
                } else {
                    // Record failed JWT validation
                    val userId = jwtService.getUserIdFromToken(token)
                    val username = jwtService.getUsernameFromToken(token)
                    securityAuditEventListener.recordJwtValidation(
                        userId ?: java.util.UUID.randomUUID(), 
                        username ?: "unknown", 
                        false, 
                        "Token validation failed"
                    )
                }
            }
        } catch (e: Exception) {
            logger.error("Cannot set user authentication: {}", e.message)
        }
        
        filterChain.doFilter(request, response)
    }

    /**
     * Extracts JWT token from Authorization header
     */
    private fun extractTokenFromRequest(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader(AUTHORIZATION_HEADER)
        return if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            bearerToken.substring(BEARER_PREFIX.length)
        } else {
            null
        }
    }

    /**
     * Creates UserDetails from JWT token claims
     */
    private fun createUserDetailsFromJwt(token: String): UserDetails {
        val userId = jwtService.getUserIdFromToken(token) ?: throw IllegalArgumentException("Invalid token")
        val role = jwtService.getRoleFromToken(token) ?: "CLIENT"
        val permissions = jwtService.getPermissionsFromToken(token)
        
        // Create authorities from role and permissions
        val authorities = mutableListOf<SimpleGrantedAuthority>()
        authorities.add(SimpleGrantedAuthority("ROLE_$role"))
        permissions.forEach { permission ->
            authorities.add(SimpleGrantedAuthority(permission))
        }
        
        return User.builder()
            .username(userId.toString())
            .password("") // Not needed for JWT authentication
            .authorities(authorities)
            .accountExpired(false)
            .accountLocked(false)
            .credentialsExpired(false)
            .disabled(false)
            .build()
    }

    /**
     * Skip JWT processing for public endpoints
     */
    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.servletPath
        return path.startsWith("/auth/") ||
               path.startsWith("/actuator/health") ||
               path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs") ||
               path.equals("/favicon.ico")
    }
}