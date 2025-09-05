package com.astarworks.astarmanagement.core.auth.domain.model

import com.astarworks.astarmanagement.core.auth.domain.service.TestAuthContextBuilder
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import java.util.*

/**
 * Unit tests for AuthenticatedUserContext domain model.
 * Tests basic functionality and role checking methods.
 */
@Tag("unit")
@DisplayName("AuthenticatedUserContext Unit Tests")
class AuthenticatedUserContextTest {

    private val testTenantId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

    @Test
    @DisplayName("Should create test context with factory method")
    fun `creates test context with factory method`() {
        // When
        val context = TestAuthContextBuilder.forTesting()

        // Then
        assertEquals("test|123456", context.auth0Sub)
        assertEquals("test@example.com", context.email)
        assertTrue(context.isActive)
    }

    @Test
    @DisplayName("Should check tenant membership correctly")
    fun `checks tenant membership correctly`() {
        // Given
        val myTenantId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        val otherTenantId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
        
        val context = TestAuthContextBuilder.forTesting(tenantId = myTenantId)

        // When & Then
        assertEquals(myTenantId, context.tenantId)
        assertNotEquals(otherTenantId, context.tenantId)
    }

    @Test
    @DisplayName("Should check active tenant membership")
    fun `checks active tenant membership`() {
        // Given
        val activeContext = AuthenticatedUserContext(
            auth0Sub = "auth0|active123",
            userId = UUID.randomUUID(),
            tenantUserId = UUID.randomUUID(),
            tenantId = testTenantId,
            isActive = true
        )

        val inactiveContext = AuthenticatedUserContext(
            auth0Sub = "auth0|inactive123", 
            userId = UUID.randomUUID(),
            tenantUserId = UUID.randomUUID(),
            tenantId = testTenantId,
            isActive = false
        )

        // When & Then
        assertTrue(activeContext.isActive)
        assertFalse(inactiveContext.isActive)
    }

    @Test
    @DisplayName("Should handle empty roles gracefully")
    fun `handles empty roles gracefully`() {
        // Given
        val context = TestAuthContextBuilder.forTesting(tenantId = testTenantId)

        // When & Then
        assertFalse(context.hasRole("admin"))
        assertFalse(context.hasAnyRole("admin", "user"))
        assertTrue(context.hasAllRoles()) // Empty varargs should return true
    }

    @Test
    @DisplayName("Should validate auth0Sub is not blank")
    fun `validates auth0Sub not blank`() {
        // Then
        assertThrows(IllegalArgumentException::class.java) {
            TestAuthContextBuilder.forTesting(auth0Sub = "")
        }
    }
}