# AsterManagement Security Configuration

## Overview

The AsterManagement backend implements comprehensive JWT-based authentication with OAuth2 Resource Server support, role-based authorization, and security hardening measures.

## Security Architecture

### 1. Authentication Strategy
- **JWT-based authentication** with stateless sessions
- **Dual signing approaches**: HMAC SHA (configurable) and RSA (default)
- **OAuth2 Resource Server** integration for standard JWT processing
- **Custom JWT filter** for additional processing and validation

### 2. Authorization Model
- **Role-based access control (RBAC)** with three primary roles:
  - `LAWYER`: Full system access, administrative capabilities
  - `CLERK`: Case management, document handling
  - `CLIENT`: Read-only access to own cases
- **Method-level security** using `@PreAuthorize` annotations
- **Authority-based permissions** for granular access control

### 3. Security Configuration

#### Core Components
- `SecurityConfiguration.kt`: Main security filter chain setup
- `JwtConfiguration.kt`: JWT encoder/decoder configuration
- `JwtAuthenticationFilter.kt`: Custom JWT processing filter
- `JwtAuthenticationEntryPoint.kt`: Handles authentication failures
- `JwtAccessDeniedHandler.kt`: Handles authorization failures

#### Security Headers
```kotlin
headers {
    frameOptions { frameOptions -> frameOptions.deny() }
    contentTypeOptions { }
    httpStrictTransportSecurity { hsts ->
        hsts.maxAgeInSeconds(31536000)
            .includeSubDomains(true)
    }
    contentSecurityPolicy { csp ->
        csp.policyDirectives("default-src 'self'; frame-ancestors 'none'")
    }
}
```

#### CORS Configuration
```kotlin
allowedOriginPatterns = listOf(
    "http://localhost:*",
    "https://localhost:*", 
    "https://*.astermanagement.dev",
    "https://*.vercel.app"
)
allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
allowCredentials = true
```

## JWT Configuration

### Environment Variables
```properties
# JWT Settings
JWT_EXPIRATION=3600              # Token expiration in seconds (1 hour)
JWT_REFRESH_EXPIRATION=86400     # Refresh token expiration (24 hours)
JWT_ISSUER=astermanagement-api   # Token issuer
JWT_SECRET_KEY=your-secret-key   # HMAC SHA key (optional, defaults to RSA)
```

### Token Structure
```json
{
  "sub": "user-uuid",
  "role": "LAWYER|CLERK|CLIENT",
  "permissions": ["matter:read", "matter:write", "document:upload"],
  "iat": 1640995200,
  "exp": 1640998800,
  "iss": "astermanagement-api"
}
```

### Signing Approaches

#### 1. RSA Key Pairs (Default)
- **More secure** for production environments
- **2048-bit RSA keys** generated automatically
- **Public key verification** prevents token tampering
- **No shared secrets** between services

#### 2. HMAC SHA (Configurable)
- **Simpler setup** for development/testing
- **Shared secret** approach
- **Activated** when `JWT_SECRET_KEY` is provided
- **Falls back to RSA** if secret key is empty

## Endpoint Security

### Public Endpoints
```
/auth/**                    # Authentication endpoints
/actuator/health           # Health checks
/swagger-ui/**             # API documentation
/v3/api-docs/**           # OpenAPI specs
/favicon.ico              # Static resources
```

### Protected Endpoints
```
/v1/matters/**            # Role-based: LAWYER, CLERK
/v1/documents/**          # Authority-based: document:read, document:write
/v1/memos/**             # Authority-based: memo:read, memo:write
/v1/expenses/**          # Authority-based: expense:read, expense:write
/v1/admin/**             # Role-based: LAWYER only
```

## Development vs Production

### Development Profile (`application-dev.properties`)
```properties
# Extended token lifetime for development
app.jwt.expiration=7200                    # 2 hours
app.jwt.refresh-expiration=172800          # 48 hours
app.jwt.issuer=astermanagement-dev-api

# Enhanced logging
logging.level.org.springframework.security=DEBUG
spring.jpa.show-sql=true
```

### Production Profile (`application.properties`)
```properties
# Standard token lifetime
app.jwt.expiration=3600                    # 1 hour
app.jwt.refresh-expiration=86400           # 24 hours
app.jwt.issuer=astermanagement-api

# Minimal logging
spring.jpa.show-sql=false
```

## Testing

### Security Integration Tests
- `SecurityIntegrationTest.kt`: Comprehensive security testing
- **Authentication flow testing**
- **Authorization verification**
- **Security header validation**
- **Error response formatting**

### Test Configuration
```kotlin
@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class SecurityIntegrationTest {
    // JWT token generation and validation tests
    // Role-based access control tests
    // Security filter chain tests
}
```

## Security Best Practices Implemented

1. **Stateless sessions** prevent session fixation attacks
2. **CSRF protection disabled** (using JWT tokens)
3. **Security headers** prevent XSS, clickjacking, MIME sniffing
4. **CORS configuration** restricts cross-origin requests
5. **Method-level security** for fine-grained access control
6. **Custom error handling** prevents information leakage
7. **Profile-specific configurations** for different environments
8. **Comprehensive test coverage** for security scenarios

## Troubleshooting

### Common Issues

1. **JWT Token Expired**
   - Error: `401 Unauthorized`
   - Solution: Use refresh token to get new access token

2. **CORS Errors**
   - Error: `Access-Control-Allow-Origin`
   - Solution: Verify frontend URL in `allowedOriginPatterns`

3. **Role/Authority Mismatch**
   - Error: `403 Forbidden`
   - Solution: Check user roles and endpoint requirements

### Debug Commands
```bash
# Check JWT configuration
curl -X POST /auth/login -d '{"username":"test","password":"test"}'

# Verify security headers
curl -I https://api.astermanagement.com/actuator/health

# Test protected endpoint
curl -H "Authorization: Bearer <token>" /v1/matters
```

## Future Enhancements

1. **Rate limiting** for authentication endpoints
2. **Account lockout** after failed attempts  
3. **Two-factor authentication** integration
4. **JWT blacklisting** for logout functionality
5. **Dynamic permission management**
6. **API versioning** for authentication endpoints