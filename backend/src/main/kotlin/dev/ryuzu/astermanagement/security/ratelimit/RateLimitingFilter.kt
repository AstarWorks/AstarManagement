package dev.ryuzu.astermanagement.security.ratelimit

import com.fasterxml.jackson.databind.ObjectMapper
import dev.ryuzu.astermanagement.security.ratelimit.impl.RedisRateLimiter
import dev.ryuzu.astermanagement.security.util.ClientInfoExtractor
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Duration
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse

/**
 * Filter that applies rate limiting to incoming requests
 */
@Component("securityRateLimitingFilter")
class RateLimitingFilter(
    private val rateLimiter: RedisRateLimiter,
    private val clientInfoExtractor: ClientInfoExtractor,
    private val objectMapper: ObjectMapper,
    @Value("\${security.rate-limit.default.requests:100}") private val defaultRequestLimit: Int,
    @Value("\${security.rate-limit.default.window:PT1H}") private val defaultWindow: String,
    @Value("\${security.rate-limit.auth.requests:5}") private val authRequestLimit: Int,
    @Value("\${security.rate-limit.auth.window:PT15M}") private val authWindow: String,
    @Value("\${security.rate-limit.enabled:true}") private val rateLimitingEnabled: Boolean
) : OncePerRequestFilter() {

    private val logger = LoggerFactory.getLogger(RateLimitingFilter::class.java)

    companion object {
        private const val RATE_LIMIT_HEADER_LIMIT = "X-RateLimit-Limit"
        private const val RATE_LIMIT_HEADER_REMAINING = "X-RateLimit-Remaining"
        private const val RATE_LIMIT_HEADER_RESET = "X-RateLimit-Reset"
        private const val RATE_LIMIT_HEADER_RETRY_AFTER = "Retry-After"
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        if (!rateLimitingEnabled) {
            filterChain.doFilter(request, response)
            return
        }

        try {
            val rateLimitConfig = getRateLimitConfig(request)
            val clientKey = generateClientKey(request)

            logger.debug("Checking rate limit for key: $clientKey with config: $rateLimitConfig")

            val rateLimitInfo = rateLimiter.getRateLimitInfo(
                key = clientKey,
                limit = rateLimitConfig.limit,
                window = rateLimitConfig.window
            )

            // Add rate limit headers to response
            addRateLimitHeaders(response, rateLimitInfo)

            // Check if request is allowed
            if (!rateLimiter.isAllowed(clientKey, rateLimitConfig.limit, rateLimitConfig.window)) {
                handleRateLimitExceeded(request, response, rateLimitInfo)
                return
            }

            // Log successful rate limit check
            logger.debug("Rate limit check passed for key: $clientKey (remaining: ${rateLimitInfo.remaining - 1})")

            filterChain.doFilter(request, response)

        } catch (e: Exception) {
            logger.error("Error in rate limiting filter", e)
            // Fail open - continue with request if rate limiting fails
            filterChain.doFilter(request, response)
        }
    }

    private fun getRateLimitConfig(request: HttpServletRequest): RateLimitConfig {
        val path = request.requestURI
        
        return when {
            path.startsWith("/api/auth/") -> RateLimitConfig(
                limit = authRequestLimit,
                window = Duration.parse(authWindow)
            )
            path.startsWith("/api/") -> RateLimitConfig(
                limit = defaultRequestLimit,
                window = Duration.parse(defaultWindow)
            )
            else -> RateLimitConfig(
                limit = defaultRequestLimit * 2, // More lenient for non-API endpoints
                window = Duration.parse(defaultWindow)
            )
        }
    }

    private fun generateClientKey(request: HttpServletRequest): String {
        val clientInfo = clientInfoExtractor.extractClientInfo(request)
        
        // Use IP + User-Agent for anonymous requests
        // Use User ID for authenticated requests (if available)
        val principal = request.userPrincipal
        
        return if (principal != null) {
            "user:${principal.name}:${request.requestURI}"
        } else {
            "ip:${clientInfo.ipAddress}:${clientInfo.userAgent.hashCode()}:${request.requestURI}"
        }
    }

    private fun addRateLimitHeaders(response: HttpServletResponse, rateLimitInfo: RateLimitInfo) {
        response.setHeader(RATE_LIMIT_HEADER_LIMIT, rateLimitInfo.limit.toString())
        response.setHeader(RATE_LIMIT_HEADER_REMAINING, rateLimitInfo.remaining.toString())
        
        rateLimitInfo.resetTime?.let { resetTime ->
            val resetTimeFormatted = resetTime.atOffset(ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_INSTANT)
            response.setHeader(RATE_LIMIT_HEADER_RESET, resetTimeFormatted)
        }
    }

    private fun handleRateLimitExceeded(
        request: HttpServletRequest,
        response: HttpServletResponse,
        rateLimitInfo: RateLimitInfo
    ) {
        val clientInfo = clientInfoExtractor.extractClientInfo(request)
        
        logger.warn("Rate limit exceeded for client: ${rateLimitInfo.key} (IP: ${clientInfo.ipAddress}, User-Agent: ${clientInfo.userAgent})")

        response.status = HttpStatus.TOO_MANY_REQUESTS.value()
        response.contentType = MediaType.APPLICATION_JSON_VALUE

        // Add retry-after header
        rateLimitInfo.resetTime?.let { resetTime ->
            val retryAfterSeconds = Duration.between(
                java.time.Instant.now(),
                resetTime
            ).seconds
            response.setHeader(RATE_LIMIT_HEADER_RETRY_AFTER, retryAfterSeconds.toString())
        }

        val errorResponse = mapOf(
            "error" to "rate_limit_exceeded",
            "message" to "Too many requests. Please try again later.",
            "details" to mapOf(
                "limit" to rateLimitInfo.limit,
                "remaining" to rateLimitInfo.remaining,
                "resetTime" to rateLimitInfo.resetTime?.toString(),
                "windowDuration" to rateLimitInfo.windowDuration.toString()
            )
        )

        try {
            response.writer.write(objectMapper.writeValueAsString(errorResponse))
        } catch (e: Exception) {
            logger.error("Error writing rate limit error response", e)
        }
    }

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        
        // Skip rate limiting for health check and monitoring endpoints
        return path.startsWith("/actuator/") ||
               path.startsWith("/health") ||
               path.startsWith("/metrics") ||
               path.startsWith("/static/") ||
               path.startsWith("/favicon.ico")
    }

    private data class RateLimitConfig(
        val limit: Int,
        val window: Duration
    )
}