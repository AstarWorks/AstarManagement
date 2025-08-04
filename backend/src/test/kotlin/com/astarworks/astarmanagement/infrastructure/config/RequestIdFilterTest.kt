package com.astarworks.astarmanagement.infrastructure.config

import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.mockito.Mock
import org.mockito.kotlin.*
import org.mockito.ArgumentCaptor
import org.slf4j.MDC
import java.util.*
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse

class RequestIdFilterTest {

    @Mock
    private lateinit var request: HttpServletRequest

    @Mock
    private lateinit var response: HttpServletResponse

    @Mock
    private lateinit var filterChain: FilterChain

    private lateinit var filter: RequestIdFilter

    @BeforeEach
    fun setUp() {
        request = mock<HttpServletRequest>()
        response = mock<HttpServletResponse>()
        filterChain = mock<FilterChain>()
        filter = RequestIdFilter()
        
        // Clear MDC before each test
        MDC.clear()
    }

    @AfterEach
    fun tearDown() {
        // Clean up MDC after each test
        MDC.clear()
    }

    @Test
    fun `should generate new request ID when not provided in header`() {
        // Given
        whenever(request.getHeader(RequestIdFilter.REQUEST_ID_HEADER)).thenReturn(null)

        // When
        filter.doFilter(request, response, filterChain)

        // Then
        verify(filterChain).doFilter(request, response)
        verify(response).setHeader(eq(RequestIdFilter.REQUEST_ID_HEADER), any<String>())
        
        // Verify that a request ID was set in the response header
        val argumentCaptor = argumentCaptor<String>()
        verify(response).setHeader(eq(RequestIdFilter.REQUEST_ID_HEADER), argumentCaptor.capture())
        
        val capturedRequestId = argumentCaptor.firstValue
        assertNotNull(capturedRequestId)
        assertEquals(36, capturedRequestId.length) // UUID format
    }

    @Test
    fun `should use existing request ID from header`() {
        // Given
        val existingRequestId = "existing-request-id-123"
        whenever(request.getHeader(RequestIdFilter.REQUEST_ID_HEADER)).thenReturn(existingRequestId)

        // When
        filter.doFilter(request, response, filterChain)

        // Then
        verify(filterChain).doFilter(request, response)
        verify(response).setHeader(RequestIdFilter.REQUEST_ID_HEADER, existingRequestId)
    }

    @Test
    fun `should set request ID in MDC during filter execution`() {
        // Given
        val requestId = "test-request-id"
        whenever(request.getHeader(RequestIdFilter.REQUEST_ID_HEADER)).thenReturn(requestId)
        
        var mdcValueDuringChain: String? = null
        doAnswer {
            // Capture MDC value during filter chain execution
            mdcValueDuringChain = MDC.get(RequestIdFilter.REQUEST_ID_MDC_KEY)
            null
        }.whenever(filterChain).doFilter(request, response)

        // When
        filter.doFilter(request, response, filterChain)

        // Then
        assertEquals(requestId, mdcValueDuringChain)
        
        // MDC should be cleared after filter execution
        assertNull(MDC.get(RequestIdFilter.REQUEST_ID_MDC_KEY))
    }

    @Test
    fun `should clean up MDC even when exception occurs`() {
        // Given
        val requestId = "test-request-id"
        whenever(request.getHeader(RequestIdFilter.REQUEST_ID_HEADER)).thenReturn(requestId)
        doThrow(RuntimeException("Test exception")).whenever(filterChain).doFilter(request, response)

        // When & Then
        try {
            filter.doFilter(request, response, filterChain)
        } catch (e: RuntimeException) {
            // Expected exception
        }

        // MDC should still be cleared
        assertNull(MDC.get(RequestIdFilter.REQUEST_ID_MDC_KEY))
    }

    @Test
    fun `should handle UUID format for generated request ID`() {
        // Given
        whenever(request.getHeader(RequestIdFilter.REQUEST_ID_HEADER)).thenReturn(null)

        // When
        filter.doFilter(request, response, filterChain)

        // Then
        val argumentCaptor = argumentCaptor<String>()
        verify(response).setHeader(eq(RequestIdFilter.REQUEST_ID_HEADER), argumentCaptor.capture())
        
        val generatedRequestId = argumentCaptor.firstValue
        
        // Verify it's a valid UUID format
        try {
            UUID.fromString(generatedRequestId)
        } catch (e: IllegalArgumentException) {
            throw AssertionError("Generated request ID should be a valid UUID format: $generatedRequestId")
        }
    }
}