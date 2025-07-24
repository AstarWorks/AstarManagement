package dev.ryuzu.astermanagement.security.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
import org.springframework.security.web.header.HeaderWriter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import java.time.Duration

/**
 * Security headers configuration for comprehensive protection
 * Implements OWASP security headers recommendations
 */
@Configuration
@EnableWebSecurity
class SecurityHeadersConfig {

    @Value("\${security.headers.content-security-policy:default-src 'self'}")
    private lateinit var contentSecurityPolicy: String

    @Value("\${security.headers.hsts-max-age:31536000}")
    private val hstsMaxAge: Long = 31536000 // 1 year

    @Value("\${security.headers.hsts-include-subdomains:true}")
    private val hstsIncludeSubDomains: Boolean = true

    @Value("\${security.headers.frame-options:DENY}")
    private lateinit var frameOptions: String

    @Value("\${app.frontend.url:http://localhost:3000}")
    private lateinit var frontendUrl: String

    @Bean
    fun securityHeadersFilterChain(http: HttpSecurity): SecurityFilterChain {
        http.headers { headers ->
            headers
                // Content Security Policy
                .contentSecurityPolicy { csp ->
                    csp.policyDirectives(buildContentSecurityPolicy())
                }
                
                // HTTP Strict Transport Security (HSTS)
                .httpStrictTransportSecurity { hsts ->
                    hsts
                        .maxAgeInSeconds(hstsMaxAge)
                        .includeSubDomains(hstsIncludeSubDomains)
                        .preload(true)
                }
                
                // X-Frame-Options
                .frameOptions { frame ->
                    when (frameOptions.uppercase()) {
                        "DENY" -> frame.deny()
                        "SAMEORIGIN" -> frame.sameOrigin()
                        else -> frame.deny()
                    }
                }
                
                // X-Content-Type-Options
                .contentTypeOptions { }
                
                // X-XSS-Protection
                .xssProtection { xss ->
                    xss.headerValue(org.springframework.security.web.header.writers.XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK)
                }
                
                // Referrer Policy
                .referrerPolicy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                
                // We'll add the custom headers using a separate filter
        }

        return http.build()
    }

    @Bean("securityCorsConfigurationSource")
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            // Allowed origins
            allowedOriginPatterns = listOf(
                frontendUrl,
                "http://localhost:3000", // Development
                "https://*.astermanagement.com" // Production domains
            )
            
            // Allowed methods
            allowedMethods = listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            
            // Allowed headers
            allowedHeaders = listOf(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "X-CSRF-Token",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
            )
            
            // Exposed headers
            exposedHeaders = listOf(
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "X-RateLimit-Reset",
                "X-Total-Count"
            )
            
            // Credentials
            allowCredentials = true
            
            // Max age
            maxAge = Duration.ofMinutes(30).seconds
        }

        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/api/**", configuration)
        }
    }

    private fun buildContentSecurityPolicy(): String {
        return """
            default-src 'self';
            script-src 'self' 'unsafe-inline' 'unsafe-eval' 
                       https://cdn.jsdelivr.net 
                       https://unpkg.com;
            style-src 'self' 'unsafe-inline' 
                      https://fonts.googleapis.com 
                      https://cdn.jsdelivr.net;
            font-src 'self' 
                     https://fonts.gstatic.com 
                     data:;
            img-src 'self' 
                    data: 
                    https: 
                    blob:;
            media-src 'self' 
                      data: 
                      blob:;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
            upgrade-insecure-requests;
            block-all-mixed-content;
            connect-src 'self' 
                        https://api.astermanagement.com 
                        wss://api.astermanagement.com;
            worker-src 'self' 
                       blob:;
            manifest-src 'self';
            prefetch-src 'self';
        """.trimIndent().replace("\n", " ").replace(Regex("\\s+"), " ")
    }

    private fun buildPermissionsPolicy(): String {
        return listOf(
            "accelerometer=()",
            "ambient-light-sensor=()",
            "autoplay=()",
            "battery=()",
            "camera=()",
            "cross-origin-isolated=()",
            "display-capture=()",
            "document-domain=()",
            "encrypted-media=()",
            "execution-while-not-rendered=()",
            "execution-while-out-of-viewport=()",
            "fullscreen=(self)",
            "geolocation=()",
            "gyroscope=()",
            "keyboard-map=()",
            "magnetometer=()",
            "microphone=()",
            "midi=()",
            "navigation-override=()",
            "payment=()",
            "picture-in-picture=()",
            "publickey-credentials-get=(self)",
            "screen-wake-lock=()",
            "sync-xhr=()",
            "usb=()",
            "web-share=()",
            "xr-spatial-tracking=()"
        ).joinToString(", ")
    }
}

/**
 * Security headers filter for dynamic header configuration
 */
@Configuration
class DynamicSecurityHeadersFilter {
    
    @Bean
    fun dynamicSecurityHeadersCustomizer(): SecurityHeadersCustomizer {
        return SecurityHeadersCustomizer()
    }
}

/**
 * Customizer for dynamic security headers based on request context
 */
class SecurityHeadersCustomizer {
    
    fun addSecurityHeaders(
        response: HttpServletResponse,
        requestPath: String
    ) {
        // Add security headers based on request context
        when {
            requestPath.startsWith("/api/auth/") -> {
                addAuthEndpointHeaders(response)
            }
            requestPath.startsWith("/api/") -> {
                addApiHeaders(response)
            }
            requestPath.startsWith("/admin/") -> {
                addAdminHeaders(response)
            }
            else -> {
                addDefaultHeaders(response)
            }
        }
    }
    
    private fun addAuthEndpointHeaders(response: HttpServletResponse) {
        // Stricter headers for authentication endpoints
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        response.setHeader("Pragma", "no-cache")
        response.setHeader("X-Content-Type-Options", "nosniff")
        response.setHeader("X-Frame-Options", "DENY")
        response.setHeader("X-XSS-Protection", "1; mode=block")
    }
    
    private fun addApiHeaders(response: HttpServletResponse) {
        // Standard API headers
        response.setHeader("X-Content-Type-Options", "nosniff")
        response.setHeader("X-Frame-Options", "DENY")
        response.setHeader("Cache-Control", "no-cache, no-store, max-age=0")
    }
    
    private fun addAdminHeaders(response: HttpServletResponse) {
        // Extra strict headers for admin endpoints
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        response.setHeader("Pragma", "no-cache")
        response.setHeader("X-Content-Type-Options", "nosniff")
        response.setHeader("X-Frame-Options", "DENY")
        response.setHeader("X-XSS-Protection", "1; mode=block")
        response.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
    }
    
    private fun addDefaultHeaders(response: HttpServletResponse) {
        // Basic security headers for all other requests
        response.setHeader("X-Content-Type-Options", "nosniff")
        response.setHeader("X-Frame-Options", "SAMEORIGIN")
    }
}