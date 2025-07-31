#!/bin/bash

# Fast Production Readiness Test Suite
set -e

echo "🚀 Tansu dApp - Fast Production Tests"
echo "====================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 1. Quick Build Check
echo -e "\n${YELLOW}📦 Build Check${NC}"
run_test "Production Build" "bun run build"

# 2. Essential E2E Tests (should be fast now)
echo -e "\n${YELLOW}🌐 Essential Tests${NC}"
run_test "Core Flows" "bunx playwright test --reporter=dot"

# 3. Fast Security Checks
echo -e "\n${YELLOW}🔒 Security Check${NC}"

# Check for XSS protection
if grep -r "DOMPurify.sanitize" src/ >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ XSS Protection${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ${RED}❌ Missing XSS Protection${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Check for secure transport
if grep -r "allowHttp.*import.meta.env.DEV" src/ >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Secure Transport${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ${RED}❌ Insecure Transport${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 4. Quick File Checks
echo -e "\n${YELLOW}📋 Files${NC}"

for file in "dist/index.html" "src/utils/envAssert.ts" "src/utils/retry.ts"; do
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅ $(basename $file)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   ${RED}❌ $(basename $file)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
done

# 5. Results
echo -e "\n${YELLOW}📊 Results${NC}"
echo "Total: $TOTAL_TESTS | Passed: $PASSED_TESTS | Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 PRODUCTION READY!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  $FAILED_TESTS failed${NC}"
    exit 1
fi 