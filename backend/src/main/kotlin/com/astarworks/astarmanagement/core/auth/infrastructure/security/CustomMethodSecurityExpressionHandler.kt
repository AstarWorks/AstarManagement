package com.astarworks.astarmanagement.core.auth.infrastructure.security

import com.astarworks.astarmanagement.core.auth.domain.service.AuthorizationProvider
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import org.aopalliance.intercept.MethodInvocation
import org.springframework.expression.EvaluationContext
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations
import org.springframework.security.authentication.AuthenticationTrustResolver
import org.springframework.security.authentication.AuthenticationTrustResolverImpl
import org.springframework.security.core.Authentication
import java.util.function.Supplier

/**
 * Custom method security expression handler for Spring Security.
 * 
 * This handler enables custom SpEL expressions in @PreAuthorize annotations,
 * providing domain-specific authorization methods that integrate with our
 * permission system.
 * 
 * Features:
 * - Custom permission checking methods
 * - Resource-based access control
 * - Dynamic role evaluation
 * - Tenant context awareness
 * 
 * Usage:
 * @PreAuthorize("hasPermission('document.edit.all')")
 * @PreAuthorize("canAccessResource(#id, 'document', 'view')")
 * @PreAuthorize("hasPermissionForOwn('document', 'delete', #ownerId)")
 * 
 * Note: This class is registered as a Bean in MethodSecurityConfig
 */
class CustomMethodSecurityExpressionHandler(
    private val authorizationProvider: AuthorizationProvider,
    private val tenantContextService: TenantContextService
) : DefaultMethodSecurityExpressionHandler() {
    
    private val trustResolver: AuthenticationTrustResolver = AuthenticationTrustResolverImpl()
    
    /**
     * Spring Security 6.x compatibility method.
     * @EnableMethodSecurity calls this new method instead of the old createSecurityExpressionRoot.
     * This method delegates to the existing createEvaluationContext for compatibility.
     * 
     * @param authentication Supplier of the current authentication object
     * @param invocation The method being invoked
     * @return EvaluationContext with our custom expression root
     */
    override fun createEvaluationContext(
        authentication: Supplier<Authentication>,
        invocation: MethodInvocation
    ): EvaluationContext {
        println("====== CustomMethodSecurityExpressionHandler: createEvaluationContext called (Spring Security 6.x) ======")
        println("====== Method: ${invocation.method.name} on ${invocation.method.declaringClass.simpleName} ======")
        println("====== Authentication supplier: ${authentication} ======")
        System.err.println("====== CustomMethodSecurityExpressionHandler: createEvaluationContext called ======")
        System.err.println("====== Method: ${invocation.method.name} ======")
        println("====== Delegating to createEvaluationContext(Authentication, MethodInvocation) ======")
        return createEvaluationContext(authentication.get(), invocation)
    }

    /**
     * Creates a custom security expression root with our domain-specific methods.
     * This is the legacy Spring Security 5.x method that we still use internally.
     * 
     * @param authentication The current authentication object
     * @param invocation The method being invoked
     * @return Custom expression root with additional authorization methods
     */
    override fun createSecurityExpressionRoot(
        authentication: Authentication,
        invocation: MethodInvocation
    ): MethodSecurityExpressionOperations {
        println("====== CustomMethodSecurityExpressionHandler: createSecurityExpressionRoot called ======")
        println("Authentication: ${authentication.javaClass.simpleName}, Principal: ${authentication.principal?.javaClass?.simpleName}")
        println("Method: ${invocation.method.name} on ${invocation.method.declaringClass.simpleName}")
        println("Method parameters: ${invocation.arguments?.joinToString { it?.javaClass?.simpleName ?: "null" }}")
        System.err.println("====== CustomMethodSecurityExpressionHandler: createSecurityExpressionRoot called ======")
        System.err.println("====== Method: ${invocation.method.name} ======")
        
        val root = CustomMethodSecurityExpressionRoot(
            authentication,
            authorizationProvider,
            tenantContextService
        )
        
        // Set the target object (the object on which the method is being called)
        root.setThis(invocation.`this`)
        
        // Set the permission evaluator (if configured)
        root.setPermissionEvaluator(permissionEvaluator)
        
        // Set the trust resolver for authentication checks
        root.setTrustResolver(trustResolver)
        
        // Set role hierarchy if configured
        roleHierarchy?.let { root.setRoleHierarchy(it) }
        
        return root
    }
}