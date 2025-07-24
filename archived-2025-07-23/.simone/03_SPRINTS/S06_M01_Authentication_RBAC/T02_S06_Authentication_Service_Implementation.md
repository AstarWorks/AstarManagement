# T02_S06: Authentication Service Implementation

**Status**: COMPLETED  
**Started**: 2025-06-30 21:31  
**Completed**: 2025-06-30 22:00

## Description
Implement core authentication service with user validation, JWT token generation, and refresh token rotation. This task builds upon the existing AuthenticationService and JwtService to add the missing UserDetailsService implementation for Spring Security integration and enhance token management capabilities.

## Goals
- Create authentication logic with Spring Security UserDetailsService
- Implement enhanced token management with secure refresh token rotation
- Create user details service for Spring Security integration
- Implement session management with Redis for active session tracking
- Add comprehensive authentication error handling

## Acceptance Criteria
- [ ] UserDetailsService implementation loads users from database with authorities
- [ ] UserPrincipal class implements UserDetails interface with proper authorities mapping
- [ ] JWT token generation includes user roles and permissions claims
- [ ] Refresh token rotation mechanism prevents token replay attacks
- [ ] BCryptPasswordEncoder is configured for secure password hashing
- [ ] Authentication exceptions provide clear, secure error messages
- [ ] Session management tracks active sessions per user in Redis
- [ ] Token validation includes expiration and signature verification
- [ ] User authorities are properly mapped from role-based permissions
- [ ] All authentication flows are covered with comprehensive unit tests

## Subtasks
- [x] Create UserPrincipal class implementing UserDetails interface
- [x] Implement CustomUserDetailsService for Spring Security
- [x] Enhance JwtService with additional token validation methods
- [x] Implement secure refresh token rotation mechanism
- [x] Configure BCryptPasswordEncoder bean for password hashing
- [x] Create authentication exception handlers with ProblemDetail
- [x] Implement session management service with Redis
- [x] Add authentication event listeners for audit logging
- [x] Create authentication utility methods for common operations
- [x] Write comprehensive unit tests for all authentication components

## Technical Guidance

### Key Interfaces
- `UserDetailsService`: Spring Security interface for loading user data
- `JwtTokenProvider`: Enhanced JWT operations beyond existing JwtService
- `AuthenticationManager`: Spring Security's main authentication interface
- `UserDetails`: Spring Security user representation
- `GrantedAuthority`: Spring Security permission representation

### Integration Points
- Service Location: `/backend/src/main/kotlin/com/astromanagement/auth/service/`
- Existing Services: `AuthenticationService.kt`, `JwtService.kt`
- User Domain: `/backend/src/main/kotlin/dev/ryuzu/astermanagement/domain/user/`
- Security Config: `/backend/src/main/kotlin/com/astromanagement/security/`
- Redis Config: Already configured for session storage

### Existing Patterns
- Service layer patterns from MatterService with BaseService abstraction
- Repository pattern with Spring Data JPA from UserRepository
- DTO mapping patterns from authentication request/response classes
- Error handling with ProblemDetail from existing exception handlers
- Audit logging with SecurityAuditEventListener

### Database Models
- `User` entity with roles and authentication fields
- `RefreshToken` entity for storing refresh token metadata (to be created)
- UserRole enum: LAWYER, CLERK, CLIENT
- User-Permission mapping through role-based logic

### Error Handling
- Custom authentication exceptions extending Spring Security exceptions
- ProblemDetail responses for consistent API error format
- Specific error codes for different authentication failures
- Audit logging for all authentication attempts

## Implementation Notes

### UserPrincipal Implementation

```kotlin
package dev.ryuzu.astarmanagement.auth.service

import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRole
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.util.*

/**
 * Custom UserDetails implementation for Spring Security
 * Bridges the User entity with Spring Security's authentication system
 */
class UserPrincipal(
    private val user: User
) : UserDetails {

    override fun getAuthorities(): Collection<GrantedAuthority> {
        val authorities = mutableListOf<GrantedAuthority>()

        // Add role authority
        authorities.add(SimpleGrantedAuthority("ROLE_${user.role.name}"))

        // Add permission authorities based on role
        authorities.addAll(getPermissionAuthorities())

        return authorities
    }

    private fun getPermissionAuthorities(): List<GrantedAuthority> {
        return when (user.role) {
            UserRole.LAWYER -> listOf(
                "matter:read", "matter:write", "matter:delete",
                "document:read", "document:write", "document:delete",
                "memo:read", "memo:write", "memo:delete",
                "expense:read", "expense:write", "expense:approve"
            )
            UserRole.CLERK -> listOf(
                "matter:read", "matter:write",
                "document:read", "document:write",
                "memo:read", "memo:write",
                "expense:read", "expense:write"
            )
            UserRole.CLIENT -> listOf(
                "matter:read",
                "document:read",
                "memo:read"
            )
        }.map { SimpleGrantedAuthority(it) }
    }

    override fun getPassword(): String = user.passwordHash ?: ""
    override fun getUsername(): String = user.email
    override fun isAccountNonExpired(): Boolean = true
    override fun isAccountNonLocked(): Boolean = user.isActive
    override fun isCredentialsNonExpired(): Boolean = true
    override fun isEnabled(): Boolean = user.isActive

    val id: UUID? = user.id
    val email: String = user.email
    val fullName: String = user.fullName
    val role: UserRole = user.role
}
```

### CustomUserDetailsService Implementation

```kotlin
package dev.ryuzu.astarmanagement.auth.service

import dev.ryuzu.astermanagement.domain.user.UserRepository
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Custom UserDetailsService implementation for Spring Security
 * Loads user details from database for authentication
 */
@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    @Transactional(readOnly = true)
    override fun loadUserByUsername(username: String): UserDetails {
        val user = userRepository.findByEmail(username)
            ?: throw UsernameNotFoundException("User not found with email: $username")

        if (!user.isActive) {
            throw UsernameNotFoundException("User account is disabled")
        }

        return UserPrincipal(user)
    }

    @Transactional(readOnly = true)
    fun loadUserById(userId: UUID): UserDetails {
        val user = userRepository.findById(userId)
            .orElseThrow { UsernameNotFoundException("User not found with id: $userId") }

        return UserPrincipal(user)
    }
}
```

### Enhanced JWT Service Methods
```kotlin
// Additional methods to add to existing JwtService

/**
 * Creates JWT from UserPrincipal
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
        .build()

    return jwtEncoder.encode(JwtEncoderParameters.from(claims)).tokenValue
}

/**
 * Validates token and returns UserPrincipal
 */
fun validateTokenAndGetUser(token: String): UserPrincipal? {
    return try {
        val jwt = jwtDecoder.decode(token)
        val userId = UUID.fromString(jwt.subject)
        customUserDetailsService.loadUserById(userId) as? UserPrincipal
    } catch (e: Exception) {
        null
    }
}
```

### Refresh Token Rotation Implementation
```kotlin
/**
 * Implements secure refresh token rotation
 * Old refresh token is invalidated when new one is issued
 */
private fun rotateRefreshToken(userId: UUID, oldRefreshToken: String): String {
    // Validate old refresh token
    val storedToken = redisTemplate.opsForValue().get("$REFRESH_TOKEN_PREFIX$userId")
    if (storedToken != oldRefreshToken) {
        throw BadCredentialsException("Invalid refresh token")
    }
    
    // Blacklist old token
    blacklistToken(oldRefreshToken)
    
    // Generate new refresh token
    val user = userRepository.findById(userId)
        .orElseThrow { BadCredentialsException("User not found") }
    val newRefreshToken = jwtService.generateRefreshToken(user)
    
    // Store new token
    storeRefreshToken(userId, newRefreshToken)
    
    return newRefreshToken
}

private fun blacklistToken(token: String) {
    val jwt = jwtService.validateToken(token) ?: return
    val expiry = jwt.expiresAt?.let { 
        Duration.between(Instant.now(), it) 
    } ?: Duration.ZERO
    
    if (expiry.isPositive) {
        redisTemplate.opsForValue().set(
            "blacklist:$token",
            "true",
            expiry.seconds,
            TimeUnit.SECONDS
        )
    }
}
```

### Session Management Service

```kotlin
package dev.ryuzu.astarmanagement.auth.service

import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.time.Duration
import java.util.*
import java.util.concurrent.TimeUnit

@Service
class SessionManagementService(
    private val redisTemplate: RedisTemplate<String, String>
) {

    fun createSession(userId: UUID, sessionData: Map<String, String>): String {
        val sessionId = UUID.randomUUID().toString()
        val key = "session:$sessionId"

        redisTemplate.opsForHash<String, String>().putAll(key, sessionData)
        redisTemplate.expire(key, Duration.ofHours(24))

        // Track active sessions for user
        redisTemplate.opsForSet().add("user:sessions:$userId", sessionId)

        return sessionId
    }

    fun invalidateSession(sessionId: String) {
        redisTemplate.delete("session:$sessionId")
    }

    fun invalidateAllUserSessions(userId: UUID) {
        val sessions = redisTemplate.opsForSet().members("user:sessions:$userId") ?: emptySet()
        sessions.forEach { sessionId ->
            invalidateSession(sessionId)
        }
        redisTemplate.delete("user:sessions:$userId")
    }

    fun getActiveSessions(userId: UUID): Set<String> {
        return redisTemplate.opsForSet().members("user:sessions:$userId") ?: emptySet()
    }
}
```

### Security Best Practices
- **Password Requirements**: Minimum 8 characters, complexity rules enforced
- **Token Expiration**: Access tokens expire in 1 hour, refresh tokens in 7 days
- **Rate Limiting**: Authentication endpoints limited to 5 attempts per minute
- **Audit Logging**: All authentication events logged with SecurityAuditEventListener
- **Token Blacklisting**: Revoked tokens stored in Redis until expiration
- **Session Management**: Active session tracking with forced logout capability

## Related Tasks
- T01_S06: Spring Security Configuration
- T03_S06: User Authentication Controller
- T04_S06: Role-Based Access Control Implementation
- T05_S06: Two-Factor Authentication Setup

## Complexity
Medium

## Priority
High

## Estimated Hours
12-16

## Dependencies
- Spring Security 6.x with OAuth2 Resource Server
- Existing AuthenticationService and JwtService
- User domain model and repository
- Redis for session and token management
- BCrypt for password encoding

## Output Log

[2025-06-30 21:31]: Task started - analyzing existing authentication infrastructure
[2025-06-30 21:31]: Found comprehensive AuthenticationService with Redis session management
[2025-06-30 21:31]: Existing JwtService provides full JWT token operations
[2025-06-30 21:31]: User entity with role-based authentication ready
[2025-06-30 21:31]: Missing components: UserPrincipal and CustomUserDetailsService
[2025-06-30 21:31]: Created UserPrincipal class with comprehensive authorities mapping
[2025-06-30 21:31]: Implemented CustomUserDetailsService with email-based authentication
[2025-06-30 21:58]: Enhanced JwtService with refresh token rotation and blacklisting
[2025-06-30 21:58]: Added TokenValidationResult enum for detailed validation feedback
[2025-06-30 21:58]: Implemented secure refresh token rotation with Redis storage
[2025-06-30 21:58]: BCryptPasswordEncoder already configured in SecurityConfiguration
[2025-06-30 21:58]: Created authentication exception handlers with ProblemDetail responses
[2025-06-30 21:58]: Added TokenException and TwoFactorAuthenticationException classes
[2025-06-30 21:58]: Implemented SessionManagementService with Redis session tracking
[2025-06-30 21:58]: Created AuthenticationEventListener for comprehensive audit logging
[2025-06-30 21:58]: Added AuthenticationUtils for common security operations
[2025-06-30 21:58]: Wrote comprehensive unit tests for all authentication components
[2025-06-30 21:58]: Task completed - all authentication service components implemented

## Notes
- UserDetailsService implementation is critical for Spring Security integration
- Refresh token rotation prevents token replay attacks
- Consider implementing remember-me functionality in future sprint
- Plan for gradual migration from existing auth logic to Spring Security
- Monitor token sizes to ensure they stay within HTTP header limits