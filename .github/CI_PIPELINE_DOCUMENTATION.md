# CI/CD Pipeline Documentation

This document provides comprehensive documentation for the Astar Management CI/CD pipelines, troubleshooting guides, and maintenance procedures.

## Overview

The Astar Management project uses GitHub Actions for Continuous Integration (CI) and Continuous Deployment (CD) with separate pipelines for backend (Spring Boot/Kotlin) and frontend (Nuxt.js/Vue 3) components.

## Pipeline Architecture

### Backend CI Pipeline (`backend-ci.yml`)

**Trigger**: Changes to `backend/**` or workflow file
**Duration**: ~15-20 minutes
**Services**: PostgreSQL 15, Redis 7

#### Jobs Overview

1. **backend-tests** (15 min)
   - Spring Boot application testing
   - JaCoCo coverage reporting (90% requirement)
   - Integration tests with Testcontainers

2. **code-quality** (8 min)
   - Checkstyle code style verification
   - SpotBugs static analysis
   - Kotlin coding standards

3. **security-scan** (12 min)
   - OWASP dependency vulnerability scanning
   - CVE database checks
   - Security report generation

4. **build-verification** (5 min)
   - Gradle build without tests
   - JAR artifact creation
   - Build artifact upload

### Frontend CI Pipeline (`frontend-ci.yml`)

**Trigger**: Changes to `frontend/**` or workflow file
**Duration**: ~8-12 minutes
**Package Manager**: Bun 1.2.16

#### Jobs Overview

1. **lint-and-typecheck** (5 min)
   - ESLint code quality checks
   - TypeScript type validation
   - Vue SFC lint verification

2. **unit-tests** (7 min)
   - Vitest unit test execution
   - Coverage reporting with Codecov
   - Test result artifact upload

3. **build-verification** (6 min)
   - Nuxt.js production build
   - Build artifact validation
   - Asset optimization verification

4. **security-audit** (3 min)
   - npm/bun security audit
   - License compliance checking
   - Dependency vulnerability scan

## Existing Specialized Workflows

### Comprehensive E2E Testing (`nuxt-e2e.yml`)
- Multi-browser testing (Chromium, Firefox, WebKit, Mobile)
- Visual regression testing with baseline management
- Comprehensive test reporting and artifact management

### Performance Testing (`performance-tests.yml`)
- Load testing scenarios
- Performance metric collection
- Baseline comparison and reporting

### Storybook Testing (`nuxt-storybook.yml`)
- Component documentation validation
- Visual component testing
- Storybook build verification

## Quality Gates

### Coverage Requirements
- **Backend**: 90% line coverage (JaCoCo)
- **Frontend**: 80% coverage threshold (configurable)
- **Integration**: End-to-end test coverage for critical paths

### Security Standards
- **OWASP**: No HIGH/CRITICAL vulnerabilities allowed
- **Dependency Scanning**: Regular CVE database updates
- **License Compliance**: Approved licenses only

### Code Quality Standards
- **Backend**: Checkstyle compliance, SpotBugs clean
- **Frontend**: ESLint zero warnings, TypeScript strict mode
- **Documentation**: All public APIs documented

## Environment Configuration

### Required Secrets
```yaml
# Backend
DATABASE_URL: "postgresql://localhost:5432/Astarmanagement_test"
DATABASE_USERNAME: "postgres"
DATABASE_PASSWORD: "testpassword"
REDIS_HOST: "localhost"
REDIS_PORT: "6379"

# Security Scanning
CODECOV_TOKEN: "your-codecov-token" # Optional but recommended

# Frontend
NODE_ENV: "production"
CI: "true"
```

### Environment Variables
```yaml
# Backend CI
JAVA_VERSION: "21"
POSTGRES_VERSION: "15"
REDIS_VERSION: "7"
SPRING_PROFILES_ACTIVE: "test"

# Frontend CI
NODE_VERSION: "20"
BUN_VERSION: "1.2.16"
```

## Performance Optimization

### Caching Strategy

#### Backend Caching
```yaml
# Gradle dependencies and wrapper
~/.gradle/caches
~/.gradle/wrapper
backend/.gradle/

# Cache key includes all Gradle files
key: ${{ runner.os }}-gradle-${{ hashFiles('backend/**/*.gradle*') }}
```

#### Frontend Caching
```yaml
# Bun dependencies and cache
frontend/node_modules
~/.bun/install/cache

# Cache key includes lockfile
key: ${{ runner.os }}-bun-${{ hashFiles('frontend/bun.lock') }}
```

### Parallel Execution
- Backend and frontend pipelines run independently
- Multiple jobs within each pipeline run in parallel
- Change detection prevents unnecessary runs

## Troubleshooting Guide

### Common Backend Issues

#### 1. Test Failures
```bash
# Local reproduction
cd backend
./gradlew clean test --info --stacktrace

# Check logs
./gradlew test --debug
```

**Common causes**:
- Database connection issues
- Missing test data setup
- Flaky integration tests
- Port conflicts in CI

#### 2. Coverage Failures
```bash
# Generate coverage report locally
./gradlew jacocoTestReport
open build/reports/jacoco/test/html/index.html

# Check coverage requirements
./gradlew jacocoTestCoverageVerification
```

**Solutions**:
- Add tests for uncovered methods
- Review coverage exclusions in `build.gradle.kts`
- Check if new code lacks test coverage

#### 3. Security Scan Issues
```bash
# Run OWASP check locally
./gradlew dependencyCheckAnalyze
open build/reports/dependency-check-report.html
```

**Solutions**:
- Update vulnerable dependencies
- Add suppressions for false positives
- Review and update suppression file

### Common Frontend Issues

#### 1. Build Failures
```bash
# Local reproduction
cd frontend
bun install --frozen-lockfile
bun run build
```

**Common causes**:
- TypeScript compilation errors
- Missing dependencies
- Environment variable issues
- Asset optimization failures

#### 2. Test Failures
```bash
# Run tests locally
bun run test:run --reporter=verbose

# Run specific test
bun run test:run --reporter=verbose -- matter.test.ts
```

**Solutions**:
- Update test snapshots if needed
- Check component mounting issues
- Verify mock data setup
- Review async test handling

#### 3. Lint/TypeScript Errors
```bash
# Fix linting issues
bun run lint:fix

# Check TypeScript errors
bun run typecheck
```

**Solutions**:
- Fix ESLint rule violations
- Add missing type definitions
- Update component prop types
- Check import/export statements

### Pipeline-Specific Issues

#### 1. Workflow Not Triggering
**Check**:
- Path filters in workflow triggers
- Branch name patterns
- File change detection

**Solution**:
```yaml
# Ensure paths are correct
paths:
  - 'backend/**'
  - '!backend/node_modules/**'
```

#### 2. Service Connection Issues
**PostgreSQL/Redis connection failures**:
- Check service health commands
- Verify port mappings
- Review service startup timing

**Solution**:
```yaml
# Add explicit health checks
- name: Wait for services
  run: |
    pg_isready -h localhost -p 5432 -U postgres
    redis-cli -h localhost -p 6379 ping
```

#### 3. Artifact Upload Failures
**Check**:
- File paths exist
- Permissions on directories
- Artifact size limits

**Solution**:
```yaml
# Ensure paths exist before upload
- name: Create directories
  run: mkdir -p build/reports

- name: Upload artifacts
  if: always()  # Upload even on failure
```

## Maintenance Procedures

### Regular Updates (Monthly)

#### 1. Dependency Updates
```bash
# Backend
cd backend
./gradlew dependencyUpdates

# Frontend
cd frontend
bun update
```

#### 2. Security Scanning
```bash
# Update OWASP database
./gradlew dependencyCheckUpdate

# Review and update suppressions
vim config/owasp/suppressions.xml
```

#### 3. Tool Version Updates
```yaml
# Update in workflow files
JAVA_VERSION: "21"      # Check for LTS updates
BUN_VERSION: "1.2.16"   # Check latest stable
NODE_VERSION: "20"      # Check LTS updates
```

### Performance Monitoring

#### 1. Pipeline Duration Tracking
Monitor average pipeline durations:
- Backend CI: Target < 20 minutes
- Frontend CI: Target < 12 minutes
- Total CI time: Target < 25 minutes

#### 2. Cache Hit Rates
Check cache effectiveness:
- Gradle cache should have >80% hit rate
- Bun cache should have >90% hit rate

#### 3. Resource Usage
Monitor runner resource consumption:
- Memory usage during tests
- Disk space for artifacts
- Network bandwidth for dependencies

### Configuration Updates

#### 1. Adding New Quality Checks
```yaml
# Add to backend-ci.yml
- name: New quality check
  run: ./gradlew newQualityTask

# Update branch protection rules
# Add new status check requirement
```

#### 2. Environment Changes
```yaml
# Update service versions
postgres: 15 → 16
redis: 7 → 8

# Test compatibility
# Update documentation
```

## Performance Benchmarks

### Target Metrics
- **Backend Tests**: < 15 minutes
- **Frontend Tests**: < 7 minutes
- **Build Times**: < 5 minutes each
- **Security Scans**: < 10 minutes
- **Cache Hit Rate**: > 80%

### Optimization Strategies
1. **Parallel Test Execution**: Utilize test parallelization
2. **Selective Testing**: Run only tests affected by changes
3. **Smart Caching**: Cache dependencies and build artifacts
4. **Resource Scaling**: Use appropriate runner sizes

## Integration with Deployment

### CD Pipeline Prerequisites
All CI checks must pass before deployment:
- ✅ All tests passing
- ✅ Coverage requirements met
- ✅ Security scans clean
- ✅ Build successful
- ✅ Branch protection rules satisfied

### Deployment Triggers
```yaml
# Triggered after successful CI
on:
  workflow_run:
    workflows: ["Backend CI", "Frontend CI"]
    types:
      - completed
    branches: [main]
```

## Monitoring and Alerting

### GitHub Actions Insights
- Monitor workflow success rates
- Track pipeline duration trends
- Review resource usage patterns

### Notification Channels
- Slack integration for critical failures
- Email notifications for security issues
- PR comments for coverage reports

## Documentation Maintenance

This documentation should be updated when:
- New workflows are added
- Quality requirements change
- Tool versions are updated
- New troubleshooting scenarios arise

Last updated: 2025-07-04
Next review: 2025-08-04