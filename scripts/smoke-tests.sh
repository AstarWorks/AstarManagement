#!/usr/bin/env bash
set -euo pipefail

# Aster Management - Staging Smoke Tests
# This script verifies that the staging deployment is working correctly

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly API_URL="${API_URL:-https://api-staging.astermanagement.com}"
readonly FRONTEND_URL="${FRONTEND_URL:-https://staging.astermanagement.com}"
readonly TIMEOUT="${TIMEOUT:-30}"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

test_passed() {
    ((TESTS_PASSED++))
    log_success "✓ $1"
}

test_failed() {
    ((TESTS_FAILED++))
    log_error "✗ $1"
}

# Test functions
test_backend_health() {
    log_info "Testing backend health endpoint..."
    
    if curl -f --max-time "$TIMEOUT" "${API_URL}/actuator/health" > /dev/null 2>&1; then
        test_passed "Backend health check"
    else
        test_failed "Backend health check - endpoint not responding"
        return 1
    fi
}

test_backend_readiness() {
    log_info "Testing backend readiness endpoint..."
    
    if curl -f --max-time "$TIMEOUT" "${API_URL}/actuator/health/readiness" > /dev/null 2>&1; then
        test_passed "Backend readiness check"
    else
        test_failed "Backend readiness check - not ready"
        return 1
    fi
}

test_backend_metrics() {
    log_info "Testing backend metrics endpoint..."
    
    if curl -f --max-time "$TIMEOUT" "${API_URL}/actuator/metrics" > /dev/null 2>&1; then
        test_passed "Backend metrics endpoint"
    else
        test_failed "Backend metrics endpoint - not accessible"
        return 1
    fi
}

test_api_cors() {
    log_info "Testing API CORS configuration..."
    
    local cors_headers
    cors_headers=$(curl -s -H "Origin: ${FRONTEND_URL}" \
                       -H "Access-Control-Request-Method: GET" \
                       -H "Access-Control-Request-Headers: Authorization,Content-Type" \
                       -X OPTIONS \
                       --max-time "$TIMEOUT" \
                       "${API_URL}/api/matters" \
                       -I | grep -i "access-control" | wc -l)
    
    if [ "$cors_headers" -gt 0 ]; then
        test_passed "API CORS configuration"
    else
        test_failed "API CORS configuration - headers missing"
        return 1
    fi
}

test_authentication_endpoint() {
    log_info "Testing authentication endpoint..."
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" \
                        --max-time "$TIMEOUT" \
                        -X POST \
                        -H "Content-Type: application/json" \
                        -d '{"username":"test@example.com","password":"wrongpassword"}' \
                        "${API_URL}/api/auth/login")
    
    # Expecting 401 for invalid credentials (means endpoint is working)
    if [ "$response_code" = "401" ] || [ "$response_code" = "400" ]; then
        test_passed "Authentication endpoint responds correctly"
    else
        test_failed "Authentication endpoint - unexpected response code: $response_code"
        return 1
    fi
}

test_matters_api_protection() {
    log_info "Testing matters API protection..."
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" \
                        --max-time "$TIMEOUT" \
                        "${API_URL}/api/matters")
    
    # Expecting 401 for unauthenticated request
    if [ "$response_code" = "401" ]; then
        test_passed "Matters API properly protected"
    else
        test_failed "Matters API protection - expected 401, got: $response_code"
        return 1
    fi
}

test_frontend_accessibility() {
    log_info "Testing frontend accessibility..."
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" \
                        --max-time "$TIMEOUT" \
                        "${FRONTEND_URL}")
    
    if [ "$response_code" = "200" ]; then
        test_passed "Frontend is accessible"
    else
        test_failed "Frontend accessibility - response code: $response_code"
        return 1
    fi
}

test_frontend_content() {
    log_info "Testing frontend content..."
    
    local content
    content=$(curl -s --max-time "$TIMEOUT" "${FRONTEND_URL}" | grep -i "aster.*management" | wc -l)
    
    if [ "$content" -gt 0 ]; then
        test_passed "Frontend contains expected content"
    else
        test_failed "Frontend content - 'Aster Management' not found"
        return 1
    fi
}

test_ssl_certificates() {
    log_info "Testing SSL certificates..."
    
    # Extract hostname from URL
    local api_host
    api_host=$(echo "$API_URL" | sed 's|https\?://||' | cut -d'/' -f1)
    local frontend_host
    frontend_host=$(echo "$FRONTEND_URL" | sed 's|https\?://||' | cut -d'/' -f1)
    
    # Test API SSL
    if echo | openssl s_client -connect "$api_host:443" -servername "$api_host" 2>/dev/null | \
       openssl x509 -noout -dates 2>/dev/null | grep -q "After"; then
        test_passed "API SSL certificate valid"
    else
        test_failed "API SSL certificate invalid or missing"
    fi
    
    # Test frontend SSL
    if echo | openssl s_client -connect "$frontend_host:443" -servername "$frontend_host" 2>/dev/null | \
       openssl x509 -noout -dates 2>/dev/null | grep -q "After"; then
        test_passed "Frontend SSL certificate valid"
    else
        test_failed "Frontend SSL certificate invalid or missing"
    fi
}

test_performance_baseline() {
    log_info "Running basic performance test..."
    
    # Test API response time
    local api_response_time
    api_response_time=$(curl -o /dev/null -s -w "%{time_total}" \
                           --max-time "$TIMEOUT" \
                           "${API_URL}/actuator/health")
    
    # Convert to milliseconds and compare to SLA (500ms)
    local api_ms
    api_ms=$(echo "$api_response_time * 1000" | bc -l | cut -d'.' -f1)
    
    if [ "$api_ms" -lt 500 ]; then
        test_passed "API response time within SLA (${api_ms}ms < 500ms)"
    else
        test_failed "API response time exceeds SLA (${api_ms}ms >= 500ms)"
    fi
    
    # Test frontend response time
    local frontend_response_time
    frontend_response_time=$(curl -o /dev/null -s -w "%{time_total}" \
                                --max-time "$TIMEOUT" \
                                "${FRONTEND_URL}")
    
    # Convert to milliseconds and compare to SLA (3000ms)
    local frontend_ms
    frontend_ms=$(echo "$frontend_response_time * 1000" | bc -l | cut -d'.' -f1)
    
    if [ "$frontend_ms" -lt 3000 ]; then
        test_passed "Frontend response time within SLA (${frontend_ms}ms < 3000ms)"
    else
        test_failed "Frontend response time exceeds SLA (${frontend_ms}ms >= 3000ms)"
    fi
}

test_database_connectivity() {
    log_info "Testing database connectivity (via API health check)..."
    
    local health_response
    health_response=$(curl -s --max-time "$TIMEOUT" "${API_URL}/actuator/health")
    
    if echo "$health_response" | grep -q '"status":"UP"'; then
        test_passed "Database connectivity (health check reports UP)"
    else
        test_failed "Database connectivity issues detected"
        log_error "Health response: $health_response"
    fi
}

run_all_tests() {
    log_info "Starting smoke tests for Aster Management staging environment"
    log_info "API URL: $API_URL"
    log_info "Frontend URL: $FRONTEND_URL"
    echo
    
    # Backend tests
    test_backend_health || true
    test_backend_readiness || true
    test_backend_metrics || true
    test_database_connectivity || true
    test_api_cors || true
    test_authentication_endpoint || true
    test_matters_api_protection || true
    
    # Frontend tests
    test_frontend_accessibility || true
    test_frontend_content || true
    
    # Security tests
    test_ssl_certificates || true
    
    # Performance tests
    test_performance_baseline || true
    
    echo
    log_info "=== Test Results Summary ==="
    log_success "Tests passed: $TESTS_PASSED"
    if [ $TESTS_FAILED -gt 0 ]; then
        log_error "Tests failed: $TESTS_FAILED"
        return 1
    else
        log_success "All tests passed!"
        return 0
    fi
}

# Check prerequisites
check_prerequisites() {
    local missing_tools=()
    
    command -v curl >/dev/null 2>&1 || missing_tools+=("curl")
    command -v openssl >/dev/null 2>&1 || missing_tools+=("openssl")
    command -v bc >/dev/null 2>&1 || missing_tools+=("bc")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install the missing tools and try again"
        exit 1
    fi
}

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --api-url)
                API_URL="$2"
                shift 2
                ;;
            --frontend-url)
                FRONTEND_URL="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo
                echo "Options:"
                echo "  --api-url URL       API base URL (default: https://api-staging.astermanagement.com)"
                echo "  --frontend-url URL  Frontend URL (default: https://staging.astermanagement.com)"
                echo "  --timeout SECONDS   Request timeout in seconds (default: 30)"
                echo "  --help              Show this help message"
                echo
                echo "Environment variables:"
                echo "  API_URL             API base URL"
                echo "  FRONTEND_URL        Frontend URL"
                echo "  TIMEOUT             Request timeout"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    check_prerequisites
    run_all_tests
}

# Run main function
main "$@"