package com.astarworks.astarmanagement.core.auth.infrastructure.config

import com.astarworks.astarmanagement.core.auth.domain.service.AuthorizationProvider
import com.astarworks.astarmanagement.core.auth.infrastructure.security.CustomMethodSecurityExpressionHandler
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Lazy
import org.springframework.security.access.PermissionEvaluator
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler

/**
 * Configuration for method-level security with custom expression handling.
 * 
 * This configuration registers a custom MethodSecurityExpressionHandler as a Spring Bean,
 * which Spring Security automatically detects and uses for @PreAuthorize annotations.
 * 
 * Features enabled:
 * - Custom permission checking methods in @PreAuthorize
 * - Resource-based access control
 * - Dynamic role evaluation
 * - Tenant context awareness
 * 
 * Example usage in controllers:
 * @PreAuthorize("hasPermission('document.edit.all')")
 * @PreAuthorize("canAccessResource(#id, 'document', 'view')")
 * @PreAuthorize("hasPermissionForOwn('document', 'delete', #ownerId)")
 * 
 * Note: 
 * - @EnableMethodSecurity is configured in SecurityConfig
 * - PermissionEvaluator is configured in PermissionEvaluatorConfig to avoid circular dependencies
 * - This configuration follows Spring Security 5.6+ best practices
 */
@Configuration
class MethodSecurityConfig {
    
    companion object {
        /**
         * Creates and registers the custom method security expression handler as a Spring Bean.
         * Must be static to ensure Spring publishes it before initializing Spring Security's 
         * method security configuration classes (Spring Security 6.x absolute requirement).
         * 
         * Dependencies are injected from Spring Context, allowing for proper @MockBean usage in tests.
         * 
         * @param authorizationProvider The authorization provider (injected from context)
         * @param tenantContextService The tenant context service (injected from context) 
         * @return The custom method security expression handler
         */
        @Bean
        @JvmStatic
        fun methodSecurityExpressionHandler(
            @Lazy authorizationProvider: AuthorizationProvider,
            @Lazy tenantContextService: TenantContextService
        ): MethodSecurityExpressionHandler {
            println("====== MethodSecurityConfig: Creating STATIC methodSecurityExpressionHandler Bean ======")
            println("====== AuthorizationProvider: $authorizationProvider ======")
            println("====== TenantContextService: $tenantContextService ======")
            
            val handler = CustomMethodSecurityExpressionHandler(authorizationProvider, tenantContextService)
            
            println("====== MethodSecurityConfig: Created STATIC handler: $handler ======")
            return handler
        }
    }
}