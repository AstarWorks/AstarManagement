package com.astarworks.astarmanagement.base

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.util.*

/**
 * Helper class for setting PostgreSQL session variables required for RLS.
 * 
 * In production, these are set by the application after JWT authentication.
 * In tests, we need to set them manually to simulate authenticated requests.
 */
@Component
class TestSecurityContextHelper(
    private val jdbcTemplate: JdbcTemplate
) {
    
    /**
     * Sets the current tenant and user context for RLS policies.
     * This must be called within a transaction for the settings to take effect.
     */
    fun setSecurityContext(tenantId: UUID, userId: UUID) {
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenantId', true)")
        jdbcTemplate.execute("SELECT set_config('app.current_user_id', '$userId', true)")
    }
    
    /**
     * Clears the security context.
     */
    fun clearSecurityContext() {
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', NULL, true)")
        jdbcTemplate.execute("SELECT set_config('app.current_user_id', NULL, true)")
    }
    
    /**
     * Gets the current tenant ID from PostgreSQL session.
     */
    fun getCurrentTenantId(): UUID? {
        val result = jdbcTemplate.queryForObject(
            "SELECT current_setting('app.current_tenant_id', true)",
            String::class.java
        )
        return result?.let { UUID.fromString(it) }
    }
    
    /**
     * Gets the current user ID from PostgreSQL session.
     */
    fun getCurrentUserId(): UUID? {
        val result = jdbcTemplate.queryForObject(
            "SELECT current_setting('app.current_user_id', true)",
            String::class.java
        )
        return result?.let { UUID.fromString(it) }
    }
}