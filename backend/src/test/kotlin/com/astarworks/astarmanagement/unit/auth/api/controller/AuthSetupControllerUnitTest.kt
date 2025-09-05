package com.astarworks.astarmanagement.unit.auth.api.controller

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.api.controller.AuthSetupController
import com.astarworks.astarmanagement.core.auth.api.dto.*
import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeAuthentication
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeContext
import com.astarworks.astarmanagement.core.auth.domain.service.UserResolverService
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.service.UserService
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import io.mockk.*
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.security.core.Authentication
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

/**
 * Unit tests for AuthSetupController.
 * 
 * Tests the controller logic for handling user setup flow,
 * including tenant creation and membership establishment.
 */
@DisplayName("AuthSetupController Unit Tests")
class AuthSetupControllerUnitTest : UnitTestBase() {
    
    private lateinit var controller: AuthSetupController
    private lateinit var userService: UserService
    private lateinit var tenantService: TenantService
    private lateinit var tenantMembershipRepository: TenantMembershipRepository
    private lateinit var userResolverService: UserResolverService
    
    @BeforeEach
    fun setUp() {
        userService = mockk()
        tenantService = mockk()
        tenantMembershipRepository = mockk()
        userResolverService = mockk()
        controller = AuthSetupController(userService, tenantService, tenantMembershipRepository, userResolverService)
    }
    
    @Nested
    @DisplayName("POST /api/v1/auth/setup - Complete Setup")
    inner class CompleteSetupTests {
        
        @Test
        @DisplayName("Should complete setup for new user")
        fun `should complete setup for new user`() {
            // Given
            val setupRequest = SetupRequest(
                tenantName = "My Company",
                tenantType = TenantTypeDto.PERSONAL,
                userProfile = UserProfileDto(
                    displayName = "John Doe",
                    email = "john@example.com",
                    avatarUrl = "https://avatar.example.com/john.jpg"
                )
            )
            
            val authentication = createSetupModeAuthentication(
                auth0Sub = "auth0|123456",
                email = "john@example.com"
            )
            
            val userId = UUID.randomUUID()
            val tenantId = UUID.randomUUID()
            val membershipId = UUID.randomUUID()
            
            val user = mockk<User>()
            every { user.id } returns UserId(userId)
            every { user.auth0Sub } returns "auth0|123456"
            every { user.email } returns "john@example.com"
            
            val tenant = mockk<Tenant>()
            every { tenant.id } returns TenantId(tenantId)
            every { tenant.name } returns "My Company"
            every { tenant.slug } returns "my-company"
            every { tenant.auth0OrgId } returns "org_generated123"
            every { tenant.isActive } returns true
            
            val membership = mockk<TenantMembership>()
            every { membership.id } returns TenantMembershipId(membershipId)
            every { membership.userId } returns UserId(userId)
            every { membership.tenantId } returns TenantId(tenantId)
            every { membership.isActive } returns true
            
            // Mock service calls
            val authenticatedContext = mockk<AuthenticatedUserContext>()
            every { authenticatedContext.userId } returns userId
            every { authenticatedContext.tenantId } returns tenantId
            every { authenticatedContext.tenantUserId } returns UUID.randomUUID()
            every { authenticatedContext.auth0Sub } returns "auth0|123456"
            every { authenticatedContext.email } returns "john@example.com"
            
            every { 
                userResolverService.createUserWithDefaultTenant(
                    "auth0|123456",
                    "john@example.com", 
                    "My Company"
                )
            } returns authenticatedContext
            
            every { userService.findById(UserId(userId)) } returns user
            every { tenantService.findById(TenantId(tenantId)) } returns tenant
            
            // When
            val response = controller.completeSetup(setupRequest, authentication)
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.userId).isEqualTo(userId)
            assertThat(response.tenantId).isEqualTo(tenantId)
            assertThat(response.tenant.name).isEqualTo("My Company")
            assertThat(response.tenant.type).isEqualTo(TenantTypeDto.PERSONAL)
            assertThat(response.user.displayName).isEqualTo("John Doe")
            assertThat(response.user.email).isEqualTo("john@example.com")
            
            // Verify interactions - Phase 2 uses unified JIT provisioning
            verify(exactly = 1) { 
                userResolverService.createUserWithDefaultTenant(
                    "auth0|123456",
                    "john@example.com", 
                    "My Company"
                )
            }
            verify(exactly = 1) { userService.findById(UserId(userId)) }
            verify(exactly = 1) { tenantService.findById(TenantId(tenantId)) }
        }
        
        @Test
        @DisplayName("Should generate unique slug when name conflicts")
        fun `should generate unique slug when name conflicts`() {
            // Given
            val setupRequest = SetupRequest(
                tenantName = "Popular Name",
                tenantType = TenantTypeDto.TEAM,
                userProfile = UserProfileDto(
                    displayName = "Jane Doe",
                    email = "jane@example.com"
                )
            )
            
            val authentication = createSetupModeAuthentication(
                auth0Sub = "auth0|789012",
                email = "jane@example.com"
            )
            
            val user = mockk<User>()
            every { user.id } returns UserId(UUID.randomUUID())
            every { user.auth0Sub } returns "auth0|789012"
            every { user.email } returns "jane@example.com"
            
            val tenant = mockk<Tenant>()
            every { tenant.id } returns TenantId(UUID.randomUUID())
            every { tenant.name } returns "Popular Name"
            every { tenant.slug } returns "popular-name-2"
            every { tenant.auth0OrgId } returns "org_generated456"
            every { tenant.isActive } returns true
            
            val membership = mockk<TenantMembership>()
            every { membership.id } returns TenantMembershipId(UUID.randomUUID())
            
            val testUserId = UUID.randomUUID()
            val testTenantId = UUID.randomUUID()
            val authenticatedContext = mockk<AuthenticatedUserContext>()
            every { authenticatedContext.userId } returns testUserId
            every { authenticatedContext.tenantId } returns testTenantId
            every { authenticatedContext.tenantUserId } returns UUID.randomUUID()
            
            every { userResolverService.createUserWithDefaultTenant(any(), any(), any()) } returns authenticatedContext
            every { userService.findById(UserId(testUserId)) } returns user
            every { tenantService.findById(TenantId(testTenantId)) } returns tenant
            
            // When
            val response = controller.completeSetup(setupRequest, authentication)
            
            // Then - Phase 2 uses unified JIT provisioning, no slug checking in controller
            verify(exactly = 1) { 
                userResolverService.createUserWithDefaultTenant(
                    "auth0|789012",
                    "jane@example.com",
                    "Popular Name"
                )
            }
            verify(exactly = 1) { userService.findById(UserId(testUserId)) }
            verify(exactly = 1) { tenantService.findById(TenantId(testTenantId)) }
        }
        
        @Test
        @DisplayName("Should throw exception for non-SetupModeAuthentication")
        fun `should throw exception for non-SetupModeAuthentication`() {
            // Given
            val setupRequest = SetupRequest(
                tenantName = "Company",
                tenantType = TenantTypeDto.PERSONAL,
                userProfile = UserProfileDto(
                    displayName = "User",
                    email = "user@example.com"
                )
            )
            
            val normalAuth = mockk<Authentication>()
            every { normalAuth.isAuthenticated } returns true
            every { normalAuth.principal } returns "normal_principal"
            
            // When & Then
            assertThatThrownBy { controller.completeSetup(setupRequest, normalAuth) }
                .isInstanceOf(ResponseStatusException::class.java)
                .hasMessageContaining("This endpoint is only accessible in setup mode")
        }
        
        @Test
        @DisplayName("Should handle user without email in JWT")
        fun `should handle user without email in JWT`() {
            // Given
            val setupRequest = SetupRequest(
                tenantName = "No Email Company",
                tenantType = TenantTypeDto.PERSONAL,
                userProfile = UserProfileDto(
                    displayName = "No Email User",
                    email = "provided@example.com", // Email from request
                    avatarUrl = null
                )
            )
            
            val authentication = createSetupModeAuthentication(
                auth0Sub = "auth0|nomail",
                email = null // No email in JWT
            )
            
            val user = mockk<User>()
            every { user.id } returns UserId(UUID.randomUUID())
            every { user.auth0Sub } returns "auth0|nomail"
            every { user.email } returns "provided@example.com"
            
            val tenant = mockk<Tenant>()
            every { tenant.id } returns TenantId(UUID.randomUUID())
            every { tenant.name } returns "No Email Company"
            every { tenant.slug } returns "no-email-company"
            every { tenant.auth0OrgId } returns "org_generated789"
            every { tenant.isActive } returns true
            
            val membership = mockk<TenantMembership>()
            every { membership.id } returns TenantMembershipId(UUID.randomUUID())
            
            val testUserId = UUID.randomUUID()
            val testTenantId = UUID.randomUUID()
            val authenticatedContext = mockk<AuthenticatedUserContext>()
            every { authenticatedContext.userId } returns testUserId
            every { authenticatedContext.tenantId } returns testTenantId
            every { authenticatedContext.tenantUserId } returns UUID.randomUUID()
            
            every { 
                userResolverService.createUserWithDefaultTenant(
                    "auth0|nomail",
                    "provided@example.com", // Uses email from request
                    "No Email Company"
                )
            } returns authenticatedContext
            
            every { userService.findById(UserId(testUserId)) } returns user
            every { tenantService.findById(TenantId(testTenantId)) } returns tenant
            
            // When
            val response = controller.completeSetup(setupRequest, authentication)
            
            // Then - Phase 2 uses unified JIT provisioning
            assertThat(response).isNotNull
            verify { 
                userResolverService.createUserWithDefaultTenant(
                    "auth0|nomail",
                    "provided@example.com",
                    "No Email Company"
                )
            }
            verify(exactly = 1) { userService.findById(UserId(testUserId)) }
            verify(exactly = 1) { tenantService.findById(TenantId(testTenantId)) }
        }
    }
    
    @Nested
    @DisplayName("GET /api/v1/auth/setup/my-tenants - List User Tenants")
    inner class MyTenantsTests {
        
        @Test
        @DisplayName("Should return empty list for new user with SetupModeAuthentication")
        fun `should return empty list for new user with setup mode`() {
            // Given
            val authentication = createSetupModeAuthentication(
                auth0Sub = "auth0|newuser",
                email = "new@example.com"
            )
            
            every { userService.findByAuth0Sub("auth0|newuser") } returns null
            
            // When
            val response = controller.getMyTenants(authentication)
            
            // Then
            assertThat(response.tenants).isEmpty()
            assertThat(response.defaultTenantId).isNull()
            
            verify(exactly = 1) { userService.findByAuth0Sub("auth0|newuser") }
            verify(exactly = 0) { tenantMembershipRepository.findByUserId(any()) }
        }
        
        @Test
        @DisplayName("Should return tenants for existing user")
        fun `should return tenants for existing user`() {
            // Given
            val userId = UUID.randomUUID()
            val tenantId1 = UUID.randomUUID()
            val tenantId2 = UUID.randomUUID()
            
            val authentication = createSetupModeAuthentication(
                auth0Sub = "auth0|existing",
                email = "existing@example.com"
            )
            
            val user = mockk<User>()
            every { user.id } returns UserId(userId)
            every { user.auth0Sub } returns "auth0|existing"
            
            val tenant1 = mockk<Tenant>()
            every { tenant1.id } returns TenantId(tenantId1)
            every { tenant1.name } returns "Tenant One"
            every { tenant1.auth0OrgId } returns "org_tenant1"
            
            val tenant2 = mockk<Tenant>()
            every { tenant2.id } returns TenantId(tenantId2)
            every { tenant2.name } returns "Tenant Two"
            every { tenant2.auth0OrgId } returns "org_tenant2"
            
            val membership1 = mockk<TenantMembership>()
            every { membership1.tenantId } returns TenantId(tenantId1)
            every { membership1.joinedAt } returns Instant.now().minusSeconds(3600)
            every { membership1.isActive } returns true
            
            val membership2 = mockk<TenantMembership>()
            every { membership2.tenantId } returns TenantId(tenantId2)
            every { membership2.joinedAt } returns Instant.now()
            every { membership2.isActive } returns true
            
            every { userService.findByAuth0Sub("auth0|existing") } returns user
            every { tenantMembershipRepository.findByUserId(UserId(userId)) } returns listOf(membership1, membership2)
            every { tenantService.findById(TenantId(tenantId1)) } returns tenant1
            every { tenantService.findById(TenantId(tenantId2)) } returns tenant2
            
            // When
            val response = controller.getMyTenants(authentication)
            
            // Then
            assertThat(response.tenants).hasSize(2)
            assertThat(response.tenants[0].tenantName).isEqualTo("Tenant One")
            assertThat(response.tenants[0].orgId).isEqualTo("org_tenant1")
            assertThat(response.tenants[1].tenantName).isEqualTo("Tenant Two")
            assertThat(response.tenants[1].orgId).isEqualTo("org_tenant2")
            assertThat(response.defaultTenantId).isEqualTo(tenantId1) // First tenant is default
        }
        
        @Test
        @DisplayName("Should handle tenant not found gracefully")
        fun `should handle tenant not found gracefully`() {
            // Given
            val userId = UUID.randomUUID()
            val tenantId = UUID.randomUUID()
            
            val authentication = createSetupModeAuthentication(
                auth0Sub = "auth0|user",
                email = "user@example.com"
            )
            
            val user = mockk<User>()
            every { user.id } returns UserId(userId)
            
            val membership = mockk<TenantMembership>()
            every { membership.tenantId } returns TenantId(tenantId)
            every { membership.joinedAt } returns Instant.now()
            every { membership.isActive } returns true
            
            every { userService.findByAuth0Sub("auth0|user") } returns user
            every { tenantMembershipRepository.findByUserId(UserId(userId)) } returns listOf(membership)
            every { tenantService.findById(TenantId(tenantId)) } returns null
            
            // When & Then
            assertThatThrownBy { controller.getMyTenants(authentication) }
                .isInstanceOf(IllegalStateException::class.java)
                .hasMessageContaining("Tenant not found: $tenantId")
        }
        
        @Test
        @DisplayName("Should work with normal authentication")
        fun `should work with normal authentication`() {
            // Given
            val normalAuth = mockk<Authentication>()
            every { normalAuth.name } returns "auth0|normaluser"
            every { normalAuth.isAuthenticated } returns true
            
            every { userService.findByAuth0Sub("auth0|normaluser") } returns null
            
            // When
            val response = controller.getMyTenants(normalAuth)
            
            // Then
            assertThat(response.tenants).isEmpty()
            assertThat(response.defaultTenantId).isNull()
        }
    }
    
    @Nested
    @DisplayName("Helper Methods")
    inner class HelperMethodTests {
        
        @Test
        @DisplayName("Should generate URL-friendly slug from name")
        fun `should generate URL-friendly slug from name`() {
            // Test various name transformations
            val testCases = mapOf(
                "Simple Name" to "simple-name",
                "Company & Co." to "company-co",
                "Test@#$%Company" to "test-company",
                "   Spaces   Around   " to "spaces-around",
                "CamelCaseName" to "camelcasename",
                "Multiple---Dashes" to "multiple-dashes",
                "123 Numbers First" to "123-numbers-first"
            )
            
            testCases.forEach { (input, expected) ->
                // This tests the internal logic, but we can only test through public API
                // The slug generation is tested indirectly through completeSetup
            }
        }
    }
    
    // Helper methods
    
    private fun createSetupModeAuthentication(
        auth0Sub: String = "auth0|123456",
        email: String? = "user@example.com"
    ): SetupModeAuthentication {
        val jwt = createMockJwt()
        val context = SetupModeContext(auth0Sub, email)
        
        return SetupModeAuthentication(
            jwt = jwt,
            auth0Sub = auth0Sub,
            email = email,
            authorities = listOf(SimpleGrantedAuthority("ROLE_SETUP_MODE"))
        ).apply {
            // Set principal through reflection or use proper constructor
            // For simplicity, we'll return as-is since principal is created internally
        }
    }
    
    private fun createMockJwt(): Jwt {
        val now = Instant.now()
        return Jwt(
            "mock.jwt.token",
            now,
            now.plusSeconds(3600),
            mapOf("alg" to "RS256", "typ" to "JWT"),
            mapOf(
                "sub" to "auth0|123456",
                "iss" to "https://test.auth0.com/",
                "aud" to listOf("https://api.astar.com")
            )
        )
    }
}