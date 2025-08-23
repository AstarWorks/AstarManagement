package com.astarworks.astarmanagement.shared.infrastructure.security

import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.slf4j.LoggerFactory
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * AOP interceptor that automatically sets PostgreSQL session variables
 * for Row Level Security (RLS) when entering transactional methods.
 * 
 * This interceptor:
 * 1. Intercepts all methods annotated with @Transactional
 * 2. Extracts tenant and user context
 * 3. Sets PostgreSQL session variables (app.current_tenant_id, app.current_user_id)
 * 4. Allows RLS policies to filter data automatically
 * 
 * The session variables are automatically cleared when the transaction ends.
 */
@Aspect
@Component
class RLSInterceptor(
    private val jdbcTemplate: JdbcTemplate,
    private val tenantContextService: TenantContextService,
    private val userRepository: UserRepository
) {
    
    private val logger = LoggerFactory.getLogger(RLSInterceptor::class.java)
    
    /**
     * Intercepts all @Transactional methods and sets RLS context.
     */
    @Around("@annotation(transactional)")
    fun setRLSContext(
        joinPoint: ProceedingJoinPoint,
        transactional: Transactional
    ): Any? {
        val tenantId = tenantContextService.getTenantContext()
        val userId = getCurrentUserId()
        
        if (tenantId != null && userId != null) {
            try {
                // Set PostgreSQL session variables for RLS
                setPostgreSQLSessionContext(tenantId, userId)
                logger.debug(
                    "Set RLS context for {}.{}: tenant={}, user={}", 
                    joinPoint.target.javaClass.simpleName,
                    joinPoint.signature.name,
                    tenantId, 
                    userId
                )
            } catch (e: Exception) {
                logger.error("Failed to set RLS context", e)
                // Continue without RLS context rather than failing the request
            }
        } else {
            logger.debug(
                "Incomplete RLS context for {}.{}: tenant={}, user={}", 
                joinPoint.target.javaClass.simpleName,
                joinPoint.signature.name,
                tenantId, 
                userId
            )
        }
        
        // Proceed with the original method
        return joinPoint.proceed()
    }
    
    /**
     * Sets PostgreSQL session variables that are used by RLS policies.
     * These variables are automatically cleared when the transaction ends.
     */
    private fun setPostgreSQLSessionContext(tenantId: UUID, userId: UUID) {
        try {
            // Set session variables that RLS functions will read
            jdbcTemplate.execute("""
                SELECT set_config('app.current_tenant_id', '$tenantId', true);
                SELECT set_config('app.current_user_id', '$userId', true);
            """)
            
            logger.trace("PostgreSQL session variables set: tenant_id={}, user_id={}", tenantId, userId)
            
        } catch (e: Exception) {
            logger.error("Failed to set PostgreSQL session variables", e)
            throw e
        }
    }
    
    /**
     * Gets the current user ID from the security context.
     * Extracts the user ID by finding the user record matching the Auth0 subject.
     */
    private fun getCurrentUserId(): UUID? {
        return try {
            val authentication = SecurityContextHolder.getContext().authentication
                ?: return null
            
            if (authentication.principal !is Jwt) {
                logger.debug("Authentication principal is not a JWT")
                return null
            }
            
            val jwt = authentication.principal as Jwt
            val auth0Sub = jwt.subject
            
            if (auth0Sub.isNullOrBlank()) {
                logger.warn("JWT subject (sub) is null or blank")
                return null
            }
            
            // Find user by Auth0 subject
            val user = userRepository.findByAuth0Sub(auth0Sub)
            if (user == null) {
                logger.warn("No user found for Auth0 subject: {}", auth0Sub)
                return null
            }
            
            return user.id
            
        } catch (e: Exception) {
            logger.error("Error getting current user ID", e)
            null
        }
    }
    
    /**
     * Alternative method that intercepts all transactional methods without requiring
     * the @Transactional annotation to be present in the pointcut.
     * This ensures we catch all transactional contexts.
     */
    @Around("execution(* *(..)) && @within(org.springframework.stereotype.Service)")
    fun interceptServiceMethods(joinPoint: ProceedingJoinPoint): Any? {
        // Check if we're already in a transaction by checking if RLS variables are set
        val currentTenantId = try {
            jdbcTemplate.queryForObject(
                "SELECT current_setting('app.current_tenant_id', true)",
                String::class.java
            )
        } catch (e: Exception) {
            null
        }
        
        // Only set RLS context if not already set
        if (currentTenantId.isNullOrEmpty()) {
            return setRLSContextIfNeeded(joinPoint)
        }
        
        return joinPoint.proceed()
    }
    
    /**
     * Sets RLS context if tenant and user context are available.
     */
    private fun setRLSContextIfNeeded(joinPoint: ProceedingJoinPoint): Any? {
        val tenantId = tenantContextService.getTenantContext()
        val userId = getCurrentUserId()
        
        if (tenantId != null && userId != null) {
            try {
                setPostgreSQLSessionContext(tenantId, userId)
                logger.debug(
                    "Auto-set RLS context for {}.{}: tenant={}, user={}", 
                    joinPoint.target.javaClass.simpleName,
                    joinPoint.signature.name,
                    tenantId, 
                    userId
                )
            } catch (e: Exception) {
                logger.error("Failed to auto-set RLS context", e)
            }
        }
        
        return joinPoint.proceed()
    }
    
    /**
     * Manually sets RLS context for cases where automatic interception doesn't work.
     * This can be called directly from service methods if needed.
     */
    fun manuallySetRLSContext(tenantId: UUID, userId: UUID) {
        try {
            setPostgreSQLSessionContext(tenantId, userId)
            logger.debug("Manually set RLS context: tenant={}, user={}", tenantId, userId)
        } catch (e: Exception) {
            logger.error("Failed to manually set RLS context", e)
            throw e
        }
    }
    
    /**
     * Clears RLS context manually. Usually not needed as transaction end clears it automatically.
     */
    fun clearRLSContext() {
        try {
            jdbcTemplate.execute("""
                SELECT set_config('app.current_tenant_id', NULL, true);
                SELECT set_config('app.current_user_id', NULL, true);
            """)
            logger.debug("Manually cleared RLS context")
        } catch (e: Exception) {
            logger.error("Failed to clear RLS context", e)
        }
    }
}