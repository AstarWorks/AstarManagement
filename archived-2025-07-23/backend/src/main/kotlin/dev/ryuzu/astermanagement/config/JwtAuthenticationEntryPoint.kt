package dev.ryuzu.astermanagement.config

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ProblemDetail
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component
import java.net.URI

/**
 * JWT Authentication Entry Point
 * 
 * Handles authentication failures by returning RFC 7807 Problem+JSON responses
 * when unauthenticated users try to access protected resources.
 */
@Component
class JwtAuthenticationEntryPoint(
    private val objectMapper: ObjectMapper
) : AuthenticationEntryPoint {

    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException
    ) {
        val problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNAUTHORIZED,
            "Authentication required to access this resource"
        )
        problem.type = URI.create("/errors/unauthorized")
        problem.title = "Authentication Required"
        problem.setProperty("path", request.requestURI)
        problem.setProperty("method", request.method)

        response.status = HttpStatus.UNAUTHORIZED.value()
        response.contentType = MediaType.APPLICATION_PROBLEM_JSON_VALUE
        response.characterEncoding = "UTF-8"

        val responseBody = objectMapper.writeValueAsString(problem)
        response.writer.write(responseBody)
        response.writer.flush()
    }
}