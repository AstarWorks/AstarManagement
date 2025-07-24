package dev.ryuzu.astermanagement.util

import org.springframework.stereotype.Component
import jakarta.servlet.http.HttpServletRequest

/**
 * Utility for extracting client information from HTTP requests
 */
@Component
class ClientInfoExtractor {

    companion object {
        private val FORWARDED_HEADERS = listOf(
            "X-Forwarded-For",
            "X-Real-IP",
            "X-Original-Forwarded-For",
            "CF-Connecting-IP", // Cloudflare
            "True-Client-IP"    // Akamai
        )
    }

    /**
     * Extract comprehensive client information from the request
     */
    fun extractClientInfo(request: HttpServletRequest): ClientInfo {
        return ClientInfo(
            ipAddress = extractRealIPAddress(request),
            userAgent = extractUserAgent(request),
            sessionId = extractSessionId(request),
            referer = request.getHeader("Referer"),
            origin = request.getHeader("Origin"),
            acceptLanguage = request.getHeader("Accept-Language"),
            forwardedFor = request.getHeader("X-Forwarded-For")
        )
    }

    private fun extractRealIPAddress(request: HttpServletRequest): String {
        // Check forwarded headers first (for load balancers/proxies)
        for (header in FORWARDED_HEADERS) {
            val value = request.getHeader(header)
            if (!value.isNullOrBlank() && value != "unknown") {
                // X-Forwarded-For can contain multiple IPs, take the first one
                return value.split(",").first().trim()
            }
        }

        // Fall back to remote address
        return request.remoteAddr ?: "unknown"
    }

    private fun extractUserAgent(request: HttpServletRequest): String {
        return request.getHeader("User-Agent") ?: "unknown"
    }

    private fun extractSessionId(request: HttpServletRequest): String? {
        return request.session?.id
    }
    
    /**
     * Get client IP address from request
     */
    fun getClientIpAddress(request: HttpServletRequest?): String {
        return request?.let { extractRealIPAddress(it) } ?: "unknown"
    }
    
    /**
     * Get user agent from request
     */
    fun getUserAgent(request: HttpServletRequest?): String? {
        return request?.let { extractUserAgent(it) }
    }
}

/**
 * Data class containing extracted client information
 */
data class ClientInfo(
    val ipAddress: String,
    val userAgent: String,
    val sessionId: String? = null,
    val referer: String? = null,
    val origin: String? = null,
    val acceptLanguage: String? = null,
    val forwardedFor: String? = null
)