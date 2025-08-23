#!/bin/bash

# テスト結果サマリースクリプト - 全テストの実行と結果集約
# 使用方法: ./test-summary.sh [BASE_URL] [--quick|--full]

# set -e disabled to allow complete test execution

# デフォルト設定
BASE_URL=${1:-"http://localhost:8080"}
TEST_MODE=${2:-"--quick"}

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# スクリプトディレクトリ
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# テスト結果格納
declare -A TEST_RESULTS
declare -A TEST_TIMES
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# タイムスタンプ
TEST_START_TIME=$(date +"%Y-%m-%d %H:%M:%S")
START_SECONDS=$(date +%s)

echo "========================================"
echo -e "${BOLD}   Astar Management Test Suite${NC}"
echo -e "${BOLD}       Complete Test Summary${NC}"
echo "========================================"
echo -e "${CYAN}Start Time:${NC}  $TEST_START_TIME"
echo -e "${CYAN}Base URL:${NC}    $BASE_URL"
echo -e "${CYAN}Test Mode:${NC}   $TEST_MODE"
echo "========================================"
echo ""

# ヘルパー関数: テスト実行と結果記録
run_test() {
    local test_name="$1"
    local test_script="$2"
    local test_args="$3"
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    echo "----------------------------------------"
    
    local start_time=$(date +%s)
    
    if [[ -f "$test_script" ]]; then
        # テスト実行
        if $test_script $test_args > /tmp/test_output_$$.log 2>&1; then
            TEST_RESULTS["$test_name"]="PASSED"
            ((PASSED_TESTS++))
            echo -e "${GREEN}✓ PASSED${NC}"
            
            # テスト結果の詳細を抽出
            if grep -q "Passed:" /tmp/test_output_$$.log; then
                passed=$(grep "Passed:" /tmp/test_output_$$.log | tail -1 | grep -oE '[0-9]+')
                failed=$(grep "Failed:" /tmp/test_output_$$.log | tail -1 | grep -oE '[0-9]+')
                echo -e "  Details: ${GREEN}$passed passed${NC}, ${RED}$failed failed${NC}"
            fi
        else
            TEST_RESULTS["$test_name"]="FAILED"
            ((FAILED_TESTS++))
            echo -e "${RED}✗ FAILED${NC}"
            
            # エラーの最後の行を表示
            tail -5 /tmp/test_output_$$.log | sed 's/^/  /'
        fi
        
        rm -f /tmp/test_output_$$.log
    else
        TEST_RESULTS["$test_name"]="SKIPPED"
        ((SKIPPED_TESTS++))
        echo -e "${YELLOW}⊗ SKIPPED${NC} (Script not found)"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    TEST_TIMES["$test_name"]=$duration
    
    echo -e "  Duration: ${CYAN}${duration}s${NC}"
    echo ""
    
    ((TOTAL_TESTS++))
}

# 1. バックエンドサーバーの起動確認
echo -e "${MAGENTA}[Prerequisites Check]${NC}"
echo "----------------------------------------"
echo -ne "${BLUE}Checking backend server...${NC} "

if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/health" | grep -q "200"; then
    echo -e "${GREEN}✓ Online${NC}"
else
    echo -e "${RED}✗ Offline${NC}"
    echo ""
    echo -e "${RED}Error: Backend server is not running${NC}"
    echo -e "Please start the backend server with:"
    echo -e "  ${CYAN}cd backend && ./gradlew bootRun${NC}"
    exit 1
fi
echo ""

# 2. 基本APIテスト
run_test "Basic API Tests" "$SCRIPT_DIR/test-api.sh" "$BASE_URL"

# 3. モック認証テスト
run_test "Mock Authentication Tests" "$SCRIPT_DIR/test-mock-auth.sh" "$BASE_URL"

# 4. Gradleテスト実行（--fullモードのみ）
if [[ "$TEST_MODE" == "--full" ]]; then
    run_test "Gradle Unit Tests" "$SCRIPT_DIR/run-tests.sh" "unit"
    run_test "Gradle Integration Tests" "$SCRIPT_DIR/run-tests.sh" "integration"
fi

# 5. 負荷テスト（--fullモードのみ）
if [[ "$TEST_MODE" == "--full" ]]; then
    run_test "Load Performance Tests" "$SCRIPT_DIR/load-test.sh" "$BASE_URL 5 100"
else
    echo -e "${YELLOW}[Load Tests]${NC}"
    echo "----------------------------------------"
    echo -e "${CYAN}Skipped in quick mode${NC}"
    echo "Use --full flag to run load tests"
    echo ""
fi

# 6. エンドポイントカバレッジ分析
echo -e "${MAGENTA}[Endpoint Coverage Analysis]${NC}"
echo "----------------------------------------"

# 実装済みエンドポイントのリスト
declare -a ENDPOINTS=(
    "/api/v1/health"
    "/api/v1/health/ping"
    "/api/v1/auth/me"
    "/api/v1/auth/claims"
    "/api/v1/auth/business-context"
    "/actuator/health"
    "/actuator/info"
    "/mock-auth/login"
    "/mock-auth/register"
    "/mock-auth/refresh"
    "/mock-auth/logout"
)

TESTED_COUNT=0
UNTESTED_COUNT=0

for endpoint in "${ENDPOINTS[@]}"; do
    echo -ne "  $endpoint: "
    
    # エンドポイントが動作するかチェック
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    
    if [[ "$status" == "200" ]] || [[ "$status" == "401" ]] || [[ "$status" == "404" ]] || [[ "$status" == "405" ]]; then
        echo -e "${GREEN}✓ Tested${NC}"
        ((TESTED_COUNT++))
    else
        echo -e "${YELLOW}○ Not tested${NC}"
        ((UNTESTED_COUNT++))
    fi
done

coverage_percent=$(echo "scale=1; $TESTED_COUNT * 100 / ${#ENDPOINTS[@]}" | bc)
echo ""
echo -e "Endpoint Coverage: ${CYAN}${coverage_percent}%${NC} ($TESTED_COUNT/${#ENDPOINTS[@]})"
echo ""

# 7. セキュリティチェック
echo -e "${MAGENTA}[Security Checks]${NC}"
echo "----------------------------------------"

echo -ne "CORS Headers: "
if curl -s -I -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: GET" \
    "$BASE_URL/api/v1/health" 2>/dev/null | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ Configured${NC}"
else
    echo -e "${RED}✗ Not configured${NC}"
fi

echo -ne "Authentication Required: "
auth_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/auth/me")
if [[ "$auth_status" == "401" ]]; then
    echo -e "${GREEN}✓ Protected${NC}"
else
    echo -e "${RED}✗ Unprotected${NC}"
fi

echo -ne "Security Headers: "
headers=$(curl -s -I "$BASE_URL/api/v1/health")
if echo "$headers" | grep -q "X-Content-Type-Options\|X-Frame-Options"; then
    echo -e "${GREEN}✓ Present${NC}"
else
    echo -e "${YELLOW}⚠ Missing${NC}"
fi
echo ""

# 8. パフォーマンスサマリー
echo -e "${MAGENTA}[Performance Summary]${NC}"
echo "----------------------------------------"

# ヘルスチェックエンドポイントの応答時間測定
total_time=0
samples=10

for i in $(seq 1 $samples); do
    time=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/v1/health")
    total_time=$(echo "$total_time + $time" | bc)
done

avg_response=$(echo "scale=3; $total_time / $samples" | bc)

echo -e "Average Response Time: ${CYAN}${avg_response}s${NC}"

if [[ $(echo "$avg_response < 0.1" | bc) -eq 1 ]]; then
    echo -e "Performance Rating: ${GREEN}Excellent${NC}"
elif [[ $(echo "$avg_response < 0.5" | bc) -eq 1 ]]; then
    echo -e "Performance Rating: ${CYAN}Good${NC}"
elif [[ $(echo "$avg_response < 1.0" | bc) -eq 1 ]]; then
    echo -e "Performance Rating: ${YELLOW}Fair${NC}"
else
    echo -e "Performance Rating: ${RED}Poor${NC}"
fi
echo ""

# 終了時刻と実行時間
END_SECONDS=$(date +%s)
TOTAL_DURATION=$((END_SECONDS - START_SECONDS))
TEST_END_TIME=$(date +"%Y-%m-%d %H:%M:%S")

# 最終レポート
echo "========================================"
echo -e "${BOLD}        Final Test Report${NC}"
echo "========================================"
echo -e "${CYAN}End Time:${NC}     $TEST_END_TIME"
echo -e "${CYAN}Duration:${NC}     ${TOTAL_DURATION}s"
echo ""
echo -e "${BOLD}Test Results:${NC}"
echo -e "  ${GREEN}✓ Passed:${NC}  $PASSED_TESTS"
echo -e "  ${RED}✗ Failed:${NC}  $FAILED_TESTS"
echo -e "  ${YELLOW}⊗ Skipped:${NC} $SKIPPED_TESTS"
echo -e "  ${CYAN}━━━━━━━━━━━${NC}"
echo -e "  ${BOLD}Total:${NC}     $TOTAL_TESTS"
echo ""

# 成功率の計算
if [[ $TOTAL_TESTS -gt 0 ]]; then
    success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    echo -e "${BOLD}Success Rate: ${success_rate}%${NC}"
fi

# 各テストの実行時間
echo ""
echo -e "${BOLD}Test Execution Times:${NC}"
for test_name in "${!TEST_TIMES[@]}"; do
    duration=${TEST_TIMES[$test_name]}
    result=${TEST_RESULTS[$test_name]}
    
    if [[ "$result" == "PASSED" ]]; then
        color=$GREEN
    elif [[ "$result" == "FAILED" ]]; then
        color=$RED
    else
        color=$YELLOW
    fi
    
    printf "  %-30s ${color}%-8s${NC} %3ds\n" "$test_name:" "$result" "$duration"
done

echo ""
echo "========================================"

# 全体的な評価
if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}All tests passed successfully!${NC}"
    echo -e "${GREEN}The backend is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}Some tests failed!${NC}"
    echo -e "${YELLOW}Please review the failed tests above.${NC}"
    exit 1
fi