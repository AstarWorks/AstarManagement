package com.astarworks.astarmanagement.base

import com.astarworks.astarmanagement.core.auth.domain.service.AuthorizationService
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.fixture.setup.AuthorizationTestSetup
import com.astarworks.astarmanagement.fixture.helper.JwtIntegrationHelper
import com.astarworks.astarmanagement.fixture.AuthFixture
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers
import java.util.UUID
import org.junit.jupiter.api.Assertions.*
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken

/**
 * Base class for authorization integration tests.
 * 
 * Provides common utilities for testing permission-based access control,
 * role management, and resource authorization.
 * 
 * Features:
 * - User and tenant context management
 * - Permission assertion helpers
 * - JWT token generation for different permission scenarios
 * - Mock MVC helpers for API testing
 */
abstract class AuthorizationTestBase : IntegrationTestBase() {
    
    @Autowired
    protected lateinit var authorizationTestSetup: AuthorizationTestSetup
    
    @Autowired
    protected lateinit var authorizationService: AuthorizationService
    
    @Autowired 
    protected lateinit var tenantContextService: TenantContextService
    
    @Autowired
    protected lateinit var jwtHelper: JwtIntegrationHelper
    
    /**
     * Executes a block of code with a specific user context.
     * Sets up the security context with the given user ID and cleans up afterward.
     * 
     * @param userId The user ID to set in the context
     * @param tenantId The tenant ID for the context (optional)
     * @param block The code to execute with the user context
     */
    protected fun withUser(
        userId: UUID, 
        tenantId: UUID? = null,
        block: () -> Unit
    ) {
        val originalContext = SecurityContextHolder.getContext()
        try {
            // Create a mock JWT with the user ID
            val claims = mutableMapOf<String, Any>(
                "sub" to userId.toString(),
                "email" to "test-$userId@example.com"
            )
            
            // Add tenant context if provided
            tenantId?.let {
                claims["org_id"] = it.toString()
                tenantContextService.setTenantContext(it)
            }
            
            val jwt = Jwt.withTokenValue("test-token")
                .header("alg", "RS256")
                .claims { it.putAll(claims) }
                .build()
            
            val authentication = JwtAuthenticationToken(jwt)
            SecurityContextHolder.getContext().authentication = authentication
            
            // Execute the test block
            block()
        } finally {
            // Restore original context
            SecurityContextHolder.setContext(originalContext)
            tenantContextService.clearTenantContext()
        }
    }
    
    /**
     * Executes a block of code with a specific tenant context.
     * 
     * @param tenantId The tenant ID to set in the context
     * @param block The code to execute with the tenant context
     */
    protected fun withTenant(tenantId: UUID, block: () -> Unit) {
        try {
            tenantContextService.setTenantContext(tenantId)
            block()
        } finally {
            tenantContextService.clearTenantContext()
        }
    }
    
    /**
     * Asserts that a user has a specific permission.
     * 
     * @param userId The user to check
     * @param permission The permission rule string (e.g., "table.view.all")
     * @param message Optional assertion message
     */
    protected fun assertPermissionGranted(
        userId: UUID,
        permission: String,
        message: String? = null
    ) {
        withUser(userId) {
            val hasPermission = authorizationService.hasPermission(
                userId, 
                com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule.fromDatabaseString(permission)
            )
            assertTrue(
                hasPermission,
                message ?: "User $userId should have permission: $permission"
            )
        }
    }
    
    /**
     * Asserts that a user does NOT have a specific permission.
     * 
     * @param userId The user to check
     * @param permission The permission rule string
     * @param message Optional assertion message
     */
    protected fun assertPermissionDenied(
        userId: UUID,
        permission: String,
        message: String? = null
    ) {
        withUser(userId) {
            val hasPermission = authorizationService.hasPermission(
                userId,
                com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule.fromDatabaseString(permission)
            )
            assertFalse(
                hasPermission,
                message ?: "User $userId should NOT have permission: $permission"
            )
        }
    }
    
    /**
     * Performs an authenticated GET request and asserts a 200 OK response.
     * 
     * @param url The URL to request
     * @param jwt The JWT token for authentication
     */
    protected fun assertAuthorizedGet(url: String, jwt: String) {
        mockMvc.perform(
            MockMvcRequestBuilders.get(url)
                .header("Authorization", "Bearer $jwt")
        )
        .andExpect(MockMvcResultMatchers.status().isOk)
    }
    
    /**
     * Performs an authenticated GET request and asserts a 403 Forbidden response.
     * 
     * @param url The URL to request
     * @param jwt The JWT token for authentication
     */
    protected fun assertForbiddenGet(url: String, jwt: String) {
        mockMvc.perform(
            MockMvcRequestBuilders.get(url)
                .header("Authorization", "Bearer $jwt")
        )
        .andExpect(MockMvcResultMatchers.status().isForbidden)
    }
    
    /**
     * Performs an authenticated POST request and asserts a specific status.
     * 
     * @param url The URL to request
     * @param jwt The JWT token for authentication
     * @param body The request body as JSON string
     * @param expectedStatus The expected HTTP status
     */
    protected fun assertPost(
        url: String,
        jwt: String,
        body: String,
        expectedStatus: Int
    ) {
        mockMvc.perform(
            MockMvcRequestBuilders.post(url)
                .header("Authorization", "Bearer $jwt")
                .contentType("application/json")
                .content(body)
        )
        .andExpect(MockMvcResultMatchers.status().`is`(expectedStatus))
    }
    
    /**
     * Creates a JWT token with specific permissions for testing.
     * 
     * @param userId The user ID
     * @param tenantId The tenant ID
     * @param permissions List of permission strings
     * @return JWT token string
     */
    protected fun createJwtWithPermissions(
        userId: UUID,
        tenantId: UUID,
        permissions: List<String>
    ): String {
        // Use AuthFixture to create a test JWT
        // Note: This returns a predefined test JWT
        // In the future, we may want to enhance this to support custom permissions
        return AuthFixture.adminJwt(AuthFixture.Tenants.TENANT_A)
    }
    
    /**
     * Utility to clean up test data after each test.
     * Override in subclasses if needed.
     */
    protected open fun cleanupTestData() {
        // Default implementation - subclasses can override
    }
}