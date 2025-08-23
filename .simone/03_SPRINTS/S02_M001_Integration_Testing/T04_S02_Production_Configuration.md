---
task_id: T04_S02
title: Production Environment Setup
sprint: S02_M001
complexity: Medium
status: planned
created: 2025-01-23
---

## Task Overview

Configure a secure production environment for the Astar Management platform with proper Auth0 integration, environment variable management, secure cookie configuration, and HTTPS/TLS setup. This task ensures the application is properly configured for production deployment with enterprise-grade security.

## Objectives

- Configure Auth0 production tenant with proper security settings
- Set up comprehensive environment variable management
- Configure secure cookie flags and session handling
- Enable HTTPS/TLS with proper security headers
- Validate production configuration integrity

## Acceptance Criteria

- [ ] Auth0 production tenant configured with correct URLs and security settings
- [ ] All environment variables documented and securely managed
- [ ] Secure cookie flags enabled (httpOnly, secure, sameSite)
- [ ] HTTPS enforced across all communication channels
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Configuration validated through integration tests
- [ ] Environment-specific configuration files created
- [ ] Production deployment checklist completed

## Subtasks

### 1. Auth0 Production Tenant Configuration
- [ ] Create Auth0 production tenant
- [ ] Configure production application settings
- [ ] Set up proper callback and logout URLs
- [ ] Configure CORS settings for production domain
- [ ] Enable security features (MFA, anomaly detection)
- [ ] Set up custom domain (auth.astar-management.com)

### 2. Backend Environment Configuration
- [ ] Create production profile in application.yml
- [ ] Configure secure database connections
- [ ] Set up production Auth0 integration settings
- [ ] Configure cache settings for production
- [ ] Set up proper logging configuration
- [ ] Configure health check endpoints

### 3. Frontend Environment Configuration
- [ ] Configure production runtime config in nuxt.config.ts
- [ ] Set up secure cookie configuration
- [ ] Configure Auth0 settings for production
- [ ] Set up proper CSP headers
- [ ] Configure production API endpoints
- [ ] Set up error handling for production

### 4. Security Headers and HTTPS Setup
- [ ] Configure HTTPS enforcement
- [ ] Set up HSTS headers
- [ ] Configure Content Security Policy
- [ ] Set up X-Frame-Options and other security headers
- [ ] Configure secure session management
- [ ] Set up SSL/TLS certificate management

### 5. Environment Variable Management
- [ ] Document all required environment variables
- [ ] Create environment-specific .env templates
- [ ] Set up secure environment variable storage
- [ ] Configure environment variable validation
- [ ] Create deployment environment setup scripts

## Technical Guidance

### Configuration File Locations

**Backend Configuration:**
- `/backend/src/main/resources/application.yml` - Main configuration with profiles
- Production profile: `spring.config.activate.on-profile: production`
- Environment variables: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`

**Frontend Configuration:**
- `/frontend/nuxt.config.ts` - Main Nuxt configuration
- Runtime config for environment-specific settings
- Auth configuration through `@sidebase/nuxt-auth`
- Environment variables: `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER`, `NUXT_AUTH_SECRET`

### Environment Variable Naming Conventions

**Backend (Spring Boot):**
```yaml
# Database Configuration
DB_URL: jdbc:postgresql://prod-db:5432/astar_management_prod
DB_USERNAME: ${DATABASE_USER}
DB_PASSWORD: ${DATABASE_PASSWORD}

# Auth0 Configuration
AUTH0_DOMAIN: auth.astar-management.com
AUTH0_AUDIENCE: https://api.astar-management.com

# Security Configuration
JWT_SECRET: ${JWT_SECRET_KEY}
ENCRYPTION_KEY: ${ENCRYPTION_SECRET}
```

**Frontend (Nuxt.js):**
```bash
# Auth Configuration
NUXT_AUTH_SECRET=32-character-random-production-string
AUTH0_CLIENT_ID=production-client-id
AUTH0_CLIENT_SECRET=production-client-secret
AUTH0_ISSUER=https://auth.astar-management.com/
AUTH0_AUDIENCE=https://api.astar-management.com

# Application Configuration
NUXT_PUBLIC_API_BASE_URL=https://api.astar-management.com/api/v1
NUXT_PUBLIC_APP_ENV=production
```

### Security Best Practices

**Cookie Security Configuration:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  auth: {
    provider: {
      type: 'authjs',
      trustHost: true, // Only for production with proper domain
      addDefaultCallbackUrl: true
    },
    globalAppMiddleware: true
  },
  runtimeConfig: {
    authSecret: process.env.NUXT_AUTH_SECRET, // 32+ character secret
    public: {
      authUrl: process.env.NUXT_AUTH_ORIGIN || 'https://app.astar-management.com'
    }
  },
  // Security headers
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        }
      }
    }
  }
})
```

**Spring Boot Security Configuration:**
```yaml
# application.yml - production profile
spring:
  config:
    activate:
      on-profile: production
  
  security:
    require-ssl: true
    headers:
      frame-options: DENY
      content-type-options: nosniff
      xss-protection: 1; mode=block
      hsts: max-age=31536000; includeSubDomains
    
server:
  port: 8443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
  servlet:
    session:
      cookie:
        secure: true
        http-only: true
        same-site: strict
```

### Deployment Checklist

**Pre-deployment:**
- [ ] All environment variables set and validated
- [ ] SSL certificates configured and valid
- [ ] Auth0 production tenant configured
- [ ] Database migrations applied
- [ ] Security headers tested
- [ ] Cookie configuration validated
- [ ] CORS settings verified

**Post-deployment:**
- [ ] Health checks passing
- [ ] Auth0 integration working
- [ ] HTTPS redirects functioning
- [ ] Security headers present
- [ ] Session management working
- [ ] API endpoints protected
- [ ] Monitoring and logging active

## Implementation Notes

### Production Setup Approach

1. **Environment Separation**: Use distinct configurations for development, staging, and production
2. **Secret Management**: Use secure secret management solutions (Azure Key Vault, AWS Secrets Manager, etc.)
3. **Certificate Management**: Implement automated SSL certificate renewal
4. **Database Security**: Use connection pooling with SSL and proper access controls
5. **Monitoring**: Set up comprehensive monitoring and alerting
6. **Backup Strategy**: Implement automated backup and recovery procedures

### Auth0 Production Configuration

```javascript
// server/api/auth/[...].ts - Production configuration
export default NuxtAuthHandler({
  secret: useRuntimeConfig().authSecret,
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.AUTH0_ISSUER!,
      authorization: {
        params: {
          audience: process.env.AUTH0_AUDIENCE,
          prompt: 'login', // Force login for production
          max_age: 3600 // 1 hour session timeout
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 1 * 60 * 60, // 1 hour
    updateAge: 15 * 60   // 15 minutes
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.audience = process.env.AUTH0_AUDIENCE
      }
      return token
    }
  },
  pages: {
    signIn: '/signin',
    error: '/auth/error'
  },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: true,
        domain: '.astar-management.com'
      }
    }
  }
})
```

### Database Configuration

```yaml
# Production database configuration
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 20000
      idle-timeout: 300000
      max-lifetime: 1200000
      leak-detection-threshold: 60000
      connection-test-query: SELECT 1
  
  jpa:
    hibernate:
      ddl-auto: validate # Never create/update in production
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
        generate_statistics: false
```

## Dependencies

- Auth0 production account with custom domain
- SSL/TLS certificates from trusted CA
- Production infrastructure (servers, load balancers, databases)
- Secret management system
- Monitoring and logging infrastructure
- Backup and recovery systems

## Configuration Checklist

### Auth0 Tenant Settings
- [ ] Production tenant created and configured
- [ ] Custom domain configured (auth.astar-management.com)
- [ ] Application settings configured with production URLs
- [ ] Security features enabled (MFA, anomaly detection)
- [ ] API permissions properly configured
- [ ] CORS settings configured for production domain

### Backend Environment Variables
- [ ] `AUTH0_DOMAIN` set to production domain
- [ ] `AUTH0_AUDIENCE` set to production API identifier
- [ ] `DB_URL` configured for production database
- [ ] `DB_USERNAME` and `DB_PASSWORD` securely configured
- [ ] `JWT_SECRET` set with strong random value
- [ ] `SPRING_PROFILES_ACTIVE` set to `production`

### Frontend Environment Variables
- [ ] `NUXT_AUTH_SECRET` set with 32+ character random string
- [ ] `AUTH0_CLIENT_ID` configured for production SPA
- [ ] `AUTH0_CLIENT_SECRET` configured for production
- [ ] `AUTH0_ISSUER` set to production Auth0 URL
- [ ] `NUXT_PUBLIC_API_BASE_URL` set to production API URL
- [ ] `NUXT_PUBLIC_APP_ENV` set to `production`

### Security Headers
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] HSTS header configured with appropriate max-age
- [ ] Content Security Policy configured
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] Secure cookie flags enabled (httpOnly, secure, sameSite)

### Infrastructure Configuration
- [ ] Load balancer configured with SSL termination
- [ ] Database configured with SSL/TLS connections
- [ ] Redis configured with authentication and SSL
- [ ] MinIO configured with HTTPS and proper access policies
- [ ] Backup systems configured and tested
- [ ] Monitoring and alerting configured

## Validation Steps

1. **Security Scan**: Run security scanning tools against production configuration
2. **SSL Test**: Validate SSL certificate and configuration using SSL Labs
3. **Auth Flow Test**: Complete end-to-end authentication flow testing
4. **API Security Test**: Verify all API endpoints are properly protected
5. **Performance Test**: Validate production performance under load
6. **Disaster Recovery Test**: Test backup and recovery procedures

## Related Tasks

- T01_S02_Complete_Auth0_Integration: Auth0 setup prerequisite
- T02_S02_Integration_Testing: Testing framework for validation
- T03_S02_Error_Handling: Error handling in production environment
- T05_S02_Performance_Testing: Performance validation in production environment

## Risk Assessment

**High Risk:**
- Incorrect Auth0 configuration leading to authentication failures
- Missing or incorrect environment variables causing deployment failures
- Insecure cookie configuration compromising session security

**Medium Risk:**
- SSL certificate expiration causing service interruption
- Database connection pool exhaustion under high load
- Missing security headers exposing application to attacks

**Mitigation Strategies:**
- Comprehensive testing in staging environment identical to production
- Automated configuration validation scripts
- Monitoring and alerting for all critical components
- Regular security audits and penetration testing