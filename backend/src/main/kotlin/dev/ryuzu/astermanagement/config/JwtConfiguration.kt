package dev.ryuzu.astermanagement.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import com.nimbusds.jose.jwk.JWKSet
import com.nimbusds.jose.jwk.RSAKey
import com.nimbusds.jose.jwk.source.ImmutableJWKSet
import com.nimbusds.jose.jwk.source.JWKSource
import com.nimbusds.jose.proc.SecurityContext
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.time.Duration

/**
 * JWT Configuration for AsterManagement Authentication System
 * 
 * Configures RSA-based JWT tokens with the following structure:
 * {
 *   "sub": "user-uuid",
 *   "role": "LAWYER|CLERK|CLIENT", 
 *   "permissions": ["matter:read", "matter:write", "document:upload"],
 *   "iat": timestamp,
 *   "exp": timestamp,
 *   "iss": "astermanagement-api"
 * }
 */
@Configuration
class JwtConfiguration {

    @Value("\${app.jwt.expiration:3600}")
    private var jwtExpiration: Long = 3600 // 1 hour default

    @Value("\${app.jwt.refresh-expiration:86400}")
    private var refreshExpiration: Long = 86400 // 24 hours default

    @Value("\${app.jwt.issuer:astermanagement-api}")
    private lateinit var issuer: String

    private val keyPair: KeyPair = generateRsaKey()

    /**
     * JWT Token expiration duration in seconds
     */
    fun getJwtExpiration(): Duration = Duration.ofSeconds(jwtExpiration)

    /**
     * Refresh token expiration duration in seconds
     */
    fun getRefreshExpiration(): Duration = Duration.ofSeconds(refreshExpiration)

    /**
     * JWT Token issuer identifier
     */
    fun getIssuer(): String = issuer

    /**
     * JWT Encoder bean for creating tokens
     */
    @Bean
    fun jwtEncoder(): JwtEncoder {
        val jwk = RSAKey.Builder(rsaPublicKey())
            .privateKey(rsaPrivateKey())
            .build()
        val jwkSet = JWKSet(jwk)
        val jwkSource: JWKSource<SecurityContext> = ImmutableJWKSet(jwkSet)
        return NimbusJwtEncoder(jwkSource)
    }

    /**
     * JWT Decoder bean for validating tokens
     */
    @Bean
    fun jwtDecoder(): JwtDecoder {
        return NimbusJwtDecoder.withPublicKey(rsaPublicKey()).build()
    }

    /**
     * RSA Public Key for token verification
     */
    @Bean
    fun rsaPublicKey(): RSAPublicKey {
        return keyPair.public as RSAPublicKey
    }

    /**
     * RSA Private Key for token signing
     */
    @Bean
    fun rsaPrivateKey(): RSAPrivateKey {
        return keyPair.private as RSAPrivateKey
    }

    /**
     * Generates RSA key pair for JWT signing
     */
    private fun generateRsaKey(): KeyPair {
        val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
        keyPairGenerator.initialize(2048)
        return keyPairGenerator.generateKeyPair()
    }
}