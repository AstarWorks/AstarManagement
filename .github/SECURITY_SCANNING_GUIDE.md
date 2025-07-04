# Security Scanning Guide - Aster Management

This document provides comprehensive guidance on the security scanning infrastructure implemented for the Aster Management application.

## Overview

The security scanning system implements a multi-layered approach to application security, covering:

- **Static Application Security Testing (SAST)**: CodeQL, SpotBugs, PMD
- **Dependency Vulnerability Scanning**: OWASP Dependency Check
- **Dynamic Application Security Testing (DAST)**: OWASP ZAP
- **License Compliance**: Frontend dependency analysis
- **Container Security**: Planned for future implementation

## Security Scanning Workflows

### 1. Security Analysis Workflow (`.github/workflows/security-analysis.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests
- Weekly scheduled scans (Sundays 2 AM UTC)
- Manual dispatch

**Jobs:**
1. **CodeQL Analysis**: Advanced SAST scanning for Java and JavaScript
2. **Advanced SAST**: SpotBugs, PMD, and enhanced OWASP scanning
3. **Frontend Security**: License compliance and dependency auditing
4. **API Security Scan**: OWASP ZAP dynamic testing
5. **Security Summary**: Consolidated reporting

### 2. Integration with Existing CI Pipeline

The security analysis workflow integrates with the existing CI pipeline from T12_S04:
- **Change Detection**: Intelligent filtering to avoid unnecessary scans
- **Parallel Execution**: Security jobs run concurrently with CI jobs
- **Shared Infrastructure**: Uses same services (PostgreSQL, Redis)
- **Artifact Management**: Security reports uploaded with retention policies

## Security Tools Configuration

### CodeQL Configuration (`.github/codeql/codeql-config.yml`)

**Query Suites:**
- `security-extended`: Comprehensive security query set
- `security-and-quality`: Combined security and code quality
- `custom-security`: Project-specific security queries

**Language Support:**
- **Java**: Spring Boot security patterns, SQL injection detection
- **JavaScript**: Vue/Nuxt security patterns, Node.js vulnerabilities

**Path Filtering:**
- Includes: Source code directories (`src/main/`, `src/`, `components/`)
- Excludes: Test files, build artifacts, node_modules

### SpotBugs Security Enhancement

**Enhanced Configuration in `backend/build.gradle.kts`:**
```kotlin
spotbugs {
    ignoreFailures = false
    effort = com.github.spotbugs.snom.Effort.DEFAULT
    reportLevel = com.github.spotbugs.snom.Confidence.MEDIUM
    excludeFilter = file("${rootDir}/config/spotbugs/exclude.xml")
}
```

**Security Focus:**
- FindSecBugs plugin for security-specific bug patterns
- Spring Security configuration analysis
- Cryptographic usage validation
- Input validation checks

### PMD Security Rules (`backend/config/pmd/security-ruleset.xml`)

**Custom Security Rules:**
1. **SQL Injection Prevention**: Detects string concatenation in SQL queries
2. **Hardcoded Credentials**: Identifies potential hardcoded secrets
3. **Insecure Random Usage**: Flags non-cryptographic random usage
4. **Spring Security Config Issues**: Detects potential misconfigurations

**Rule Categories:**
- Core security rules from PMD security category
- Error-prone patterns with security implications
- Best practices affecting security
- Performance rules with security impact

### OWASP Dependency Check Enhancement

**Enhanced Configuration:**
```kotlin
dependencyCheck {
    failBuildOnCVSS = 7.0f  // Fail on HIGH/CRITICAL vulnerabilities
    suppressionFile = "${rootDir}/config/owasp/suppressions.xml"
    format = org.owasp.dependencycheck.reporting.ReportGenerator.Format.ALL
}
```

**Features:**
- NVD API integration for faster scans
- Comprehensive suppression file for false positives
- Multiple output formats (HTML, XML, JSON)
- Critical vulnerability threshold enforcement

### OWASP ZAP Dynamic Testing

**Scan Types:**
1. **Baseline Scan**: Passive security testing
2. **API Scan**: OpenAPI specification-based testing
3. **Full Scan**: Comprehensive active testing (manual/scheduled)

**Configuration:**
- Automatic application startup for testing
- Health check verification before scanning
- Configurable scan depth and timeout
- JSON and HTML report generation

## Security Report Generation

### Automated Report Script (`.github/scripts/generate-security-report.sh`)

**Features:**
- Consolidates all security tool outputs
- Vulnerability severity classification
- Executive summary generation
- Recommendations and next steps
- CI/CD integration with exit codes

**Report Sections:**
1. **Executive Summary**: High-level vulnerability counts
2. **Tool-Specific Analysis**: Detailed findings per tool
3. **Recommendations**: Immediate and ongoing actions
4. **Compliance**: Audit trail and documentation

### Report Artifacts

**Retention Policy:**
- Security reports: 30 days
- Critical findings: Extended retention
- Compliance reports: Archive permanently

**Access Control:**
- Reports available to authorized team members
- Critical findings trigger immediate notifications
- Historical trending available for analysis

## Security Thresholds and Quality Gates

### Critical Vulnerability Handling

**CVSS 7.0+ Threshold:**
- Blocks merge/deployment automatically
- Requires immediate remediation
- Security team notification
- Exception process for false positives

**High/Medium Vulnerabilities:**
- Tracked in security backlog
- Planned remediation within sprint cycle
- Risk assessment documentation
- Regular review and prioritization

### Build Integration

**Failure Conditions:**
- Critical vulnerabilities (CVSS ≥ 7.0)
- CodeQL security alerts
- High-priority PMD violations
- ZAP high-risk findings

**Success Criteria:**
- All security scans complete successfully
- No critical vulnerabilities detected
- Security reports generated and archived
- Compliance requirements satisfied

## Operational Procedures

### Weekly Security Review

**Scheduled Actions:**
- Review all medium/low vulnerabilities
- Update suppression files for false positives
- Dependency update planning
- Security trend analysis

### Incident Response

**Critical Vulnerability Discovery:**
1. Immediate build/deployment halt
2. Security team notification
3. Impact assessment
4. Remediation planning
5. Testing and verification
6. Documentation and lessons learned

### Tool Maintenance

**Regular Updates:**
- Security tool versions
- Vulnerability databases
- Query definitions
- Suppression files
- Configuration tuning

## Integration with Development Workflow

### Developer Experience

**Local Development:**
```bash
# Run security scans locally
cd backend
./gradlew dependencyCheckAnalyze spotbugsMain pmdMain

# Review reports
open build/reports/dependency-check-report.html
open build/reports/spotbugs/main.html
open build/reports/pmd/main.html
```

**Pre-commit Hooks:**
- Dependency vulnerability check
- Secret scanning
- Basic security linting

### CI/CD Integration

**Pull Request Process:**
1. Security scans run automatically
2. Results posted as PR comments
3. Blocking conditions enforced
4. Manual review for exceptions

**Deployment Gates:**
- All security checks must pass
- Critical vulnerabilities resolved
- Security sign-off required
- Compliance documentation complete

## Monitoring and Alerting

### Real-time Monitoring

**Alert Conditions:**
- New critical vulnerabilities
- Security scan failures
- Threshold breaches
- Tool configuration changes

**Notification Channels:**
- Slack security channel
- Email alerts for critical issues
- GitHub Security tab integration
- Dashboard updates

### Metrics and KPIs

**Security Metrics:**
- Vulnerability detection rate
- Time to remediation
- False positive ratio
- Coverage metrics

**Trending Analysis:**
- Vulnerability introduction rate
- Tool effectiveness
- Team security awareness
- Compliance status

## Troubleshooting

### Common Issues

**Scan Failures:**
- Network connectivity to vulnerability databases
- Service startup timing issues
- Memory/resource constraints
- Tool version compatibility

**False Positives:**
- Suppression file maintenance
- Tool configuration tuning
- Custom rule development
- Risk acceptance documentation

### Performance Optimization

**Scan Speed:**
- Parallel execution optimization
- Caching strategies
- Incremental analysis
- Resource allocation tuning

**Resource Usage:**
- Memory optimization
- Network bandwidth management
- Storage requirements
- Cost optimization

## Compliance and Auditing

### Audit Trail

**Documentation Requirements:**
- All security scans recorded
- Vulnerability remediation tracking
- Risk acceptance justification
- Tool configuration changes

### Compliance Standards

**Supported Frameworks:**
- OWASP Top 10
- NIST Cybersecurity Framework
- ISO 27001 requirements
- Industry-specific standards

## Future Enhancements

### Planned Improvements

**Short-term (Next Sprint):**
- Container security scanning
- Infrastructure as Code scanning
- Enhanced ZAP automation
- Custom rule development

**Medium-term (Next Quarter):**
- Machine learning-based analysis
- Advanced threat modeling
- Security champion program
- Automated remediation

**Long-term (Next Year):**
- Runtime security monitoring
- Advanced persistent threat detection
- Zero-trust architecture validation
- Continuous compliance monitoring

---

## Quick Reference

### Key Commands

```bash
# Run all security scans
./gradlew dependencyCheckAnalyze spotbugsMain pmdMain

# Generate security report
.github/scripts/generate-security-report.sh

# View latest reports
open build/reports/dependency-check-report.html
```

### Important Files

- **Security Workflow**: `.github/workflows/security-analysis.yml`
- **CodeQL Config**: `.github/codeql/codeql-config.yml`
- **PMD Rules**: `backend/config/pmd/security-ruleset.xml`
- **Report Script**: `.github/scripts/generate-security-report.sh`

### Contact Information

- **Security Team**: security@astermanagement.dev
- **On-call**: security-oncall@astermanagement.dev
- **Documentation**: This guide and GitHub Security tab

---

Last Updated: 2025-07-04
Next Review: 2025-08-04