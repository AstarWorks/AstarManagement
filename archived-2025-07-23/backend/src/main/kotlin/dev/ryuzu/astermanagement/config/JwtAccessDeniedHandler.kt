package dev.ryuzu.astermanagement.config

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ProblemDetail
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.stereotype.Component
import java.net.URI

/**
 * JWT Access Denied Handler
 * 
 * Handles authorization failures by returning RFC 7807 Problem+JSON responses
 * when authenticated users lack sufficient permissions for requested resources.
 */
@Component
class JwtAccessDeniedHandler(
    private val objectMapper: ObjectMapper
) : AccessDeniedHandler {

    override fun handle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        accessDeniedException: AccessDeniedException
    ) {
        val problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.FORBIDDEN,
            "Insufficient permissions to access this resource"
        )
        problem.type = URI.create("/errors/forbidden")
        problem.title = "Access Denied"
        problem.setProperty("path", request.requestURI)
        problem.setProperty("method", request.method)
        problem.setProperty("requiredAuthority", extractRequiredAuthority(accessDeniedException))

        response.status = HttpStatus.FORBIDDEN.value()
        response.contentType = MediaType.APPLICATION_PROBLEM_JSON_VALUE
        response.characterEncoding = "UTF-8"

        val responseBody = objectMapper.writeValueAsString(problem)
        response.writer.write(responseBody)
        response.writer.flush()
    }

    /**
     * Extracts required authority information from the exception message
     */
    private fun extractRequiredAuthority(exception: AccessDeniedException): String {
        val message = exception.message ?: "Unknown permission required"
        return when {
            message.contains("hasRole") -> "Role-based access required"
            message.contains("hasAuthority") -> "Specific permission required"
            else -> "Valid authorization required"
        }
    }
}