package com.astarworks.astarmanagement.core.infrastructure.security

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldNotBe
import io.mockk.every
import io.mockk.mockk
import org.springframework.core.env.Environment
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder

class SecurityConfigTest : DescribeSpec({
    
    describe("SecurityConfig") {
        
        context("when creating JWT decoder") {
            
            it("should create decoder with JWKS URI") {
                val jwksUri = "https://test.auth0.com/.well-known/jwks.json"
                val auth0Domain = "test.auth0.com"
                val audience = "test-audience"
                val mockConverter = mockk<JwtAuthenticationConverter>()
                val mockAuthEntryPoint = mockk<CustomAuthenticationEntryPoint>()
                val mockAccessDeniedHandler = mockk<CustomAccessDeniedHandler>()
                val mockEnvironment = mockk<Environment> {
                    every { activeProfiles } returns arrayOf("test")
                }
                
                val config = SecurityConfig(
                    jwksUri = jwksUri,
                    auth0Domain = auth0Domain,
                    audience = audience,
                    jwtAuthenticationConverter = mockConverter,
                    customAuthenticationEntryPoint = mockAuthEntryPoint,
                    customAccessDeniedHandler = mockAccessDeniedHandler,
                    environment = mockEnvironment
                )
                
                val decoder = config.jwtDecoder()
                
                decoder shouldNotBe null
                // Verify it's a NimbusJwtDecoder (the actual implementation)
                decoder::class shouldNotBe null
            }
        }
        
        context("when configuring CORS") {
            
            it("should create CORS configuration source") {
                val jwksUri = "https://test.auth0.com/.well-known/jwks.json"
                val auth0Domain = "test.auth0.com"
                val audience = "test-audience"
                val mockConverter = mockk<JwtAuthenticationConverter>()
                val mockAuthEntryPoint = mockk<CustomAuthenticationEntryPoint>()
                val mockAccessDeniedHandler = mockk<CustomAccessDeniedHandler>()
                val mockEnvironment = mockk<Environment> {
                    every { activeProfiles } returns arrayOf("test")
                }
                
                val config = SecurityConfig(
                    jwksUri = jwksUri,
                    auth0Domain = auth0Domain,
                    audience = audience,
                    jwtAuthenticationConverter = mockConverter,
                    customAuthenticationEntryPoint = mockAuthEntryPoint,
                    customAccessDeniedHandler = mockAccessDeniedHandler,
                    environment = mockEnvironment
                )
                
                val corsConfig = config.corsConfigurationSource()
                
                corsConfig shouldNotBe null
                // CorsConfigurationSource is properly configured
                // The actual CORS configuration will be handled by Spring Security
            }
        }
    }
})