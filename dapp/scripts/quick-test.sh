#!/bin/bash

# Ultra-fast production validation
echo "🚀 Quick Production Test"

# Colors
G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; NC='\033[0m'

pass=0; fail=0; total=0

test_check() {
    echo -n "Testing $1... "
    total=$((total + 1))
    if eval "$2" >/dev/null 2>&1; then
        echo -e "${G}✅${NC}"
        pass=$((pass + 1))
    else
        echo -e "${R}❌${NC}"
        fail=$((fail + 1))
    fi
}

# Only test essentials that are fast
test_check "Files exist" "test -f dist/index.html && test -f src/utils/envAssert.ts"
test_check "XSS protection" "grep -r 'DOMPurify' src/"
test_check "Secure transport" "grep -r 'allowHttp.*import.meta.env.DEV' src/"
test_check "Essential E2E tests" "bun run test:essential"

echo -e "\n${Y}Results:${NC} $pass/$total passed"

if [ $fail -eq 0 ]; then
    echo -e "${G}✅ PRODUCTION READY${NC}"
    exit 0
else
    echo -e "${R}❌ $fail issues${NC}"
    exit 1
fi 