package com.astarworks.astarmanagement.modules.shared.infrastructure.security

import com.astarworks.astarmanagement.modules.auth.application.port.output.TokenProvider
import com.astarworks.astarmanagement.modules.shared.domain.entity.User
import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.*
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(
    @Value("\${app.jwt.secret:defaultSecretKeyThatShouldBeChangedInProduction}")
    private val jwtSecret: String,
    
    @Value("\${app.jwt.expiration:3600}")
    private val jwtExpiration: Long,
    
    @Value("\${app.jwt.refresh-expiration:86400}")
    private val refreshExpiration: Long
) : TokenProvider {
    
    private val key: SecretKey = Keys.hmacShaKeyFor(jwtSecret.toByteArray())
    
    override fun generateAccessToken(user: User): String {
        return createToken(user, jwtExpiration * 1000)
    }
    
    override fun generateRefreshToken(user: User): String {
        return createToken(user, refreshExpiration * 1000)
    }
    
    override fun validateToken(token: String): Boolean {
        return try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
            true
        } catch (e: Exception) {
            false
        }
    }
    
    override fun getUserIdFromToken(token: String): UUID? {
        return try {
            val claims = getClaims(token)
            UUID.fromString(claims.subject)
        } catch (e: Exception) {
            null
        }
    }
    
    override fun getExpirationTime(): Long = jwtExpiration
    
    private fun createToken(user: User, expirationTime: Long): String {
        val now = Date()
        val expiryDate = Date(now.time + expirationTime)
        
        return Jwts.builder()
            .subject(user.id.toString())
            .claim("email", user.email)
            .claim("role", user.role.name)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(key)
            .compact()
    }
    
    private fun getClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}