---
task_id: T06_S01
sprint_sequence_id: S01
status: open
complexity: High
last_updated: 2025-06-15T07:48:00Z
---

# Task: Authentication & Authorization Integration

## Description

Implement comprehensive authentication and authorization system for the AsterManagement backend API using Spring Security with JWT tokens and role-based access control (RBAC). This task integrates Spring Security with JWT authentication, implements role-based authorization, and establishes proper security configuration patterns that align with the API design guidelines.

Based on the existing Spring Boot project configuration, we need to establish:
- Spring Security configuration with JWT authentication
- Custom authentication filters and providers
- Role-based access control (RBAC) with method-level security
- Integration with audit logging and user management
- OAuth2 client integration for external authentication providers
- Security headers and CORS configuration

## Goal / Objectives

- Implement secure JWT-based authentication system aligned with API guidelines (Bearer token)
- Establish role-based authorization supporting Lawyer, Clerk, and Client roles
- Create method-level security annotations for fine-grained access control
- Integrate authentication with audit logging system
- Implement proper security headers and CORS configuration
- Support 2FA requirements and session management

## Acceptance Criteria

- [ ] JWT authentication implemented with proper token validation (FR-001)
- [ ] Role-based authorization supports Lawyer/Clerk/Client roles (FR-002)
- [ ] Method-level security annotations protect sensitive endpoints
- [ ] Authentication integrates with audit logging system
- [ ] OAuth2 client configuration for external providers
- [ ] Security headers follow API guidelines (X-Frame-Options, CSP, HSTS)
- [ ] CORS configuration supports frontend integration
- [ ] Token refresh mechanism implemented (/auth/refresh)
- [ ] Proper error handling with RFC 7807 Problem+JSON format
- [ ] 2FA support infrastructure in place
- [ ] Integration tests validate security configuration

## Subtasks

- [ ] Analyze existing Spring Security and OAuth2 client dependencies
- [ ] Design JWT token structure and validation strategy
- [ ] Create custom authentication filter chain
- [ ] Implement role-based authorization with Spring Security
- [ ] Create method-level security annotations and enforcement
- [ ] Configure security headers and CORS policies
- [ ] Integrate authentication with audit logging
- [ ] Implement token refresh and session management
- [ ] Create authentication REST endpoints (/auth/*)
- [ ] Add 2FA support infrastructure
- [ ] Write comprehensive security integration tests
- [ ] Document authentication and authorization patterns

## Technical Guidance

### Existing Spring Boot Security Analysis

The project currently has:
- **Spring Security** starter dependency configured
- **OAuth2 Client** starter for external authentication
- **Spring Session Data Redis** for session management
- **Spring Boot Actuator** for security monitoring
- **Spring Modulith** for modular security boundaries

Key dependencies already configured:
- `spring-boot-starter-security`
- `spring-boot-starter-oauth2-client`
- `spring-session-data-redis`
- `spring-security-test` for testing

### JWT Authentication Strategy

Based on API guidelines requiring `Authorization: Bearer <JWT>`:

1. **JWT Token Structure**:
   ```json
   {
     "sub": "user-uuid",
     "role": "LAWYER",
     "permissions": ["matter:read", "matter:write", "document:upload"],
     "iat": 1640995200,
     "exp": 1640998800,
     "iss": "astermanagement-api"
   }
   ```

2. **Security Filter Chain Configuration**:
   ```kotlin
   @Configuration
   @EnableWebSecurity
   @EnableMethodSecurity(prePostEnabled = true)
   class SecurityConfiguration {
       
       @Bean
       fun filterChain(http: HttpSecurity): SecurityFilterChain {
           return http
               .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
               .authorizeHttpRequests { auth ->
                   auth.requestMatchers("/auth/**", "/actuator/health").permitAll()
                       .requestMatchers(HttpMethod.GET, "/v1/matters").hasAnyRole("LAWYER", "CLERK")
                       .requestMatchers(HttpMethod.POST, "/v1/matters").hasRole("LAWYER")
                       .anyRequest().authenticated()
               }
               .oauth2ResourceServer { it.jwt(Customizer.withDefaults()) }
               .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter::class.java)
               .build()
       }
   }
   ```

### Role-Based Access Control Implementation

**Role Hierarchy Design**:
```kotlin
enum class UserRole(val authorities: Set<String>) {
    LAWYER(setOf(
        "matter:read", "matter:write", "matter:delete",
        "document:read", "document:write", "document:delete",
        "memo:read", "memo:write", "expense:read", "expense:write"
    )),
    CLERK(setOf(
        "matter:read", "document:read", "document:write",
        "memo:read", "memo:write", "expense:read", "expense:write"
    )),
    CLIENT(setOf(
        "matter:read", "document:read", "memo:read"
    ))
}
```

**Method-Level Security Annotations**:
```kotlin
@RestController
@RequestMapping("/v1/matters")
class MatterController {
    
    @PreAuthorize("hasAuthority('matter:read')")
    @GetMapping
    fun getMatters(): ResponseEntity<List<Matter>> { }
    
    @PreAuthorize("hasAuthority('matter:write') and @matterService.isOwnerOrAssigned(#matterId, authentication.name)")
    @PutMapping("/{matterId}")
    fun updateMatter(@PathVariable matterId: UUID, @RequestBody request: UpdateMatterRequest): ResponseEntity<Matter> { }
}
```

### Security Configuration Patterns

1. **JWT Configuration**:
   ```kotlin
   @Configuration
   class JwtConfiguration {
       
       @Value("\${app.jwt.secret}")
       private lateinit var jwtSecret: String
       
       @Value("\${app.jwt.expiration:3600}")
       private var jwtExpiration: Long = 3600
       
       @Bean
       fun jwtEncoder(): JwtEncoder {
           val jwk = RSAKey.Builder(rsaPublicKey())
               .privateKey(rsaPrivateKey())
               .build()
           val jwkSet = JWKSet(jwk)
           return NimbusJwtEncoder(ImmutableJWKSet(jwkSet))
       }
   }
   ```

2. **Custom Authentication Filter**:
   ```kotlin
   @Component
   class JwtAuthenticationFilter(
       private val jwtDecoder: JwtDecoder,
       private val userDetailsService: UserDetailsService
   ) : OncePerRequestFilter() {
       
       override fun doFilterInternal(
           request: HttpServletRequest,
           response: HttpServletResponse,
           filterChain: FilterChain
       ) {
           val token = extractTokenFromRequest(request)
           if (token != null && validateToken(token)) {
               val authentication = createAuthentication(token)
               SecurityContextHolder.getContext().authentication = authentication
           }
           filterChain.doFilter(request, response)
       }
   }
   ```

3. **Security Headers Configuration**:
   ```kotlin
   @Bean
   fun corsConfigurationSource(): CorsConfigurationSource {
       val configuration = CorsConfiguration()
       configuration.allowedOriginPatterns = listOf("http://localhost:*", "https://*.astermanagement.dev")
       configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
       configuration.allowedHeaders = listOf("*")
       configuration.allowCredentials = true
       
       val source = UrlBasedCorsConfigurationSource()
       source.registerCorsConfiguration("/v1/**", configuration)
       return source
   }
   ```

## Implementation Notes

### Step-by-Step Security Implementation

1. **Security Configuration Setup** (Priority: High)
   ```kotlin
   // Create src/main/kotlin/dev/ryuzu/astermanagement/config/SecurityConfiguration.kt
   @Configuration
   @EnableWebSecurity
   @EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
   class SecurityConfiguration(
       private val jwtAuthenticationEntryPoint: JwtAuthenticationEntryPoint,
       private val jwtAccessDeniedHandler: JwtAccessDeniedHandler
   ) {
       
       @Bean
       fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
       
       @Bean
       fun authenticationManager(config: AuthenticationConfiguration): AuthenticationManager =
           config.authenticationManager
   }
   ```

2. **JWT Service Implementation** (Priority: High)
   ```kotlin
   @Service
   class JwtService {
       
       fun generateToken(userDetails: UserDetails): String {
           val claims = mapOf(
               "role" to userDetails.authorities.first().authority,
               "permissions" to userDetails.authorities.map { it.authority }
           )
           return createToken(claims, userDetails.username)
       }
       
       fun validateToken(token: String, userDetails: UserDetails): Boolean {
           val username = extractUsername(token)
           return username == userDetails.username && !isTokenExpired(token)
       }
   }
   ```

3. **Authentication Controllers** (Priority: High)
   ```kotlin
   @RestController
   @RequestMapping("/auth")
   @Validated
   class AuthenticationController(
       private val authenticationService: AuthenticationService,
       private val auditService: AuditService
   ) {
       
       @PostMapping("/login")
       fun authenticate(@Valid @RequestBody request: LoginRequest): ResponseEntity<AuthenticationResponse> {
           return try {
               val response = authenticationService.authenticate(request)
               auditService.logAuthenticationSuccess(request.username)
               ResponseEntity.ok(response)
           } catch (e: BadCredentialsException) {
               auditService.logAuthenticationFailure(request.username, e.message)
               throw UnauthorizedException("Invalid credentials")
           }
       }
       
       @PostMapping("/refresh")
       fun refreshToken(@Valid @RequestBody request: RefreshTokenRequest): ResponseEntity<AuthenticationResponse> {
           val response = authenticationService.refresh(request.refreshToken)
           return ResponseEntity.ok(response)
       }
   }
   ```

### Integration with Audit Logging

**Audit Integration Pattern**:
```kotlin
@Component
class SecurityAuditEventListener {
    
    @EventListener
    fun handleAuthenticationSuccess(event: AuthenticationSuccessEvent) {
        val username = event.authentication.name
        auditService.logEvent(
            eventType = "AUTHENTICATION_SUCCESS",
            principal = username,
            details = mapOf("timestamp" to Instant.now())
        )
    }
    
    @EventListener  
    fun handleAuthenticationFailure(event: AbstractAuthenticationFailureEvent) {
        auditService.logEvent(
            eventType = "AUTHENTICATION_FAILURE",
            principal = event.authentication.name,
            details = mapOf(
                "reason" to event.exception.message,
                "timestamp" to Instant.now()
            )
        )
    }
}
```

### OAuth2 Client Integration

**OAuth2 Configuration for External Providers**:
```yaml
# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          keycloak:
            client-id: ${KEYCLOAK_CLIENT_ID}
            client-secret: ${KEYCLOAK_CLIENT_SECRET}
            scope: openid,profile,email
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
        provider:
          keycloak:
            issuer-uri: ${KEYCLOAK_ISSUER_URI}
            user-name-attribute: preferred_username
```

### Error Handling with RFC 7807

**Security Exception Handler**:
```kotlin
@ControllerAdvice
class SecurityExceptionHandler {
    
    @ExceptionHandler(UnauthorizedException::class)
    fun handleUnauthorized(ex: UnauthorizedException): ResponseEntity<ProblemDetail> {
        val problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.message ?: "Unauthorized")
        problem.type = URI.create("/errors/unauthorized")
        problem.title = "Authentication Required"
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem)
    }
    
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(ex: AccessDeniedException): ResponseEntity<ProblemDetail> {
        val problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.message ?: "Access denied")
        problem.type = URI.create("/errors/forbidden")
        problem.title = "Insufficient Permissions"
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problem)
    }
}
```

### Testing Strategy

**Security Integration Tests**:
```kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(OrderAnnotation::class)
class SecurityIntegrationTest {
    
    @Test
    @Order(1)
    fun `should authenticate with valid credentials`() {
        val request = LoginRequest("lawyer@example.com", "password")
        val response = restTemplate.postForEntity("/auth/login", request, AuthenticationResponse::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.accessToken).isNotNull()
        assertThat(response.body?.role).isEqualTo("LAWYER")
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should allow lawyer to create matter`() {
        val request = CreateMatterRequest("Test Matter", "CLIENT_001")
        val response = restTemplate.postForEntity("/v1/matters", request, Matter::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
    }
    
    @Test
    @WithMockUser(roles = ["CLIENT"])
    fun `should deny client from creating matter`() {
        val request = CreateMatterRequest("Test Matter", "CLIENT_001")
        val response = restTemplate.postForEntity("/v1/matters", request, ProblemDetail::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
    }
}
```

### Performance and Security Considerations

1. **JWT Token Management**:
   - Use short-lived access tokens (15-30 minutes)
   - Implement secure refresh token rotation
   - Store refresh tokens in Redis with proper expiration

2. **Rate Limiting**:
   ```kotlin
   @Component
   class AuthenticationRateLimitFilter : OncePerRequestFilter() {
       
       private val rateLimiter = RateLimiter.create(10.0) // 10 requests per second
       
       override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
           if (request.servletPath.startsWith("/auth/") && !rateLimiter.tryAcquire()) {
               response.status = 429
               response.writer.write("Rate limit exceeded")
               return
           }
           filterChain.doFilter(request, response)
       }
   }
   ```

3. **Security Headers**:
   ```kotlin
   @Bean
   fun httpSecurityHeadersWriter(): HeaderWriterFilter {
       val writers = listOf(
           XFrameOptionsHeaderWriter(XFrameOptionsHeaderWriter.XFrameOptionsMode.DENY),
           XXssProtectionHeaderWriter(),
           CacheControlHeadersWriter(),
           HstsHeaderWriter(),
           ContentTypeOptionsHeaderWriter()
       )
       return HeaderWriterFilter(writers)
   }
   ```

## Output Log

*(This section is populated as work progresses on the task)*

[2025-06-15 07:48:00] Task created and ready for implementation