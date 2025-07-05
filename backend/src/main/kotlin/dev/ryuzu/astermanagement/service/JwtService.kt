package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.auth.service.TokenValidationResult
import dev.ryuzu.astermanagement.auth.service.UserPrincipal
import dev.ryuzu.astermanagement.config.JwtConfiguration
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.oauth2.jwt.*
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant
import java.util.*
import java.util.concurrent.TimeUnit

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
    private val jwtConfiguration: JwtConfiguration,
    private val userRepository: UserRepository,
    private val redisTemplate: RedisTemplate<String, String>
) {
    
    companion object {
        private const val REFRESH_TOKEN_PREFIX = "refresh_token:"
        private const val BLACKLIST_PREFIX = "blacklist:"
    }

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
            .claim("name", "${user.firstName} ${user.lastName}")
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
     * Generates JWT from UserPrincipal (Spring Security integration)
     */
    fun generateTokenFromUserPrincipal(userPrincipal: UserPrincipal): String {
        val now = Instant.now()
        val expiry = now.plus(jwtConfiguration.getJwtExpiration())
        
        val authorities = userPrincipal.authorities.map { it.authority }
        
        val claims = JwtClaimsSet.builder()
            .issuer(jwtConfiguration.getIssuer())
            .issuedAt(now)
            .expiresAt(expiry)
            .subject(userPrincipal.id.toString())
            .claim("email", userPrincipal.email)
            .claim("name", userPrincipal.fullName)
            .claim("role", userPrincipal.role.name)
            .claim("authorities", authorities)
            .claim("permissions", userPrincipal.getPermissions())
            .build()

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).tokenValue
    }

    /**
     * Validates token and extracts UserPrincipal information
     * Note: This returns a minimal UserPrincipal based on token claims only
     */
    fun extractUserPrincipalFromToken(token: String): UserPrincipal? {
        return try {
            val jwt = jwtDecoder.decode(token)
            if (jwt.expiresAt?.isBefore(Instant.now()) == true) {
                return null
            }
            
            // Create a minimal UserDto object from token claims
            val userDto = createUserDtoFromTokenClaims(jwt)
            UserPrincipal.create(userDto)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Validates token and returns user ID if valid
     */
    fun validateTokenAndGetUserId(token: String): UUID? {
        return try {
            val jwt = jwtDecoder.decode(token)
            if (jwt.expiresAt?.isBefore(Instant.now()) == true) {
                null
            } else {
                UUID.fromString(jwt.subject)
            }
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Enhanced token validation with detailed error information
     */
    fun validateTokenWithDetails(token: String): TokenValidationResult {
        return try {
            val jwt = jwtDecoder.decode(token)
            
            when {
                jwt.expiresAt?.isBefore(Instant.now()) == true -> 
                    TokenValidationResult.EXPIRED
                jwt.issuer?.toString() != jwtConfiguration.getIssuer() -> 
                    TokenValidationResult.INVALID_ISSUER
                jwt.subject.isNullOrBlank() -> 
                    TokenValidationResult.MISSING_SUBJECT
                else -> TokenValidationResult.VALID
            }
        } catch (e: JwtException) {
            when (e) {
                is JwtValidationException -> TokenValidationResult.SIGNATURE_INVALID
                else -> TokenValidationResult.MALFORMED
            }
        }
    }

    /**
     * Implements secure refresh token rotation
     * Old refresh token is invalidated when new one is issued
     */
    fun rotateRefreshToken(userId: UUID, oldRefreshToken: String): String {
        // Validate old refresh token
        val storedToken = redisTemplate.opsForValue().get("$REFRESH_TOKEN_PREFIX$userId")
        if (storedToken != oldRefreshToken) {
            throw BadCredentialsException("Invalid refresh token")
        }
        
        // Validate token signature and expiration
        val validationResult = validateTokenWithDetails(oldRefreshToken)
        if (!validationResult.isValid) {
            throw BadCredentialsException("Refresh token validation failed: ${validationResult.description}")
        }
        
        // Ensure it's actually a refresh token
        if (!isRefreshToken(oldRefreshToken)) {
            throw BadCredentialsException("Token is not a refresh token")
        }
        
        // Blacklist old token
        blacklistToken(oldRefreshToken)
        
        // Generate new refresh token
        val user = userRepository.findById(userId)
            .orElseThrow { BadCredentialsException("User not found") }
        val newRefreshToken = generateRefreshToken(user)
        
        // Store new token
        storeRefreshToken(userId, newRefreshToken)
        
        return newRefreshToken
    }
    
    /**
     * Stores refresh token in Redis with expiration
     */
    fun storeRefreshToken(userId: UUID, refreshToken: String) {
        val expirationSeconds = jwtConfiguration.getRefreshExpiration().seconds
        redisTemplate.opsForValue().set(
            "$REFRESH_TOKEN_PREFIX$userId",
            refreshToken,
            expirationSeconds,
            TimeUnit.SECONDS
        )
    }
    
    /**
     * Blacklists a token until its natural expiration
     */
    fun blacklistToken(token: String) {
        val jwt = validateToken(token) ?: return
        val expiry = jwt.expiresAt?.let { 
            Duration.between(Instant.now(), it) 
        } ?: Duration.ZERO
        
        if (expiry.isPositive) {
            redisTemplate.opsForValue().set(
                "$BLACKLIST_PREFIX$token",
                "true",
                expiry.seconds,
                TimeUnit.SECONDS
            )
        }
    }
    
    /**
     * Checks if a token is blacklisted
     */
    fun isTokenBlacklisted(token: String): Boolean {
        return redisTemplate.hasKey("$BLACKLIST_PREFIX$token")
    }
    
    /**
     * Revokes all refresh tokens for a user (logout from all devices)
     */
    fun revokeAllUserTokens(userId: UUID) {
        // Remove stored refresh token
        redisTemplate.delete("$REFRESH_TOKEN_PREFIX$userId")
        
        // Note: Access tokens can't be revoked without maintaining a per-token blacklist
        // Consider implementing token families or shorter access token lifetimes for better security
    }
    
    /**
     * Validates refresh token and generates new access token
     */
    fun refreshAccessToken(refreshToken: String): String {
        // Validate refresh token
        val validationResult = validateTokenWithDetails(refreshToken)
        if (!validationResult.isValid) {
            throw BadCredentialsException("Invalid refresh token: ${validationResult.description}")
        }
        
        // Check if token is blacklisted
        if (isTokenBlacklisted(refreshToken)) {
            throw BadCredentialsException("Refresh token has been revoked")
        }
        
        // Ensure it's a refresh token
        if (!isRefreshToken(refreshToken)) {
            throw BadCredentialsException("Token is not a refresh token")
        }
        
        // Get user ID and generate new access token
        val userId = getUserIdFromToken(refreshToken)
            ?: throw BadCredentialsException("Invalid user ID in token")
            
        val user = userRepository.findById(userId)
            .orElseThrow { BadCredentialsException("User not found") }
            
        if (!user.isActive) {
            throw BadCredentialsException("User account is disabled")
        }
        
        return generateAccessToken(user)
    }

    /**
     * Creates a minimal User object from JWT token claims
     * Used for token-based user principal creation
     */
    private fun createUserDtoFromTokenClaims(jwt: Jwt): dev.ryuzu.astermanagement.auth.dto.UserDto {
        return dev.ryuzu.astermanagement.auth.dto.UserDto(
            id = UUID.fromString(jwt.subject),
            email = jwt.getClaimAsString("email") ?: "",
            firstName = jwt.getClaimAsString("name")?.split(" ")?.firstOrNull() ?: "",
            lastName = jwt.getClaimAsString("name")?.split(" ")?.drop(1)?.joinToString(" ") ?: "",
            passwordHash = null, // Not stored in token
            role = dev.ryuzu.astermanagement.auth.dto.UserRoleDto.valueOf(
                jwt.getClaimAsString("role") ?: "CLIENT"
            ),
            isActive = true, // Token exists, so user was active when issued
            lastLoginAt = null // Not stored in token
        )
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