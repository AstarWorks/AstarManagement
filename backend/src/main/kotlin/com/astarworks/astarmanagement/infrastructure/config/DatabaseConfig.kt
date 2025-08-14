package com.astarworks.astarmanagement.infrastructure.config

import com.astarworks.astarmanagement.infrastructure.security.TenantContextService
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.springframework.context.annotation.Configuration
import org.springframework.security.core.context.SecurityContextHolder
import com.astarworks.astarmanagement.domain.entity.User
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component

/**
 * Database configuration for handling tenant context propagation.
 * Ensures that tenant context is properly set for all transactional operations.
 */
@Configuration
class DatabaseConfig {
    // Configuration can be extended as needed
}

/**
 * Aspect that intercepts all @Transactional methods to ensure tenant context is set.
 * This is critical for Row Level Security (RLS) to work properly.
 */
@Aspect
@Component
@ConditionalOnProperty(name = ["rls.enabled"], havingValue = "true", matchIfMissing = true)
class TenantContextAspect(
    private val tenantContextService: TenantContextService
) {
    
    /**
     * Intercepts all methods annotated with @Transactional to set tenant context.
     * This ensures RLS policies have the necessary context for data filtering.
     */
    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    fun setTenantContextForTransaction(joinPoint: ProceedingJoinPoint): Any? {
        val authentication = SecurityContextHolder.getContext().authentication
        
        return if (authentication?.principal is User) {
            val user = authentication.principal as User
            // Ensure tenant context is set for this transaction
            tenantContextService.setSecurityContext(user.tenantId, user.id)
            
            try {
                joinPoint.proceed()
            } finally {
                // Context is automatically cleared when connection returns to pool
            }
        } else {
            // No authenticated user, proceed without setting context
            // This might happen for public endpoints or during registration
            joinPoint.proceed()
        }
    }
}