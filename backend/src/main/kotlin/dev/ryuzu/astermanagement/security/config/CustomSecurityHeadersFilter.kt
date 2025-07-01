package dev.ryuzu.astermanagement.security.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Custom filter to add additional security headers
 */
@Component
class CustomSecurityHeadersFilter(
    private val securityHeadersConfig: SecurityHeadersConfig
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        // Add custom security headers
        response.setHeader("Permissions-Policy", buildPermissionsPolicy())
        response.setHeader("Cross-Origin-Resource-Policy", "cross-origin")
        response.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
        response.setHeader("Cross-Origin-Opener-Policy", "same-origin")
        response.setHeader("Server", "Aster-Management")
        response.setHeader("X-Powered-By", "")
        
        filterChain.doFilter(request, response)
    }
    
    private fun buildPermissionsPolicy(): String {
        return listOf(
            "accelerometer=()",
            "ambient-light-sensor=()",
            "autoplay=(self)",
            "camera=()",
            "encrypted-media=(self)",
            "fullscreen=(self)",
            "geolocation=()",
            "gyroscope=()",
            "magnetometer=()",
            "microphone=()",
            "midi=()",
            "payment=()",
            "picture-in-picture=(self)",
            "usb=()",
            "sync-xhr=(self)"
        ).joinToString(" ")
    }
}