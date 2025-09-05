package com.astarworks.astarmanagement.unit.auth.infrastructure.security

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeAuthentication
import com.astarworks.astarmanagement.core.auth.infrastructure.security.CustomAuthorizationManager
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.security.authorization.AuthorizationDecision
import org.springframework.security.core.Authentication
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.security.web.access.intercept.RequestAuthorizationContext
import java.time.Instant
import java.util.UUID
import java.util.function.Supplier

/**
 * Unit tests for CustomAuthorizationManager.
 * 
 * Tests the flexible authorization logic that handles both SetupModeAuthentication
 * and normal authentication for different endpoints.
 */
@DisplayName("CustomAuthorizationManager Unit Tests")
class CustomAuthorizationManagerTest : UnitTestBase() {
    
    private lateinit var authorizationManager: CustomAuthorizationManager
    
    @BeforeEach
    fun setUp() {
        authorizationManager = CustomAuthorizationManager()
    }
    
    @Nested
    @DisplayName("Setup Mode Authentication")
    inner class SetupModeAuthenticationTests {
        
        @Test
        @DisplayName("Should allow access to /api/v1/auth/me with SetupModeAuthentication")
        fun `should allow access to auth me endpoint with setup mode`() {
            // Given
            val authentication = createSetupModeAuthentication()
            val request = MockHttpServletRequest("GET", "/api/v1/auth/me")
            val context = RequestAuthorizationContext(request)
            
            // When
            val decision = authorizationManager.authorize(
                Supplier { authentication },
                context
            )
            
            // Then
            assertThat(decision).isNotNull
            assertThat(decision).isInstanceOf(AuthorizationDecision::class.java)
            assertThat((decision as AuthorizationDecision).isGranted).isTrue()
        }
        
        @Test
        @DisplayName("Should allow access to /api/v1/auth/setup with SetupModeAuthentication")
        fun `should allow access to setup endpoint with setup mode`() {
            // Given
            val authentication = createSetupModeAuthentication()
            val request = MockHttpServletRequest("POST", "/api/v1/auth/setup")
            val context = RequestAuthorizationContext(request)
            
            // When
            val decision = authorizationManager.authorize(
                Supplier { authentication },
                context
            )
            
            // Then
            assertThat(decision).isNotNull
            assertThat((decision as AuthorizationDecision).isGranted).isTrue()
        }
        
        @Test
        @DisplayName("Should allow access to /api/v1/auth/setup/my-tenants with SetupModeAuthentication")
        fun `should allow access to my tenants endpoint with setup mode`() {
            // Given
            val authentication = createSetupModeAuthentication()
            val request = MockHttpServletRequest("GET", "/api/v1/auth/setup/my-tenants")
            val context = RequestAuthorizationContext(request)
            
            // When
            val decision = authorizationManager.authorize(
                Supplier { authentication },
                context
            )
            
            // Then
            assertThat(decision).isNotNull
            assertThat((decision as AuthorizationDecision).isGranted).isTrue()
        }
        
        @Test
        @DisplayName("Should deny access to business API with SetupModeAuthentication")
        fun `should deny access to business api with setup mode`() {
            // Given
            val authentication = createSetupModeAuthentication()
            val request = MockHttpServletRequest("GET", "/api/v1/workspaces")
            val context = RequestAuthorizationContext(request)
            
            // When
            val decision = authorizationManager.authorize(
                Supplier { authentication },
                context
            )
            
            // Then
            assertThat(decision).isNotNull
            assertThat((decision as AuthorizationDecision).isGranted).isFalse()
        }
        
        @Test
        @DisplayName("Should deny access to tenant API with SetupModeAuthentication")
        fun `should deny access to tenant api with setup mode`() {
            // Given
            val authentication = createSetupModeAuthentication()
            val request = MockHttpServletRequest("GET", "/api/v1/tenants")
            val context = RequestAuthorizationContext(request)
            
            // When
            val decision = authorizationManager.authorize(
                Supplier { authentication },
                context
            )
            
            // Then
            assertThat(decision).isNotNull
            assertThat((decision as AuthorizationDecision).isGranted).isFalse()
        }
        
        @Test
        @DisplayName("Should deny access to user management API with SetupModeAuthentication")
        fun `should deny access to user management api with setup mode`() {
            // Given
            val authentication = createSetupModeAuthentication()
            val request = MockHttpServletRequest("GET", "/api/v1/users")
            val context = RequestAuthorizationContext(request)
            
            // When
            val decision = authorizationManager.authorize(
                Supplier { authentication },
                context
            )
            
            // Then
            assertThat(decision).isNotNull
            assertThat((decision as AuthorizationDecision).isGranted).isFalse()
        }
    }
    
    @Nested
    @DisplayName("Normal JWT Authentication")
    inner class NormalAuthenticationTests {
        
        @Test
        @DisplayName("Should allow access to permitted auth endpoints with normal authentication")
        fun `should allow access to all auth endpoints with normal auth`() {
            // Given
            val authentication = createNormalAuthentication()
            val endpoints = listOf(
                "/api/v1/auth/me",
                "/api/v1/auth/claims",
                "/api/v1/auth/business-context",
                "/api/v1/auth/setup/my-tenants"
            )
            
            endpoints.forEach { endpoint ->
                // Given
                val request = MockHttpServletRequest("GET", endpoint)
                val context = RequestAuthorizationContext(request)
                
                // When
                val decision = authorizationManager.authorize(
                    Supplier { authentication },
                    context
                )
                
                // Then
                assertThat(decision)
                    .describedAs("Endpoint $endpoint should be accessible")
                    .isNotNull
                assertThat((decision as AuthorizationDecision).isGranted)
                    .describedAs("Endpoint $endpoint should be granted")
                    .isTrue()
            }
        }
        
        @Test
        @DisplayName("Should allow access to business APIs with normal authentication")
        fun `should allow access to business apis with normal auth`() {
            // Given
            val authentication = createNormalAuthentication()
            val businessEndpoints = listOf(
                "/api/v1/workspaces",
                "/api/v1/tables",
                "/api/v1/records",
                "/api/v1/tenants",
                "/api/v1/users"
            )
            
            businessEndpoints.forEach { endpoint ->
                // Given
                val request = MockHttpServletRequest("GET", endpoint)
                val context = RequestAuthorizationContext(request)
                
                // When
                val decision = authorizationManager.authorize(
                    Supplier { authentication },
                    context
                )
                
                // Then
                assertThat(decision).isNotNull
                assertThat((decision as AuthorizationDecision).isGranted)
                    .describedAs("Business endpoint $endpoint should be granted")
                    .isTrue()
            }
        }
    }
    
    @Nested
    @DisplayName("Unauthenticated Access")
    inner class UnauthenticatedAccessTests {
        
        @Test
        @DisplayName("Should deny access when authentication is not authenticated")
        fun `should deny access when not authenticated`() {
            // Given
            val authentication = mockk<Authentication>()
            every { authentication.isAuthenticated } returns false
            
            val request = MockHttpServletRequest("GET", "/api/v1/auth/me")
            val context = RequestAuthorizationContext(request)
            
            // When
            val decision = authorizationManager.authorize(
                Supplier { authentication },
                context
            )
            
            // Then
            assertThat(decision).isNotNull
            assertThat((decision as AuthorizationDecision).isGranted).isFalse()
        }
    }
    
    @Nested
    @DisplayName("Edge Cases")
    inner class EdgeCaseTests {
        
        @Test
        @DisplayName("Should handle paths with trailing slashes")
        fun `should handle paths with trailing slashes`() {
            // Given
            val authentication = createSetupModeAuthentication()
            val request = MockHttpServletRequest("POST", "/api/v1/auth/setup/")
            val context = RequestAuthorizationContext(request)
            
            // When
            val decision = authorizationManager.authorize(
                Supplier { authentication },
                context
            )
            
            // Then
            assertThat(decision).isNotNull
            assertThat((decision as AuthorizationDecision).isGranted).isTrue()
        }
        
        @Test
        @DisplayName("Should handle paths with query parameters")
        fun `should handle paths with query parameters`() {
            // Given
            val authentication = createSetupModeAuthentication()
            val request = MockHttpServletRequest("GET", "/api/v1/auth/me")
            request.queryString = "include=roles&expand=tenant"
            val context = RequestAuthorizationContext(request)
            
            // When
            val decision = authorizationManager.authorize(
                Supplier { authentication },
                context
            )
            
            // Then
            assertThat(decision).isNotNull
            assertThat((decision as AuthorizationDecision).isGranted).isTrue()
        }
        
        @Test
        @DisplayName("Should handle different HTTP methods")
        fun `should handle different HTTP methods`() {
            // Given
            val authentication = createSetupModeAuthentication()
            val methods = listOf("GET", "POST", "PUT", "DELETE", "PATCH")
            
            methods.forEach { method ->
                val request = MockHttpServletRequest(method, "/api/v1/auth/setup")
                val context = RequestAuthorizationContext(request)
                
                // When
                val decision = authorizationManager.authorize(
                    Supplier { authentication },
                    context
                )
                
                // Then
                assertThat(decision)
                    .describedAs("Method $method should be handled")
                    .isNotNull
                assertThat((decision as AuthorizationDecision).isGranted)
                    .describedAs("Method $method should be granted for setup endpoint")
                    .isTrue()
            }
        }
    }
    
    @Nested
    @DisplayName("Unknown Authentication Types")
    inner class UnknownAuthenticationTests {
        
        @Test
        @DisplayName("Should accept any authenticated request for /auth/me endpoint")
        fun `should accept any authenticated request for auth me endpoint`() {
            // Given - /auth/me is a generic authentication check endpoint
            val authentication = mockk<Authentication>()
            every { authentication.isAuthenticated } returns true
            every { authentication.principal } returns "unknown_principal"
            
            val request = MockHttpServletRequest("GET", "/api/v1/auth/me")
            val context = RequestAuthorizationContext(request)
            
            // When
            val decision = authorizationManager.authorize(
                Supplier { authentication },
                context
            )
            
            // Then - should allow access if authenticated (by design)
            assertThat(decision).isNotNull
            assertThat((decision as AuthorizationDecision).isGranted).isTrue()
        }
    }
    
    // Helper methods
    
    private fun createSetupModeAuthentication(): SetupModeAuthentication {
        val jwt = createMockJwt()
        return SetupModeAuthentication(
            jwt = jwt,
            auth0Sub = "auth0|123456",
            email = "user@example.com",
            authorities = listOf(SimpleGrantedAuthority("ROLE_SETUP_MODE"))
        )
    }
    
    private fun createNormalAuthentication(): JwtAuthenticationToken {
        val jwt = createMockJwt(withOrgId = true)
        val authorities = listOf(
            SimpleGrantedAuthority("ROLE_USER"),
            SimpleGrantedAuthority("SCOPE_read"),
            SimpleGrantedAuthority("SCOPE_write")
        )
        
        val principal = AuthenticatedUserContext(
            auth0Sub = "auth0|123456",
            userId = UUID.randomUUID(),
            tenantUserId = UUID.randomUUID(),
            tenantId = UUID.randomUUID(),
            roles = emptySet(),
            permissions = emptySet(),
            email = "user@example.com",
            isActive = true,
            lastAccessedAt = Instant.now()
        )
        
        return JwtAuthenticationToken(jwt, authorities).apply {
            details = principal
        }
    }
    
    private fun createMockJwt(withOrgId: Boolean = false): Jwt {
        val now = Instant.now()
        val claims = mutableMapOf<String, Any>(
            "sub" to "auth0|123456",
            "iss" to "https://test.auth0.com/",
            "aud" to listOf("https://api.astar.com"),
            "iat" to now.epochSecond,
            "exp" to now.plusSeconds(3600).epochSecond,
            "email" to "user@example.com"
        )
        
        if (withOrgId) {
            claims["org_id"] = "org_test123"
        }
        
        return Jwt(
            "mock.jwt.token",
            now,
            now.plusSeconds(3600),
            mapOf("alg" to "RS256", "typ" to "JWT"),
            claims
        )
    }
}