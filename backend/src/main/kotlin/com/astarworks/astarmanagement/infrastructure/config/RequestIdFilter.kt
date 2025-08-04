package com.astarworks.astarmanagement.infrastructure.config

import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import java.util.*
import jakarta.servlet.*
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse

/**
 * Filter that adds a unique request ID to MDC for each request.
 * This ID is used for tracing requests across the application.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RequestIdFilter : Filter {
    
    companion object {
        const val REQUEST_ID_HEADER = "X-Request-ID"
        const val REQUEST_ID_MDC_KEY = "requestId"
    }
    
    override fun doFilter(
        request: ServletRequest,
        response: ServletResponse,
        chain: FilterChain
    ) {
        val httpRequest = request as HttpServletRequest
        val httpResponse = response as HttpServletResponse
        
        // Get request ID from header or generate a new one
        val requestId = httpRequest.getHeader(REQUEST_ID_HEADER) 
            ?: UUID.randomUUID().toString()
        
        try {
            // Add request ID to MDC for logging
            MDC.put(REQUEST_ID_MDC_KEY, requestId)
            
            // Add request ID to response header
            httpResponse.setHeader(REQUEST_ID_HEADER, requestId)
            
            // Continue with the request
            chain.doFilter(request, response)
        } finally {
            // Clean up MDC to prevent memory leaks
            MDC.clear()
        }
    }
}