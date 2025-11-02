
#!/bin/bash

echo "🔍 Running All Diagnostic Checks"
echo "═══════════════════════════════════════════════════════════"

FAILED=0

# 1. TypeScript check
echo ""
echo "1️⃣  TypeScript Check..."
pnpm -w tsc --noEmit
if [ $? -ne 0 ]; then
  echo "   ❌ TypeScript errors found"
  FAILED=$((FAILED + 1))
else
  echo "   ✅ TypeScript passed"
fi

# 2. Unit tests
echo ""
echo "2️⃣  Unit Tests..."
pnpm --filter apps/web test:unit --run
if [ $? -ne 0 ]; then
  echo "   ❌ Unit tests failed"
  FAILED=$((FAILED + 1))
else
  echo "   ✅ Unit tests passed"
fi

# 3. Gigs fetch
echo ""
echo "3️⃣  Gigs Fetch Check..."
node scripts/diag/check-gigs-fetch.js
if [ $? -ne 0 ]; then
  echo "   ❌ Gigs fetch failed"
  FAILED=$((FAILED + 1))
else
  echo "   ✅ Gigs fetch passed"
fi

# 4. Signup API
echo ""
echo "4️⃣  Signup API Check..."
node scripts/diag/check-signup-api.js
if [ $? -ne 0 ]; then
  echo "   ❌ Signup API failed"
  FAILED=$((FAILED + 1))
else
  echo "   ✅ Signup API passed"
fi

# 5. Complete flow
echo ""
echo "5️⃣  Complete Flow Check..."
node scripts/diag/test-complete-flow.js
if [ $? -ne 0 ]; then
  echo "   ❌ Complete flow failed"
  FAILED=$((FAILED + 1))
else
  echo "   ✅ Complete flow passed"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✅ All checks passed!"
  exit 0
else
  echo "❌ $FAILED check(s) failed"
  exit 1
fi
