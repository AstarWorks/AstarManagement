# T03_S01 - Authentication API Endpoints

## Task Overview
**Duration**: 8 hours  
**Priority**: Critical  
**Dependencies**: T02_S01_JWT_Service_Implementation  
**Sprint**: S01_M001_BACKEND_AUTH  

## Objective
Implement REST API endpoints for user authentication including login, logout, refresh token, and user profile access, providing secure authentication services for the legal practice management frontend.

## Background
This task implements AUTH-002 from the milestone requirements, creating the authentication API endpoints that the frontend will integrate with. The endpoints must provide secure authentication for Japanese law firms with proper error handling and audit logging.

## Technical Requirements

### 1. Authentication Controller
Create REST controller following Spring Web MVC patterns:

**Location**: `backend/modules/auth/web/rest/AuthController.kt`

**Endpoints to Implement**:
- `POST /api/auth/login` - User authentication with email/password
- `POST /api/auth/refresh` - Access token refresh using refresh token
- `POST /api/auth/logout` - Session invalidation and token cleanup
- `GET /api/auth/me` - Current user profile information

### 2. Authentication DTOs
Create data transfer objects for API contracts:

**Location**: `backend/modules/auth/web/rest/dto/`

**DTOs to Create**:
- `LoginRequest.kt` - Login credentials
- `LoginResponse.kt` - Login success response with tokens
- `RefreshTokenRequest.kt` - Refresh token request
- `TokenResponse.kt` - Token response structure
- `UserProfileResponse.kt` - User profile information

### 3. Authentication Service
Create application service for authentication business logic:

**Location**: `backend/modules/auth/application/service/AuthenticationService.kt`

**Service Methods**:
- `authenticate(email, password)` - User authentication
- `refreshAccessToken(refreshToken)` - Token refresh
- `logout(refreshToken)` - Session termination
- `getCurrentUser(userId)` - User profile retrieval

### 4. Request Validation
Implement comprehensive input validation:

**Validation Requirements**:
- Email format validation
- Password strength requirements
- Rate limiting for login attempts
- Input sanitization for security

## Implementation Guidance

### Authentication Controller Implementation
Create RESTful endpoints with proper Spring Boot patterns:

```kotlin
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
@Validated
class AuthController(
    private val authenticationService: AuthenticationService,
    private val jwtService: JwtService
) {

    @PostMapping("/login")
    @Operation(
        summary = "User login",
        description = "Authenticate user with email and password"
    )
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<LoginResponse> {
        return try {
            val response = authenticationService.authenticate(request.email, request.password)
            ResponseEntity.ok(response)
        } catch (e: BadCredentialsException) {
            throw AuthenticationException("Invalid credentials")
        } catch (e: AccountLockedException) {
            throw AuthenticationException("Account is locked")
        }
    }

    @PostMapping("/refresh")
    @Operation(
        summary = "Refresh access token",
        description = "Generate new access token using refresh token"
    )
    fun refresh(@Valid @RequestBody request: RefreshTokenRequest): ResponseEntity<TokenResponse> {
        val tokenPair = jwtService.refreshAccessToken(request.refreshToken)
            ?: throw InvalidTokenException("Invalid refresh token")
        
        return ResponseEntity.ok(TokenResponse(tokenPair.accessToken, tokenPair.refreshToken))
    }

    @PostMapping("/logout")
    @Operation(
        summary = "User logout",
        description = "Invalidate refresh token and log out user"
    )
    fun logout(@Valid @RequestBody request: RefreshTokenRequest): ResponseEntity<Void> {
        authenticationService.logout(request.refreshToken)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/me")
    @Operation(
        summary = "Get current user profile",
        description = "Retrieve authenticated user's profile information"
    )
    @PreAuthorize("isAuthenticated()")
    fun getCurrentUser(authentication: Authentication): ResponseEntity<UserProfileResponse> {
        val userProfile = authenticationService.getCurrentUser(authentication.name)
        return ResponseEntity.ok(userProfile)
    }
}
```

### Authentication Service Implementation
Implement business logic with proper separation of concerns:

```kotlin
@Service
@Transactional
class AuthenticationService(
    private val authenticationManager: AuthenticationManager,
    private val userDetailsService: CustomUserDetailsService,
    private val jwtService: JwtService,
    private val auditService: AuditService,
    private val passwordEncoder: PasswordEncoder
) {

    fun authenticate(email: String, password: String): LoginResponse {
        return try {
            // Authenticate user
            val authRequest = UsernamePasswordAuthenticationToken(email, password)
            val authentication = authenticationManager.authenticate(authRequest)
            val userDetails = authentication.principal as CustomUserDetails

            // Generate tokens
            val accessToken = jwtService.generateAccessToken(userDetails)
            val refreshToken = jwtService.generateRefreshToken(userDetails)

            // Update last login
            updateLastLogin(userDetails.userId)

            // Log successful authentication
            auditService.logAuthenticationSuccess(userDetails.userId, getClientInfo())

            LoginResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                user = mapToUserProfile(userDetails),
                expiresIn = jwtProperties.accessTokenExpiration
            )
        } catch (e: BadCredentialsException) {
            auditService.logAuthenticationFailure(email, "Invalid credentials", getClientInfo())
            throw e
        }
    }

    fun refreshAccessToken(refreshToken: String): TokenResponse? {
        return jwtService.refreshAccessToken(refreshToken)?.let { tokenPair ->
            TokenResponse(tokenPair.accessToken, tokenPair.refreshToken)
        }
    }

    fun logout(refreshToken: String) {
        jwtService.invalidateRefreshToken(refreshToken)
        auditService.logLogout(getCurrentUserId(), getClientInfo())
    }
}
```

### Input Validation and DTOs
Create comprehensive validation for all inputs:

```kotlin
data class LoginRequest(
    @field:Email(message = "有効なメールアドレスを入力してください")
    @field:NotBlank(message = "メールアドレスは必須です")
    val email: String,

    @field:NotBlank(message = "パスワードは必須です")
    @field:Size(min = 8, max = 128, message = "パスワードは8文字以上128文字以下で入力してください")
    val password: String,

    val rememberMe: Boolean = false
)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: UserProfileResponse,
    val expiresIn: Long,
    val tokenType: String = "Bearer"
)

data class UserProfileResponse(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String,
    val permissions: List<String>,
    val lastLoginAt: LocalDateTime?,
    val createdAt: LocalDateTime
)
```

### Error Handling
Implement consistent error responses:

```kotlin
@RestControllerAdvice
class AuthenticationExceptionHandler {

    @ExceptionHandler(BadCredentialsException::class)
    fun handleBadCredentials(e: BadCredentialsException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse(
                code = "INVALID_CREDENTIALS",
                message = "メールアドレスまたはパスワードが正しくありません",
                timestamp = LocalDateTime.now()
            ))
    }

    @ExceptionHandler(InvalidTokenException::class)
    fun handleInvalidToken(e: InvalidTokenException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse(
                code = "INVALID_TOKEN",
                message = "無効なトークンです",
                timestamp = LocalDateTime.now()
            ))
    }
}
```

## Integration Points

### Spring Security Integration
- AuthenticationManager for credential validation
- UserDetailsService for user loading
- SecurityContext for authenticated user access

### Database Integration
- User queries for authentication
- Refresh token storage and validation
- Audit logging for compliance requirements

### JWT Service Integration
- Token generation after successful authentication
- Token validation for protected endpoints
- Refresh token management

## Implementation Steps

1. **Create Authentication DTOs** (1 hour)
   - Request/response data classes
   - Validation annotations
   - OpenAPI documentation annotations

2. **Implement Authentication Service** (2 hours)
   - Business logic for authentication
   - User credential validation
   - Token generation coordination

3. **Create REST Controller** (2 hours)
   - Authentication endpoints
   - Request/response handling
   - Security annotations

4. **Error Handling Implementation** (1 hour)
   - Custom exception classes
   - Global exception handler
   - Consistent error responses

5. **Integration and Testing** (2 hours)
   - Integration with Spring Security
   - Database integration testing
   - API endpoint testing

## Testing Requirements

### Unit Tests
```kotlin
@ExtendWith(MockKExtension::class)
class AuthControllerTest {
    
    @Test
    fun `should authenticate user with valid credentials`() {
        // Test successful authentication
    }
    
    @Test
    fun `should return 401 for invalid credentials`() {
        // Test authentication failure
    }
    
    @Test
    fun `should refresh access token with valid refresh token`() {
        // Test token refresh
    }
    
    @Test
    fun `should logout user and invalidate tokens`() {
        // Test logout functionality
    }
}
```

### Integration Tests
```kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class AuthControllerIntegrationTest {
    
    @Test
    fun `should complete full authentication flow`() {
        // Test complete login/refresh/logout flow
    }
    
    @Test
    fun `should protect user profile endpoint`() {
        // Test endpoint security
    }
}
```

### API Contract Tests
```kotlin
@AutoConfigureRestDocs
class AuthApiDocumentationTest {
    
    @Test
    fun `should document login endpoint`() {
        // Generate API documentation
    }
}
```

## Success Criteria

- [ ] All authentication endpoints respond correctly
- [ ] Input validation prevents invalid requests
- [ ] JWT tokens generated and validated properly
- [ ] Error responses provide appropriate feedback
- [ ] Audit logging captures all authentication events
- [ ] API documentation generated via SpringDoc
- [ ] Integration tests achieve >90% coverage
- [ ] Performance targets met (<200ms response time)

## Security Considerations

### Legal Practice Requirements
- No confidential client data in authentication logs
- Proper tenant isolation in multi-tenant environment
- Compliance with attorney-client privilege requirements
- Audit trail for regulatory compliance

### API Security Best Practices
- Rate limiting on login endpoint (5 attempts per 15 minutes)
- Input sanitization to prevent injection attacks
- Secure error messages without information disclosure
- HTTPS enforcement for all authentication endpoints

## Performance Considerations

- Authentication response time: <200ms
- Database query optimization for user lookup
- JWT token generation efficiency
- Connection pooling for database operations
- Caching of frequently accessed user data

## Files to Create/Modify

- `backend/modules/auth/web/rest/AuthController.kt`
- `backend/modules/auth/web/rest/dto/LoginRequest.kt`
- `backend/modules/auth/web/rest/dto/LoginResponse.kt`
- `backend/modules/auth/web/rest/dto/RefreshTokenRequest.kt`
- `backend/modules/auth/web/rest/dto/TokenResponse.kt`
- `backend/modules/auth/web/rest/dto/UserProfileResponse.kt`
- `backend/modules/auth/application/service/AuthenticationService.kt`
- `backend/modules/auth/web/rest/exception/AuthenticationExceptionHandler.kt`

## Architectural References

### Clean Architecture Guidelines
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md`
- **Relevance**: Authentication API endpoints must follow Clean Architecture presentation layer patterns with proper separation from business logic
- **Key Guidance**: Place REST controllers in presentation layer, delegate to application services, avoid business logic in controllers, maintain clean DTOs for API contracts

### Legal Domain Security Requirements  
- **Reference**: `CLAUDE.md` - Legal Domain Implementation Checklist
- **Relevance**: Authentication endpoints must enforce legal practice security requirements including audit logging and multi-tenant isolation
- **Key Guidance**: Log all authentication events for compliance, implement rate limiting to prevent brute force attacks, ensure error messages don't leak sensitive information

### Technology Stack Standards
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md` - Technology Stack section
- **Relevance**: API endpoints must use Spring Web MVC patterns with proper validation, error handling, and OpenAPI documentation
- **Key Guidance**: Use Spring Boot validation annotations, implement global exception handlers, generate API documentation with SpringDoc, follow RESTful conventions

## Related Tasks

- T02_S01_JWT_Service_Implementation
- T04_S01_User_Entity_Repository_Layer
- T07_S01_Security_Integration_Testing

---

**Note**: These API endpoints form the primary integration point between frontend and backend authentication systems. Ensure thorough testing and security review.