package com.astarworks.astarmanagement.shared.infrastructure.handler

import com.astarworks.astarmanagement.shared.exception.dto.ErrorResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component

/**
 * Custom authentication entry point for handling authentication failures.
 * Returns user-friendly JSON error responses instead of default Spring Security responses.
 */
@Component
class CustomAuthenticationEntryPoint(
    private val json: Json,
    @Value("\${spring.profiles.active:default}") private val activeProfile: String
) : AuthenticationEntryPoint {
    
    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException
    ) {
        println("=== CustomAuthenticationEntryPoint called for ${request.requestURI} ===")
        println("Exception: ${authException.message}")
        
        response.status = HttpServletResponse.SC_UNAUTHORIZED
        response.contentType = "application/json"
        response.characterEncoding = "UTF-8"
        
        // In development, provide detailed error information
        val isDevelopment = activeProfile.contains("local") || activeProfile.contains("dev")
        
        val message = if (isDevelopment && authException.message != null) {
            "Authentication failed: ${authException.message}"
        } else {
            "Authentication required"
        }
        
        val details = if (isDevelopment && authException.cause?.message != null) {
            buildJsonObject {
                put("detail", JsonPrimitive(authException.cause?.message!!))
            }
        } else {
            null
        }
        
        val errorResponse = ErrorResponse.unauthorized(message).copy(
            path = request.requestURI,
            details = details
        )
        
        response.writer.write(json.encodeToString(ErrorResponse.serializer(), errorResponse))
    }
}