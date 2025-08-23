# Task T001: Auth0 Authentication Migration

## Task Information

**ID**: T001  
**Title**: Migrate Spring Boot Authentication to Auth0  
**Status**: In Progress  
**Priority**: High  
**Milestone**: M001 - Auth0 Integration  
**Assignee**: Backend Team  
**Created**: 2025-01-18  
**Due Date**: 2025-02-01  

## Task Description

Migrate the current Spring Boot custom JWT authentication implementation to use Auth0 as the authentication provider while maintaining the existing authorization logic within the application. This follows the authentication delegation pattern documented in `/docs/40-specs/02-auth-security/`.

## Acceptance Criteria

- [ ] Auth0 OAuth2 Resource Server configured in Spring Boot
- [ ] JWT validation using Auth0 JWKS endpoint
- [ ] Custom claims (tenant_id, roles) properly extracted
- [ ] JIT user provisioning from Auth0 tokens
- [ ] Existing AuthenticationService refactored
- [ ] Multi-tenant RLS context maintained
- [ ] All authentication tests passing
- [ ] Zero breaking changes to API contracts

## Technical Requirements

### Backend Changes

1. **Dependencies** (✅ Completed)
   - Added `spring-boot-starter-oauth2-resource-server`
   - Added `spring-security-oauth2-jose`

2. **Configuration** (✅ Completed)
   - Auth0 properties in application.properties
   - JWKS URI configuration
   - Audience validation setup

3. **Security Implementation** (🔄 In Progress)
   - Auth0JwtAuthenticationConverter created
   - SecurityConfig updated for OAuth2
   - Custom claims extraction logic

4. **Service Layer** (⏳ Pending)
   - Remove password validation from AuthenticationService
   - Implement JIT user provisioning
   - Update user creation flow

5. **Database Migration** (⏳ Pending)
   - Add auth0_sub column to users table
   - Remove password_hash requirement
   - Update audit fields

### Frontend Changes (⏳ Pending)

1. **Sidebase Auth Configuration**
   - Configure Auth0 provider
   - Update environment variables
   - Implement token refresh

2. **Login/Logout Flows**
   - Redirect to Auth0 Universal Login
   - Handle callback and tokens
   - Update logout to clear Auth0 session

3. **API Integration**
   - Add Authorization header to all requests
   - Handle 401 responses
   - Implement token refresh logic

## Implementation Steps

### Step 1: Auth0 Tenant Setup
```bash
# Required Auth0 configuration
1. Create API in Auth0 Dashboard
2. Set API Identifier (audience)
3. Configure allowed callbacks
4. Create Post-Login Action for custom claims
```

### Step 2: Backend Integration
```kotlin
// Already implemented in Auth0JwtAuthenticationConverter.kt
class Auth0JwtAuthenticationConverter : Converter<Jwt, AbstractAuthenticationToken> {
    override fun convert(jwt: Jwt): AbstractAuthenticationToken {
        val authorities = extractAuthorities(jwt)
        val tenantId = jwt.getClaimAsString("tenant_id")
        // Set tenant context for RLS
        return JwtAuthenticationToken(jwt, authorities)
    }
}
```

### Step 3: Frontend Integration
```typescript
// Configure Sidebase Auth with Auth0
export default defineNuxtConfig({
  auth: {
    provider: {
      type: 'oauth',
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER,
      authorization: {
        params: {
          audience: process.env.AUTH0_AUDIENCE
        }
      }
    }
  }
})
```

### Step 4: User Migration
```sql
-- Migration script for Auth0 users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth0_sub VARCHAR(255) UNIQUE,
ALTER COLUMN password_hash DROP NOT NULL;

-- Create index for Auth0 subject lookup
CREATE INDEX idx_users_auth0_sub ON users(auth0_sub);
```

## Testing Checklist

- [ ] Unit tests for Auth0JwtAuthenticationConverter
- [ ] Integration tests for JWT validation
- [ ] End-to-end authentication flow test
- [ ] Multi-tenant isolation test
- [ ] Performance test for token validation
- [ ] Security audit for token handling

## Dependencies

- Auth0 tenant must be configured
- Frontend team availability for Sidebase Auth integration
- Database migration window scheduled
- User communication plan approved

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Token validation performance | Implement JWKS caching with 5-minute TTL |
| User migration failures | Dual-auth support during transition |
| Auth0 service dependency | Circuit breaker pattern for resilience |
| Breaking API changes | Maintain backward compatibility layer |

## Definition of Done

- [ ] Code implementation complete
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Deployed to staging environment
- [ ] Performance metrics validated
- [ ] Security review completed
- [ ] Production deployment successful

## Related Documentation

- [Auth0 Integration Architecture](../../../docs/40-specs/02-auth-security/auth0-integration-architecture.md)
- [Spring Security OAuth2 Guide](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [Sidebase Auth Documentation](https://auth.sidebase.io/)
- [Milestone M001](../02_MILESTONES/M001_Auth0_Integration.md)

## Progress Log

### 2025-01-18
- Initial task creation
- Dependencies added to build.gradle.kts
- Auth0 configuration added to application.properties
- Auth0JwtAuthenticationConverter implemented
- SecurityConfig updated for OAuth2 Resource Server

### Next Steps
1. Complete JIT user provisioning logic
2. Create database migration script
3. Update AuthenticationService
4. Begin frontend Sidebase Auth integration

---
*Task managed by Simone Framework*  
*Last Updated: 2025-01-18*