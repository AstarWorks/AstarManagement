package com.astarworks.astarmanagement.core.infrastructure.security

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.TestPropertySource
import java.time.Instant

/**
 * Integration test for JWT Claims Extraction functionality.
 * 
 * This test replicates the manual script-like testing we performed to verify
 * the complete authentication flow from JWT token generation to business context extraction.
 * 
 * Instead of using MockMvc (which has JWT validation issues in test environment),
 * this test focuses on testing the core JWT claims extraction logic directly.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = [
    "auth.mock.enabled=true"
])
class JwtClaimsExtractionIntegrationTest {

    @Autowired
    private lateinit var jwtClaimsExtractor: JwtClaimsExtractor

    @Test
    fun `should extract business context from JWT token successfully`() {
        // 1. Create a test JWT with the expected claims (simulating MockAuthService token)
        val jwt = createTestJwt(
            subject = "mock-user-12345",
            orgId = "test-tenant-123",
            customTenantId = "custom-tenant-456",
            roles = listOf("ADMIN", "USER")
        )
        
        // 2. Test JWT claims extraction directly (core functionality)
        val businessContext = jwtClaimsExtractor.extractBusinessContext(jwt)
        
        // 3. Verify business context extraction (same verification as manual test)
        assertThat(businessContext.userId).isEqualTo("mock-user-12345")
        assertThat(businessContext.tenantId).isEqualTo("test-tenant-123")
        assertThat(businessContext.roles).containsExactlyInAnyOrder(
            BusinessRole.ADMIN, 
            BusinessRole.USER
        )
    }
    
    @Test
    fun `should handle missing tenant claims gracefully`() {
        // Test JWT without org_id - should use custom_tenant_id as fallback
        val jwt = createTestJwt(
            subject = "mock-user-12345",
            orgId = null, // No org_id
            customTenantId = "custom-tenant-456",
            roles = listOf("USER")
        )
        
        val businessContext = jwtClaimsExtractor.extractBusinessContext(jwt)
        
        // Should fallback to custom tenant claim
        assertThat(businessContext.tenantId).isEqualTo("custom-tenant-456")
        assertThat(businessContext.userId).isEqualTo("mock-user-12345")
        assertThat(businessContext.roles).containsExactlyInAnyOrder(BusinessRole.USER)
    }
    
    @Test
    fun `should prioritize org_id over custom tenant claim`() {
        // Test JWT with both org_id and custom_tenant_id - org_id should take precedence
        val jwt = createTestJwt(
            subject = "mock-user-12345",
            orgId = "test-tenant-123",
            customTenantId = "custom-tenant-456",
            roles = listOf("ADMIN")
        )
        
        val businessContext = jwtClaimsExtractor.extractBusinessContext(jwt)
        
        // Should prioritize org_id over custom tenant claim
        assertThat(businessContext.tenantId).isEqualTo("test-tenant-123")
    }
    
    @Test
    fun `should map Auth0 roles to business roles correctly`() {
        // Test various role mappings including case insensitive mapping
        val jwt = createTestJwt(
            subject = "mock-user-12345",
            orgId = "test-tenant-123",
            customTenantId = null,
            roles = listOf("admin", "user", "viewer", "unknown_role")
        )
        
        val businessContext = jwtClaimsExtractor.extractBusinessContext(jwt)
        
        // Should map roles correctly and ignore unknown roles
        assertThat(businessContext.roles).hasSize(3) // unknown_role should be filtered out
        assertThat(businessContext.roles).containsExactlyInAnyOrder(
            BusinessRole.ADMIN, 
            BusinessRole.USER, 
            BusinessRole.VIEWER
        )
    }
    
    @Test
    fun `should handle completely missing tenant claims`() {
        // Test JWT without any tenant claims
        val jwt = createTestJwt(
            subject = "mock-user-12345",
            orgId = null,
            customTenantId = null,
            roles = listOf("USER")
        )
        
        val businessContext = jwtClaimsExtractor.extractBusinessContext(jwt)
        
        // Should handle missing tenant claims gracefully
        assertThat(businessContext.tenantId).isNull()
        assertThat(businessContext.userId).isEqualTo("mock-user-12345")
        assertThat(businessContext.roles).containsExactlyInAnyOrder(BusinessRole.USER)
    }

    /**
     * Helper method to create a Spring Security JWT object for testing.
     * This simulates what Spring Security would create from a real JWT token.
     */
    private fun createTestJwt(
        subject: String,
        orgId: String? = null,
        customTenantId: String? = null,
        roles: List<String> = emptyList()
    ): Jwt {
        val headers = mutableMapOf<String, Any>(
            "alg" to "RS256",
            "typ" to "JWT"
        )
        
        val now = Instant.now()
        val claims = mutableMapOf<String, Any>(
            "sub" to subject,
            "iss" to "http://localhost:8080/mock-auth",
            "aud" to "local-dev-api",
            "iat" to now,
            "exp" to now.plusSeconds(3600),
            "email" to "test@example.com",
            "name" to "Test User",
            "email_verified" to true
        )
        
        // Add tenant claims if provided
        orgId?.let { claims["org_id"] = it }
        customTenantId?.let { claims["https://your-app.com/tenant_id"] = it }
        
        // Add roles if provided
        if (roles.isNotEmpty()) {
            claims["https://your-app.com/roles"] = roles
        }
        
        return Jwt.withTokenValue("test-jwt-token")
            .headers { it.putAll(headers) }
            .claims { it.putAll(claims) }
            .build()
    }
}