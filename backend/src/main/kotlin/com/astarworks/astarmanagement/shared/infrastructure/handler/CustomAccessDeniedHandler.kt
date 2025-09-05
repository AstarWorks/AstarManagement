package com.astarworks.astarmanagement.shared.infrastructure.handler

import com.astarworks.astarmanagement.shared.exception.dto.ErrorResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import kotlinx.serialization.json.Json
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.stereotype.Component

/**
 * Custom access denied handler for handling authorization failures.
 * Returns user-friendly JSON error responses for forbidden access attempts.
 */
@Component
class CustomAccessDeniedHandler(
    private val json: Json
) : AccessDeniedHandler {
    
    override fun handle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        accessDeniedException: AccessDeniedException
    ) {
        response.status = HttpServletResponse.SC_FORBIDDEN
        response.contentType = "application/json"
        response.characterEncoding = "UTF-8"
        
        val errorResponse = ErrorResponse.forbidden(
            message = "Access denied",
            requiredPermission = null
        ).copy(path = request.requestURI)
        
        response.writer.write(json.encodeToString(ErrorResponse.serializer(), errorResponse))
    }
}