package com.astarworks.astarmanagement.shared.infrastructure.handler

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.stereotype.Component
import java.time.Instant

/**
 * Custom access denied handler for handling authorization failures.
 * Returns user-friendly JSON error responses for forbidden access attempts.
 */
@Component
class CustomAccessDeniedHandler : AccessDeniedHandler {
    
    private val objectMapper = ObjectMapper().apply {
        registerModule(JavaTimeModule())
    }
    
    override fun handle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        accessDeniedException: AccessDeniedException
    ) {
        response.status = HttpServletResponse.SC_FORBIDDEN
        response.contentType = "application/json"
        response.characterEncoding = "UTF-8"
        
        val errorResponse = ErrorResponse(
            error = "forbidden",
            message = "Access denied",
            timestamp = Instant.now(),
            path = request.requestURI
        )
        
        response.writer.write(objectMapper.writeValueAsString(errorResponse))
    }
}