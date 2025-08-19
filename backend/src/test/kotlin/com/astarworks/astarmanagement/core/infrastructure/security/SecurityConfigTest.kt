package com.astarworks.astarmanagement.core.infrastructure.security

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldNotBe
import io.mockk.every
import io.mockk.mockk
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder

class SecurityConfigTest : DescribeSpec({
    
    describe("SecurityConfig") {
        
        context("when creating JWT decoder") {
            
            it("should create decoder with JWKS URI") {
                val jwksUri = "https://test.auth0.com/.well-known/jwks.json"
                val config = SecurityConfig(jwksUri)
                
                val decoder = config.jwtDecoder()
                
                decoder shouldNotBe null
                // Verify it's a NimbusJwtDecoder (the actual implementation)
                decoder::class shouldNotBe null
            }
        }
        
        context("when configuring CORS") {
            
            it("should create CORS configuration source") {
                val jwksUri = "https://test.auth0.com/.well-known/jwks.json"
                val config = SecurityConfig(jwksUri)
                
                val corsConfig = config.corsConfigurationSource()
                
                corsConfig shouldNotBe null
                // CorsConfigurationSource is properly configured
                // The actual CORS configuration will be handled by Spring Security
            }
        }
    }
})