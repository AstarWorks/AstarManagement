package com.astarworks.astarmanagement.unit.core.auth.infrastructure.jwt

import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.service.PermissionService
import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.JwtClaimsExtractor
import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.TenantAwareJwtAuthenticationConverter
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import io.mockk.*
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import java.util.*

/**
 * Unit tests for TenantAwareJwtAuthenticationConverter - MockK Version
 */
@DisplayName("TenantAwareJwtAuthenticationConverter Tests")
class TenantAwareJwtAuthenticationConverterTest {

    private val jwtClaimsExtractor = mockk<JwtClaimsExtractor>()
    private val permissionService = mockk<PermissionService>()
    
    private lateinit var converter: TenantAwareJwtAuthenticationConverter

    private val testTenantId = UUID.randomUUID()
    private val testUserId = UUID.randomUUID()
    private val testTenantUserId = UUID.randomUUID()
    private val testAuth0Sub = "auth0|123456"
    private val testEmail = "test@example.com"

    @BeforeEach
    fun setUp() {
        clearMocks(jwtClaimsExtractor, permissionService)
        converter = TenantAwareJwtAuthenticationConverter(jwtClaimsExtractor, permissionService)
    }

    @Test
    @DisplayName("Should convert JWT with single role and permissions")
    fun shouldConvertJwtWithSingleRoleAndPermissions() {
        // Given
        val jwt = JwtTestFixture.parseToSpringJwt(
            JwtTestFixture.createValidJwt(subject = testAuth0Sub)
        )

        val adminRole = DynamicRole(
            name = "admin",
            displayName = "Administrator",
            tenantId = TenantId(testTenantId),
            position = 100
        )

        val authenticatedContext = AuthenticatedUserContext(
            auth0Sub = testAuth0Sub,
            userId = testUserId,
            tenantUserId = testTenantUserId,
            tenantId = testTenantId,
            email = testEmail,
            roles = setOf(adminRole),
            permissions = emptySet()
        )

        every { jwtClaimsExtractor.extractAuthenticatedContext(jwt) } returns authenticatedContext

        // When
        val authToken = converter.convert(jwt)

        // Then
        assertThat(authToken).isNotNull
        assertThat(authToken).isInstanceOf(JwtAuthenticationToken::class.java)
        assertThat(authToken.principal).isEqualTo(authenticatedContext)
        assertThat(authToken.name).isEqualTo(testAuth0Sub)

        // Verify authorities
        val authorities = authToken.authorities
        assertThat(authorities).hasSize(1) // 1 role
        assertThat(authorities).contains(
            SimpleGrantedAuthority("ROLE_ADMIN")
        )
    }

    @Test
    @DisplayName("Should convert JWT with multiple roles")
    fun shouldConvertJwtWithMultipleRoles() {
        // Given
        val jwt = JwtTestFixture.parseToSpringJwt(
            JwtTestFixture.createValidJwt(subject = testAuth0Sub)
        )

        val roles = setOf(
            DynamicRole(
                name = "admin",
                tenantId = TenantId(testTenantId)
            ),
            DynamicRole(
                name = "manager",
                tenantId = TenantId(testTenantId)
            ),
            DynamicRole(
                name = "user",
                tenantId = TenantId(testTenantId)
            )
        )

        val authenticatedContext = AuthenticatedUserContext(
            auth0Sub = testAuth0Sub,
            userId = testUserId,
            tenantUserId = testTenantUserId,
            tenantId = testTenantId,
            roles = roles,
            permissions = emptySet()
        )

        every { jwtClaimsExtractor.extractAuthenticatedContext(jwt) } returns authenticatedContext

        // When
        val authToken = converter.convert(jwt)

        // Then
        val authorities = authToken.authorities
        assertThat(authorities).hasSize(3) // 3 roles, 0 permissions
        assertThat(authorities).contains(
            SimpleGrantedAuthority("ROLE_ADMIN"),
            SimpleGrantedAuthority("ROLE_MANAGER"),
            SimpleGrantedAuthority("ROLE_USER")
        )
    }

    @Test
    @DisplayName("Should handle empty roles and permissions")
    fun shouldHandleEmptyRolesAndPermissions() {
        // Given
        val jwt = JwtTestFixture.parseToSpringJwt(
            JwtTestFixture.createValidJwt(subject = testAuth0Sub)
        )

        val authenticatedContext = AuthenticatedUserContext(
            auth0Sub = testAuth0Sub,
            userId = testUserId,
            tenantUserId = testTenantUserId,
            tenantId = testTenantId,
            roles = emptySet(),
            permissions = emptySet()
        )

        every { jwtClaimsExtractor.extractAuthenticatedContext(jwt) } returns authenticatedContext

        // When
        val authToken = converter.convert(jwt)

        // Then
        assertThat(authToken).isNotNull
        assertThat(authToken.principal).isEqualTo(authenticatedContext)
        assertThat(authToken.authorities).isEmpty()
    }
}