# Milestone M002: Auth0 Authentication Only

---
milestone_id: M002
title: Auth0 Authentication Only Implementation
status: planning
created: 2025-01-18
last_updated: 2025-01-18 14:30
owner: Development Team
target_date: 2025-02-15
priority: critical
---

## Milestone Overview

This milestone focuses exclusively on implementing **authentication** (認証) using Auth0, Sidebase Auth, and Spring Boot OAuth2 Resource Server. Authorization (認可) logic and role-based access control are explicitly deferred to a future milestone to ensure clean separation of concerns.

## Goals

1. **Complete Auth0 Integration**: Fully delegate authentication to Auth0 service
2. **Remove Custom Auth**: Eliminate all password-based authentication code
3. **Implement Token Validation**: Setup JWT validation with JWKS in Spring Boot
4. **Frontend Auth Flow**: Configure Sidebase Auth with Auth0 provider
5. **User Provisioning**: Implement JIT user creation from Auth0 tokens
6. **Session Management**: Ensure proper login/logout and token refresh

## Key Documents

- **PRD**: [PRD_Auth0_Authentication.md](PRD_Auth0_Authentication.md) - Product requirements for authentication
- **Technical Spec**: [SPECS_Auth0_Integration.md](SPECS_Auth0_Integration.md) - Technical implementation details
- **Reference**: [Auth0 Architecture](/docs/40-specs/02-auth-security/auth0-integration-architecture.md)

## Scope

### In Scope ✅

**Backend (Spring Boot)**:
- Configure as OAuth2 Resource Server
- JWT validation using Auth0 JWKS endpoint
- Extract user information from JWT claims
- JIT user provisioning (create user on first login)
- Remove password fields and validation logic
- API endpoint protection with Bearer tokens

**Frontend (Nuxt/Sidebase)**:
- Configure Sidebase Auth with Auth0 provider
- Implement login redirect to Auth0 Universal Login
- Handle OAuth2 callback and token storage
- Automatic token refresh mechanism
- Logout flow (clear local and Auth0 sessions)
- Protected route middleware

**Auth0 Configuration**:
- Tenant setup and application configuration
- Configure allowed callbacks and logout URLs
- Setup Post-Login Action for custom claims (tenant_id only)
- Configure refresh token rotation
- Setup development and production environments

### Out of Scope ❌

**Authorization Features** (deferred to M003):
- Role-based access control (RBAC)
- Permission checks in API endpoints
- Dynamic role management
- Resource-level authorization
- Admin role assignment
- Permission UI components

**Advanced Features** (future milestones):
- Multi-factor authentication (MFA)
- Social login providers
- Single Sign-On (SSO)
- Password reset flows
- User profile management UI

## Definition of Done

### Required for Completion ✅

1. **Authentication Flow**
   - [ ] Users can click "Login" and be redirected to Auth0
   - [ ] After login, users return to the application authenticated
   - [ ] User information is displayed correctly (name, email)
   - [ ] Logout clears session and redirects appropriately

2. **Token Management**
   - [ ] JWT tokens are validated on every API request
   - [ ] Invalid/expired tokens return 401 Unauthorized
   - [ ] Tokens refresh automatically before expiration
   - [ ] Refresh tokens rotate for security

3. **User Provisioning**
   - [ ] New Auth0 users are created in database on first login
   - [ ] Existing users are matched by email
   - [ ] User profile syncs from Auth0 (name, email, picture)
   - [ ] Tenant association is maintained

4. **Code Cleanup**
   - [ ] All password-related code removed from backend
   - [ ] Custom JWT generation removed
   - [ ] Legacy auth endpoints disabled
   - [ ] Database migration removes password columns

5. **Testing**
   - [ ] Unit tests for JWT validation logic
   - [ ] Integration tests for auth flow
   - [ ] Manual testing in development environment
   - [ ] Staging environment validation

6. **Documentation**
   - [ ] Setup guide for Auth0 tenant configuration
   - [ ] Environment variables documented
   - [ ] API authentication changes documented
   - [ ] Developer onboarding guide updated

### Success Metrics

- **Zero Password Storage**: No passwords in database
- **Auth Success Rate**: >99% successful authentications
- **Token Validation Speed**: <50ms average
- **User Experience**: Login to dashboard in <3 seconds
- **Zero Auth Bypasses**: All endpoints properly protected

## Technical Approach

### Backend Implementation

```kotlin
// Spring Security Configuration
@Configuration
@EnableWebSecurity
class SecurityConfig {
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .authorizeHttpRequests { auth ->
                auth.requestMatchers("/api/public/**").permitAll()
                auth.anyRequest().authenticated()
            }
            .oauth2ResourceServer { oauth2 ->
                oauth2.jwt { jwt ->
                    jwt.decoder(jwtDecoder())
                    jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())
                }
            }
            .build()
    }
}
```

### Frontend Implementation

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  auth: {
    baseURL: process.env.AUTH_ORIGIN,
    provider: {
      type: 'oauth',
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER,
      authorization: {
        params: {
          scope: 'openid profile email offline_access',
          audience: process.env.AUTH0_AUDIENCE
        }
      }
    }
  }
})
```

### Auth0 Configuration

```javascript
// Post-Login Action (minimal for authentication only)
exports.onExecutePostLogin = async (event, api) => {
  // Only set tenant_id for now, no roles
  const tenantId = event.user.app_metadata.tenant_id || 
                   deriveTenantFromEmail(event.user.email);
  
  api.idToken.setCustomClaim('tenant_id', tenantId);
  api.accessToken.setCustomClaim('tenant_id', tenantId);
};
```

## Dependencies

### External
- Auth0 tenant (dev and prod)
- Auth0 API configuration
- Environment variables setup

### Internal
- Database schema updates
- Frontend routing setup
- API endpoint updates

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Auth0 service outage | High | Low | Implement graceful degradation with clear error messages |
| Token validation performance | Medium | Medium | Implement JWKS caching with 5-minute TTL |
| User migration issues | High | Low | Maintain email as unique identifier |
| Session persistence issues | Medium | Medium | Implement proper refresh token handling |

## Timeline Estimate

**Total Duration**: 3 weeks

- **Week 1**: Backend implementation and Auth0 setup
- **Week 2**: Frontend integration and token management
- **Week 3**: Testing, documentation, and deployment

## Related Milestones

- **Predecessor**: M001_Auth0_Integration (general planning)
- **Successor**: M003_Authorization_Implementation (RBAC and permissions)

## Notes and Context

This milestone intentionally limits scope to authentication only. The separation allows for:
1. Faster initial deployment of Auth0
2. Reduced complexity in testing
3. Clear separation of authentication vs authorization concerns
4. Ability to validate Auth0 integration before adding complex authorization

The existing authorization code can continue to work with default permissions until M003 implements the full RBAC system.

## References

- [Auth0 Documentation](https://auth0.com/docs)
- [Sidebase Auth Guide](https://auth.sidebase.io/)
- [Spring Security OAuth2](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [Project Auth Specs](/docs/40-specs/02-auth-security/)

---
*Milestone created: 2025-01-18*  
*Framework: Simone v1.0.0*