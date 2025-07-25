# T02_S01 - JWT Service Implementation

## Task Overview
**Duration**: 6 hours  
**Priority**: Critical  
**Dependencies**: T01_S01_Spring_Security_Configuration  
**Sprint**: S01_M001_BACKEND_AUTH  

## Objective
Implement a comprehensive JWT service for token generation, validation, and refresh functionality, providing secure token management for the legal practice management system.

## Background
This task implements the core JWT token management functionality required for AUTH-002 (JWT Authentication Endpoints). The service must handle token lifecycle management with security appropriate for attorney-client confidential data.

## Technical Requirements

### 1. JWT Service Interface
Define the service contract following Clean Architecture principles:

**Location**: `backend/modules/auth/domain/service/JwtService.kt`

**Core Methods**:
- Token generation (access and refresh tokens)
- Token validation and parsing
- Token refresh mechanism
- User information extraction from tokens
- Token blacklist management

### 2. JWT Service Implementation
Implement the service with security best practices:

**Location**: `backend/modules/auth/infrastructure/service/JwtServiceImpl.kt`

**Key Features**:
- HMAC-SHA512 signature algorithm
- Claims-based user information storage
- Token expiration handling
- Refresh token rotation for security
- Thread-safe implementation

### 3. JWT Token Models
Create data classes for token management:

**Location**: `backend/modules/auth/domain/model/`

**Models to Create**:
- `JwtToken.kt` - Access token representation
- `JwtRefreshToken.kt` - Refresh token representation
- `TokenPair.kt` - Access + refresh token pair
- `JwtClaims.kt` - Custom claims structure

### 4. Token Repository
Implement token storage for refresh token management:

**Location**: `backend/modules/auth/infrastructure/persistence/`

**Components**:
- `RefreshTokenRepository.kt` - JPA repository for refresh tokens
- `RefreshTokenEntity.kt` - JPA entity for token storage
- Database migration for refresh tokens table

## Implementation Guidance

### JWT Service Core Implementation
Use the established Spring Security JWT patterns with additional security:

```kotlin
@Service
class JwtServiceImpl(
    private val jwtProperties: JwtProperties,
    private val refreshTokenRepository: RefreshTokenRepository
) : JwtService {

    private val secretKey: SecretKey by lazy {
        Keys.hmacShaKeyFor(jwtProperties.secret.toByteArray())
    }

    override fun generateAccessToken(userDetails: UserDetails): String {
        val claims = buildClaims(userDetails)
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.username)
            .setIssuer(jwtProperties.issuer)
            .setAudience(jwtProperties.audience)
            .setIssuedAt(Date())
            .setExpiration(Date(System.currentTimeMillis() + jwtProperties.accessTokenExpiration * 1000))
            .signWith(secretKey, SignatureAlgorithm.HS512)
            .compact()
    }

    override fun generateRefreshToken(userDetails: UserDetails): String {
        val refreshToken = Jwts.builder()
            .setSubject(userDetails.username)
            .setIssuer(jwtProperties.issuer)
            .setIssuedAt(Date())
            .setExpiration(Date(System.currentTimeMillis() + jwtProperties.refreshTokenExpiration * 1000))
            .signWith(secretKey, SignatureAlgorithm.HS512)
            .compact()
        
        // Store refresh token in database for validation
        storeRefreshToken(userDetails.username, refreshToken)
        return refreshToken
    }
}
```

### Custom Claims for Legal Practice
Include relevant user information in JWT claims:

```kotlin
private fun buildClaims(userDetails: UserDetails): Map<String, Any> {
    val user = userDetails as CustomUserDetails
    return mapOf(
        "userId" to user.userId,
        "email" to user.email,
        "role" to user.role,
        "permissions" to user.authorities.map { it.authority },
        "tenantId" to user.tenantId, // For multi-tenant isolation
        "fullName" to "${user.firstName} ${user.lastName}",
        "lastLoginAt" to user.lastLoginAt?.toString()
    )
}
```

### Token Validation with Security Checks
Implement comprehensive token validation:

```kotlin
override fun validateToken(token: String): Boolean {
    return try {
        val claims = Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
        
        // Additional validation checks
        val subject = claims.body.subject
        val expiration = claims.body.expiration
        val issuer = claims.body.issuer
        
        subject.isNotBlank() && 
        expiration.after(Date()) && 
        issuer == jwtProperties.issuer &&
        !isTokenBlacklisted(token)
    } catch (e: Exception) {
        false
    }
}
```

### Refresh Token Management
Implement secure refresh token handling:

```kotlin
override fun refreshAccessToken(refreshToken: String): TokenPair? {
    return try {
        // Validate refresh token
        if (!validateRefreshToken(refreshToken)) {
            return null
        }
        
        val claims = extractClaims(refreshToken)
        val username = claims.subject
        
        // Load fresh user details
        val userDetails = userDetailsService.loadUserByUsername(username)
        
        // Generate new token pair
        val newAccessToken = generateAccessToken(userDetails)
        val newRefreshToken = generateRefreshToken(userDetails)
        
        // Invalidate old refresh token
        invalidateRefreshToken(refreshToken)
        
        TokenPair(newAccessToken, newRefreshToken)
    } catch (e: Exception) {
        null
    }
}
```

## Integration Points

### Spring Security Integration
- UserDetailsService for loading user information
- Authentication objects for security context
- Custom UserDetails implementation with additional fields

### Database Integration
- Refresh token storage and validation
- Token blacklist for logout functionality
- User information queries for token generation

### Module Architecture
Follow Clean Architecture with proper dependency injection:
- Domain service interface in `domain/service/`
- Implementation in `infrastructure/service/`
- Models in `domain/model/`
- Repository in `infrastructure/persistence/`

## Implementation Steps

1. **Create Domain Models** (1 hour)
   - `JwtToken`, `TokenPair`, `JwtClaims` data classes
   - Domain service interface definition
   - Custom exceptions for JWT operations

2. **Implement JWT Service** (2 hours)
   - Core token generation logic
   - Token validation and parsing
   - Claims building and extraction methods

3. **Refresh Token Management** (1.5 hours)
   - Database entity and repository
   - Token refresh logic with rotation
   - Database migration for refresh tokens

4. **Security Features** (1 hour)
   - Token blacklist functionality
   - Additional validation checks
   - Error handling and logging

5. **Testing and Integration** (0.5 hours)
   - Unit tests for JWT operations
   - Integration tests with Spring Security
   - Performance testing for token operations

## Testing Requirements

### Unit Tests
```kotlin
@ExtendWith(MockKExtension::class)
class JwtServiceImplTest {
    
    @Test
    fun `should generate valid access token`() {
        // Test token generation
    }
    
    @Test
    fun `should validate token correctly`() {
        // Test token validation
    }
    
    @Test
    fun `should refresh tokens securely`() {
        // Test refresh token flow
    }
    
    @Test
    fun `should handle expired tokens`() {
        // Test expiration handling
    }
}
```

### Integration Tests
```kotlin
@SpringBootTest
@Testcontainers
class JwtServiceIntegrationTest {
    
    @Test
    fun `should persist refresh tokens in database`() {
        // Test database integration
    }
    
    @Test
    fun `should invalidate old refresh tokens on refresh`() {
        // Test token rotation
    }
}
```

## Success Criteria

- [ ] JWT tokens generated with proper claims and expiration
- [ ] Token validation correctly identifies valid/invalid tokens
- [ ] Refresh token mechanism works with database persistence
- [ ] Token blacklist functionality prevents reuse of invalidated tokens
- [ ] All JWT operations complete within performance targets (<10ms)
- [ ] Unit tests achieve >95% coverage
- [ ] Integration tests verify database and security integration
- [ ] No sensitive information logged during JWT operations

## Security Considerations

### Legal Practice Security Requirements
- Attorney-client privilege: No confidential data in tokens
- Tenant isolation: Include tenant ID in claims for multi-tenant security
- Audit trail: Log all token generation and validation events
- Compliance: Follow Japanese data protection standards

### JWT Security Best Practices
- Strong secret key (minimum 512 bits for HS512)
- Short-lived access tokens (15 minutes)
- Refresh token rotation on each use
- Proper error handling without information disclosure
- Token blacklist for immediate revocation

## Performance Considerations

- Token generation: <5ms per token
- Token validation: <2ms per validation
- Database queries optimized with proper indexing
- Connection pooling for refresh token operations
- Memory-efficient claims processing

## Files to Create/Modify

- `backend/modules/auth/domain/service/JwtService.kt`
- `backend/modules/auth/infrastructure/service/JwtServiceImpl.kt`
- `backend/modules/auth/domain/model/JwtToken.kt`
- `backend/modules/auth/domain/model/TokenPair.kt`
- `backend/modules/auth/domain/model/JwtClaims.kt`
- `backend/modules/auth/infrastructure/persistence/RefreshTokenEntity.kt`
- `backend/modules/auth/infrastructure/persistence/RefreshTokenRepository.kt`
- `backend/src/main/resources/db/migration/V002__Create_refresh_tokens_table.sql`

## Architectural References

### Clean Architecture Guidelines
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md`
- **Relevance**: JWT service must follow Clean Architecture with domain service interface separated from infrastructure implementation
- **Key Guidance**: Implement JwtService interface in domain layer, concrete implementation in infrastructure layer, ensuring no domain dependencies on external libraries

### Legal Domain Security Requirements  
- **Reference**: `CLAUDE.md` - Legal Domain Implementation Checklist
- **Relevance**: JWT tokens must protect attorney-client privilege and support multi-tenant isolation for law firms
- **Key Guidance**: Include tenantId in JWT claims, ensure no confidential client data in tokens, implement audit logging for all token operations

### Technology Stack Standards
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md` - Technology Stack section
- **Relevance**: JWT implementation must use specified Spring Security JWT patterns with Kotlin and proper security algorithms
- **Key Guidance**: Use HMAC-SHA512 signature algorithm, implement with Spring Security JWT components, follow established Kotlin coding standards

## Related Tasks

- T01_S01_Spring_Security_Configuration
- T03_S01_Authentication_API_Endpoints
- T04_S01_User_Entity_Repository_Layer

---

**Note**: This JWT service is central to all authentication operations. Ensure proper testing and security review before integration with API endpoints.