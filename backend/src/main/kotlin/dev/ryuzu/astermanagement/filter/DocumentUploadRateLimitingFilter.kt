package dev.ryuzu.astermanagement.filter

import dev.ryuzu.astermanagement.security.ratelimit.RateLimiter
import dev.ryuzu.astermanagement.security.ratelimit.RateLimitInfo
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Duration

/**
 * Rate limiting filter specifically for document upload endpoints
 * Provides additional protection against abuse of upload functionality
 */
@Component
@Order(2) // Execute after the main rate limiting filter
class DocumentUploadRateLimitingFilter(
    private val rateLimiter: RateLimiter,
    @Value("\${aster.upload.rate-limit.requests-per-minute:10}") private val requestsPerMinute: Int,
    @Value("\${aster.upload.rate-limit.window-minutes:15}") private val windowMinutes: Long
) : OncePerRequestFilter() {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    private val uploadEndpoints = setOf(
        "/api/v1/documents/upload",
        "/api/v1/documents/upload/batch"
    )
    
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val requestPath = request.requestURI
        
        // Only apply rate limiting to document upload endpoints
        if (shouldApplyRateLimit(requestPath, request.method)) {
            val clientIp = getClientIpAddress(request)
            val rateLimitKey = "upload:$clientIp"
            
            this.logger.debug("Checking upload rate limit for IP: $clientIp, path: $requestPath")
            
            val rateLimitInfo = rateLimiter.getRateLimitInfo(
                key = rateLimitKey,
                limit = requestsPerMinute,
                window = Duration.ofMinutes(windowMinutes)
            )
            
            // Add rate limit headers
            response.setHeader("X-RateLimit-Limit", rateLimitInfo.limit.toString())
            response.setHeader("X-RateLimit-Remaining", rateLimitInfo.remaining.toString())
            response.setHeader("X-RateLimit-Reset", (rateLimitInfo.resetTime?.epochSecond ?: 0).toString())
            response.setHeader("X-RateLimit-Window", "${windowMinutes}m")
            
            val allowed = rateLimitInfo.remaining > 0
            if (allowed) {
                this.logger.debug("Upload request within rate limit for IP: $clientIp")
                filterChain.doFilter(request, response)
            } else {
                this.logger.warn("Upload rate limit exceeded for IP: $clientIp, path: $requestPath")
                handleRateLimitExceeded(response, rateLimitInfo)
            }
        } else {
            // Not an upload endpoint, proceed without rate limiting
            filterChain.doFilter(request, response)
        }
    }
    
    /**
     * Determine if rate limiting should be applied to this request
     */
    private fun shouldApplyRateLimit(path: String, method: String): Boolean {
        return method == "POST" && uploadEndpoints.any { endpoint ->
            path.startsWith(endpoint)
        }
    }
    
    /**
     * Handle rate limit exceeded scenario
     */
    private fun handleRateLimitExceeded(response: HttpServletResponse, rateLimitInfo: RateLimitInfo) {
        response.status = HttpStatus.TOO_MANY_REQUESTS.value()
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        
        val errorMessage = """
            {
                "status": 429,
                "error": "Too Many Requests",
                "message": "Upload rate limit exceeded. Too many upload requests.",
                "rateLimitInfo": {
                    "limit": ${rateLimitInfo.limit},
                    "remaining": ${rateLimitInfo.remaining},
                    "resetTime": ${rateLimitInfo.resetTime?.epochSecond ?: 0},
                    "windowMinutes": $windowMinutes
                },
                "retryAfter": ${calculateRetryAfter(rateLimitInfo.resetTime?.epochSecond ?: 0)}
            }
        """.trimIndent()
        
        response.setHeader("Retry-After", calculateRetryAfter(rateLimitInfo.resetTime?.epochSecond ?: 0).toString())
        response.writer.write(errorMessage)
        response.writer.flush()
    }
    
    /**
     * Calculate retry-after header value in seconds
     */
    private fun calculateRetryAfter(resetTime: Long): Long {
        val currentTime = System.currentTimeMillis() / 1000
        return maxOf(0, resetTime - currentTime)
    }
    
    /**
     * Extract client IP address from request
     * Handles common proxy headers for accurate IP detection
     */
    private fun getClientIpAddress(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrBlank()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",").first().trim()
        }
        
        val xRealIp = request.getHeader("X-Real-IP")
        if (!xRealIp.isNullOrBlank()) {
            return xRealIp.trim()
        }
        
        val xForwardedProto = request.getHeader("X-Forwarded-Proto")
        if (!xForwardedProto.isNullOrBlank()) {
            val cfConnectingIp = request.getHeader("CF-Connecting-IP")
            if (!cfConnectingIp.isNullOrBlank()) {
                return cfConnectingIp.trim()
            }
        }
        
        return request.remoteAddr ?: "unknown"
    }
}