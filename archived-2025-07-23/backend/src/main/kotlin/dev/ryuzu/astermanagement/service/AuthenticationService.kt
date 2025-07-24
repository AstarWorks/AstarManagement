package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.config.JwtConfiguration
import dev.ryuzu.astermanagement.config.SecurityAuditEventListener
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.dto.auth.*
import dev.ryuzu.astermanagement.security.twofa.service.TwoFactorAuthenticationService
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import java.time.Duration
import java.util.*
import java.util.concurrent.TimeUnit

/**
 * Authentication Service
 * 
 * Handles user authentication, token generation, and refresh token management
 * with comprehensive audit logging and Redis-based session storage.
 */
@Service
class AuthenticationService(
    private val authenticationManager: AuthenticationManager,
    private val userRepository: UserRepository,
    private val jwtService: JwtService,
    private val passwordEncoder: PasswordEncoder,
    private val redisTemplate: RedisTemplate<String, String>,
    private val securityAuditEventListener: SecurityAuditEventListener,
    private val jwtConfiguration: JwtConfiguration,
    private val twoFactorAuthenticationService: TwoFactorAuthenticationService
) {

    companion object {
        private const val REFRESH_TOKEN_PREFIX = "refresh_token:"
        private const val USER_SESSION_PREFIX = "user_session:"
        private const val ACTIVE_SESSIONS_PREFIX = "active_sessions:"
        private const val TWO_FACTOR_SESSION_PREFIX = "2fa_session:"
        private const val TWO_FACTOR_SESSION_DURATION_SECONDS = 300L // 5 minutes
    }

    /**
     * Authenticates user with email and password
     * Returns either AuthenticationResponse or TwoFactorRequiredResponse
     */
    fun authenticate(request: LoginRequest): AuthenticationResult {
        return try {
            // Authenticate with Spring Security
            val authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(request.email, request.password)
            )
            
            // Find user in database
            val user = userRepository.findByEmail(request.email)
                ?: throw BadCredentialsException("User not found")
            
            // Check if user has 2FA enabled
            if (twoFactorAuthenticationService.isTwoFactorEnabled(user.id!!)) {
                // Create temporary session token for 2FA verification
                val sessionToken = createTwoFactorSessionToken(user.id!!)
                
                // Audit log partial success
                securityAuditEventListener.recordJwtValidation(user.id!!, user.email, true, "2FA required")
                
                return TwoFactorRequiredResponse(
                    sessionToken = sessionToken,
                    twoFactorMethod = "TOTP",
                    expiresIn = TWO_FACTOR_SESSION_DURATION_SECONDS
                )
            }
            
            // No 2FA - proceed with normal authentication
            return generateAuthenticationResponse(user)
        } catch (e: BadCredentialsException) {
            // Audit log failure
            val userId = userRepository.findByEmail(request.email)?.id
            securityAuditEventListener.recordJwtValidation(
                userId ?: UUID.randomUUID(),
                request.email,
                false,
                "Invalid credentials"
            )
            throw e
        }
    }

    /**
     * Refreshes access token using refresh token
     */
    fun refresh(refreshToken: String): AuthenticationResponse {
        // Validate refresh token
        val jwt = jwtService.validateToken(refreshToken)
            ?: throw BadCredentialsException("Invalid refresh token")
        
        if (!jwtService.isRefreshToken(refreshToken)) {
            throw BadCredentialsException("Token is not a refresh token")
        }
        
        val userId = UUID.fromString(jwt.subject)
        
        // Check if refresh token exists in Redis
        val storedToken = redisTemplate.opsForValue().get("$REFRESH_TOKEN_PREFIX$userId")
        if (storedToken != refreshToken) {
            securityAuditEventListener.recordTokenRefresh(userId, jwt.subject, false, "Token not found in store")
            throw BadCredentialsException("Refresh token not found or invalid")
        }
        
        // Get user from database
        val user = userRepository.findById(userId).orElseThrow {
            BadCredentialsException("User not found")
        }
        
        // Generate new tokens
        val newAccessToken = jwtService.generateAccessToken(user)
        val newRefreshToken = jwtService.generateRefreshToken(user)
        
        // Update refresh token in Redis
        storeRefreshToken(userId, newRefreshToken)
        
        // Update user session
        updateUserSession(userId, user.email, newAccessToken)
        
        // Audit log success
        securityAuditEventListener.recordTokenRefresh(userId, user.email, true)
        
        return AuthenticationResponse(
            accessToken = newAccessToken,
            refreshToken = newRefreshToken,
            tokenType = "Bearer",
            expiresIn = jwtConfiguration.getJwtExpiration().seconds,
            user = UserInfoResponse(
                id = user.id!!,
                email = user.email,
                name = "${user.firstName} ${user.lastName}",
                role = user.role.name,
                permissions = jwtService.getUserPermissions(user)
            )
        )
    }

    /**
     * Logs out user and invalidates tokens
     */
    fun logout(userId: UUID): Boolean {
        return try {
            // Remove refresh token
            redisTemplate.delete("$REFRESH_TOKEN_PREFIX$userId")
            
            // Remove user session
            redisTemplate.delete("$USER_SESSION_PREFIX$userId")
            
            // Remove from active sessions
            redisTemplate.opsForSet().remove("$ACTIVE_SESSIONS_PREFIX$userId", userId.toString())
            
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Validates if user session is active
     */
    fun isSessionActive(userId: UUID): Boolean {
        return redisTemplate.hasKey("$USER_SESSION_PREFIX$userId")
    }

    /**
     * Gets active user sessions
     */
    fun getActiveSessions(userId: UUID): Set<String> {
        return redisTemplate.opsForSet().members("$ACTIVE_SESSIONS_PREFIX$userId") ?: emptySet()
    }

    /**
     * Revokes all sessions for a user
     */
    fun revokeAllSessions(userId: UUID): Boolean {
        return try {
            val sessions = getActiveSessions(userId)
            sessions.forEach { sessionId ->
                redisTemplate.delete("$USER_SESSION_PREFIX$sessionId")
            }
            redisTemplate.delete("$ACTIVE_SESSIONS_PREFIX$userId")
            redisTemplate.delete("$REFRESH_TOKEN_PREFIX$userId")
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Stores refresh token in Redis with expiration
     */
    private fun storeRefreshToken(userId: UUID, refreshToken: String) {
        val key = "$REFRESH_TOKEN_PREFIX$userId"
        redisTemplate.opsForValue().set(
            key,
            refreshToken,
            jwtConfiguration.getRefreshExpiration().seconds,
            TimeUnit.SECONDS
        )
    }

    /**
     * Creates user session in Redis
     */
    private fun createUserSession(userId: UUID, email: String, accessToken: String) {
        val sessionKey = "$USER_SESSION_PREFIX$userId"
        val sessionData = mapOf(
            "userId" to userId.toString(),
            "email" to email,
            "accessToken" to accessToken,
            "createdAt" to System.currentTimeMillis().toString()
        )
        
        // Store session data
        redisTemplate.opsForHash<String, String>().putAll(sessionKey, sessionData)
        redisTemplate.expire(sessionKey, jwtConfiguration.getJwtExpiration())
        
        // Add to active sessions set
        redisTemplate.opsForSet().add("$ACTIVE_SESSIONS_PREFIX$userId", userId.toString())
        redisTemplate.expire("$ACTIVE_SESSIONS_PREFIX$userId", Duration.ofDays(30))
    }

    /**
     * Updates user session with new access token
     */
    private fun updateUserSession(userId: UUID, email: String, accessToken: String) {
        val sessionKey = "$USER_SESSION_PREFIX$userId"
        
        // Update session data
        redisTemplate.opsForHash<String, String>().put(sessionKey, "accessToken", accessToken)
        redisTemplate.opsForHash<String, String>().put(sessionKey, "updatedAt", System.currentTimeMillis().toString())
        
        // Extend expiration
        redisTemplate.expire(sessionKey, jwtConfiguration.getJwtExpiration())
    }

    /**
     * Gets user permissions based on role (used internally)
     */
    private fun JwtService.getUserPermissions(user: User): List<String> {
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
     * Gets user information by ID for profile endpoint
     */
    fun getUserInfo(userId: UUID): User {
        return userRepository.findById(userId)
            .orElseThrow { BadCredentialsException("User not found") }
    }
    
    /**
     * Completes authentication after successful 2FA verification
     */
    fun completeTwoFactorAuthentication(userId: UUID, sessionToken: String): AuthenticationResponse {
        // Validate session token
        val storedUserId = validateTwoFactorSessionToken(sessionToken)
        if (storedUserId != userId) {
            throw BadCredentialsException("Invalid session token")
        }
        
        // Get user from database
        val user = userRepository.findById(userId).orElseThrow {
            BadCredentialsException("User not found")
        }
        
        // Remove temporary session token
        removeTwoFactorSessionToken(sessionToken)
        
        // Generate authentication response
        return generateAuthenticationResponse(user)
    }
    
    /**
     * Creates temporary session token for 2FA verification
     */
    private fun createTwoFactorSessionToken(userId: UUID): String {
        val sessionToken = "${userId}:${UUID.randomUUID()}"
        val key = "$TWO_FACTOR_SESSION_PREFIX$sessionToken"
        
        redisTemplate.opsForValue().set(
            key,
            userId.toString(),
            TWO_FACTOR_SESSION_DURATION_SECONDS,
            TimeUnit.SECONDS
        )
        
        return sessionToken
    }
    
    /**
     * Validates and retrieves user ID from 2FA session token
     */
    private fun validateTwoFactorSessionToken(sessionToken: String): UUID {
        val key = "$TWO_FACTOR_SESSION_PREFIX$sessionToken"
        val userIdStr = redisTemplate.opsForValue().get(key)
            ?: throw BadCredentialsException("Invalid or expired session token")
        
        return UUID.fromString(userIdStr)
    }
    
    /**
     * Removes 2FA session token after successful verification
     */
    private fun removeTwoFactorSessionToken(sessionToken: String) {
        val key = "$TWO_FACTOR_SESSION_PREFIX$sessionToken"
        redisTemplate.delete(key)
    }
    
    /**
     * Generates standard authentication response with tokens
     */
    private fun generateAuthenticationResponse(user: User): AuthenticationResponse {
        // Generate tokens
        val accessToken = jwtService.generateAccessToken(user)
        val refreshToken = jwtService.generateRefreshToken(user)
        
        // Store refresh token in Redis
        storeRefreshToken(user.id!!, refreshToken)
        
        // Create user session
        createUserSession(user.id!!, user.email, accessToken)
        
        // Audit log success
        securityAuditEventListener.recordJwtValidation(user.id!!, user.email, true)
        
        return AuthenticationResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            tokenType = "Bearer",
            expiresIn = jwtConfiguration.getJwtExpiration().seconds,
            user = UserInfoResponse(
                id = user.id!!,
                email = user.email,
                name = "${user.firstName} ${user.lastName}",
                role = user.role.name,
                permissions = jwtService.getUserPermissions(user)
            )
        )
    }
}