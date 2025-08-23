#!/bin/bash

# 統合テスト実行スクリプト - Gradleテストとカバレッジレポート生成
# 使用方法: ./run-tests.sh [test-type]
# test-type: unit, integration, all (デフォルト: all)

set -e

# テストタイプ
TEST_TYPE=${1:-"all"}

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# プロジェクトルートディレクトリ
PROJECT_ROOT=$(cd "$(dirname "$0")/../.." && pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "========================================"
echo "   Astar Management Test Runner"
echo "   Test Type: $TEST_TYPE"
echo "========================================"
echo ""

# Gradleラッパーの存在確認
if [[ ! -f "$BACKEND_DIR/gradlew" ]]; then
    echo -e "${RED}Error: Gradle wrapper not found${NC}"
    echo "Please run this script from the backend directory"
    exit 1
fi

cd "$BACKEND_DIR"

# クリーンビルド
echo -e "${BLUE}[Step 1/5]${NC} Cleaning previous build..."
./gradlew clean > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Clean completed"
echo ""

# コンパイル
echo -e "${BLUE}[Step 2/5]${NC} Compiling source code..."
if ./gradlew compileKotlin compileTestKotlin > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Compilation successful"
else
    echo -e "${RED}✗${NC} Compilation failed"
    echo "Run './gradlew compileKotlin' for details"
    exit 1
fi
echo ""

# テスト実行
echo -e "${BLUE}[Step 3/5]${NC} Running tests..."
echo "----------------------------------------"

run_test_suite() {
    local test_name=$1
    local gradle_task=$2
    
    echo -ne "${CYAN}Running $test_name...${NC} "
    
    # テスト実行と結果取得
    if ./gradlew $gradle_task --no-daemon 2>&1 | tee test-output.log | grep -q "BUILD SUCCESSFUL"; then
        # テスト結果の詳細を抽出
        tests_run=$(grep -oE '[0-9]+ tests?' test-output.log | head -1 | grep -oE '[0-9]+' || echo "0")
        tests_passed=$(grep -oE '[0-9]+ passed' test-output.log | grep -oE '[0-9]+' || echo "0")
        tests_failed=$(grep -oE '[0-9]+ failed' test-output.log | grep -oE '[0-9]+' || echo "0")
        tests_skipped=$(grep -oE '[0-9]+ skipped' test-output.log | grep -oE '[0-9]+' || echo "0")
        
        if [[ "$tests_failed" == "0" ]]; then
            echo -e "${GREEN}✓ Passed${NC}"
            echo -e "  Tests: ${GREEN}$tests_passed passed${NC}, $tests_skipped skipped"
        else
            echo -e "${YELLOW}⚠ Passed with failures${NC}"
            echo -e "  Tests: ${GREEN}$tests_passed passed${NC}, ${RED}$tests_failed failed${NC}, $tests_skipped skipped"
        fi
    else
        echo -e "${RED}✗ Failed${NC}"
        echo -e "  ${RED}Build failed. Check test-output.log for details${NC}"
        rm -f test-output.log
        return 1
    fi
    
    rm -f test-output.log
}

# テストタイプに応じた実行
case $TEST_TYPE in
    unit)
        run_test_suite "Unit Tests" "test --tests '*Test' -x integrationTest"
        ;;
    integration)
        run_test_suite "Integration Tests" "test --tests '*IntegrationTest'"
        ;;
    all)
        run_test_suite "All Tests" "test"
        ;;
    *)
        echo -e "${RED}Invalid test type: $TEST_TYPE${NC}"
        echo "Valid options: unit, integration, all"
        exit 1
        ;;
esac

echo ""

# カバレッジレポート生成
echo -e "${BLUE}[Step 4/5]${NC} Generating test coverage report..."
if ./gradlew jacocoTestReport > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Coverage report generated"
    
    # カバレッジサマリーの表示
    if [[ -f "build/reports/jacoco/test/jacocoTestReport.xml" ]]; then
        echo ""
        echo -e "${CYAN}Coverage Summary:${NC}"
        # XMLからカバレッジ情報を抽出（簡易版）
        coverage=$(grep -oE 'missed="[0-9]+".*covered="[0-9]+"' build/reports/jacoco/test/jacocoTestReport.xml | head -1)
        if [[ -n "$coverage" ]]; then
            echo "  Coverage report available at: build/reports/jacoco/test/html/index.html"
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC} Coverage report generation skipped"
fi
echo ""

# テストレポートの場所を表示
echo -e "${BLUE}[Step 5/5]${NC} Test Reports"
echo "----------------------------------------"
echo -e "${CYAN}HTML Test Report:${NC}"
echo "  file://$BACKEND_DIR/build/reports/tests/test/index.html"
echo ""
echo -e "${CYAN}Coverage Report:${NC}"
echo "  file://$BACKEND_DIR/build/reports/jacoco/test/html/index.html"
echo ""

# 最近失敗したテストの表示
if [[ -d "build/reports/tests/test" ]]; then
    failed_tests=$(find build/reports/tests/test -name "*.html" -exec grep -l "failed" {} \; 2>/dev/null | wc -l)
    if [[ $failed_tests -gt 0 ]]; then
        echo -e "${YELLOW}⚠ Warning:${NC} Found $failed_tests failed test reports"
        echo "Check the HTML report for details"
    fi
fi

# データベースマイグレーションの確認
echo -e "${CYAN}Database Migrations:${NC}"
migration_count=$(ls -1 src/main/resources/db/migration/*.sql 2>/dev/null | wc -l)
echo "  Found $migration_count migration files"
echo ""

# 成功メッセージ
echo "========================================"
echo -e "${GREEN}        Test Execution Complete${NC}"
echo "========================================"

# エラーがあった場合の終了コード
if [[ $failed_tests -gt 0 ]]; then
    exit 1
else
    exit 0
fi