#!/bin/bash

# 負荷テストスクリプト - API負荷テストとパフォーマンス測定
# 使用方法: ./load-test.sh [BASE_URL] [CONCURRENT_USERS] [TOTAL_REQUESTS]

# set -e disabled to allow complete test execution

# デフォルト設定
BASE_URL=${1:-"http://localhost:8080"}
CONCURRENT_USERS=${2:-10}
TOTAL_REQUESTS=${3:-1000}

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 統計情報格納
declare -a response_times
declare -a status_codes
TOTAL_SUCCESS=0
TOTAL_FAILURE=0
START_TIME=""
END_TIME=""

echo "========================================"
echo "      API Load Testing Suite"
echo "========================================"
echo -e "${CYAN}Base URL:${NC}         $BASE_URL"
echo -e "${CYAN}Concurrent Users:${NC} $CONCURRENT_USERS"
echo -e "${CYAN}Total Requests:${NC}   $TOTAL_REQUESTS"
echo "========================================"
echo ""

# Apache Benchの存在確認
if ! command -v ab &> /dev/null; then
    echo -e "${YELLOW}⚠ Apache Bench (ab) not installed${NC}"
    echo "Installing with: apt-get install apache2-utils (Ubuntu) or brew install httpd (macOS)"
    
    # 代替として簡単な並列リクエストテストを実行
    echo ""
    echo -e "${BLUE}Running alternative load test with curl...${NC}"
    echo ""
fi

# 1. ヘルスチェックエンドポイントの負荷テスト
echo -e "${YELLOW}[1/5] Health Check Endpoint Load Test${NC}"
echo "----------------------------------------"

if command -v ab &> /dev/null; then
    echo -ne "${BLUE}Testing /api/v1/health...${NC} "
    
    # Apache Benchでテスト実行
    ab_result=$(ab -n $TOTAL_REQUESTS -c $CONCURRENT_USERS \
        -g health-gnuplot.tsv \
        "$BASE_URL/api/v1/health" 2>&1)
    
    # 結果の解析
    req_per_sec=$(echo "$ab_result" | grep "Requests per second" | awk '{print $4}')
    time_per_req=$(echo "$ab_result" | grep "Time per request" | grep "(mean)" | awk '{print $4}')
    failed_req=$(echo "$ab_result" | grep "Failed requests" | awk '{print $3}')
    
    if [[ -n "$req_per_sec" ]]; then
        echo -e "${GREEN}✓ Completed${NC}"
        echo -e "  ${CYAN}Requests/sec:${NC}     $req_per_sec"
        echo -e "  ${CYAN}Time/request:${NC}     ${time_per_req}ms"
        echo -e "  ${CYAN}Failed requests:${NC}  $failed_req"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
else
    # curlを使った簡易負荷テスト
    echo -e "${BLUE}Running $CONCURRENT_USERS parallel requests...${NC}"
    
    START_TIME=$(date +%s%N)
    
    # バックグラウンドで並列実行
    for i in $(seq 1 $CONCURRENT_USERS); do
        (
            for j in $(seq 1 $((TOTAL_REQUESTS / CONCURRENT_USERS))); do
                response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" "$BASE_URL/api/v1/health")
                echo "$response"
            done
        ) &
    done | while read result; do
        status=$(echo $result | cut -d: -f1)
        time=$(echo $result | cut -d: -f2)
        
        if [[ "$status" == "200" ]]; then
            ((TOTAL_SUCCESS++))
        else
            ((TOTAL_FAILURE++))
        fi
        
        # 進捗表示
        total_done=$((TOTAL_SUCCESS + TOTAL_FAILURE))
        if [[ $((total_done % 100)) -eq 0 ]]; then
            echo -ne "\r${BLUE}Progress:${NC} $total_done / $TOTAL_REQUESTS"
        fi
    done
    
    wait
    END_TIME=$(date +%s%N)
    
    # 統計計算
    duration=$(echo "scale=3; ($END_TIME - $START_TIME) / 1000000000" | bc)
    req_per_sec=$(echo "scale=2; $TOTAL_REQUESTS / $duration" | bc)
    
    echo ""
    echo -e "${GREEN}✓ Completed${NC}"
    echo -e "  ${CYAN}Duration:${NC}         ${duration}s"
    echo -e "  ${CYAN}Requests/sec:${NC}     $req_per_sec"
    echo -e "  ${CYAN}Success:${NC}          $TOTAL_SUCCESS"
    echo -e "  ${CYAN}Failed:${NC}           $TOTAL_FAILURE"
fi
echo ""

# 2. 同時接続テスト
echo -e "${YELLOW}[2/5] Concurrent Connection Test${NC}"
echo "----------------------------------------"

echo -e "${BLUE}Testing maximum concurrent connections...${NC}"

MAX_CONCURRENT=50
CONCURRENT_SUCCESS=0

for concurrent in 10 20 30 40 50; do
    echo -ne "  Testing with $concurrent connections... "
    
    # 同時接続テスト
    errors=0
    for i in $(seq 1 $concurrent); do
        curl -s -o /dev/null "$BASE_URL/api/v1/health" &
    done
    wait
    
    # すべて成功したかチェック
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓${NC}"
        CONCURRENT_SUCCESS=$concurrent
    else
        echo -e "${RED}✗${NC}"
        break
    fi
done

echo -e "${CYAN}Maximum successful concurrent connections: $CONCURRENT_SUCCESS${NC}"
echo ""

# 3. レスポンスタイム測定
echo -e "${YELLOW}[3/5] Response Time Analysis${NC}"
echo "----------------------------------------"

echo -e "${BLUE}Measuring response times (100 requests)...${NC}"

# レスポンスタイムの収集
response_times=()
for i in $(seq 1 100); do
    time=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/v1/health")
    response_times+=($time)
    
    if [[ $((i % 20)) -eq 0 ]]; then
        echo -ne "\r  Progress: $i/100"
    fi
done
echo -ne "\r  Progress: 100/100"
echo ""

# 統計計算
min_time=$(printf '%s\n' "${response_times[@]}" | sort -n | head -1)
max_time=$(printf '%s\n' "${response_times[@]}" | sort -n | tail -1)
avg_time=$(printf '%s\n' "${response_times[@]}" | awk '{sum+=$1} END {printf "%.3f", sum/NR}')
median_time=$(printf '%s\n' "${response_times[@]}" | sort -n | awk '{a[NR]=$1} END {print a[int(NR/2)]}')

echo -e "${GREEN}✓ Analysis complete${NC}"
echo -e "  ${CYAN}Min response time:${NC}    ${min_time}s"
echo -e "  ${CYAN}Max response time:${NC}    ${max_time}s"
echo -e "  ${CYAN}Avg response time:${NC}    ${avg_time}s"
echo -e "  ${CYAN}Median response time:${NC} ${median_time}s"
echo ""

# 4. エラー率テスト
echo -e "${YELLOW}[4/5] Error Rate Test${NC}"
echo "----------------------------------------"

echo -e "${BLUE}Testing error handling under load...${NC}"

ERROR_COUNT=0
SUCCESS_COUNT=0

for i in $(seq 1 100); do
    # ランダムに正常/異常リクエストを送信
    if [[ $((RANDOM % 10)) -lt 8 ]]; then
        # 正常なリクエスト
        status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/health")
    else
        # 異常なリクエスト（存在しないエンドポイント）
        status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/nonexistent")
    fi
    
    if [[ "$status" == "200" ]]; then
        ((SUCCESS_COUNT++))
    elif [[ "$status" == "404" ]] || [[ "$status" == "405" ]]; then
        # 期待されるエラー
        ((SUCCESS_COUNT++))
    else
        ((ERROR_COUNT++))
    fi
done

error_rate=$(echo "scale=2; $ERROR_COUNT * 100 / 100" | bc)

echo -e "${GREEN}✓ Completed${NC}"
echo -e "  ${CYAN}Total requests:${NC}    100"
echo -e "  ${CYAN}Successful:${NC}        $SUCCESS_COUNT"
echo -e "  ${CYAN}Unexpected errors:${NC} $ERROR_COUNT"
echo -e "  ${CYAN}Error rate:${NC}        ${error_rate}%"
echo ""

# 5. 持続負荷テスト
echo -e "${YELLOW}[5/5] Sustained Load Test (30 seconds)${NC}"
echo "----------------------------------------"

echo -e "${BLUE}Running sustained load for 30 seconds...${NC}"

SUSTAINED_START=$(date +%s)
SUSTAINED_END=$((SUSTAINED_START + 30))
SUSTAINED_COUNT=0
SUSTAINED_ERRORS=0

while [[ $(date +%s) -lt $SUSTAINED_END ]]; do
    # 5つの並列リクエスト
    for i in {1..5}; do
        (
            status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/health" 2>/dev/null)
            if [[ "$status" == "200" ]]; then
                echo "SUCCESS"
            else
                echo "ERROR"
            fi
        ) &
    done | while read result; do
        if [[ "$result" == "SUCCESS" ]]; then
            ((SUSTAINED_COUNT++))
        else
            ((SUSTAINED_ERRORS++))
        fi
    done
    
    # 進捗表示
    elapsed=$(($(date +%s) - SUSTAINED_START))
    echo -ne "\r  Time elapsed: ${elapsed}/30 seconds"
    
    sleep 0.5
done

wait
echo -ne "\r  Time elapsed: 30/30 seconds    "
echo ""

sustained_rps=$(echo "scale=2; $SUSTAINED_COUNT / 30" | bc)

echo -e "${GREEN}✓ Completed${NC}"
echo -e "  ${CYAN}Total requests:${NC}    $SUSTAINED_COUNT"
echo -e "  ${CYAN}Requests/sec:${NC}      $sustained_rps"
echo -e "  ${CYAN}Errors:${NC}            $SUSTAINED_ERRORS"
echo ""

# パフォーマンスレポート生成
echo "========================================"
echo "       Performance Report"
echo "========================================"

# パフォーマンス評価
if [[ $(echo "$req_per_sec > 100" | bc) -eq 1 ]] 2>/dev/null; then
    performance="${GREEN}Excellent${NC}"
elif [[ $(echo "$req_per_sec > 50" | bc) -eq 1 ]] 2>/dev/null; then
    performance="${CYAN}Good${NC}"
elif [[ $(echo "$req_per_sec > 20" | bc) -eq 1 ]] 2>/dev/null; then
    performance="${YELLOW}Fair${NC}"
else
    performance="${RED}Poor${NC}"
fi

echo -e "${MAGENTA}Overall Performance:${NC} $performance"
echo ""
echo -e "${CYAN}Key Metrics:${NC}"
echo -e "  • Throughput:        ${req_per_sec:-N/A} req/s"
echo -e "  • Response Time:     ${avg_time:-N/A}s (avg)"
echo -e "  • Error Rate:        ${error_rate:-0}%"
echo -e "  • Max Concurrent:    $CONCURRENT_SUCCESS connections"
echo ""

# 推奨事項
echo -e "${CYAN}Recommendations:${NC}"

if [[ $(echo "${error_rate:-0} > 5" | bc) -eq 1 ]]; then
    echo -e "  ${YELLOW}⚠${NC} High error rate detected. Check server logs."
fi

if [[ $(echo "${avg_time:-0} > 1" | bc) -eq 1 ]]; then
    echo -e "  ${YELLOW}⚠${NC} Slow response times. Consider optimization."
fi

if [[ $CONCURRENT_SUCCESS -lt 50 ]]; then
    echo -e "  ${YELLOW}⚠${NC} Limited concurrent connection capacity."
fi

echo ""
echo -e "${GREEN}Load test completed successfully!${NC}"