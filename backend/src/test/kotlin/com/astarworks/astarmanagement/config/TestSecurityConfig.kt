package com.astarworks.astarmanagement.config

import com.astarworks.astarmanagement.fixture.JwtTestFixture
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator
import org.springframework.security.oauth2.core.OAuth2TokenValidator
import org.springframework.security.oauth2.jwt.*

/**
 * Test security configuration that provides a mock JWT decoder for integration tests.
 * This configuration uses the same RSA keys as JwtTestFixture to ensure compatibility
 * across all tests without requiring individual test configurations.
 * 
 * Key features:
 * - Uses RSA public key from JwtTestFixture for JWT verification
 * - Supports custom claims like org_id for tenant resolution
 * - Maintains compatibility with TenantAwareJwtAuthenticationConverter
 * - Validates basic JWT structure without external Auth0 dependency
 * - Eliminates need for per-test jwtDecoder bean definitions
 */
@TestConfiguration
class TestSecurityConfig {
    
    /**
     * Provides a unified JWT decoder for all test environments.
     * This decoder accepts JWTs signed with JwtTestFixture's RSA private key.
     * 
     * @Primary annotation ensures this bean takes precedence over
     * the production JwtDecoder in SecurityConfig and any duplicate definitions.
     */
    @Bean("jwtDecoder")
    @Primary
    fun jwtDecoder(): JwtDecoder {
        // Use the public key from JwtTestFixture for JWT validation
        // This ensures all tests use the same JWT verification approach
        val publicKey = JwtTestFixture.publicKey
        val decoder = NimbusJwtDecoder.withPublicKey(publicKey).build()
        
        // Add basic validators (but skip issuer/audience validation for test flexibility)
        val validators = mutableListOf<OAuth2TokenValidator<Jwt>>()
        
        // Add timestamp validator (checks exp and nbf claims)
        validators.add(JwtTimestampValidator())
        
        // Create composite validator
        val validator = DelegatingOAuth2TokenValidator(validators)
        decoder.setJwtValidator(validator)
        
        return decoder
    }
}