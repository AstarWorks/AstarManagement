package com.astarworks.astarmanagement.core.auth.infrastructure.config

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.access.PermissionEvaluator
import org.springframework.security.core.Authentication
import java.io.Serializable

/**
 * Configuration for PermissionEvaluator beans.
 * 
 * This configuration is separated from MethodSecurityConfig to avoid circular dependencies.
 * The PermissionEvaluator is used by method security expressions and must be available
 * before MethodSecurityConfig is initialized.
 * 
 * The default implementation provides a fallback for environments where no custom
 * PermissionEvaluator is defined (such as the dev profile).
 */
@Configuration
class PermissionEvaluatorConfig {
    
    /**
     * Provides a default PermissionEvaluator if no custom one is defined.
     * This ensures that the application can start even without a custom implementation.
     * 
     * Note: This is a conservative implementation that denies all permissions by default.
     * In production, a proper implementation should be provided that integrates with
     * the authorization system.
     */
    @Bean
    @ConditionalOnMissingBean
    fun defaultPermissionEvaluator(): PermissionEvaluator {
        return object : PermissionEvaluator {
            override fun hasPermission(
                authentication: Authentication,
                targetDomainObject: Any,
                permission: Any
            ): Boolean {
                // Default implementation - always deny for security
                // This ensures that if no proper permission evaluator is configured,
                // the system fails closed rather than open
                return false
            }
            
            override fun hasPermission(
                authentication: Authentication,
                targetId: Serializable,
                targetType: String,
                permission: Any
            ): Boolean {
                // Default implementation - always deny for security
                return false
            }
        }
    }
}