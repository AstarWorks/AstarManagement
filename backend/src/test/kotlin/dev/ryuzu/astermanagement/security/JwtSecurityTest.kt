package dev.ryuzu.astermanagement.security

import dev.ryuzu.astermanagement.auth.service.TokenValidationResult
import dev.ryuzu.astermanagement.auth.service.UserPrincipal
import dev.ryuzu.astermanagement.config.JwtConfiguration
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.service.JwtService
import dev.ryuzu.astermanagement.testutil.AuthTestHelper
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.security.oauth2.jwt.*
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*
import kotlin.test.*

/**
 * JWT Security Test Suite
 * 
 * Comprehensive unit tests for JWT token generation, validation, and security.
 * Tests all aspects of JWT lifecycle including token rotation, blacklisting, and signature validation.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation::class)
@Transactional
class JwtSecurityTest {

    @Autowired
    private lateinit var jwtService: JwtService
    
    @Autowired
    private lateinit var jwtDecoder: JwtDecoder
    
    @Autowired
    private lateinit var jwtEncoder: JwtEncoder
    
    @Autowired
    private lateinit var jwtConfiguration: JwtConfiguration
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    @Autowired
    private lateinit var redisTemplate: RedisTemplate<String, String>

    private lateinit var testUser: User
    private lateinit var testLawyer: User
    private lateinit var testClerk: User
    private lateinit var testClient: User

    @BeforeEach
    fun setup() {
        // Clean Redis state
        redisTemplate.connectionFactory?.connection?.flushAll()
        
        // Create test users for different roles
        testUser = User().apply {
            id = UUID.randomUUID()
            username = "test.user"
            email = "test@example.com"
            firstName = "Test"
            lastName = "User"
            role = UserRole.LAWYER
            isActive = true
        }
        
        testLawyer = User().apply {
            id = UUID.randomUUID()
            username = "john.lawyer"
            email = "lawyer@example.com"
            firstName = "John"
            lastName = "Lawyer"
            role = UserRole.LAWYER
            isActive = true
        }
        
        testClerk = User().apply {
            id = UUID.randomUUID()
            username = "jane.clerk"
            email = "clerk@example.com"
            firstName = "Jane"
            lastName = "Clerk"
            role = UserRole.CLERK
            isActive = true
        }
        
        testClient = User().apply {
            id = UUID.randomUUID()
            username = "client.user"
            email = "client@example.com"
            firstName = "Client"
            lastName = "User"
            role = UserRole.CLIENT
            isActive = true
        }
    }

    @Test
    @Order(1)
    fun `should generate valid JWT with correct claims for lawyer`() {
        // When
        val accessToken = jwtService.generateAccessToken(testLawyer)
        val jwt = jwtDecoder.decode(accessToken)
        
        // Then - verify token structure
        assertNotNull(accessToken)
        assertTrue(accessToken.isNotBlank())
        
        // Verify standard claims
        assertEquals(testLawyer.id.toString(), jwt.subject)
        assertEquals(jwtConfiguration.getIssuer(), jwt.issuer?.toString())
        assertNotNull(jwt.issuedAt)
        assertNotNull(jwt.expiresAt)
        
        // Verify custom claims
        assertEquals("LAWYER", jwt.getClaimAsString("role"))
        assertEquals("${testLawyer.firstName} ${testLawyer.lastName}", jwt.getClaimAsString("name"))
        assertEquals(testLawyer.email, jwt.getClaimAsString("email"))
        
        // Verify permissions for lawyer role
        val permissions = jwt.getClaimAsStringList("permissions")
        assertNotNull(permissions)
        assertTrue(permissions.contains("matter:read"))
        assertTrue(permissions.contains("matter:write"))
        assertTrue(permissions.contains("matter:delete"))
        assertTrue(permissions.contains("document:read"))
        assertTrue(permissions.contains("document:write"))
        assertTrue(permissions.contains("document:delete"))
        
        // Verify expiration is within expected timeframe (15 minutes)
        val now = Instant.now()
        assertTrue(jwt.expiresAt!!.isAfter(now))
        assertTrue(jwt.expiresAt!!.isBefore(now.plus(16, ChronoUnit.MINUTES)))
        assertTrue(jwt.expiresAt!!.isAfter(now.plus(14, ChronoUnit.MINUTES)))
    }

    @Test
    @Order(2)
    fun `should generate valid JWT with correct permissions for clerk`() {
        // When
        val accessToken = jwtService.generateAccessToken(testClerk)
        val jwt = jwtDecoder.decode(accessToken)
        
        // Then - verify role-specific permissions
        assertEquals("CLERK", jwt.getClaimAsString("role"))
        
        val permissions = jwt.getClaimAsStringList("permissions")
        assertNotNull(permissions)
        
        // Clerk should have read access to matters but no delete
        assertTrue(permissions.contains("matter:read"))
        assertFalse(permissions.contains("matter:delete"))
        
        // Clerk should have full document access
        assertTrue(permissions.contains("document:read"))
        assertTrue(permissions.contains("document:write"))
        
        // Clerk should have memo and expense access
        assertTrue(permissions.contains("memo:read"))
        assertTrue(permissions.contains("memo:write"))
        assertTrue(permissions.contains("expense:read"))
        assertTrue(permissions.contains("expense:write"))
    }

    @Test
    @Order(3)
    fun `should generate valid JWT with correct permissions for client`() {
        // When
        val accessToken = jwtService.generateAccessToken(testClient)
        val jwt = jwtDecoder.decode(accessToken)
        
        // Then - verify role-specific permissions
        assertEquals("CLIENT", jwt.getClaimAsString("role"))
        
        val permissions = jwt.getClaimAsStringList("permissions")
        assertNotNull(permissions)
        
        // Client should only have read access
        assertTrue(permissions.contains("matter:read"))
        assertTrue(permissions.contains("document:read"))
        assertTrue(permissions.contains("memo:read"))
        
        // Client should not have write or delete access
        assertFalse(permissions.contains("matter:write"))
        assertFalse(permissions.contains("matter:delete"))
        assertFalse(permissions.contains("document:write"))
        assertFalse(permissions.contains("document:delete"))
    }

    @Test
    @Order(4)
    fun `should generate and validate refresh token`() {
        // When
        val refreshToken = jwtService.generateRefreshToken(testUser)
        val jwt = jwtDecoder.decode(refreshToken)
        
        // Then
        assertNotNull(refreshToken)
        assertEquals(testUser.id.toString(), jwt.subject)
        assertEquals("refresh", jwt.getClaimAsString("type"))
        assertEquals(jwtConfiguration.getIssuer(), jwt.issuer?.toString())
        
        // Verify longer expiration for refresh token (7 days)
        val now = Instant.now()
        assertTrue(jwt.expiresAt!!.isAfter(now.plus(6, ChronoUnit.DAYS)))
        assertTrue(jwt.expiresAt!!.isBefore(now.plus(8, ChronoUnit.DAYS)))
        
        // Verify token is marked as refresh type
        assertTrue(jwtService.isRefreshToken(refreshToken))
    }

    @Test
    @Order(5)
    fun `should reject expired tokens`() {
        // Given - manually create an expired token
        val now = Instant.now()
        val expiredClaims = JwtClaimsSet.builder()
            .issuer(jwtConfiguration.getIssuer())
            .issuedAt(now.minus(2, ChronoUnit.HOURS))
            .expiresAt(now.minus(1, ChronoUnit.HOURS))
            .subject(testUser.id.toString())
            .claim("role", testUser.role.name)
            .build()
        
        val expiredToken = jwtEncoder.encode(JwtEncoderParameters.from(expiredClaims)).tokenValue
        
        // When/Then - token should be rejected
        assertTrue(jwtService.isTokenExpired(expiredToken))
        assertNull(jwtService.validateToken(expiredToken))
        
        val validationResult = jwtService.validateTokenWithDetails(expiredToken)
        assertEquals(TokenValidationResult.EXPIRED, validationResult)
    }

    @Test
    @Order(6)
    fun `should reject tokens with invalid signature`() {
        // Given - create a token and tamper with signature
        val validToken = jwtService.generateAccessToken(testUser)
        val parts = validToken.split(".")
        val tamperedToken = "${parts[0]}.${parts[1]}.invalid_signature"
        
        // When/Then - tampered token should be rejected
        assertThrows<JwtException> {
            jwtDecoder.decode(tamperedToken)
        }
        
        assertNull(jwtService.validateToken(tamperedToken))
        assertNull(jwtService.getUsernameFromToken(tamperedToken))
        assertNull(jwtService.getUserIdFromToken(tamperedToken))
    }

    @Test
    @Order(7)
    fun `should reject tokens with invalid issuer`() {
        // Given - create token with wrong issuer
        val now = Instant.now()
        val invalidIssuerClaims = JwtClaimsSet.builder()
            .issuer("wrong-issuer")
            .issuedAt(now)
            .expiresAt(now.plus(15, ChronoUnit.MINUTES))
            .subject(testUser.id.toString())
            .claim("role", testUser.role.name)
            .build()
        
        val invalidIssuerToken = jwtEncoder.encode(JwtEncoderParameters.from(invalidIssuerClaims)).tokenValue
        
        // When/Then
        val validationResult = jwtService.validateTokenWithDetails(invalidIssuerToken)
        assertEquals(TokenValidationResult.INVALID_ISSUER, validationResult)
    }

    @Test
    @Order(8)
    fun `should handle token blacklisting correctly`() {
        // Given
        val accessToken = jwtService.generateAccessToken(testUser)
        
        // Verify token is initially valid
        assertNotNull(jwtService.validateToken(accessToken))
        assertFalse(jwtService.isTokenBlacklisted(accessToken))
        
        // When - blacklist the token
        jwtService.blacklistToken(accessToken)
        
        // Then - token should be blacklisted
        assertTrue(jwtService.isTokenBlacklisted(accessToken))
    }

    @Test
    @Order(9)
    fun `should handle refresh token rotation securely`() {
        // Given - store initial refresh token
        val userId = testUser.id!!
        val initialRefreshToken = jwtService.generateRefreshToken(testUser)
        jwtService.storeRefreshToken(userId, initialRefreshToken)
        
        // When - rotate refresh token
        val newRefreshToken = jwtService.rotateRefreshToken(userId, initialRefreshToken)
        
        // Then - new token should be different and valid
        assertNotEquals(initialRefreshToken, newRefreshToken)
        assertTrue(jwtService.isRefreshToken(newRefreshToken))
        
        // Old token should be blacklisted
        assertTrue(jwtService.isTokenBlacklisted(initialRefreshToken))
        
        // New token should be stored in Redis
        val storedToken = redisTemplate.opsForValue().get("refresh_token:$userId")
        assertNotNull(storedToken)
        assertNotEquals(newRefreshToken, storedToken) // Should be hashed
    }

    @Test
    @Order(10)
    fun `should refresh access token with valid refresh token`() {
        // Given
        val userId = testUser.id!!
        val refreshToken = jwtService.generateRefreshToken(testUser)
        jwtService.storeRefreshToken(userId, refreshToken)
        
        // Mock user repository
        userRepository.save(testUser)
        
        // When
        val newAccessToken = jwtService.refreshAccessToken(refreshToken)
        
        // Then
        assertNotNull(newAccessToken)
        val jwt = jwtDecoder.decode(newAccessToken)
        assertEquals(testUser.id.toString(), jwt.subject)
        assertEquals(testUser.role.name, jwt.getClaimAsString("role"))
        
        // Should not be a refresh token
        assertFalse(jwtService.isRefreshToken(newAccessToken))
    }

    @Test
    @Order(11)
    fun `should reject refresh token for inactive user`() {
        // Given - inactive user
        testUser.isActive = false
        userRepository.save(testUser)
        
        val refreshToken = jwtService.generateRefreshToken(testUser)
        
        // When/Then
        assertThrows<BadCredentialsException> {
            jwtService.refreshAccessToken(refreshToken)
        }
    }

    @Test
    @Order(12)
    fun `should extract user principal from token correctly`() {
        // Given
        val accessToken = jwtService.generateAccessToken(testLawyer)
        
        // When
        val userPrincipal = jwtService.extractUserPrincipalFromToken(accessToken)
        
        // Then
        assertNotNull(userPrincipal)
        assertEquals(testLawyer.id, userPrincipal?.id)
        assertEquals(testLawyer.email, userPrincipal?.email)
        assertEquals(AuthTestHelper.mapToDto(testLawyer.role), userPrincipal?.role)
        assertEquals("${testLawyer.firstName} ${testLawyer.lastName}", userPrincipal?.fullName)
        
        // Verify permissions are correctly set
        val permissions = userPrincipal?.getPermissions()
        assertNotNull(permissions)
        assertTrue(permissions!!.contains("matter:write"))
        assertTrue(permissions.contains("document:delete"))
    }

    @Test
    @Order(13)
    fun `should validate token against user details`() {
        // Given
        val token = jwtService.generateAccessToken(testUser)
        val userDetails = AuthTestHelper.createUserPrincipal(testUser)
        
        // When/Then
        assertTrue(jwtService.validateToken(token, userDetails))
        
        // Test with wrong user
        val wrongUser = User().apply {
            id = UUID.randomUUID()
            username = "wrong.user"
        }
        val wrongUserDetails = AuthTestHelper.createUserPrincipal(wrongUser)
        
        assertFalse(jwtService.validateToken(token, wrongUserDetails))
    }

    @Test
    @Order(14)
    fun `should revoke all user tokens`() {
        // Given
        val userId = testUser.id!!
        val refreshToken = jwtService.generateRefreshToken(testUser)
        jwtService.storeRefreshToken(userId, refreshToken)
        
        // Verify token is stored
        assertNotNull(redisTemplate.opsForValue().get("refresh_token:$userId"))
        
        // When
        jwtService.revokeAllUserTokens(userId)
        
        // Then
        assertNull(redisTemplate.opsForValue().get("refresh_token:$userId"))
    }

    @Test
    @Order(15)
    fun `should extract claims correctly from various token types`() {
        // Test access token
        val accessToken = jwtService.generateAccessToken(testLawyer)
        
        assertEquals(testLawyer.id.toString(), jwtService.getUsernameFromToken(accessToken))
        assertEquals(testLawyer.id, jwtService.getUserIdFromToken(accessToken))
        assertEquals("LAWYER", jwtService.getRoleFromToken(accessToken))
        
        val permissions = jwtService.getPermissionsFromToken(accessToken)
        assertTrue(permissions.isNotEmpty())
        assertTrue(permissions.contains("matter:write"))
        
        // Test refresh token
        val refreshToken = jwtService.generateRefreshToken(testUser)
        assertTrue(jwtService.isRefreshToken(refreshToken))
        assertFalse(jwtService.isRefreshToken(accessToken))
    }

    @Test
    @Order(16)
    fun `should handle malformed tokens gracefully`() {
        val malformedTokens = listOf(
            "not.a.token",
            "header.payload", // Missing signature
            "", // Empty token
            "too.many.parts.here.invalid",
            "invalid-base64.invalid-base64.invalid-base64"
        )
        
        malformedTokens.forEach { token ->
            assertNull(jwtService.validateToken(token))
            assertNull(jwtService.getUsernameFromToken(token))
            assertNull(jwtService.getUserIdFromToken(token))
            assertNull(jwtService.getRoleFromToken(token))
            assertTrue(jwtService.getPermissionsFromToken(token).isEmpty())
            assertTrue(jwtService.isTokenExpired(token))
            assertFalse(jwtService.isRefreshToken(token))
        }
    }

    @Test
    @Order(17)
    fun `should validate token with detailed error information`() {
        // Valid token
        val validToken = jwtService.generateAccessToken(testUser)
        assertEquals(TokenValidationResult.VALID, jwtService.validateTokenWithDetails(validToken))
        
        // Test various invalid tokens
        val malformedToken = "invalid.token"
        val result = jwtService.validateTokenWithDetails(malformedToken)
        assertTrue(result in listOf(TokenValidationResult.MALFORMED, TokenValidationResult.SIGNATURE_INVALID))
        
        // Test missing subject token
        val noSubjectClaims = JwtClaimsSet.builder()
            .issuer(jwtConfiguration.getIssuer())
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
            .build()
        
        val noSubjectToken = jwtEncoder.encode(JwtEncoderParameters.from(noSubjectClaims)).tokenValue
        assertEquals(TokenValidationResult.MISSING_SUBJECT, jwtService.validateTokenWithDetails(noSubjectToken))
    }
}