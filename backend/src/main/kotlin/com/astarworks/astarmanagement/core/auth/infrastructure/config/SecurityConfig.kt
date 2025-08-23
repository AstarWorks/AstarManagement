package com.astarworks.astarmanagement.core.auth.infrastructure.config

import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.TenantAwareJwtAuthenticationConverter
import com.astarworks.astarmanagement.shared.infrastructure.handler.CustomAccessDeniedHandler
import com.astarworks.astarmanagement.shared.infrastructure.handler.CustomAuthenticationEntryPoint
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.security.authorization.AuthorizationDecision
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

/**
 * Enhanced Spring Security configuration for Auth0 JWT validation with multi-tenant support.
 * Provides comprehensive API endpoint protection, CORS configuration,
 * security headers, and environment-specific access controls.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    @param:Value("\${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private val jwksUri: String,
    private val jwtAuthenticationConverter: TenantAwareJwtAuthenticationConverter,
    private val customAuthenticationEntryPoint: CustomAuthenticationEntryPoint,
    private val customAccessDeniedHandler: CustomAccessDeniedHandler,
    private val environment: Environment
) {

    private val profiles = environment.activeProfiles.toList()

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .cors { corsConfigurer ->
                corsConfigurer.configurationSource(corsConfigurationSource())
            }
            .csrf { it.disable() }
            .authorizeHttpRequests { auth ->
                auth
                    // Public endpoints
                    .requestMatchers(
                        "/actuator/health",
                        "/actuator/info",
                        "/actuator/metrics"
                    ).permitAll()

                    // Health check endpoints - Public
                    .requestMatchers(
                        "/api/v1/health",
                        "/api/v1/health/**"
                    ).permitAll()

                    // Mock auth endpoints (development only)
                    .requestMatchers("/mock-auth/**")
                    .permitAll()

                    // Test data endpoints (development only, requires mock auth to be enabled)
                    .requestMatchers("/api/v1/test-data/**")
                    .permitAll()

                    // Test endpoints - public endpoint only
                    .requestMatchers("/api/v1/test/public")
                    .permitAll()

                    // Development-only endpoints
                    .requestMatchers("/api/v1/hello")
                    .access { _, _ -> developmentOnlyAccess() }

                    // API Documentation (secured in production)
                    .requestMatchers(
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/swagger-ui.html",
                        "/api-docs/**"
                    ).access { _, _ -> developmentOnlyAccess() }

                    // Auth endpoints 
                    .requestMatchers("/api/v1/auth/**")
                    .authenticated()

                    // All other API endpoints require authentication
                    .requestMatchers("/api/**")
                    .authenticated()

                    // Deny all other requests
                    .anyRequest().denyAll()
            }
            .oauth2ResourceServer { oauth2 ->
                oauth2
                    .jwt { jwt ->
                        jwt
                            .decoder(jwtDecoder())
                            .jwtAuthenticationConverter(jwtAuthenticationConverter)
                    }
                    .authenticationEntryPoint(customAuthenticationEntryPoint)
                    .accessDeniedHandler(customAccessDeniedHandler)
            }
            .exceptionHandling { exceptions ->
                exceptions
                    .authenticationEntryPoint(customAuthenticationEntryPoint)
                    .accessDeniedHandler(customAccessDeniedHandler)
            }
            .build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()

        // Configure allowed origins based on environment
        if (isDevelopmentEnvironment()) {
            configuration.allowedOrigins = listOf(
                "http://localhost:3000", // Nuxt.js dev server
                "http://127.0.0.1:3000",
                "http://localhost:8080", // Alternative dev port
                "https://test.ngrok.io", // Test ngrok domain
                "https://test.ngrok-free.app" // Test ngrok domain
            )
            configuration.allowedOriginPatterns = listOf(
                "https://*.ngrok.io", // ngrok for development
                "https://*.ngrok-free.app" // ngrok free tier
            )
        } else {
            configuration.allowedOrigins = listOf(
                "https://app.astar-management.com",
                "https://demo.astar-management.com"
            )
            configuration.allowedOriginPatterns = listOf(
                "https://*.astar-management.com"
            )
        }

        configuration.allowedMethods = listOf(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        )

        configuration.allowedHeaders = listOf(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "X-Request-ID",
            "X-Tenant-ID"
        )

        configuration.exposedHeaders = listOf(
            "X-Request-ID",
            "X-Total-Count",
            "X-Page-Count"
        )

        configuration.allowCredentials = false // JWT in Authorization header
        configuration.maxAge = 3600 // 1 hour preflight cache

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration) // Apply to all endpoints
        return source
    }

    @Bean
    fun jwtDecoder(): JwtDecoder {
        // Note: JWKS caching is handled internally by NimbusJwtDecoder
        // It caches the keys automatically with a default TTL
        return NimbusJwtDecoder.withJwkSetUri(jwksUri).build()
    }

    private fun developmentOnlyAccess(): AuthorizationDecision =
        if (isDevelopmentEnvironment())
            AuthorizationDecision(true) else
            AuthorizationDecision(false)

    private fun isDevelopmentEnvironment(): Boolean {
        return profiles.contains("dev") ||
                profiles.contains("local") ||
                profiles.contains("test")
    }
}