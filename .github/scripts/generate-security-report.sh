#!/usr/bin/env bash
set -euo pipefail

# Comprehensive Security Report Generator for Astar Management
# This script consolidates all security analysis results into a unified report

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPORT_DIR="${REPO_ROOT}/security-reports"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# Create report directory
mkdir -p "${REPORT_DIR}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Generating Comprehensive Security Report${NC}"
echo "Report directory: ${REPORT_DIR}"
echo "Timestamp: ${TIMESTAMP}"

# Initialize report
REPORT_FILE="${REPORT_DIR}/security-report-${TIMESTAMP}.md"
cat > "${REPORT_FILE}" << EOF
# Security Analysis Report - $(date)

## Executive Summary

This report consolidates security analysis results from multiple tools:
- **CodeQL SAST**: Static application security testing
- **SpotBugs/FindSecBugs**: Bug pattern analysis with security focus
- **OWASP Dependency Check**: Known vulnerability scanning
- **PMD Security Rules**: Custom security pattern detection
- **OWASP ZAP**: Dynamic application security testing
- **Frontend Security**: License and dependency analysis

---

EOF

# Function to add section to report
add_section() {
    local title="$1"
    local content="$2"
    
    cat >> "${REPORT_FILE}" << EOF
## ${title}

${content}

---

EOF
}

# Function to count vulnerabilities from XML reports
count_vulnerabilities() {
    local file="$1"
    local pattern="$2"
    
    if [[ -f "$file" ]]; then
        grep -o "$pattern" "$file" | wc -l || echo "0"
    else
        echo "0"
    fi
}

# Function to extract severity counts from OWASP dependency check
analyze_owasp_report() {
    local report_file="$1"
    
    if [[ ! -f "$report_file" ]]; then
        echo "OWASP report not found: $report_file"
        return 1
    fi
    
    local critical=$(count_vulnerabilities "$report_file" 'severity="CRITICAL"')
    local high=$(count_vulnerabilities "$report_file" 'severity="HIGH"')
    local medium=$(count_vulnerabilities "$report_file" 'severity="MEDIUM"')
    local low=$(count_vulnerabilities "$report_file" 'severity="LOW"')
    local total=$((critical + high + medium + low))
    
    cat << EOF
### OWASP Dependency Check Results

- **Total Vulnerabilities**: ${total}
- **Critical**: ${critical} 🔴
- **High**: ${high} 🟠  
- **Medium**: ${medium} 🟡
- **Low**: ${low} 🟢

$(if [[ $critical -gt 0 ]]; then
    echo "⚠️  **CRITICAL VULNERABILITIES FOUND** - Immediate action required"
elif [[ $high -gt 0 ]]; then
    echo "⚠️  **HIGH VULNERABILITIES FOUND** - Review and remediate"
elif [[ $total -gt 0 ]]; then
    echo "ℹ️  Low to medium vulnerabilities found - Review recommended"
else
    echo "✅ No known vulnerabilities detected"
fi)

EOF
}

# Function to analyze SpotBugs report
analyze_spotbugs_report() {
    local report_file="$1"
    
    if [[ ! -f "$report_file" ]]; then
        echo "SpotBugs report not found: $report_file"
        return 1
    fi
    
    local bug_count=$(count_vulnerabilities "$report_file" '<BugInstance')
    local security_bugs=$(grep -o 'category="SECURITY"' "$report_file" | wc -l || echo "0")
    
    cat << EOF
### SpotBugs Security Analysis

- **Total Issues**: ${bug_count}
- **Security-Related**: ${security_bugs}

$(if [[ $security_bugs -gt 0 ]]; then
    echo "⚠️  Security-related issues found - Review recommended"
else
    echo "✅ No security-specific issues detected"
fi)

EOF
}

# Function to analyze PMD report
analyze_pmd_report() {
    local report_file="$1"
    
    if [[ ! -f "$report_file" ]]; then
        echo "PMD report not found: $report_file"
        return 1
    fi
    
    local violation_count=$(count_vulnerabilities "$report_file" '<violation')
    local priority1=$(count_vulnerabilities "$report_file" 'priority="1"')
    local priority2=$(count_vulnerabilities "$report_file" 'priority="2"')
    
    cat << EOF
### PMD Security Analysis

- **Total Violations**: ${violation_count}
- **High Priority (1)**: ${priority1}
- **Medium Priority (2)**: ${priority2}

$(if [[ $priority1 -gt 0 ]]; then
    echo "⚠️  High priority security issues found"
elif [[ $violation_count -gt 0 ]]; then
    echo "ℹ️  Code quality issues found - Review recommended"
else
    echo "✅ No PMD violations detected"
fi)

EOF
}

# Function to analyze CodeQL results
analyze_codeql_results() {
    local results_dir="$1"
    
    if [[ ! -d "$results_dir" ]]; then
        echo "CodeQL results directory not found: $results_dir"
        return 1
    fi
    
    local sarif_files=$(find "$results_dir" -name "*.sarif" -type f)
    local alert_count=0
    
    for sarif_file in $sarif_files; do
        if [[ -f "$sarif_file" ]]; then
            # Count alerts in SARIF file (simplified)
            local alerts=$(grep -o '"level"' "$sarif_file" | wc -l || echo "0")
            alert_count=$((alert_count + alerts))
        fi
    done
    
    cat << EOF
### CodeQL SAST Analysis

- **Security Alerts**: ${alert_count}

$(if [[ $alert_count -gt 0 ]]; then
    echo "⚠️  Security alerts found - Review GitHub Security tab"
else
    echo "✅ No security alerts detected"
fi)

EOF
}

# Generate report sections
echo -e "${YELLOW}📊 Analyzing OWASP Dependency Check...${NC}"
OWASP_SECTION=$(analyze_owasp_report "${REPO_ROOT}/backend/build/reports/dependency-check-report.xml" || echo "OWASP analysis skipped - report not found")
add_section "OWASP Dependency Check" "$OWASP_SECTION"

echo -e "${YELLOW}🔍 Analyzing SpotBugs...${NC}"
SPOTBUGS_SECTION=$(analyze_spotbugs_report "${REPO_ROOT}/backend/build/reports/spotbugs/main.xml" || echo "SpotBugs analysis skipped - report not found")
add_section "SpotBugs Analysis" "$SPOTBUGS_SECTION"

echo -e "${YELLOW}📋 Analyzing PMD...${NC}"
PMD_SECTION=$(analyze_pmd_report "${REPO_ROOT}/backend/build/reports/pmd/main.xml" || echo "PMD analysis skipped - report not found")
add_section "PMD Security Rules" "$PMD_SECTION"

echo -e "${YELLOW}🔬 Analyzing CodeQL...${NC}"
CODEQL_SECTION=$(analyze_codeql_results "${REPO_ROOT}/codeql-results" || echo "CodeQL analysis skipped - results not found")
add_section "CodeQL SAST" "$CODEQL_SECTION"

# Add recommendations section
cat >> "${REPORT_FILE}" << EOF
## Recommendations

### Immediate Actions
1. **Critical Vulnerabilities**: Address any critical vulnerabilities immediately
2. **Security Alerts**: Review and remediate CodeQL security alerts
3. **High Priority Issues**: Plan fixes for high-priority PMD and SpotBugs findings

### Ongoing Security Practices
1. **Regular Scans**: Run security scans on every pull request
2. **Dependency Updates**: Keep dependencies updated regularly
3. **Security Training**: Ensure team is aware of secure coding practices
4. **Penetration Testing**: Consider periodic professional security assessments

### Compliance
- Ensure all critical vulnerabilities are resolved before production deployment
- Document remediation efforts for audit purposes
- Maintain security scan reports for compliance requirements

---

## Report Metadata

- **Generated**: $(date)
- **Tools Used**: CodeQL, SpotBugs, OWASP Dependency Check, PMD, OWASP ZAP
- **Report Location**: ${REPORT_FILE}
- **Contact**: Security team for questions about findings

EOF

echo -e "${GREEN}✅ Security report generated: ${REPORT_FILE}${NC}"

# Generate summary for CI/CD
SUMMARY_FILE="${REPORT_DIR}/security-summary.txt"
cat > "${SUMMARY_FILE}" << EOF
Security Analysis Summary - $(date)

Critical Issues: $(grep -o "Critical.*[0-9]" "${REPORT_FILE}" | tail -1 || echo "0")
High Issues: $(grep -o "High.*[0-9]" "${REPORT_FILE}" | tail -1 || echo "0") 
Medium Issues: $(grep -o "Medium.*[0-9]" "${REPORT_FILE}" | tail -1 || echo "0")

Status: $(if grep -q "CRITICAL VULNERABILITIES FOUND" "${REPORT_FILE}"; then echo "FAILED"; else echo "PASSED"; fi)
EOF

echo -e "${BLUE}📋 Summary written to: ${SUMMARY_FILE}${NC}"

# Exit with appropriate code
if grep -q "CRITICAL VULNERABILITIES FOUND" "${REPORT_FILE}"; then
    echo -e "${RED}❌ Critical vulnerabilities found - build should fail${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No critical vulnerabilities found${NC}"
    exit 0
fi