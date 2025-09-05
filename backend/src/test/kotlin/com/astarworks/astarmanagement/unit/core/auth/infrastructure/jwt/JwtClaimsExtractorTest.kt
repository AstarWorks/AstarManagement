package com.astarworks.astarmanagement.unit.core.auth.infrastructure.jwt

import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.service.UserResolverService
import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.JwtClaimsExtractor
import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.MissingTenantException
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import io.mockk.*
import java.util.*

/**
 * Unit tests for JwtClaimsExtractor - MockK Version
 */
@DisplayName("JwtClaimsExtractor Tests")
class JwtClaimsExtractorTest {

    private val tenantContextService = mockk<TenantContextService>()
    private val tenantService = mockk<TenantService>()
    private val userResolverService = mockk<UserResolverService>()
    
    private lateinit var jwtClaimsExtractor: JwtClaimsExtractor

    private val testTenantId = UUID.randomUUID()
    private val testUserId = UUID.randomUUID()
    private val testTenantUserId = UUID.randomUUID()
    private val testAuth0Sub = "auth0|123456"
    private val testOrgId = "org_ABC123"
    private val testEmail = "test@example.com"

    @BeforeEach
    fun setUp() {
        clearMocks(tenantContextService, tenantService, userResolverService)
        jwtClaimsExtractor = JwtClaimsExtractor(tenantContextService, tenantService, userResolverService)
    }

    @Test
    @DisplayName("Should extract context from valid JWT with org_id")
    fun shouldExtractContextFromValidJwt() {
        // Given
        val jwt = JwtTestFixture.parseToSpringJwt(
            JwtTestFixture.createValidJwt(
                subject = testAuth0Sub,
                orgId = testOrgId,
                email = testEmail
            )
        )

        val tenant = Tenant(
            id = TenantId(testTenantId),
            slug = "test-tenant",
            name = "Test Tenant",
            auth0OrgId = testOrgId
        )

        val expectedContext = AuthenticatedUserContext(
            auth0Sub = testAuth0Sub,
            userId = testUserId,
            tenantUserId = testTenantUserId,
            tenantId = testTenantId,
            email = testEmail
        )

        every { tenantService.findByAuth0OrgId(testOrgId) } returns tenant
        every { userResolverService.resolveAuthenticatedContext(testAuth0Sub, testTenantId, testEmail) } returns expectedContext
        every { tenantContextService.setTenantContext(testTenantId) } just Runs

        // When
        val result = jwtClaimsExtractor.extractAuthenticatedContext(jwt)

        // Then
        assertThat(result).isEqualTo(expectedContext)
        verify { tenantContextService.setTenantContext(testTenantId) }
        verify { tenantService.findByAuth0OrgId(testOrgId) }
        verify { userResolverService.resolveAuthenticatedContext(testAuth0Sub, testTenantId, testEmail) }
    }

    @Test
    @DisplayName("Should throw MissingTenantException when org_id is missing")
    fun shouldThrowExceptionWhenOrgIdMissing() {
        // Given
        val jwt = JwtTestFixture.parseToSpringJwt(
            JwtTestFixture.createJwtWithoutOrgId(
                subject = testAuth0Sub,
                email = testEmail
            )
        )

        // When & Then
        assertThatThrownBy { jwtClaimsExtractor.extractAuthenticatedContext(jwt) }
            .isInstanceOf(MissingTenantException::class.java)
            .hasMessageContaining("No tenant context found in JWT")

        verify(exactly = 0) { tenantContextService.setTenantContext(any()) }
        verify(exactly = 0) { userResolverService.resolveAuthenticatedContext(any(), any(), any()) }
    }

    @Test
    @DisplayName("Should throw MissingTenantException when tenant not found for org_id")
    fun shouldThrowExceptionWhenTenantNotFound() {
        // Given
        val jwt = JwtTestFixture.parseToSpringJwt(
            JwtTestFixture.createValidJwt(
                subject = testAuth0Sub,
                orgId = testOrgId
            )
        )

        every { tenantService.findByAuth0OrgId(testOrgId) } returns null

        // When & Then
        assertThatThrownBy { jwtClaimsExtractor.extractAuthenticatedContext(jwt) }
            .isInstanceOf(MissingTenantException::class.java)
            .hasMessageContaining("No tenant context found in JWT")

        verify { tenantService.findByAuth0OrgId(testOrgId) }
        verify(exactly = 0) { tenantContextService.setTenantContext(any()) }
        verify(exactly = 0) { userResolverService.resolveAuthenticatedContext(any(), any(), any()) }
    }
}