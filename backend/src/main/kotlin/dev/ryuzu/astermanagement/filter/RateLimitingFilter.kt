package dev.ryuzu.astermanagement.filter

import dev.ryuzu.astermanagement.config.SimpleRateLimitingService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Rate limiting filter for authentication endpoints
 * 
 * Applies rate limiting to authentication endpoints to prevent
 * brute force attacks and abuse.
 */
@Component
class RateLimitingFilter(
    private val rateLimitingService: SimpleRateLimitingService
) : OncePerRequestFilter() {

    private val authEndpoints = setOf(
        "/api/auth/login",
        "/api/auth/refresh"
    )

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val requestPath = request.requestURI
        
        // Only apply rate limiting to authentication endpoints
        if (authEndpoints.contains(requestPath) && request.method == "POST") {
            val clientIp = getClientIpAddress(request)
            
            if (rateLimitingService.isWithinRateLimit(clientIp)) {
                // Within rate limit, increment counter and proceed
                val remaining = rateLimitingService.incrementAndGetRemaining(clientIp)
                
                // Add rate limit headers
                response.setHeader("X-Rate-Limit-Remaining", remaining.toString())
                response.setHeader("X-Rate-Limit-Reset", rateLimitingService.getResetTime().toString())
                
                filterChain.doFilter(request, response)
            } else {
                // Rate limit exceeded
                response.status = HttpStatus.TOO_MANY_REQUESTS.value()
                response.contentType = MediaType.APPLICATION_JSON_VALUE
                response.setHeader("X-Rate-Limit-Remaining", "0")
                response.setHeader("X-Rate-Limit-Reset", rateLimitingService.getResetTime().toString())
                response.setHeader("Retry-After", "60")
                
                val errorResponse = """{
                    "type": "https://astermanagement.dev/errors/rate_limit_exceeded",
                    "title": "Rate Limit Exceeded",
                    "status": 429,
                    "detail": "Too many authentication attempts. Please try again later.",
                    "instance": "$requestPath",
                    "errorCode": "RATE_LIMIT_EXCEEDED",
                    "timestamp": "${System.currentTimeMillis()}"
                }"""
                
                response.writer.write(errorResponse)
            }
        } else {
            filterChain.doFilter(request, response)
        }
    }

    /**
     * Extract client IP address from request
     */
    private fun getClientIpAddress(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrBlank()) {
            return xForwardedFor.split(",")[0].trim()
        }
        
        val xRealIp = request.getHeader("X-Real-IP")
        if (!xRealIp.isNullOrBlank()) {
            return xRealIp
        }
        
        return request.remoteAddr
    }
}