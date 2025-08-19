package com.astarworks.astarmanagement.core.infrastructure.security.mock

import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.RSASSASigner
import com.nimbusds.jose.jwk.JWKSet
import com.nimbusds.jose.jwk.KeyUse
import com.nimbusds.jose.jwk.RSAKey
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.time.Instant
import java.util.*
import jakarta.annotation.PostConstruct

/**
 * Simple mock authentication service for local development.
 * Generates JWT tokens and provides JWKS for verification.
 */
@Service
@ConditionalOnProperty(
    name = ["auth.mock.enabled"],
    havingValue = "true",
    matchIfMissing = false
)
class MockAuthService(
    @Value("\${server.port:8080}") private val serverPort: String,
    @Value("\${auth0.audience:local-dev-api}") private val audience: String
) {
    
    private val logger = LoggerFactory.getLogger(MockAuthService::class.java)
    private lateinit var keyPair: KeyPair
    private lateinit var rsaKey: RSAKey
    private val keyId = "mock-key-1"
    
    @PostConstruct
    fun init() {
        logger.info("Initializing mock authentication service")
        generateKeyPair()
    }
    
    private fun generateKeyPair() {
        // Generate RSA key pair for signing JWTs
        val keyGen = KeyPairGenerator.getInstance("RSA")
        keyGen.initialize(2048)
        keyPair = keyGen.generateKeyPair()
        
        // Create RSA JWK for JWKS endpoint
        rsaKey = RSAKey.Builder(keyPair.public as RSAPublicKey)
            .privateKey(keyPair.private as RSAPrivateKey)
            .keyUse(KeyUse.SIGNATURE)
            .algorithm(JWSAlgorithm.RS256)
            .keyID(keyId)
            .build()
    }
    
    /**
     * Generate a simple mock JWT token with default claims.
     */
    fun generateToken(): String {
        val now = Instant.now()
        val expirationTime = now.plusSeconds(3600) // 1 hour
        
        // Build JWT claims with minimal required fields
        val claimsSet = JWTClaimsSet.Builder()
            .subject("mock-user-${UUID.randomUUID()}")
            .issuer("http://localhost:$serverPort/mock-auth")
            .audience(audience)
            .expirationTime(Date.from(expirationTime))
            .issueTime(Date.from(now))
            .notBeforeTime(Date.from(now))
            .jwtID(UUID.randomUUID().toString())
            // Add required custom claims
            .claim("email", "test@example.com")
            .claim("name", "Test User")
            .claim("email_verified", true)
            .build()
        
        // Sign the JWT
        val signedJWT = SignedJWT(
            JWSHeader.Builder(JWSAlgorithm.RS256)
                .keyID(keyId)
                .build(),
            claimsSet
        )
        
        val signer = RSASSASigner(keyPair.private as RSAPrivateKey)
        signedJWT.sign(signer)
        
        return signedJWT.serialize()
    }
    
    /**
     * Get JWKS for JWT verification.
     */
    fun getJwks(): Map<String, Any> {
        val publicKey = rsaKey.toPublicJWK()
        return mapOf("keys" to listOf(publicKey.toJSONObject()))
    }
}