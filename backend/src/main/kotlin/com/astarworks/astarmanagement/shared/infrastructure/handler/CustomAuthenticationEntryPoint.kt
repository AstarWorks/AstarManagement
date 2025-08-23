package com.astarworks.astarmanagement.shared.infrastructure.handler

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component
import java.time.Instant

/**
 * Custom authentication entry point for handling authentication failures.
 * Returns user-friendly JSON error responses instead of default Spring Security responses.
 */
@Component
class CustomAuthenticationEntryPoint : AuthenticationEntryPoint {
    
    private val objectMapper = ObjectMapper().apply {
        registerModule(JavaTimeModule())
    }
    
    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException
    ) {
        response.status = HttpServletResponse.SC_UNAUTHORIZED
        response.contentType = "application/json"
        response.characterEncoding = "UTF-8"
        
        // In development, provide detailed error information
        val isDevelopment = System.getProperty("spring.profiles.active")?.contains("local") ?: true
        
        val message = if (isDevelopment && authException.message != null) {
            "Authentication failed: ${authException.message}"
        } else {
            "Authentication required"
        }
        
        val errorResponse = if (isDevelopment) {
            DetailedErrorResponse(
                error = "unauthorized",
                message = message,
                detail = authException.cause?.message,
                timestamp = Instant.now(),
                path = request.requestURI
            )
        } else {
            ErrorResponse(
                error = "unauthorized",
                message = "Authentication required",
                timestamp = Instant.now(),
                path = request.requestURI
            )
        }
        
        response.writer.write(objectMapper.writeValueAsString(errorResponse))
    }
}

/**
 * Error response DTO for authentication and authorization failures.
 */
data class ErrorResponse(
    val error: String,
    val message: String,
    val timestamp: Instant,
    val path: String
)

/**
 * Detailed error response for development environment.
 */
data class DetailedErrorResponse(
    val error: String,
    val message: String,
    val detail: String?,
    val timestamp: Instant,
    val path: String
)