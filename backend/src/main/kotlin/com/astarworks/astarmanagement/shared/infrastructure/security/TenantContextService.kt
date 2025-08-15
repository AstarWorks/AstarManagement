package com.astarworks.astarmanagement.modules.shared.infrastructure.security

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Service for managing tenant context in PostgreSQL session variables for Row Level Security (RLS).
 * 
 * This service sets the necessary session variables that RLS policies use to enforce tenant isolation.
 * In production, these variables must be set after JWT authentication to ensure proper data isolation.
 */
@Service
class TenantContextService(
    private val jdbcTemplate: JdbcTemplate
) {
    
    /**
     * Sets the tenant context for the current database session.
     * This enables RLS policies to properly filter data based on tenant isolation.
     * 
     * @param tenantId The tenant ID to set in the session context
     */
    fun setTenantContext(tenantId: UUID) {
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenantId', true)")
    }
    
    /**
     * Sets both tenant and user context for the current database session.
     * This provides complete security context for RLS policies and audit trails.
     * 
     * @param tenantId The tenant ID to set in the session context
     * @param userId The user ID to set in the session context (nullable for registration scenarios)
     */
    fun setSecurityContext(tenantId: UUID, userId: UUID?) {
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenantId', true)")
        if (userId != null) {
            jdbcTemplate.execute("SELECT set_config('app.current_user_id', '$userId', true)")
        } else {
            jdbcTemplate.execute("SELECT set_config('app.current_user_id', NULL, true)")
        }
    }
    
    /**
     * Clears the tenant context from the current database session.
     * This should be called when the session ends or authentication is cleared.
     */
    fun clearTenantContext() {
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', NULL, true)")
        jdbcTemplate.execute("SELECT set_config('app.current_user_id', NULL, true)")
    }
    
    /**
     * Gets the current tenant ID from the PostgreSQL session context.
     * 
     * @return The current tenant ID, or null if not set
     */
    fun getCurrentTenantId(): UUID? {
        return try {
            val result = jdbcTemplate.queryForObject(
                "SELECT current_setting('app.current_tenant_id', true)",
                String::class.java
            )
            if (result.isNullOrEmpty()) null else UUID.fromString(result)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Gets the current user ID from the PostgreSQL session context.
     * 
     * @return The current user ID, or null if not set
     */
    fun getCurrentUserId(): UUID? {
        return try {
            val result = jdbcTemplate.queryForObject(
                "SELECT current_setting('app.current_user_id', true)",
                String::class.java
            )
            if (result.isNullOrEmpty()) null else UUID.fromString(result)
        } catch (e: Exception) {
            null
        }
    }
}