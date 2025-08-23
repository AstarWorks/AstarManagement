package com.astarworks.astarmanagement.core.infrastructure.security

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.BeforeEach
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.ArgumentMatchers
import org.mockito.junit.jupiter.MockitoExtension
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.security.oauth2.jwt.Jwt
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue

@ExtendWith(MockitoExtension::class)
class JwtClaimsExtractorTest {

    @Mock
    private lateinit var tenantContextService: TenantContextService

    @Mock
    private lateinit var jwt: Jwt

    private lateinit var jwtClaimsExtractor: JwtClaimsExtractor

    @BeforeEach
    fun setUp() {
        jwtClaimsExtractor = JwtClaimsExtractor(tenantContextService)
    }

    @Test
    fun `should extract business context with org_id claim`() {
        // Given
        val expectedUserId = "auth0|123456"
        val expectedTenantId = "tenant-123"
        val roles = listOf("ADMIN", "USER")

        `when`(jwt.subject).thenReturn(expectedUserId)
        `when`(jwt.getClaimAsString("org_id")).thenReturn(expectedTenantId)
        `when`(jwt.getClaimAsStringList("https://your-app.com/roles")).thenReturn(roles)

        // When
        val context = jwtClaimsExtractor.extractBusinessContext(jwt)

        // Then
        assertEquals(expectedUserId, context.userId)
        assertEquals(expectedTenantId, context.tenantId)
        assertTrue(context.roles.contains(BusinessRole.ADMIN))
        assertTrue(context.roles.contains(BusinessRole.USER))
        verify(tenantContextService).setTenantContext(expectedTenantId)
    }

    @Test
    fun `should extract business context with custom tenant claim`() {
        // Given
        val expectedUserId = "auth0|123456"
        val expectedTenantId = "custom-tenant-123"

        `when`(jwt.subject).thenReturn(expectedUserId)
        `when`(jwt.getClaimAsString("org_id")).thenReturn(null)
        `when`(jwt.getClaimAsString("https://your-app.com/tenant_id")).thenReturn(expectedTenantId)
        `when`(jwt.getClaimAsStringList("https://your-app.com/roles")).thenReturn(emptyList())

        // When
        val context = jwtClaimsExtractor.extractBusinessContext(jwt)

        // Then
        assertEquals(expectedUserId, context.userId)
        assertEquals(expectedTenantId, context.tenantId)
        assertTrue(context.roles.isEmpty())
        verify(tenantContextService).setTenantContext(expectedTenantId)
    }

    @Test
    fun `should handle missing tenant claims gracefully`() {
        // Given
        val expectedUserId = "auth0|123456"

        `when`(jwt.subject).thenReturn(expectedUserId)
        `when`(jwt.getClaimAsString("org_id")).thenReturn(null)
        `when`(jwt.getClaimAsString("https://your-app.com/tenant_id")).thenReturn(null)
        `when`(jwt.getClaimAsStringList("https://your-app.com/roles")).thenReturn(emptyList())

        // When
        val context = jwtClaimsExtractor.extractBusinessContext(jwt)

        // Then
        assertEquals(expectedUserId, context.userId)
        assertNull(context.tenantId)
        assertTrue(context.roles.isEmpty())
        verify(tenantContextService, never()).setTenantContext(ArgumentMatchers.anyString())
    }

    @Test
    fun `should map roles correctly and ignore unknown roles`() {
        // Given
        val expectedUserId = "auth0|123456"
        val roles = listOf("admin", "user", "unknown_role", "viewer")

        `when`(jwt.subject).thenReturn(expectedUserId)
        `when`(jwt.getClaimAsString("org_id")).thenReturn(null)
        `when`(jwt.getClaimAsString("https://your-app.com/tenant_id")).thenReturn(null)
        `when`(jwt.getClaimAsStringList("https://your-app.com/roles")).thenReturn(roles)

        // When
        val context = jwtClaimsExtractor.extractBusinessContext(jwt)

        // Then
        assertEquals(3, context.roles.size) // unknown_role should be ignored
        assertTrue(context.roles.contains(BusinessRole.ADMIN))
        assertTrue(context.roles.contains(BusinessRole.USER))
        assertTrue(context.roles.contains(BusinessRole.VIEWER))
    }

    @Test
    fun `should handle fallback roles claim`() {
        // Given
        val expectedUserId = "auth0|123456"
        val roles = listOf("USER")

        `when`(jwt.subject).thenReturn(expectedUserId)
        `when`(jwt.getClaimAsString("org_id")).thenReturn(null)
        `when`(jwt.getClaimAsString("https://your-app.com/tenant_id")).thenReturn(null)
        `when`(jwt.getClaimAsStringList("https://your-app.com/roles")).thenReturn(null)
        `when`(jwt.getClaimAsStringList("roles")).thenReturn(roles)

        // When
        val context = jwtClaimsExtractor.extractBusinessContext(jwt)

        // Then
        assertEquals(1, context.roles.size)
        assertTrue(context.roles.contains(BusinessRole.USER))
    }
}