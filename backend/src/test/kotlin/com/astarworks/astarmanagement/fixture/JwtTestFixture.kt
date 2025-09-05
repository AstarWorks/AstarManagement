package com.astarworks.astarmanagement.fixture

import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.JWSSigner
import com.nimbusds.jose.crypto.RSASSASigner
import com.nimbusds.jose.jwk.RSAKey
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT
import org.springframework.security.oauth2.jwt.Jwt
import java.security.interfaces.RSAPublicKey
import java.time.Instant
import java.util.*

/**
 * JWT test fixture for generating mock Auth0-style JWT tokens.
 * Provides utilities for creating valid and invalid tokens for testing.
 */
object JwtTestFixture {
    
    // Generate RSA key pair for signing
    private val rsaKey: RSAKey = RSAKeyGenerator(2048)
        .keyID("test-key-id")
        .generate()
    
    private val signer: JWSSigner = RSASSASigner(rsaKey)
    val publicKey: RSAPublicKey = rsaKey.toRSAPublicKey()
    
    /**
     * Creates a valid JWT with default claims.
     */
    fun createValidJwt(
        subject: String = "auth0|123456",
        orgId: String = "org_ABC123",
        email: String = "test@example.com",
        issuer: String = "https://test.auth0.com/",
        audience: String = "https://api.astar.com",
        expiresAt: Instant = Instant.now().plusSeconds(3600),
        issuedAt: Instant = Instant.now(),
        additionalClaims: Map<String, Any> = emptyMap()
    ): String {
        val claimsBuilder = JWTClaimsSet.Builder()
            .subject(subject)
            .issuer(issuer)
            .audience(audience)
            .expirationTime(Date.from(expiresAt))
            .issueTime(Date.from(issuedAt))
            .claim("org_id", orgId)
            .claim("email", email)
        
        // Add any additional claims
        additionalClaims.forEach { (key, value) ->
            claimsBuilder.claim(key, value)
        }
        
        val claimsSet = claimsBuilder.build()
        
        val signedJWT = SignedJWT(
            JWSHeader.Builder(JWSAlgorithm.RS256)
                .keyID(rsaKey.keyID)
                .build(),
            claimsSet
        )
        
        signedJWT.sign(signer)
        return signedJWT.serialize()
    }
    
    /**
     * Creates a JWT without org_id claim (missing tenant).
     */
    fun createJwtWithoutOrgId(
        subject: String = "auth0|123456",
        email: String = "test@example.com"
    ): String {
        val claimsSet = JWTClaimsSet.Builder()
            .subject(subject)
            .issuer("https://test.auth0.com/")
            .audience("https://api.astar.com")
            .expirationTime(Date.from(Instant.now().plusSeconds(3600)))
            .issueTime(Date.from(Instant.now()))
            .claim("email", email)
            .build()
        
        val signedJWT = SignedJWT(
            JWSHeader.Builder(JWSAlgorithm.RS256)
                .keyID(rsaKey.keyID)
                .build(),
            claimsSet
        )
        
        signedJWT.sign(signer)
        return signedJWT.serialize()
    }
    
    /**
     * Creates an expired JWT.
     */
    fun createExpiredJwt(
        subject: String = "auth0|123456",
        orgId: String = "org_ABC123"
    ): String {
        return createValidJwt(
            subject = subject,
            orgId = orgId,
            expiresAt = Instant.now().minusSeconds(3600), // Expired 1 hour ago
            issuedAt = Instant.now().minusSeconds(7200)   // Issued 2 hours ago
        )
    }
    
    /**
     * Creates a JWT with invalid signature.
     */
    fun createJwtWithInvalidSignature(
        subject: String = "auth0|123456",
        orgId: String = "org_ABC123"
    ): String {
        val validJwt = createValidJwt(subject, orgId)
        // Corrupt the signature by changing the last character
        return validJwt.dropLast(1) + "X"
    }
    
    /**
     * Creates a JWT with alternative email claim locations.
     */
    fun createJwtWithAlternativeEmailClaim(
        subject: String = "auth0|123456",
        orgId: String = "org_ABC123",
        emailClaimName: String = "https://your-app.com/email",
        email: String = "alternative@example.com"
    ): String {
        val claimsSet = JWTClaimsSet.Builder()
            .subject(subject)
            .issuer("https://test.auth0.com/")
            .audience("https://api.astar.com")
            .expirationTime(Date.from(Instant.now().plusSeconds(3600)))
            .issueTime(Date.from(Instant.now()))
            .claim("org_id", orgId)
            .claim(emailClaimName, email)
            .build()
        
        val signedJWT = SignedJWT(
            JWSHeader.Builder(JWSAlgorithm.RS256)
                .keyID(rsaKey.keyID)
                .build(),
            claimsSet
        )
        
        signedJWT.sign(signer)
        return signedJWT.serialize()
    }
    
    /**
     * Creates a JWT with alternative org_id claim location.
     */
    fun createJwtWithAlternativeOrgClaim(
        subject: String = "auth0|123456",
        orgId: String = "org_ABC123",
        orgClaimName: String = "https://your-app.com/tenant_id"
    ): String {
        val claimsSet = JWTClaimsSet.Builder()
            .subject(subject)
            .issuer("https://test.auth0.com/")
            .audience("https://api.astar.com")
            .expirationTime(Date.from(Instant.now().plusSeconds(3600)))
            .issueTime(Date.from(Instant.now()))
            .claim(orgClaimName, orgId)
            .claim("email", "test@example.com")
            .build()
        
        val signedJWT = SignedJWT(
            JWSHeader.Builder(JWSAlgorithm.RS256)
                .keyID(rsaKey.keyID)
                .build(),
            claimsSet
        )
        
        signedJWT.sign(signer)
        return signedJWT.serialize()
    }
    
    /**
     * Creates a malformed JWT string.
     */
    fun createMalformedJwt(): String {
        return "not.a.valid.jwt"
    }
    
    /**
     * Converts a JWT string to Spring Security Jwt object.
     * Note: This is a simplified version for testing - actual JWT validation
     * would be done by Spring Security's JWT decoder.
     */
    fun parseToSpringJwt(jwtString: String): Jwt {
        val signedJWT = SignedJWT.parse(jwtString)
        val claims = signedJWT.jwtClaimsSet.claims
        
        // Convert Date objects to Instant for timestamp claims
        val convertedClaims = mutableMapOf<String, Any>()
        claims.forEach { (key, value) ->
            convertedClaims[key] = when {
                // Standard JWT timestamp claims that Spring expects as Instant
                (key in listOf("iat", "exp", "nbf", "auth_time") && value is java.util.Date) -> 
                    value.toInstant()
                // Handle numeric timestamps (seconds since epoch)
                (key in listOf("iat", "exp", "nbf", "auth_time") && value is Number) ->
                    Instant.ofEpochSecond(value.toLong())
                else -> value
            }
        }
        
        return Jwt.withTokenValue(jwtString)
            .header("alg", "RS256")
            .header("kid", rsaKey.keyID)
            .claims { it.putAll(convertedClaims) }
            .build()
    }
    
    /**
     * Creates a builder for custom JWT creation with fluent API.
     */
    class JwtBuilder {
        private var subject = "auth0|123456"
        private var orgId: String? = "org_ABC123"
        private var email: String? = "test@example.com"
        private var issuer = "https://test.auth0.com/"
        private var audience = "https://api.astar.com"
        private var expiresAt = Instant.now().plusSeconds(3600)
        private var issuedAt = Instant.now()
        private val additionalClaims = mutableMapOf<String, Any>()
        
        fun withSubject(subject: String) = apply { this.subject = subject }
        fun withOrgId(orgId: String?) = apply { this.orgId = orgId }
        fun withEmail(email: String?) = apply { this.email = email }
        fun withIssuer(issuer: String) = apply { this.issuer = issuer }
        fun withAudience(audience: String) = apply { this.audience = audience }
        fun withExpiresAt(expiresAt: Instant) = apply { this.expiresAt = expiresAt }
        fun withIssuedAt(issuedAt: Instant) = apply { this.issuedAt = issuedAt }
        fun withClaim(key: String, value: Any) = apply { this.additionalClaims[key] = value }
        
        fun build(): String {
            val claimsBuilder = JWTClaimsSet.Builder()
                .subject(subject)
                .issuer(issuer)
                .audience(audience)
                .expirationTime(Date.from(expiresAt))
                .issueTime(Date.from(issuedAt))
            
            orgId?.let { claimsBuilder.claim("org_id", it) }
            email?.let { claimsBuilder.claim("email", it) }
            
            additionalClaims.forEach { (key, value) ->
                claimsBuilder.claim(key, value)
            }
            
            val claimsSet = claimsBuilder.build()
            
            val signedJWT = SignedJWT(
                JWSHeader.Builder(JWSAlgorithm.RS256)
                    .keyID(rsaKey.keyID)
                    .build(),
                claimsSet
            )
            
            signedJWT.sign(signer)
            return signedJWT.serialize()
        }
    }
    
    /**
     * Creates a new JWT builder instance.
     */
    fun builder() = JwtBuilder()
}