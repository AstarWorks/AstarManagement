package com.astarworks.astarmanagement.core.tenant.infrastructure.context

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * Service for managing tenant context during request processing.
 * Uses ThreadLocal to store tenant context for Row Level Security (RLS) and authorization.
 * 
 * The tenant context is scoped to the current thread and should be cleared after request processing.
 */
@Component
class TenantContextService {
    private val logger = LoggerFactory.getLogger(TenantContextService::class.java)
    
    companion object {
        private val tenantContext = ThreadLocal<UUID?>()
    }
    
    /**
     * Sets the tenant context for the current request thread.
     * This is used for Row Level Security (RLS) and authorization decisions.
     * 
     * @param tenantId The UUID of the current tenant
     */
    fun setTenantContext(tenantId: UUID) {
        logger.debug("Setting tenant context: $tenantId")
        tenantContext.set(tenantId)
    }
    
    /**
     * Gets the current tenant context.
     * 
     * @return The tenant ID for the current request, or null if not set
     */
    fun getTenantContext(): UUID? {
        return tenantContext.get()
    }
    
    /**
     * Gets the current tenant context, throwing an exception if not set.
     * Use this when tenant context is required.
     * 
     * @return The tenant ID for the current request
     * @throws IllegalStateException if tenant context is not set
     */
    fun requireTenantContext(): UUID {
        return getTenantContext() 
            ?: throw IllegalStateException("Tenant context is required but not set")
    }
    
    /**
     * Clears the tenant context for the current thread.
     * Should be called after request processing to prevent context leakage.
     */
    fun clearTenantContext() {
        logger.debug("Clearing tenant context")
        tenantContext.remove()
    }
    
    /**
     * Checks if tenant context is currently set.
     * 
     * @return true if tenant context is set, false otherwise
     */
    fun hasTenantContext(): Boolean {
        return tenantContext.get() != null
    }
    
    /**
     * Executes a function with a specific tenant context.
     * Useful for operations that need to temporarily switch tenant context.
     * 
     * @param tenantId The tenant ID to use
     * @param block The function to execute
     * @return The result of the function
     */
    fun <T> withTenantContext(tenantId: UUID, block: () -> T): T {
        val previousContext = getTenantContext()
        return try {
            setTenantContext(tenantId)
            block()
        } finally {
            // Restore previous context
            if (previousContext != null) {
                setTenantContext(previousContext)
            } else {
                clearTenantContext()
            }
        }
    }
}