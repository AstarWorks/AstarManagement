package dev.ryuzu.astermanagement.config

import dev.ryuzu.astermanagement.service.JwtService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.security.web.header.writers.*
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

/**
 * Security Configuration for AsterManagement API
 * 
 * Configures:
 * - JWT-based authentication with stateless sessions
 * - Role-based authorization (LAWYER, CLERK, CLIENT)
 * - Method-level security annotations
 * - CORS configuration for frontend integration
 * - Security headers for protection
 * - Custom authentication and authorization error handling
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
class SecurityConfiguration(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val jwtAuthenticationEntryPoint: JwtAuthenticationEntryPoint,
    private val jwtAccessDeniedHandler: JwtAccessDeniedHandler
) {
    
    /**
     * Main security filter chain configuration
     */
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            // Disable CSRF for API (using JWT tokens)
            .csrf { it.disable() }
            
            // Session management - stateless for JWT
            .sessionManagement { 
                it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) 
            }
            
            // Configure authorization rules
            .authorizeHttpRequests { auth ->
                auth
                    // Public endpoints
                    .requestMatchers("/auth/**").permitAll()
                    .requestMatchers("/actuator/health").permitAll()
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/favicon.ico").permitAll()
                    
                    // Matter endpoints - role-based access
                    .requestMatchers(HttpMethod.GET, "/v1/matters/**").hasAnyRole("LAWYER", "CLERK")
                    .requestMatchers(HttpMethod.POST, "/v1/matters").hasRole("LAWYER")
                    .requestMatchers(HttpMethod.PUT, "/v1/matters/**").hasAnyRole("LAWYER", "CLERK")
                    .requestMatchers(HttpMethod.DELETE, "/v1/matters/**").hasRole("LAWYER")
                    
                    // Document endpoints - permission-based access (will be implemented in method level)
                    .requestMatchers("/v1/documents/**").hasAnyAuthority("document:read", "document:write")
                    
                    // Memo endpoints
                    .requestMatchers("/v1/memos/**").hasAnyAuthority("memo:read", "memo:write")
                    
                    // Expense endpoints
                    .requestMatchers("/v1/expenses/**").hasAnyAuthority("expense:read", "expense:write")
                    
                    // Admin endpoints - lawyer only
                    .requestMatchers("/v1/admin/**").hasRole("LAWYER")
                    
                    // All other requests need authentication
                    .anyRequest().authenticated()
            }
            
            // Exception handling
            .exceptionHandling { exceptions ->
                exceptions
                    .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                    .accessDeniedHandler(jwtAccessDeniedHandler)
            }
            
            // CORS configuration
            .cors { it.configurationSource(corsConfigurationSource()) }
            
            // Security headers
            .headers { headers ->
                headers
                    .frameOptions { frameOptions -> frameOptions.deny() }
                    .contentTypeOptions { }
                    .httpStrictTransportSecurity { hsts ->
                        hsts.maxAgeInSeconds(31536000)
                            .includeSubDomains(true)
                    }
                    .contentSecurityPolicy { csp ->
                        csp.policyDirectives("default-src 'self'; frame-ancestors 'none'")
                    }
            }
            
            // Add JWT filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
            
            .build()
    }

    /**
     * Password encoder for user credentials
     */
    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    /**
     * Authentication manager for login processing
     */
    @Bean
    fun authenticationManager(config: AuthenticationConfiguration): AuthenticationManager =
        config.authenticationManager

    /**
     * CORS configuration for frontend integration
     */
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        
        // Allow frontend origins (configurable via environment)
        configuration.allowedOriginPatterns = listOf(
            "http://localhost:*",
            "https://localhost:*",
            "https://*.astermanagement.dev",
            "https://*.vercel.app" // For preview deployments
        )
        
        // Allow common HTTP methods
        configuration.allowedMethods = listOf(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        )
        
        // Allow all headers including Authorization
        configuration.allowedHeaders = listOf("*")
        
        // Allow credentials for authentication
        configuration.allowCredentials = true
        
        // Cache preflight responses for 1 hour
        configuration.maxAge = 3600L
        
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/v1/**", configuration)
        source.registerCorsConfiguration("/auth/**", configuration)
        
        return source
    }
}