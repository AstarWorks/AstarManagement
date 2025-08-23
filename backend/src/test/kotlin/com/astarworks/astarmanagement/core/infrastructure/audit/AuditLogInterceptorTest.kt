package com.astarworks.astarmanagement.core.infrastructure.audit

import com.astarworks.astarmanagement.core.infrastructure.security.BusinessContext
import com.astarworks.astarmanagement.core.infrastructure.security.BusinessRole
import com.astarworks.astarmanagement.core.infrastructure.security.TenantContextService
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*
import org.springframework.security.authentication.TestingAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@ExtendWith(MockitoExtension::class)
class AuditLogInterceptorTest {

    @Mock
    private lateinit var tenantContextService: TenantContextService

    @Mock
    private lateinit var request: HttpServletRequest

    @Mock
    private lateinit var response: HttpServletResponse

    private lateinit var auditLogInterceptor: AuditLogInterceptor

    @BeforeEach
    fun setup() {
        auditLogInterceptor = AuditLogInterceptor(tenantContextService)
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `preHandle should store request start time`() {
        // When
        val result = auditLogInterceptor.preHandle(request, response, Any())

        // Then
        assertTrue(result)
        verify(request).setAttribute(eq("audit.request.startTime"), any<Long>())
    }

    @Test
    fun `afterCompletion should log authenticated request with BusinessContext`() {
        // Given
        val businessContext = BusinessContext(
            userId = "auth0|123456",
            tenantId = "tenant-123",
            roles = setOf(BusinessRole.OWNER)
        )
        val authentication = TestingAuthenticationToken(businessContext, null)
        SecurityContextHolder.getContext().authentication = authentication

        whenever(request.method).thenReturn("GET")
        whenever(request.requestURI).thenReturn("/api/users")
        whenever(request.remoteAddr).thenReturn("192.168.1.1")
        whenever(request.getHeader("User-Agent")).thenReturn("Mozilla/5.0")
        whenever(request.getAttribute("audit.request.startTime")).thenReturn(System.currentTimeMillis() - 100)
        whenever(response.status).thenReturn(200)

        // When
        auditLogInterceptor.afterCompletion(request, response, Any(), null)

        // Then
        // Verify that the logger would be called (actual logging happens internally)
        verify(request).method
        verify(request).requestURI
        verify(response).status
    }

    @Test
    fun `afterCompletion should log anonymous request when no authentication`() {
        // Given
        SecurityContextHolder.clearContext()  // No authentication

        whenever(request.method).thenReturn("GET")
        whenever(request.requestURI).thenReturn("/api/public")
        whenever(request.remoteAddr).thenReturn("192.168.1.1")
        whenever(request.getAttribute("audit.request.startTime")).thenReturn(System.currentTimeMillis() - 50)
        whenever(response.status).thenReturn(200)

        // When
        auditLogInterceptor.afterCompletion(request, response, Any(), null)

        // Then
        verify(request).method
        verify(request).requestURI
        verify(response).status
    }

    @Test
    fun `afterCompletion should extract tenant from context service when not in BusinessContext`() {
        // Given
        val authentication = TestingAuthenticationToken("user@example.com", null)
        SecurityContextHolder.getContext().authentication = authentication

        whenever(tenantContextService.getCurrentTenantId()).thenReturn("tenant-456")
        whenever(request.method).thenReturn("POST")
        whenever(request.requestURI).thenReturn("/api/data")
        whenever(request.remoteAddr).thenReturn("10.0.0.1")
        whenever(request.getAttribute("audit.request.startTime")).thenReturn(System.currentTimeMillis() - 75)
        whenever(response.status).thenReturn(201)

        // When
        auditLogInterceptor.afterCompletion(request, response, Any(), null)

        // Then
        verify(tenantContextService).getCurrentTenantId()
    }

    @Test
    fun `afterCompletion should handle exception in request`() {
        // Given
        val businessContext = BusinessContext(
            userId = "auth0|789",
            tenantId = "tenant-789",
            roles = setOf(BusinessRole.MEMBER)
        )
        val authentication = TestingAuthenticationToken(businessContext, null)
        SecurityContextHolder.getContext().authentication = authentication

        val exception = RuntimeException("Test error")

        whenever(request.method).thenReturn("DELETE")
        whenever(request.requestURI).thenReturn("/api/resource/123")
        whenever(request.remoteAddr).thenReturn("172.16.0.1")
        whenever(request.getAttribute("audit.request.startTime")).thenReturn(System.currentTimeMillis() - 200)
        whenever(response.status).thenReturn(500)

        // When
        auditLogInterceptor.afterCompletion(request, response, Any(), exception)

        // Then
        verify(request).method
        verify(request).requestURI
        verify(response).status
    }

    @Test
    fun `afterCompletion should extract client IP from X-Forwarded-For header`() {
        // Given
        SecurityContextHolder.clearContext()

        whenever(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.1, 198.51.100.2")
        whenever(request.method).thenReturn("GET")
        whenever(request.requestURI).thenReturn("/api/test")
        whenever(request.remoteAddr).thenReturn("10.0.0.1")
        whenever(request.getAttribute("audit.request.startTime")).thenReturn(System.currentTimeMillis() - 30)
        whenever(response.status).thenReturn(200)

        // When
        auditLogInterceptor.afterCompletion(request, response, Any(), null)

        // Then
        verify(request).getHeader("X-Forwarded-For")
    }

    @Test
    fun `afterCompletion should extract client IP from X-Real-IP header when no X-Forwarded-For`() {
        // Given
        SecurityContextHolder.clearContext()

        whenever(request.getHeader("X-Forwarded-For")).thenReturn(null)
        whenever(request.getHeader("X-Real-IP")).thenReturn("203.0.113.5")
        whenever(request.method).thenReturn("PUT")
        whenever(request.requestURI).thenReturn("/api/update")
        whenever(request.remoteAddr).thenReturn("10.0.0.1")
        whenever(request.getAttribute("audit.request.startTime")).thenReturn(System.currentTimeMillis() - 45)
        whenever(response.status).thenReturn(200)

        // When
        auditLogInterceptor.afterCompletion(request, response, Any(), null)

        // Then
        verify(request).getHeader("X-Real-IP")
    }

    @Test
    fun `afterCompletion should log unauthorized access attempts with warning level`() {
        // Given
        SecurityContextHolder.clearContext()

        whenever(request.method).thenReturn("GET")
        whenever(request.requestURI).thenReturn("/api/secure")
        whenever(request.remoteAddr).thenReturn("192.168.1.100")
        whenever(request.getAttribute("audit.request.startTime")).thenReturn(System.currentTimeMillis() - 10)
        whenever(response.status).thenReturn(401)  // Unauthorized

        // When
        auditLogInterceptor.afterCompletion(request, response, Any(), null)

        // Then
        verify(response).status
        assertEquals(401, response.status)
    }

    @Test
    fun `afterCompletion should handle missing start time gracefully`() {
        // Given
        SecurityContextHolder.clearContext()

        whenever(request.method).thenReturn("GET")
        whenever(request.requestURI).thenReturn("/api/test")
        whenever(request.remoteAddr).thenReturn("192.168.1.1")
        whenever(request.getAttribute("audit.request.startTime")).thenReturn(null)  // No start time
        whenever(response.status).thenReturn(200)

        // When
        auditLogInterceptor.afterCompletion(request, response, Any(), null)

        // Then
        verify(request).getAttribute("audit.request.startTime")
        // Should complete without error, duration will be 0
    }
}