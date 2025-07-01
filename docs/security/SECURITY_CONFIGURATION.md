# Security Configuration Guide

## Overview

This document provides comprehensive security configuration guidance for the Aster Management system. It covers authentication, authorization, rate limiting, audit logging, and security monitoring.

## Table of Contents

1. [Authentication Configuration](#authentication-configuration)
2. [Rate Limiting Configuration](#rate-limiting-configuration)
3. [Audit Logging Configuration](#audit-logging-configuration)
4. [Security Headers Configuration](#security-headers-configuration)
5. [Account Lockout Configuration](#account-lockout-configuration)
6. [Security Monitoring Configuration](#security-monitoring-configuration)
7. [Penetration Testing Setup](#penetration-testing-setup)
8. [Security Best Practices](#security-best-practices)
9. [Incident Response Procedures](#incident-response-procedures)
10. [Compliance Requirements](#compliance-requirements)

## Authentication Configuration

### JWT Configuration

```yaml
# application.yml
security:
  jwt:
    secret: ${JWT_SECRET:your-secret-key-here}
    expiration: PT30M  # 30 minutes
    refresh-expiration: P7D  # 7 days
    issuer: aster-management
    audience: aster-management-users
    
  two-factor:
    enabled: true
    window-size: 3  # Allow 3 time windows
    code-digits: 6
    time-step-seconds: 30
    issuer: "Aster Management"
```

### Spring Security Configuration

```kotlin
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig {
    
    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder(12)  // Strong bcrypt rounds
    }
    
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http.sessionManagement { 
            it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) 
        }
        return http.build()
    }
}
```

### Environment Variables

```bash
# Required environment variables
JWT_SECRET=your-256-bit-secret-key-here
DATABASE_URL=postgresql://localhost:5432/astermanagement
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=your-aes-256-encryption-key
```

## Rate Limiting Configuration

### Basic Rate Limiting

```yaml
security:
  rate-limit:
    enabled: true
    default:
      requests: 100
      window: PT1H  # 1 hour
    auth:
      requests: 5
      window: PT15M  # 15 minutes
    api:
      requests: 1000
      window: PT1H  # 1 hour
```

### Advanced Rate Limiting

```yaml
security:
  rate-limit:
    strategies:
      - path: "/api/auth/**"
        requests: 5
        window: PT15M
        key-type: IP_AND_USER
      - path: "/api/admin/**"
        requests: 10
        window: PT1H
        key-type: USER_ONLY
      - path: "/api/public/**"
        requests: 100
        window: PT1H
        key-type: IP_ONLY
```

### Redis Configuration for Rate Limiting

```yaml
spring:
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    database: 1  # Use database 1 for rate limiting
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
```

## Audit Logging Configuration

### Database Configuration

```sql
-- Audit events table (immutable for legal compliance)
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id VARCHAR(50),
    username VARCHAR(100),
    session_id VARCHAR(50),
    ip_address INET NOT NULL,
    user_agent TEXT,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    action VARCHAR(50),
    risk_level VARCHAR(20) NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    message TEXT,
    details JSONB,
    outcome VARCHAR(500),
    correlation_id VARCHAR(100),
    legal_jurisdiction VARCHAR(10) NOT NULL DEFAULT 'JP',
    retention_until TIMESTAMP WITH TIME ZONE NOT NULL,
    immutable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_ip_address ON audit_events(ip_address);
CREATE INDEX idx_audit_risk_level ON audit_events(risk_level);
```

### Audit Configuration

```yaml
security:
  audit:
    enabled: true
    async: true
    retention-years: 10  # Japanese legal requirement
    encrypt-sensitive: true
    sign-records: true
    database: audit  # Separate audit database
    
  events:
    authentication: true
    authorization: true
    data-access: true
    configuration-changes: true
    suspicious-activity: true
    system-events: true
```

## Security Headers Configuration

### Content Security Policy

```yaml
security:
  headers:
    content-security-policy: |
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com data:;
      img-src 'self' data: https: blob:;
      connect-src 'self' https://api.astermanagement.com;
      frame-ancestors 'none';
      upgrade-insecure-requests;
      
    hsts-max-age: 31536000  # 1 year
    hsts-include-subdomains: true
    frame-options: DENY
    
    permissions-policy: |
      accelerometer=(),
      camera=(),
      geolocation=(),
      microphone=(),
      payment=(),
      usb=()
```

### CORS Configuration

```yaml
security:
  cors:
    allowed-origins:
      - https://app.astermanagement.com
      - https://admin.astermanagement.com
      - http://localhost:3000  # Development only
    allowed-methods:
      - GET
      - POST
      - PUT
      - PATCH
      - DELETE
      - OPTIONS
    allowed-headers:
      - Authorization
      - Content-Type
      - X-Requested-With
      - X-CSRF-Token
    max-age: 1800  # 30 minutes
```

## Account Lockout Configuration

### Basic Lockout Settings

```yaml
security:
  lockout:
    max-failed-attempts: 5
    duration: PT30M  # 30 minutes
    failed-attempt-window: PT15M  # 15 minutes
    enable-progressive: true
    enable-ip-blocking: true
    
    ip-blocking:
      max-failed-attempts: 20
      duration: PT1H  # 1 hour
      
    progressive-durations:
      first: PT15M   # 15 minutes
      second: PT30M  # 30 minutes
      third: PT1H    # 1 hour
      fourth: PT4H   # 4 hours
      extended: P1D  # 24 hours
```

### Notification Configuration

```yaml
security:
  notifications:
    lockout:
      enabled: true
      notify-user: true
      notify-admin: true
      email-template: account-locked
      
    suspicious-activity:
      enabled: true
      threshold: 70  # Risk score threshold
      notify-admin: true
      email-template: suspicious-activity
```

## Security Monitoring Configuration

### Monitoring Thresholds

```yaml
security:
  monitoring:
    enabled: true
    real-time-alerts: true
    
    thresholds:
      failed-logins-per-minute: 10
      suspicious-activity-score: 70
      concurrent-sessions-per-user: 5
      api-errors-per-minute: 50
      
    anomaly-detection:
      enabled: true
      sensitivity: 0.8
      min-data-points: 100
      
    threat-intelligence:
      enabled: true
      update-interval: PT1H
      providers:
        - name: internal
          enabled: true
```

### Alert Configuration

```yaml
security:
  alerts:
    channels:
      - type: email
        enabled: true
        recipients:
          - security@astermanagement.com
          - admin@astermanagement.com
      - type: slack
        enabled: true
        webhook: ${SLACK_WEBHOOK_URL}
      - type: pagerduty
        enabled: false
        api-key: ${PAGERDUTY_API_KEY}
        
    severity-routing:
      critical: [email, slack, pagerduty]
      high: [email, slack]
      medium: [email]
      low: [email]
```

## Penetration Testing Setup

### OWASP ZAP Configuration

```yaml
# docker-compose.yml for ZAP
version: '3.8'
services:
  zap:
    image: owasp/zap2docker-stable
    ports:
      - "8080:8080"
    command: zap-webswing.sh
    environment:
      - ZAP_PORT=8080
    volumes:
      - ./zap-data:/zap/wrk/
```

### Test Execution

```bash
# Run security tests
./gradlew test --tests "*Security*" -Dsecurity.tests.enabled=true

# Run OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://host.docker.internal:8080 \
  -r zap-report.html
```

### Automated Security Testing

```yaml
# GitHub Actions workflow
name: Security Tests
on: [push, pull_request]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Security Tests
        run: |
          ./gradlew test --tests "*Penetration*"
          ./gradlew test --tests "*Security*"
      
      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:8080'
```

## Security Best Practices

### Password Policy

```yaml
security:
  password:
    min-length: 12
    require-uppercase: true
    require-lowercase: true
    require-numbers: true
    require-special-chars: true
    max-age-days: 90
    history-count: 12  # Prevent reuse of last 12 passwords
    
  session:
    timeout: PT30M  # 30 minutes
    max-concurrent: 3
    secure-cookies: true
    same-site: strict
```

### Data Encryption

```yaml
security:
  encryption:
    algorithm: AES-256-GCM
    key-rotation-days: 90
    encrypt-at-rest: true
    encrypt-in-transit: true
    
  database:
    encrypt-sensitive-fields: true
    encrypted-fields:
      - user.password
      - user.two_factor_secret
      - audit_event.details
```

### API Security

```yaml
security:
  api:
    versioning: true
    deprecation-notice: P30D  # 30 days
    input-validation: strict
    output-encoding: true
    
  oauth2:
    authorization-server: internal
    resource-server: true
    introspection-endpoint: /oauth2/introspect
```

## Incident Response Procedures

### 1. Detection and Analysis

```bash
# Check for security incidents
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.astermanagement.com/security/alerts?severity=critical"

# Review audit logs
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.astermanagement.com/audit/events?risk=high&hours=24"
```

### 2. Containment

```bash
# Block suspicious IP
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"ip":"192.168.1.100","duration":"PT1H","reason":"suspicious_activity"}' \
  "https://api.astermanagement.com/security/block-ip"

# Lock compromised account
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"user@example.com","reason":"potential_compromise"}' \
  "https://api.astermanagement.com/security/lock-account"
```

### 3. Investigation

```sql
-- Query audit logs for investigation
SELECT 
    event_type,
    timestamp,
    user_id,
    ip_address,
    message,
    details
FROM audit_events 
WHERE 
    timestamp >= NOW() - INTERVAL '24 hours'
    AND risk_level IN ('HIGH', 'CRITICAL')
ORDER BY timestamp DESC;
```

### 4. Recovery and Post-Incident

```bash
# Generate incident report
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.astermanagement.com/security/incident-report?id=INC-2025-001"

# Update security configurations
kubectl apply -f security-config-updated.yaml
```

## Compliance Requirements

### GDPR Compliance

```yaml
compliance:
  gdpr:
    enabled: true
    data-retention:
      user-data: P7Y      # 7 years
      audit-logs: P10Y    # 10 years (Japanese requirement)
      session-data: P30D  # 30 days
    
    rights:
      data-export: true
      data-deletion: true
      data-rectification: true
      data-portability: true
      
    consent:
      required: true
      granular: true
      withdrawable: true
```

### Japanese Legal Requirements

```yaml
compliance:
  japanese-law:
    audit-retention: P10Y  # 10 years minimum
    data-localization: true
    timezone: Asia/Tokyo
    language-support: [ja, en]
    
  financial-regulations:
    enabled: true
    audit-trail: immutable
    digital-signatures: true
    timestamp-authority: true
```

### Security Frameworks

```yaml
compliance:
  frameworks:
    iso-27001:
      enabled: true
      assessment-interval: P1Y
      
    nist:
      enabled: true
      framework-version: "1.1"
      
    owasp:
      enabled: true
      top-10-coverage: true
      testing-interval: P3M  # Quarterly
```

## Configuration Validation

### Security Configuration Test

```bash
#!/bin/bash
# security-config-test.sh

echo "Testing security configuration..."

# Test JWT configuration
curl -f http://localhost:8080/actuator/health/jwt || echo "JWT health check failed"

# Test rate limiting
for i in {1..10}; do
  curl -f http://localhost:8080/api/auth/login || echo "Rate limit test $i"
done

# Test security headers
curl -I http://localhost:8080/ | grep -i "x-frame-options\|x-content-type-options\|strict-transport-security"

echo "Security configuration test completed"
```

### Monitoring Health Checks

```yaml
management:
  health:
    security:
      enabled: true
    rate-limiting:
      enabled: true
    audit-logging:
      enabled: true
      
  endpoints:
    web:
      exposure:
        include: health,metrics,security
      base-path: /actuator
```

## Troubleshooting

### Common Issues

1. **Rate Limiting Not Working**
   ```bash
   # Check Redis connection
   redis-cli ping
   
   # Check rate limit keys
   redis-cli keys "rate_limit:*"
   ```

2. **Audit Logs Not Being Created**
   ```sql
   -- Check audit event table
   SELECT COUNT(*) FROM audit_events WHERE timestamp > NOW() - INTERVAL '1 hour';
   
   -- Check table permissions
   \dp audit_events
   ```

3. **Security Headers Missing**
   ```bash
   # Test security headers
   curl -I https://api.astermanagement.com/ | grep -i security
   
   # Check Spring Security configuration
   kubectl logs deployment/aster-management | grep -i security
   ```

### Performance Tuning

```yaml
security:
  performance:
    audit:
      batch-size: 100
      async-pool-size: 10
      
    rate-limiting:
      cache-ttl: PT5M
      cleanup-interval: PT1H
      
    monitoring:
      sample-rate: 0.1  # 10% sampling
      aggregation-window: PT1M
```

This comprehensive security configuration guide provides all necessary settings and procedures for maintaining a secure Aster Management system.