package dev.ryuzu.astermanagement.config

import io.mockk.every
import io.mockk.mockk
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.context.annotation.Profile
import org.springframework.data.domain.AuditorAware
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.jwt.JwtDecoder
import java.time.Instant
import java.util.*

/**
 * Test configuration for security-related beans and mocking
 * Provides consistent test setup for authentication and authorization
 */
@TestConfiguration
@Profile("test")
class TestSecurityConfig {
    
    /**
     * Mock JWT decoder for testing JWT-based authentication
     */
    @Bean
    @Primary
    fun testJwtDecoder(): JwtDecoder {
        val mockDecoder = mockk<JwtDecoder>()
        
        every { mockDecoder.decode(any()) } answers {
            createTestJwt(
                sub = "test-user",
                email = "test@example.com",
                roles = listOf("LAWYER"),
                scope = "read write"
            )
        }
        
        return mockDecoder
    }
    
    /**
     * Test auditor provider for JPA auditing
     */
    @Bean
    @Primary
    fun testAuditorAware(): AuditorAware<String> {
        return AuditorAware { Optional.of("test-user") }
    }
    
    /**
     * Creates test JWT tokens with specified claims
     */
    fun createTestJwt(
        sub: String = "test-user",
        email: String = "test@example.com", 
        roles: List<String> = listOf("LAWYER"),
        scope: String = "read write",
        tokenValue: String = "test-token"
    ): Jwt {
        val headers = mapOf(
            "alg" to "RS256",
            "typ" to "JWT"
        )
        
        val claims = mapOf(
            "sub" to sub,
            "email" to email,
            "roles" to roles,
            "scope" to scope,
            "iat" to Instant.now().epochSecond,
            "exp" to Instant.now().plusSeconds(3600).epochSecond,
            "aud" to "astermanagement-api",
            "iss" to "https://auth.astermanagement.dev"
        )
        
        return Jwt(
            tokenValue,
            Instant.now(),
            Instant.now().plusSeconds(3600),
            headers,
            claims
        )
    }
    
    /**
     * Creates JWT for lawyer role testing
     */
    fun createLawyerJwt(
        username: String = "lawyer@test.com"
    ): Jwt = createTestJwt(
        sub = username,
        email = username,
        roles = listOf("LAWYER"),
        scope = "read write admin"
    )
    
    /**
     * Creates JWT for clerk role testing
     */
    fun createClerkJwt(
        username: String = "clerk@test.com"
    ): Jwt = createTestJwt(
        sub = username,
        email = username,
        roles = listOf("CLERK"),
        scope = "read write"
    )
    
    /**
     * Creates JWT for client role testing
     */
    fun createClientJwt(
        username: String = "client@test.com"
    ): Jwt = createTestJwt(
        sub = username,
        email = username,
        roles = listOf("CLIENT"),
        scope = "read"
    )
}