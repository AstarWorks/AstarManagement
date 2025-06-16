package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.config.JwtConfiguration
import dev.ryuzu.astermanagement.domain.user.User
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.oauth2.jwt.*
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.*

/**
 * JWT Service for generating and validating authentication tokens
 * 
 * Implements the JWT token structure defined for AsterManagement:
 * - Subject: User UUID
 * - Role: User's primary role (LAWYER, CLERK, CLIENT)
 * - Permissions: List of granted authorities
 * - Standard JWT claims (iat, exp, iss)
 */
@Service
class JwtService(
    private val jwtEncoder: JwtEncoder,
    private val jwtDecoder: JwtDecoder,
    private val jwtConfiguration: JwtConfiguration
) {

    /**
     * Generates access token for authenticated user
     */
    fun generateAccessToken(user: User): String {
        val now = Instant.now()
        val expiry = now.plus(jwtConfiguration.getJwtExpiration())
        
        val claims = JwtClaimsSet.builder()
            .issuer(jwtConfiguration.getIssuer())
            .issuedAt(now)
            .expiresAt(expiry)
            .subject(user.id.toString())
            .claim("role", user.role.name)
            .claim("permissions", getUserPermissions(user))
            .claim("email", user.email)
            .claim("name", user.name)
            .build()

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).tokenValue
    }

    /**
     * Generates refresh token for token renewal
     */
    fun generateRefreshToken(user: User): String {
        val now = Instant.now()
        val expiry = now.plus(jwtConfiguration.getRefreshExpiration())
        
        val claims = JwtClaimsSet.builder()
            .issuer(jwtConfiguration.getIssuer())
            .issuedAt(now)
            .expiresAt(expiry)
            .subject(user.id.toString())
            .claim("type", "refresh")
            .build()

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).tokenValue
    }

    /**
     * Generates access token from Spring Security Authentication
     */
    fun generateTokenFromAuthentication(authentication: Authentication): String {
        val now = Instant.now()
        val expiry = now.plus(jwtConfiguration.getJwtExpiration())
        
        val authorities = authentication.authorities.map { it.authority }
        val role = extractRoleFromAuthorities(authorities)
        
        val claims = JwtClaimsSet.builder()
            .issuer(jwtConfiguration.getIssuer())
            .issuedAt(now)
            .expiresAt(expiry)
            .subject(authentication.name)
            .claim("role", role)
            .claim("permissions", authorities)
            .build()

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).tokenValue
    }

    /**
     * Validates JWT token and returns decoded JWT
     */
    fun validateToken(token: String): Jwt? {
        return try {
            val jwt = jwtDecoder.decode(token)
            if (jwt.expiresAt?.isBefore(Instant.now()) == true) {
                null
            } else {
                jwt
            }
        } catch (e: JwtException) {
            null
        }
    }

    /**
     * Extracts username (subject) from JWT token
     */
    fun getUsernameFromToken(token: String): String? {
        return try {
            val jwt = jwtDecoder.decode(token)
            jwt.subject
        } catch (e: JwtException) {
            null
        }
    }

    /**
     * Extracts user ID from JWT token
     */
    fun getUserIdFromToken(token: String): UUID? {
        return try {
            val jwt = jwtDecoder.decode(token)
            UUID.fromString(jwt.subject)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Extracts role from JWT token
     */
    fun getRoleFromToken(token: String): String? {
        return try {
            val jwt = jwtDecoder.decode(token)
            jwt.getClaimAsString("role")
        } catch (e: JwtException) {
            null
        }
    }

    /**
     * Extracts permissions from JWT token
     */
    fun getPermissionsFromToken(token: String): List<String> {
        return try {
            val jwt = jwtDecoder.decode(token)
            jwt.getClaimAsStringList("permissions") ?: emptyList()
        } catch (e: JwtException) {
            emptyList()
        }
    }

    /**
     * Checks if token is expired
     */
    fun isTokenExpired(token: String): Boolean {
        return try {
            val jwt = jwtDecoder.decode(token)
            jwt.expiresAt?.isBefore(Instant.now()) ?: true
        } catch (e: JwtException) {
            true
        }
    }

    /**
     * Checks if token is a refresh token
     */
    fun isRefreshToken(token: String): Boolean {
        return try {
            val jwt = jwtDecoder.decode(token)
            jwt.getClaimAsString("type") == "refresh"
        } catch (e: JwtException) {
            false
        }
    }

    /**
     * Validates token against user details
     */
    fun validateToken(token: String, userDetails: UserDetails): Boolean {
        val username = getUsernameFromToken(token)
        return username == userDetails.username && !isTokenExpired(token)
    }

    /**
     * Gets user permissions based on role
     */
    private fun getUserPermissions(user: User): List<String> {
        return when (user.role) {
            dev.ryuzu.astermanagement.domain.user.UserRole.LAWYER -> listOf(
                "matter:read", "matter:write", "matter:delete",
                "document:read", "document:write", "document:delete",
                "memo:read", "memo:write", 
                "expense:read", "expense:write"
            )
            dev.ryuzu.astermanagement.domain.user.UserRole.CLERK -> listOf(
                "matter:read", 
                "document:read", "document:write",
                "memo:read", "memo:write", 
                "expense:read", "expense:write"
            )
            dev.ryuzu.astermanagement.domain.user.UserRole.CLIENT -> listOf(
                "matter:read", 
                "document:read", 
                "memo:read"
            )
        }
    }

    /**
     * Extracts primary role from authorities list
     */
    private fun extractRoleFromAuthorities(authorities: List<String>): String {
        return authorities.firstOrNull { it.startsWith("ROLE_") }?.removePrefix("ROLE_") 
            ?: authorities.firstOrNull { it.endsWith(":read") }?.let { 
                when {
                    it.startsWith("matter:") && authorities.contains("matter:write") -> "LAWYER"
                    it.startsWith("matter:") -> "CLERK"
                    else -> "CLIENT"
                }
            } ?: "CLIENT"
    }
}