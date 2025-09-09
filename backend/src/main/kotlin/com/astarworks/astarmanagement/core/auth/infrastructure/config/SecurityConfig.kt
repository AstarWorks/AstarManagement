package com.astarworks.astarmanagement.core.auth.infrastructure.config

import com.astarworks.astarmanagement.core.auth.infrastructure.security.CustomAuthorizationManager
import com.astarworks.astarmanagement.shared.infrastructure.handler.CustomAccessDeniedHandler
import com.astarworks.astarmanagement.shared.infrastructure.handler.CustomAuthenticationEntryPoint
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.convert.converter.Converter
import org.springframework.core.env.Environment
import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.authorization.AuthorizationDecision
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
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
    private val jwtAuthenticationConverter: Converter<Jwt, AbstractAuthenticationToken>,
    private val customAuthenticationEntryPoint: CustomAuthenticationEntryPoint,
    private val customAccessDeniedHandler: CustomAccessDeniedHandler,
    private val customAuthorizationManager: CustomAuthorizationManager,
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
            .headers { headers ->
                headers
                    .frameOptions { it.deny() }
                    .xssProtection { it.headerValue(org.springframework.security.web.header.writers.XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK) }
                    .contentTypeOptions { }
                    .cacheControl { }
            }
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
                    
                    // OpenAPI and Swagger UI endpoints - Public
                    .requestMatchers(
                        "/v3/api-docs",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html"
                    ).permitAll()

                    // Mock auth endpoints (development only)
                    .requestMatchers("/mock-auth/**")
                    .permitAll()

                    // Test data endpoints - controlled by CustomAuthorizationManager
                    // SetupMode should be blocked, normal auth should be allowed
                    .requestMatchers("/api/v1/test-data/**")
                    .access(customAuthorizationManager)

                    // Test endpoints - public endpoint only
                    .requestMatchers("/api/v1/auth/test/public")
                    .permitAll()
                    
                    // Kotlin Serialization test endpoints (development only)
                    .requestMatchers("/api/test/serialization/**")
                    .permitAll()

                    // Development-only endpoints
                    .requestMatchers("/api/v1/hello")
                    .access { _, _ -> developmentOnlyAccess() }

                    // API Documentation (secured in production)
                    .requestMatchers(
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/v3/api-docs",
                        "/v3/api-docs-original",
                        "/swagger-ui.html",
                        "/api-docs/**"
                    ).access { _, _ -> developmentOnlyAccess() }

                    // Auth endpoints - use custom authorization manager
                    .requestMatchers("/api/v1/auth/**")
                    .access(customAuthorizationManager)

                    // All other API endpoints - use custom authorization manager
                    .requestMatchers("/api/**")
                    .access(customAuthorizationManager)

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
    @ConditionalOnMissingBean(JwtDecoder::class)
    fun jwtDecoder(): JwtDecoder {
        System.err.println("=== SecurityConfig.jwtDecoder() called - creating default decoder ===")
        println("=== SecurityConfig.jwtDecoder() called - creating default decoder ===")
        System.err.println("JWKS URI: $jwksUri")
        
        // Note: JWKS caching is handled internally by NimbusJwtDecoder
        // It caches the keys automatically with a default TTL
        // This bean will only be created if no other JwtDecoder bean exists (e.g., in tests)
        val decoder = NimbusJwtDecoder.withJwkSetUri(jwksUri).build()
        
        System.err.println("Default JwtDecoder created: $decoder")
        return decoder
    }

    private fun developmentOnlyAccess(): AuthorizationDecision =
        if (isDevelopmentEnvironment())
            AuthorizationDecision(true) else
            AuthorizationDecision(false)

    private fun isDevelopmentEnvironment(): Boolean {
        return profiles.contains("dev") ||
                profiles.contains("local") ||
                profiles.contains("test") ||
                profiles.contains("integration-test")
    }
}