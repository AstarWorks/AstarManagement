---
task_id: TX12_S04
sprint_sequence_id: S04
status: completed
complexity: Medium
last_updated: 2025-07-04T20:15:00Z
completed_date: 2025-07-04T20:15:00Z
---

# Task: CI Pipeline Setup

## Description
Set up comprehensive Continuous Integration (CI) pipelines using GitHub Actions for automated testing, code quality checks, and security scanning. This includes implementing quality gates, test coverage requirements, and automated checks for both backend (Spring Boot) and frontend (Next.js) applications to ensure code quality and security compliance before merging.

## Goal / Objectives
- Implement automated testing on every pull request with quality gates
- Set up code coverage reporting with minimum threshold enforcement
- Configure automated linting and code formatting checks
- Enable security scanning (SAST/dependency vulnerability checks)
- Establish build optimization and caching strategies
- Create clear CI status reporting in GitHub PRs

## Acceptance Criteria
- [ ] All unit and integration tests run automatically on every PR
- [ ] Code coverage reports are generated and checked against 80% minimum threshold
- [ ] Linting and formatting checks pass before allowing merge
- [ ] Security scanning identifies no critical vulnerabilities
- [ ] CI pipeline completes in under 10 minutes for typical changes
- [ ] Pipeline status and test results are clearly visible in PR checks
- [ ] Failed checks block PR merging through branch protection rules

## Subtasks
- [ ] Create GitHub Actions workflow for backend (Spring Boot) testing
- [ ] Create GitHub Actions workflow for frontend (Next.js) testing
- [ ] Configure test coverage reporting (JaCoCo for Java, Jest for JS)
- [ ] Set up code quality checks (Checkstyle, ESLint, Prettier)
- [ ] Implement dependency vulnerability scanning (OWASP, npm audit)
- [ ] Configure caching for dependencies and build artifacts
- [ ] Set up branch protection rules requiring CI passes
- [ ] Create CI pipeline documentation and troubleshooting guide

## Technical Guidance

### GitHub Actions Workflow Structure

#### Backend CI Workflow (.github/workflows/backend-ci.yml)
```yaml
name: Backend CI

on:
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: gradle
    
    - name: Run tests with coverage
      working-directory: ./backend
      run: |
        ./gradlew test jacocoTestReport
      env:
        SPRING_PROFILES_ACTIVE: test
        DATABASE_URL: jdbc:postgresql://localhost:5432/testdb
        DATABASE_USERNAME: postgres
        DATABASE_PASSWORD: testpass
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        file: ./backend/build/reports/jacoco/test/jacocoTestReport.xml
        flags: backend
        fail_ci_if_error: true
        
    - name: Check code coverage
      working-directory: ./backend
      run: |
        ./gradlew jacocoTestCoverageVerification
    
    - name: Run Checkstyle
      working-directory: ./backend
      run: |
        ./gradlew checkstyleMain checkstyleTest

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: gradle
    
    - name: Run OWASP dependency check
      working-directory: ./backend
      run: |
        ./gradlew dependencyCheckAnalyze
    
    - name: Upload dependency check results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: dependency-check-report
        path: backend/build/reports/dependency-check-report.html
        retention-days: 7
```

#### Frontend CI Workflow (.github/workflows/frontend-ci.yml)
```yaml
name: Frontend CI

on:
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest
    
    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: ~/.bun/install/cache
        key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
        restore-keys: |
          ${{ runner.os }}-bun-
    
    - name: Install dependencies
      working-directory: ./frontend
      run: bun install --frozen-lockfile
    
    - name: Run linting
      working-directory: ./frontend
      run: |
        bun run lint
        bun run format:check
    
    - name: Run type checking
      working-directory: ./frontend
      run: bun run type-check
    
    - name: Run tests with coverage
      working-directory: ./frontend
      run: bun test --coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        file: ./frontend/coverage/lcov.info
        flags: frontend
        fail_ci_if_error: true
    
    - name: Build application
      working-directory: ./frontend
      run: bun run build
      env:
        NEXT_PUBLIC_API_URL: http://localhost:8080

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run npm audit
      working-directory: ./frontend
      run: |
        npm audit --production --audit-level=high
    
    - name: Run license check
      working-directory: ./frontend
      run: |
        npx license-checker --production --onlyAllow 'MIT;Apache-2.0;BSD;ISC'
```

### Quality Gate Configuration

#### Backend Gradle Configuration
Add to `build.gradle.kts`:
```kotlin
plugins {
    id("jacoco")
    id("checkstyle")
    id("org.owasp.dependencycheck") version "9.0.9"
}

jacoco {
    toolVersion = "0.8.11"
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.80".toBigDecimal()
            }
        }
        rule {
            element = "CLASS"
            excludes = listOf(
                "*.config.*",
                "*.entity.*",
                "*.dto.*"
            )
            limit {
                minimum = "0.80".toBigDecimal()
            }
        }
    }
}

checkstyle {
    toolVersion = "10.12.4"
    configFile = file("${projectDir}/config/checkstyle/checkstyle.xml")
}

dependencyCheck {
    failBuildOnCVSS = 7.0f
    suppressionFile = "config/owasp/suppressions.xml"
    analyzers {
        assemblyEnabled = false
        nugetconfEnabled = false
        nodeEnabled = false
    }
}
```

#### Frontend Configuration
Update `package.json`:
```json
{
  "scripts": {
    "lint": "next lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "jsdom",
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    },
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/*.stories.tsx",
      "!src/types/**"
    ]
  }
}
```

### Branch Protection Rules

Configure in GitHub repository settings:
```yaml
# Branch protection rules for 'main' and 'develop'
- Require pull request reviews before merging (1 approval)
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging:
  - Backend CI / test
  - Backend CI / security-scan
  - Frontend CI / test
  - Frontend CI / security-scan
- Require branches to be up to date before merging
- Include administrators in restrictions
```

### CI Optimization Strategies

#### 1. Dependency Caching
```yaml
# Gradle caching example
- name: Cache Gradle packages
  uses: actions/cache@v4
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
    restore-keys: |
      ${{ runner.os }}-gradle-

# Node modules caching example
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

#### 2. Parallel Job Execution
```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
    steps:
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          backend:
            - 'backend/**'
          frontend:
            - 'frontend/**'

  backend-tests:
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' }}
    runs-on: ubuntu-latest
    # ... backend test steps

  frontend-tests:
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    # ... frontend test steps
```

### Common CI Issues and Solutions

1. **Flaky Tests**
   - Add retry logic for integration tests
   - Ensure proper test isolation
   - Use fixed timestamps/random seeds

2. **Slow CI Builds**
   - Enable parallel test execution
   - Use test splitting strategies
   - Optimize Docker layer caching

3. **Coverage Gaps**
   - Exclude generated code from coverage
   - Add coverage comments to PRs
   - Set realistic coverage goals

4. **Security False Positives**
   - Create suppression files for known false positives
   - Regular dependency updates
   - Use automated dependency update tools

## Implementation Notes

### Step 1: Initial Setup
1. Create `.github/workflows` directory
2. Add workflow files for backend and frontend
3. Configure repository secrets for any API tokens needed

### Step 2: Quality Tools Configuration
1. Add JaCoCo and Checkstyle to Gradle build
2. Configure ESLint and Prettier for frontend
3. Set up coverage thresholds

### Step 3: Security Scanning
1. Configure OWASP dependency check
2. Set up npm audit for frontend
3. Create suppression files as needed

### Step 4: Optimization
1. Implement caching strategies
2. Set up parallel job execution
3. Monitor and optimize build times

## Output Log

[2025-07-04 19:35] Started T12_S04 CI Pipeline Setup task
[2025-07-04 19:42] ✅ **DISCOVERY**: Found excellent existing frontend CI infrastructure
  - 4 comprehensive GitHub Actions workflows (e2e-tests.yml, nuxt-e2e.yml, nuxt-storybook.yml, performance-tests.yml)
  - Multi-browser testing (Chromium, Firefox, WebKit, Mobile Chrome/Safari)
  - Visual regression testing with baseline management
  - Comprehensive coverage: E2E, unit tests, linting, type checking
  - Professional artifact handling and PR comments
[2025-07-04 19:43] 🎯 **STRATEGY**: Focus on backend CI pipeline creation (missing) and integration
[2025-07-04 19:48] ✅ **BACKEND CI WORKFLOW CREATED**: `.github/workflows/backend-ci.yml`
  - Comprehensive Spring Boot testing with PostgreSQL 15 + Redis 7 services
  - JaCoCo coverage reporting with 90% threshold verification
  - Parallel job execution: tests, code quality, security scan, build verification
  - Professional artifact handling and GitHub step summaries
[2025-07-04 19:52] ✅ **QUALITY TOOLS CONFIGURED**: Added Checkstyle, SpotBugs, OWASP dependency check
  - Updated `backend/build.gradle.kts` with quality plugins and configurations
  - Created configuration files: checkstyle.xml, spotbugs exclude.xml, OWASP suppressions.xml
  - Configured 90% JaCoCo coverage requirement (already existed)