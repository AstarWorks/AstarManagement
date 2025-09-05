package com.astarworks.astarmanagement.unit.auth.domain.model

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeAuthentication
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeContext
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.PlainJWT
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import java.time.Instant

/**
 * Unit tests for SetupModeAuthentication.
 * 
 * Tests the special authentication type used for users without org_id in their JWT.
 * This authentication type allows limited access to setup endpoints only.
 */
@DisplayName("SetupModeAuthentication Unit Tests")
class SetupModeAuthenticationTest : UnitTestBase() {

    @Nested
    @DisplayName("Construction and Properties")
    inner class ConstructionTests {
        
        @Test
        @DisplayName("Should create SetupModeAuthentication with email")
        fun `should create SetupModeAuthentication with email`() {
            // Given
            val jwt = createMockJwt("auth0|123456", "user@example.com")
            val auth0Sub = "auth0|123456"
            val email = "user@example.com"
            val authorities = listOf(SimpleGrantedAuthority("ROLE_SETUP_MODE"))
            
            // When
            val authentication = SetupModeAuthentication(
                jwt = jwt,
                auth0Sub = auth0Sub,
                email = email,
                authorities = authorities
            )
            
            // Then
            assertThat(authentication).isNotNull
            assertThat(authentication.jwt).isEqualTo(jwt)
            assertThat(authentication.auth0Sub).isEqualTo(auth0Sub)
            assertThat(authentication.email).isEqualTo(email)
            assertThat(authentication.authorities).containsExactlyElementsOf(authorities)
        }
        
        @Test
        @DisplayName("Should create SetupModeAuthentication without email")
        fun `should create SetupModeAuthentication without email`() {
            // Given
            val jwt = createMockJwt("auth0|123456", null)
            val auth0Sub = "auth0|123456"
            val authorities = listOf(SimpleGrantedAuthority("ROLE_SETUP_MODE"))
            
            // When
            val authentication = SetupModeAuthentication(
                jwt = jwt,
                auth0Sub = auth0Sub,
                email = null,
                authorities = authorities
            )
            
            // Then
            assertThat(authentication).isNotNull
            assertThat(authentication.email).isNull()
            assertThat(authentication.auth0Sub).isEqualTo(auth0Sub)
        }
    }
    
    @Nested
    @DisplayName("Authentication State")
    inner class AuthenticationStateTests {
        
        @Test
        @DisplayName("Should be authenticated by default")
        fun `should be authenticated by default`() {
            // Given
            val authentication = createSetupModeAuthentication()
            
            // Then
            assertThat(authentication.isAuthenticated).isTrue()
        }
        
        @Test
        @DisplayName("Should allow setting authenticated to false")
        fun `should allow setting authenticated to false`() {
            // Given
            val authentication = createSetupModeAuthentication()
            
            // When
            authentication.isAuthenticated = false
            
            // Then
            assertThat(authentication.isAuthenticated).isFalse()
        }
    }
    
    @Nested
    @DisplayName("Principal and Credentials")
    inner class PrincipalCredentialsTests {
        
        @Test
        @DisplayName("Should return SetupModeContext as principal")
        fun `should return SetupModeContext as principal`() {
            // Given
            val auth0Sub = "auth0|123456"
            val email = "user@example.com"
            val authentication = createSetupModeAuthentication(auth0Sub, email)
            
            // When
            val principal = authentication.principal
            
            // Then
            assertThat(principal).isInstanceOf(SetupModeContext::class.java)
            val context = principal as SetupModeContext
            assertThat(context.auth0Sub).isEqualTo(auth0Sub)
            assertThat(context.email).isEqualTo(email)
        }
        
        @Test
        @DisplayName("Should return JWT as credentials")
        fun `should return JWT as credentials`() {
            // Given
            val jwt = createMockJwt("auth0|123456", "user@example.com")
            val authentication = SetupModeAuthentication(
                jwt = jwt,
                auth0Sub = "auth0|123456",
                email = "user@example.com",
                authorities = listOf(SimpleGrantedAuthority("ROLE_SETUP_MODE"))
            )
            
            // When
            val credentials = authentication.credentials
            
            // Then
            assertThat(credentials).isEqualTo(jwt)
        }
    }
    
    @Nested
    @DisplayName("Name and Details")
    inner class NameDetailsTests {
        
        @Test
        @DisplayName("Should return auth0Sub as name")
        fun `should return auth0Sub as name`() {
            // Given
            val auth0Sub = "auth0|unique_identifier"
            val authentication = createSetupModeAuthentication(auth0Sub)
            
            // When
            val name = authentication.name
            
            // Then
            assertThat(name).isEqualTo(auth0Sub)
        }
        
        @Test
        @DisplayName("Should return JWT as details")
        fun `should return JWT as details`() {
            // Given
            val jwt = createMockJwt("auth0|123456", "user@example.com")
            val authentication = SetupModeAuthentication(
                jwt = jwt,
                auth0Sub = "auth0|123456",
                email = "user@example.com",
                authorities = listOf(SimpleGrantedAuthority("ROLE_SETUP_MODE"))
            )
            
            // When
            val details = authentication.details
            
            // Then
            assertThat(details).isEqualTo(jwt)
        }
    }
    
    @Nested
    @DisplayName("Authorities")
    inner class AuthoritiesTests {
        
        @Test
        @DisplayName("Should have limited authorities for setup mode")
        fun `should have limited authorities for setup mode`() {
            // Given
            val authorities = listOf(
                SimpleGrantedAuthority("ROLE_SETUP_MODE"),
                SimpleGrantedAuthority("SCOPE_setup")
            )
            val authentication = SetupModeAuthentication(
                jwt = createMockJwt(),
                auth0Sub = "auth0|123456",
                email = "user@example.com",
                authorities = authorities
            )
            
            // Then
            assertThat(authentication.authorities).hasSize(2)
            assertThat(authentication.authorities.map { it.authority })
                .containsExactly("ROLE_SETUP_MODE", "SCOPE_setup")
        }
        
        @Test
        @DisplayName("Should work with empty authorities")
        fun `should work with empty authorities`() {
            // Given
            val authentication = SetupModeAuthentication(
                jwt = createMockJwt(),
                auth0Sub = "auth0|123456",
                email = null,
                authorities = emptyList()
            )
            
            // Then
            assertThat(authentication.authorities).isEmpty()
        }
    }
    
    @Nested
    @DisplayName("SetupModeContext")
    inner class SetupModeContextTests {
        
        @Test
        @DisplayName("Should create SetupModeContext with email")
        fun `should create SetupModeContext with email`() {
            // Given
            val auth0Sub = "auth0|123456"
            val email = "user@example.com"
            
            // When
            val context = SetupModeContext(auth0Sub, email)
            
            // Then
            assertThat(context.auth0Sub).isEqualTo(auth0Sub)
            assertThat(context.email).isEqualTo(email)
        }
        
        @Test
        @DisplayName("Should create SetupModeContext without email")
        fun `should create SetupModeContext without email`() {
            // Given
            val auth0Sub = "auth0|123456"
            
            // When
            val context = SetupModeContext(auth0Sub, null)
            
            // Then
            assertThat(context.auth0Sub).isEqualTo(auth0Sub)
            assertThat(context.email).isNull()
        }
        
        @Test
        @DisplayName("Should have correct toString representation")
        fun `should have correct toString representation`() {
            // Given
            val context = SetupModeContext("auth0|123456", "user@example.com")
            
            // When
            val string = context.toString()
            
            // Then
            assertThat(string).contains("auth0|123456")
            assertThat(string).contains("user@example.com")
        }
    }
    
    // Helper methods
    
    private fun createSetupModeAuthentication(
        auth0Sub: String = "auth0|123456",
        email: String? = "user@example.com"
    ): SetupModeAuthentication {
        return SetupModeAuthentication(
            jwt = createMockJwt(auth0Sub, email),
            auth0Sub = auth0Sub,
            email = email,
            authorities = listOf(SimpleGrantedAuthority("ROLE_SETUP_MODE"))
        )
    }
    
    private fun createMockJwt(
        subject: String = "auth0|123456",
        email: String? = "user@example.com"
    ): Jwt {
        val now = Instant.now()
        val claims = mutableMapOf<String, Any>(
            "sub" to subject,
            "iss" to "https://test.auth0.com/",
            "aud" to listOf("https://api.astar.com"),
            "iat" to now.epochSecond,
            "exp" to now.plusSeconds(3600).epochSecond
        )
        
        email?.let { claims["email"] = it }
        
        return Jwt(
            "mock.jwt.token",
            now,
            now.plusSeconds(3600),
            mapOf("alg" to "RS256", "typ" to "JWT"),
            claims
        )
    }
}