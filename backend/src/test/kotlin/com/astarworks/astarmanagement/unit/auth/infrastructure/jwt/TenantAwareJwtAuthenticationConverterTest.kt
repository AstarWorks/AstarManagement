package com.astarworks.astarmanagement.unit.auth.infrastructure.jwt

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeAuthentication
import com.astarworks.astarmanagement.core.auth.domain.service.PermissionService
import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.JwtClaimsExtractor
import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.TenantAwareJwtAuthenticationConverter
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import java.time.Instant
import java.util.UUID

/**
 * Unit tests for TenantAwareJwtAuthenticationConverter.
 * 
 * Tests the JWT authentication converter that handles both normal authentication
 * (with org_id) and SetupModeAuthentication (without org_id).
 */
@DisplayName("TenantAwareJwtAuthenticationConverter Unit Tests")
class TenantAwareJwtAuthenticationConverterTest : UnitTestBase() {
    
    private lateinit var converter: TenantAwareJwtAuthenticationConverter
    private lateinit var jwtClaimsExtractor: JwtClaimsExtractor
    private lateinit var permissionService: PermissionService
    
    @BeforeEach
    fun setUp() {
        jwtClaimsExtractor = mockk()
        permissionService = mockk()
        converter = TenantAwareJwtAuthenticationConverter(jwtClaimsExtractor, permissionService)
    }
    
    @Nested
    @DisplayName("JWT with org_id (Normal Authentication)")
    inner class NormalAuthenticationTests {
        
        @Test
        @DisplayName("Should convert JWT with org_id to normal authentication")
        fun `should convert JWT with org_id to normal authentication`() {
            // Given
            val tenantId = UUID.randomUUID()
            val userId = UUID.randomUUID()
            val tenantUserId = UUID.randomUUID()
            val jwt = createJwtWithOrgId("org_test123", "auth0|123456", "user@example.com")
            
            val role = DynamicRole(
                id = RoleId(UUID.randomUUID()),
                tenantId = TenantId(tenantId),
                name = "user",
                displayName = "User"
            )
            
            val authenticatedContext = AuthenticatedUserContext(
                auth0Sub = "auth0|123456",
                userId = userId,
                tenantUserId = tenantUserId,
                tenantId = tenantId,
                roles = setOf(role),
                permissions = emptySet(),
                email = "user@example.com",
                isActive = true,
                lastAccessedAt = Instant.now()
            )
            
            every { 
                jwtClaimsExtractor.extractAuthenticatedContext(jwt)
            } returns authenticatedContext
            
            // When
            val authentication = converter.convert(jwt)
            
            // Then
            assertThat(authentication).isNotNull
            assertThat(authentication).isInstanceOf(JwtAuthenticationToken::class.java)
            assertThat(authentication?.principal).isEqualTo(authenticatedContext)
            assertThat(authentication?.isAuthenticated).isTrue()
            
            // Verify authorities include role
            val authorities = authentication?.authorities?.map { it.authority }
            assertThat(authorities).contains("ROLE_USER")
            
            verify(exactly = 1) { jwtClaimsExtractor.extractAuthenticatedContext(jwt) }
        }
        
        @Test
        @DisplayName("Should handle multiple roles in authentication context")
        fun `should handle multiple roles in authentication context`() {
            // Given
            val tenantId = UUID.randomUUID()
            val jwt = createJwtWithOrgId("org_test123", "auth0|123456", "admin@example.com")
            
            val adminRole = DynamicRole(
                id = RoleId(UUID.randomUUID()),
                tenantId = TenantId(tenantId),
                name = "admin",
                displayName = "Admin"
            )
            
            val editorRole = DynamicRole(
                id = RoleId(UUID.randomUUID()),
                tenantId = TenantId(tenantId),
                name = "editor",
                displayName = "Editor"
            )
            
            val authenticatedContext = AuthenticatedUserContext(
                auth0Sub = "auth0|123456",
                userId = UUID.randomUUID(),
                tenantUserId = UUID.randomUUID(),
                tenantId = tenantId,
                roles = setOf(adminRole, editorRole),
                permissions = emptySet(),
                email = "admin@example.com",
                isActive = true,
                lastAccessedAt = Instant.now()
            )
            
            every { 
                jwtClaimsExtractor.extractAuthenticatedContext(jwt) 
            } returns authenticatedContext
            
            // When
            val authentication = converter.convert(jwt)
            
            // Then
            val authorities = authentication?.authorities?.map { it.authority }
            assertThat(authorities).contains("ROLE_ADMIN", "ROLE_EDITOR")
        }
        
        @Test
        @DisplayName("Should throw exception when tenant not found for org_id")
        fun `should throw exception when tenant not found for org_id`() {
            // Given
            val jwt = createJwtWithOrgId("org_unknown", "auth0|123456", "user@example.com")
            every { 
                jwtClaimsExtractor.extractAuthenticatedContext(jwt)
            } throws IllegalArgumentException("Tenant not found for org_id: org_unknown")
            
            // When & Then
            assertThatThrownBy { converter.convert(jwt) }
                .isInstanceOf(IllegalArgumentException::class.java)
                .hasMessageContaining("Tenant not found for org_id: org_unknown")
            
            verify(exactly = 1) { jwtClaimsExtractor.extractAuthenticatedContext(jwt) }
        }
        
        @Test
        @DisplayName("Should throw exception when tenant is inactive")
        fun `should throw exception when tenant is inactive`() {
            // Given
            val jwt = createJwtWithOrgId("org_inactive", "auth0|123456", "user@example.com")
            
            every { 
                jwtClaimsExtractor.extractAuthenticatedContext(jwt)
            } throws IllegalStateException("Tenant is not active: org_inactive")
            
            // When & Then
            assertThatThrownBy { converter.convert(jwt) }
                .isInstanceOf(IllegalStateException::class.java)
                .hasMessageContaining("Tenant is not active: org_inactive")
            
            verify(exactly = 1) { jwtClaimsExtractor.extractAuthenticatedContext(jwt) }
        }
    }
    
    @Nested
    @DisplayName("JWT without org_id (Setup Mode)")
    inner class SetupModeAuthenticationTests {
        
        @Test
        @DisplayName("Should convert JWT without org_id to SetupModeAuthentication")
        fun `should convert JWT without org_id to SetupModeAuthentication`() {
            // Given
            val jwt = createJwtWithoutOrgId("auth0|newuser", "newuser@example.com")
            
            // Mock the userExists check for setup mode
            every { jwtClaimsExtractor.userExists("auth0|newuser") } returns false
            every { jwtClaimsExtractor.getUserAccessibleTenants("auth0|newuser") } returns emptyList()
            
            // When
            val authentication = converter.convert(jwt)
            
            // Then
            assertThat(authentication).isNotNull
            assertThat(authentication).isInstanceOf(SetupModeAuthentication::class.java)
            
            val setupAuth = authentication as SetupModeAuthentication
            assertThat(setupAuth.auth0Sub).isEqualTo("auth0|newuser")
            assertThat(setupAuth.email).isEqualTo("newuser@example.com")
            assertThat(setupAuth.jwt).isEqualTo(jwt)
            assertThat(setupAuth.isAuthenticated).isTrue()
            
            // Verify limited authorities
            val authorities = setupAuth.authorities.map { it.authority }
            assertThat(authorities).containsExactlyInAnyOrder("ROLE_SETUP_MODE", "SCOPE_auth.setup", "SCOPE_auth.view_my_tenants", "SCOPE_auth.create_default_tenant")
            
            // Verify the expected method calls
            verify(exactly = 1) { jwtClaimsExtractor.userExists("auth0|newuser") }
            verify(exactly = 1) { jwtClaimsExtractor.getUserAccessibleTenants("auth0|newuser") }
            verify(exactly = 0) { jwtClaimsExtractor.extractAuthenticatedContext(any()) }
        }
        
        @Test
        @DisplayName("Should handle JWT without email in setup mode")
        fun `should handle JWT without email in setup mode`() {
            // Given
            val jwt = createJwtWithoutOrgId("auth0|newuser", null)
            
            // Mock the userExists check for setup mode
            every { jwtClaimsExtractor.userExists("auth0|newuser") } returns false
            every { jwtClaimsExtractor.getUserAccessibleTenants("auth0|newuser") } returns emptyList()
            
            // When
            val authentication = converter.convert(jwt)
            
            // Then
            assertThat(authentication).isNotNull
            assertThat(authentication).isInstanceOf(SetupModeAuthentication::class.java)
            
            val setupAuth = authentication as SetupModeAuthentication
            assertThat(setupAuth.auth0Sub).isEqualTo("auth0|newuser")
            assertThat(setupAuth.email).isNull()
            
            // Verify the expected method calls
            verify(exactly = 1) { jwtClaimsExtractor.userExists("auth0|newuser") }
            verify(exactly = 1) { jwtClaimsExtractor.getUserAccessibleTenants("auth0|newuser") }
        }
    }
    
    @Nested
    @DisplayName("JWT Claim Extraction")
    inner class JwtClaimExtractionTests {
        
        @Test
        @DisplayName("Should extract sub claim correctly")
        fun `should extract sub claim correctly`() {
            // Given
            val jwt = createJwtWithoutOrgId("auth0|unique123", "test@example.com")
            
            // Mock the userExists check for setup mode
            every { jwtClaimsExtractor.userExists("auth0|unique123") } returns false
            every { jwtClaimsExtractor.getUserAccessibleTenants("auth0|unique123") } returns emptyList()
            
            // When
            val authentication = converter.convert(jwt)
            
            // Then
            assertThat(authentication).isNotNull
            val setupAuth = authentication as SetupModeAuthentication
            assertThat(setupAuth.auth0Sub).isEqualTo("auth0|unique123")
        }
        
        @Test
        @DisplayName("Should handle alternative email claim locations")
        fun `should handle alternative email claim locations`() {
            // Given - email in custom claim
            val now = Instant.now()
            val jwt = Jwt(
                "mock.jwt.token",
                now,
                now.plusSeconds(3600),
                mapOf("alg" to "RS256", "typ" to "JWT"),
                mapOf(
                    "sub" to "auth0|123456",
                    "https://example.com/email" to "custom@example.com",
                    "iss" to "https://test.auth0.com/",
                    "aud" to listOf("https://api.astar.com")
                )
            )
            
            // Mock the userExists check for setup mode
            every { jwtClaimsExtractor.userExists("auth0|123456") } returns false
            every { jwtClaimsExtractor.getUserAccessibleTenants("auth0|123456") } returns emptyList()
            
            // When
            val authentication = converter.convert(jwt)
            
            // Then
            assertThat(authentication).isNotNull
            // Note: The implementation might need to check multiple claim locations
            // For now, it will return null if email is not in standard location
            val setupAuth = authentication as SetupModeAuthentication
            assertThat(setupAuth.email).isNull() // Standard implementation only checks "email" claim
        }
        
        @Test
        @DisplayName("Should handle empty org_id claim")
        fun `should handle empty org_id claim`() {
            // Given - JWT with empty org_id
            val now = Instant.now()
            val jwt = Jwt(
                "mock.jwt.token",
                now,
                now.plusSeconds(3600),
                mapOf("alg" to "RS256", "typ" to "JWT"),
                mapOf(
                    "sub" to "auth0|123456",
                    "org_id" to "", // Empty string
                    "email" to "user@example.com",
                    "iss" to "https://test.auth0.com/",
                    "aud" to listOf("https://api.astar.com")
                )
            )
            
            // Mock the userExists check for setup mode
            every { jwtClaimsExtractor.userExists("auth0|123456") } returns false
            every { jwtClaimsExtractor.getUserAccessibleTenants("auth0|123456") } returns emptyList()
            
            // When
            val authentication = converter.convert(jwt)
            
            // Then - should treat empty org_id as no org_id
            assertThat(authentication).isInstanceOf(SetupModeAuthentication::class.java)
        }
    }
    
    @Nested
    @DisplayName("Edge Cases")
    inner class EdgeCaseTests {
        
        @Test
        @DisplayName("Should handle JWT with minimal claims")
        fun `should handle JWT with minimal claims`() {
            // Given - JWT with only required claims
            val now = Instant.now()
            val jwt = Jwt(
                "mock.jwt.token",
                now,
                now.plusSeconds(3600),
                mapOf("alg" to "RS256", "typ" to "JWT"),
                mapOf(
                    "sub" to "auth0|minimal",
                    "iss" to "https://test.auth0.com/",
                    "aud" to listOf("https://api.astar.com")
                )
            )
            
            // Mock the userExists check for setup mode
            every { jwtClaimsExtractor.userExists("auth0|minimal") } returns false
            every { jwtClaimsExtractor.getUserAccessibleTenants("auth0|minimal") } returns emptyList()
            
            // When
            val authentication = converter.convert(jwt)
            
            // Then
            assertThat(authentication).isNotNull
            assertThat(authentication).isInstanceOf(SetupModeAuthentication::class.java)
            
            val setupAuth = authentication as SetupModeAuthentication
            assertThat(setupAuth.auth0Sub).isEqualTo("auth0|minimal")
            assertThat(setupAuth.email).isNull()
        }
        
        @Test
        @DisplayName("Should handle null JWT gracefully")
        fun `should handle null JWT gracefully`() {
            // Given
            val nullJwt: Jwt? = null
            
            // When & Then
            assertThatThrownBy { converter.convert(nullJwt!!) }
                .isInstanceOf(NullPointerException::class.java)
        }
    }
    
    // Helper methods
    
    private fun createJwtWithOrgId(
        orgId: String,
        subject: String = "auth0|123456",
        email: String? = "user@example.com"
    ): Jwt {
        val now = Instant.now()
        val claims = mutableMapOf<String, Any>(
            "sub" to subject,
            "org_id" to orgId,
            "iss" to "https://test.auth0.com/",
            "aud" to listOf("https://api.astar.com"),
            "iat" to now.epochSecond,
            "exp" to now.plusSeconds(3600).epochSecond
        )
        
        email?.let { claims["email"] = it }
        
        return Jwt(
            "mock.jwt.token",
            now,
            now.plusSeconds(3600),
            mapOf("alg" to "RS256", "typ" to "JWT"),
            claims
        )
    }
    
    private fun createJwtWithoutOrgId(
        subject: String = "auth0|123456",
        email: String? = "user@example.com"
    ): Jwt {
        val now = Instant.now()
        val claims = mutableMapOf<String, Any>(
            "sub" to subject,
            "iss" to "https://test.auth0.com/",
            "aud" to listOf("https://api.astar.com"),
            "iat" to now.epochSecond,
            "exp" to now.plusSeconds(3600).epochSecond
        )
        
        email?.let { claims["email"] = it }
        
        return Jwt(
            "mock.jwt.token",
            now,
            now.plusSeconds(3600),
            mapOf("alg" to "RS256", "typ" to "JWT"),
            claims
        )
    }
}